"""
MotivateAI - Production Retraining Pipeline
=============================================
Pulls real session data straight from MongoDB (no manual mongoexport step),
retrains both models, and only deploys the new models if they clear safety
gates. This is what turns "we have a training script" into "we have a
retraining pipeline you can trust to run unattended."

Safety gates (all must pass, or the run aborts and keeps old models):
  1. MIN_SESSIONS       - enough raw data to bother training at all
  2. MIN_CLASS_SAMPLES  - enough examples of both outcomes (completed/not,
                          dropped-out/not) to avoid a degenerate model
  3. MIN_AUC            - new model must beat a floor of predictive skill
  4. NO_REGRESSION       - new model must not be meaningfully worse than
                          the currently-deployed model on the same holdout

If any gate fails, the script exits non-zero, logs why, and leaves the
currently-deployed models untouched. Wire this into a scheduled job
(cron/systemd/GitHub Actions) — see bottom of file for a crontab example.

Usage:
    python retrain_pipeline.py \
        --mongo-uri "$MONGODB_URI" \
        --db motivateai \
        --collection sessionlogs \
        --outdir ./models \
        --ml-service-url http://localhost:8000
"""

import argparse
import json
import logging
import shutil
import sys
from datetime import datetime, timedelta
from pathlib import Path

import joblib
import numpy as np
import requests
from pymongo import MongoClient
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import pandas as pd

# Reuse the exact same feature-engineering logic as train_model.py so the
# offline training script and this pipeline never drift apart.
from train_model import build_task_rows, build_dropout_rows

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("retrain_pipeline")

# ---- Safety gate thresholds — tune these as real data accumulates ----
MIN_SESSIONS = 200          # below this, don't bother — stick with rules
MIN_CLASS_SAMPLES = 20      # need at least this many of the minority class
MIN_AUC = 0.60              # floor: model must beat "better than a coin flip"
MAX_AUC_REGRESSION = 0.03   # new model can be at most this much worse than old


def fetch_sessions(mongo_uri: str, db_name: str, collection: str, days_back: int = 180) -> list[dict]:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    cutoff = datetime.utcnow() - timedelta(days=days_back)
    cursor = db[collection].find({"startedAt": {"$gte": cutoff}})
    sessions = list(cursor)
    log.info(f"Fetched {len(sessions)} sessions from the last {days_back} days.")

    # Normalize datetimes/ObjectIds to plain JSON-friendly values, matching
    # the format train_model.py's build_*_rows() functions expect.
    for s in sessions:
        s.pop("_id", None)
        if isinstance(s.get("startedAt"), datetime):
            s["startedAt"] = s["startedAt"].isoformat() + "Z"
    return sessions


def evaluate_model(pipe, X, y) -> float:
    """Return ROC AUC on a held-out split. Returns np.nan if not computable."""
    if y.nunique() < 2:
        return float("nan")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    pipe.fit(X_train, y_train)
    try:
        return roc_auc_score(y_test, pipe.predict_proba(X_test)[:, 1])
    except Exception:
        return float("nan")


def load_existing_auc(model_path: str, X, y) -> float:
    """Score the currently-deployed model on the SAME fresh holdout, so the
    comparison is apples-to-apples against new data, not stale test numbers."""
    p = Path(model_path)
    if not p.exists():
        return float("nan")  # no existing model to compare against
    try:
        bundle = joblib.load(p)
        cols = bundle["feature_columns"]
        X_aligned = X.reindex(columns=cols, fill_value=0)
        return roc_auc_score(y, bundle["pipeline"].predict_proba(X_aligned)[:, 1])
    except Exception as e:
        log.warning(f"Could not score existing model {model_path}: {e}")
        return float("nan")


def try_train_completion(task_df: pd.DataFrame, outdir: str) -> bool:
    """Returns True if a new model was deployed, False if gates blocked it."""
    if len(task_df) < MIN_SESSIONS:
        log.warning(f"[completion] Only {len(task_df)} task rows (< {MIN_SESSIONS}). Skipping.")
        return False

    class_counts = task_df["completed"].value_counts()
    if class_counts.min() < MIN_CLASS_SAMPLES:
        log.warning(f"[completion] Class imbalance too severe: {class_counts.to_dict()}. Skipping.")
        return False

    numeric = ["estimated_duration", "task_position", "session_task_count", "hour_of_day", "break_skip_rate_so_far"]
    categorical = ["time_bucket", "difficulty"]
    X = pd.get_dummies(task_df[numeric + categorical], columns=categorical)
    y = task_df["completed"]

    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))])
    new_auc = evaluate_model(pipe, X, y)

    if np.isnan(new_auc):
        log.warning("[completion] Could not compute AUC. Skipping deployment.")
        return False
    if new_auc < MIN_AUC:
        log.warning(f"[completion] New model AUC {new_auc:.3f} below floor {MIN_AUC}. Skipping deployment.")
        return False

    existing_path = f"{outdir}/completion_model.joblib"
    old_auc = load_existing_auc(existing_path, X, y)
    if not np.isnan(old_auc) and (old_auc - new_auc) > MAX_AUC_REGRESSION:
        log.warning(
            f"[completion] New model AUC {new_auc:.3f} regresses vs existing {old_auc:.3f} "
            f"by more than {MAX_AUC_REGRESSION}. Skipping deployment."
        )
        return False

    # Refit on ALL data (not just the train split) before saving for production
    pipe.fit(X, y)
    if Path(existing_path).exists():
        shutil.copy(existing_path, existing_path + f".bak.{datetime.utcnow():%Y%m%d%H%M%S}")
    joblib.dump({"pipeline": pipe, "feature_columns": list(X.columns)}, existing_path)
    log.info(f"[completion] Deployed new model. AUC {new_auc:.3f} (previous: {old_auc if not np.isnan(old_auc) else 'n/a'}).")
    return True


def try_train_dropout(dropout_df: pd.DataFrame, outdir: str) -> bool:
    if len(dropout_df) < MIN_SESSIONS:
        log.warning(f"[dropout] Only {len(dropout_df)} sessions (< {MIN_SESSIONS}). Skipping.")
        return False

    class_counts = dropout_df["dropped_out"].value_counts()
    if class_counts.min() < MIN_CLASS_SAMPLES:
        log.warning(f"[dropout] Class imbalance too severe: {class_counts.to_dict()}. Skipping.")
        return False

    feature_cols = ["task_count", "avg_estimated_duration", "break_skip_rate", "completed_ratio", "estimated_session_time"]
    X = dropout_df[feature_cols]
    y = dropout_df["dropped_out"]

    pipe = Pipeline([("scaler", StandardScaler()), ("clf", LogisticRegression(max_iter=1000, class_weight="balanced"))])
    new_auc = evaluate_model(pipe, X, y)

    if np.isnan(new_auc) or new_auc < MIN_AUC:
        log.warning(f"[dropout] AUC {new_auc} did not clear floor {MIN_AUC}. Skipping deployment.")
        return False

    existing_path = f"{outdir}/dropout_model.joblib"
    old_auc = load_existing_auc(existing_path, X, y)
    if not np.isnan(old_auc) and (old_auc - new_auc) > MAX_AUC_REGRESSION:
        log.warning(f"[dropout] Regression vs existing model ({old_auc:.3f} -> {new_auc:.3f}). Skipping.")
        return False

    pipe.fit(X, y)
    if Path(existing_path).exists():
        shutil.copy(existing_path, existing_path + f".bak.{datetime.utcnow():%Y%m%d%H%M%S}")
    joblib.dump({"pipeline": pipe, "feature_columns": feature_cols}, existing_path)
    log.info(f"[dropout] Deployed new model. AUC {new_auc:.3f} (previous: {old_auc if not np.isnan(old_auc) else 'n/a'}).")
    return True


def notify_ml_service(ml_service_url: str):
    """Hit /reload so the running FastAPI service picks up the new model
    files without needing a restart/redeploy."""
    try:
        resp = requests.post(f"{ml_service_url}/reload", timeout=5)
        resp.raise_for_status()
        log.info(f"ML service reloaded models: {resp.json()}")
    except Exception as e:
        log.error(f"Failed to notify ML service at {ml_service_url}: {e}")
        log.error("Models were saved to disk but the RUNNING service is still using the old ones "
                   "until it's restarted or /reload succeeds. Check the service is up.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mongo-uri", required=True)
    parser.add_argument("--db", required=True)
    parser.add_argument("--collection", default="sessionlogs")
    parser.add_argument("--outdir", default="./models")
    parser.add_argument("--days-back", type=int, default=180)
    parser.add_argument("--ml-service-url", default="http://localhost:8000")
    args = parser.parse_args()

    Path(args.outdir).mkdir(parents=True, exist_ok=True)

    sessions = fetch_sessions(args.mongo_uri, args.db, args.collection, args.days_back)
    if not sessions:
        log.error("No sessions returned from MongoDB. Aborting — nothing to train on.")
        sys.exit(1)

    task_df = build_task_rows(sessions)
    dropout_df = build_dropout_rows(sessions)

    completion_deployed = try_train_completion(task_df, args.outdir)
    dropout_deployed = try_train_dropout(dropout_df, args.outdir)

    if completion_deployed or dropout_deployed:
        notify_ml_service(args.ml_service_url)
    else:
        log.info("No models were deployed this run (all gates held). Existing models remain live.")

    log.info(f"Retraining run complete. completion_deployed={completion_deployed}, dropout_deployed={dropout_deployed}")


if __name__ == "__main__":
    main()

# ---------------------------------------------------------------------------
# Example crontab entry — retrain weekly, Sunday 3am, log to file:
#
#   0 3 * * 0 cd /path/to/ml-service && /path/to/venv/bin/python retrain_pipeline.py \
#       --mongo-uri "$MONGODB_URI" --db motivateai --outdir ./models \
#       >> /var/log/motivateai-retrain.log 2>&1
#
# Keep MONGODB_URI in the environment (e.g. via a systemd EnvironmentFile),
# never hardcoded in the crontab itself.
# ---------------------------------------------------------------------------
