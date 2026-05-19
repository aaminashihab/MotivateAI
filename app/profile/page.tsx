'use client';

import { useEffect, useState } from 'react';
import BehaviorInsights from '@/components/BehaviorInsights';
import { UserProfile } from '@/lib/types/sessionLog';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let userId = localStorage.getItem('motivateai_user_id');
        if (!userId) {
          userId = `user_${Math.random().toString(36).substring(2, 15)}`;
          localStorage.setItem('motivateai_user_id', userId);
        }

        const res = await fetch(`/api/user/${userId}/profile`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Your Learning Profile</h1>
        <Link href="/" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', textDecoration: 'none', color: '#fff' }}>
          Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="loader"></span>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Analyzing your history...</p>
        </div>
      ) : profile ? (
        <BehaviorInsights profile={profile} />
      ) : (
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <h2>No Data Yet</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Complete a few sessions to unlock your personalized learning insights!</p>
          <Link href="/" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--accent)', borderRadius: '8px', textDecoration: 'none', color: '#fff' }}>
            Start a Session
          </Link>
        </div>
      )}
    </div>
  );
}
