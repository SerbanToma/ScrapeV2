import React from 'react';
import { getUserProfile, getSearchHistory, getSavedItems, toProxiedImageUrl } from '@/api/client';
import type { UserProfile, SearchHistoryEntry, SavedItem } from '@/types/api';

type DashboardView = 'home' | 'search' | 'profile' | 'history' | 'saved';

interface HomeDashboardProps {
  onNavigate: (view: DashboardView) => void;
}

export function HomeDashboard({ onNavigate }: HomeDashboardProps) {
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [recentHistory, setRecentHistory] = React.useState<SearchHistoryEntry[]>([]);
  const [recentSaved, setRecentSaved] = React.useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [p, h, s] = await Promise.all([
          getUserProfile(),
          getSearchHistory({ limit: 5 }),
          getSavedItems({ limit: 6 }),
        ]);
        setProfile(p);
        setRecentHistory(h);
        setRecentSaved(s);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="home-dashboard">
      <div className="header-row">
        <h1>Dashboard</h1>
        <div className="quick-actions">
          <button className="btn primary" onClick={() => onNavigate('search')}>Start a Search</button>
          <button className="btn secondary" onClick={() => onNavigate('profile')}>Profile</button>
        </div>
      </div>

      {error && (
        <div className="alert error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{profile?.search_count ?? '—'}</div>
          <div className="stat-label">Total Searches</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile?.saved_items_count ?? '—'}</div>
          <div className="stat-label">Saved Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</div>
          <div className="stat-label">Member Since</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile?.last_login ? new Date(profile.last_login).toLocaleDateString() : 'N/A'}</div>
          <div className="stat-label">Last Login</div>
        </div>
      </div>

      {/* Content */}
      <div className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Recent Searches</h2>
            <button className="link" onClick={() => onNavigate('history')}>View all →</button>
          </div>
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : recentHistory.length === 0 ? (
            <div className="empty">No recent searches</div>
          ) : (
            <ul className="history-list">
              {recentHistory.map((entry) => (
                <li key={entry.id} className="history-item">
                  <div className="left">
                    <span className="type">{entry.search_type === 'picture' ? '📷 Image' : '📋 Spec'}</span>
                    <span className="meta">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                  <div className="right">
                    <span className="count">{entry.results_count} result{entry.results_count !== 1 ? 's' : ''}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Saved Items</h2>
            <button className="link" onClick={() => onNavigate('saved')}>View all →</button>
          </div>
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : recentSaved.length === 0 ? (
            <div className="empty">No saved items yet</div>
          ) : (
            <div className="saved-grid">
              {recentSaved.map((item) => (
                <a key={item.id} href={item.product_url} target="_blank" rel="noopener noreferrer" className="saved-card">
                  {item.product_image_url && (
                    <div className="img"><img src={toProxiedImageUrl(item.product_image_url)} alt={item.product_title} /></div>
                  )}
                  <div className="title" title={item.product_title}>{item.product_title}</div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .home-dashboard { display: grid; gap: 24px; }
        .header-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        h1 { margin: 0; font-size: 26px; }
        .quick-actions { display: flex; gap: 8px; }
        .btn { padding: 10px 14px; border-radius: 8px; font-size: 14px; border: 1px solid; cursor: pointer; }
        .btn.primary { background: var(--sand-300); color: var(--navy-900); border-color: var(--sand-300); }
        .btn.secondary { background: transparent; color: var(--sand-200); border-color: rgba(230, 209, 163, 0.3); }
        .btn.primary:hover { background: var(--accent); border-color: var(--accent); }
        .btn.secondary:hover { background: rgba(230, 209, 163, 0.1); border-color: var(--sand-300); }

        .alert { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 8px; font-size: 14px; }
        .alert.error { background: rgba(255, 125, 125, 0.1); border: 1px solid rgba(255, 125, 125, 0.3); color: #ff7d7d; }
        .alert-icon { font-size: 16px; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .stat-card { text-align: center; padding: 16px; border: 1px solid rgba(230, 209, 163, 0.18); border-radius: 12px; background: linear-gradient(180deg, rgba(18,52,68,0.55), rgba(18,52,68,0.35)); }
        .stat-value { font-size: 22px; font-weight: 700; color: var(--accent); }
        .stat-label { font-size: 12px; color: var(--sand-300); opacity: 0.85; text-transform: uppercase; letter-spacing: 0.4px; }

        .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .panel { border: 1px solid rgba(230, 209, 163, 0.18); border-radius: 12px; background: linear-gradient(180deg, rgba(18,52,68,0.55), rgba(18,52,68,0.35)); padding: 16px; }
        .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .panel-header h2 { margin: 0; font-size: 18px; }
        .link { background: none; border: none; color: var(--accent); cursor: pointer; font-size: 13px; }
        .link:hover { color: var(--sand-200); text-decoration: underline; }

        .loading, .empty { padding: 16px; color: var(--sand-300); opacity: 0.85; text-align: center; }

        .history-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .history-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(230,209,163,0.12); background: rgba(13,37,49,0.4); }
        .history-item .left { display: flex; gap: 10px; align-items: baseline; }
        .history-item .type { font-weight: 600; color: var(--sand-200); }
        .history-item .meta { font-size: 12px; color: var(--sand-300); opacity: 0.8; }
        .history-item .count { font-size: 12px; color: var(--accent); font-weight: 500; }

        .saved-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .saved-card { display: grid; gap: 8px; text-decoration: none; color: inherit; border: 1px solid rgba(230,209,163,0.12); border-radius: 8px; background: rgba(13,37,49,0.4); padding: 8px; transition: transform 0.15s ease, border-color 0.15s ease; }
        .saved-card:hover { transform: translateY(-2px); border-color: rgba(230,209,163,0.25); }
        .saved-card .img { height: 120px; border-radius: 6px; overflow: hidden; background: rgba(13,37,49,0.3); }
        .saved-card .img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .saved-card .title { font-size: 12px; line-height: 1.3; color: var(--sand-200); }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .content-grid { grid-template-columns: 1fr; }
          .saved-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .saved-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}



