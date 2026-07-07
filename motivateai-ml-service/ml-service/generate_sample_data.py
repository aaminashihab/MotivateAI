"""
Generates a small synthetic sessions.json so you can test train_model.py
end-to-end before you have real exported MongoDB data.
Not for production use — swap this for a real mongoexport dump.
"""
import json
import random
from datetime import datetime, timedelta

random.seed(42)

def make_session(user_id, day_offset):
    started = datetime(2026, 1, 1) + timedelta(days=day_offset, hours=random.randint(6, 22))
    task_count = random.randint(2, 5)
    tasks = []
    for i in range(task_count):
        est = random.choice([15, 20, 25, 30])
        # Shorter tasks and earlier position => higher completion chance
        p_complete = max(0.2, min(0.95, 0.9 - (est - 15) * 0.01 - i * 0.05))
        completed = random.random() < p_complete
        tasks.append({
            "taskId": f"t{i}",
            "estimatedDuration": est,
            "actualDuration": est + random.randint(-5, 8) if completed else None,
            "completed": completed,
            "userDifficulty": random.choice(["easy", "just_right", "hard"]),
        })
    breaks = [
        {"breakNumber": i, "breakDuration": 5, "skipped": random.random() < 0.35, "paused": False, "pauseCount": 0}
        for i in range(max(0, task_count - 1))
    ]
    dropout = None
    if random.random() < 0.2:
        dropout = {"minutesInto": random.randint(10, 40), "reason": "user_quit"}

    return {
        "userId": user_id,
        "startedAt": started.isoformat() + "Z",
        "estimatedSessionTime": sum(t["estimatedDuration"] for t in tasks),
        "tasks": tasks,
        "breaks": breaks,
        "dropoutPoint": dropout,
    }

sessions = []
for u in range(1, 9):
    for d in range(25):
        sessions.append(make_session(f"user_{u}", d))

with open("sample_sessions.json", "w") as f:
    json.dump(sessions, f, indent=2)

print(f"Wrote {len(sessions)} synthetic sessions to sample_sessions.json")
