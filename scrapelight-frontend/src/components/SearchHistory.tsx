import React, { useState, useEffect } from 'react';
import { getSearchHistory, deleteSearchHistory, clearSearchHistory } from '@/api/client';
import type { SearchHistoryEntry } from '@/types/api';

export function SearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'picture' | 'spec'>('all');
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = filter === 'all' ? {} : { search_type: filter };
      const data = await getSearchHistory(params);
      setHistory(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load search history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSearch = async (searchId: number) => {
    try {
      await deleteSearchHistory(searchId);
      setHistory(history.filter(item => item.id !== searchId));
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to delete search');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all search history? This action cannot be undone.')) {
      return;
    }

    try {
      setIsClearing(true);
      await clearSearchHistory();
      setHistory([]);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to clear search history');
    } finally {
      setIsClearing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderQuerySummary = (entry: SearchHistoryEntry) => {
    if (entry.search_type === 'picture') {
      return (
        <div className="query-summary">
          <span className="query-type">📷 Image Search</span>
          <span className="query-details">
            Store: {entry.query_data.store || 'All'} | 
            Top {entry.query_data.top_k || 20} results
          </span>
        </div>
      );
    } else {
      const { details, bulb_type, dimensions, category, store } = entry.query_data;
      const parts = [
        details && `"${details}"`,
        bulb_type && `Bulb: ${bulb_type}`,
        dimensions && `Size: ${dimensions}`,
        category && `Category: ${category}`,
        store && `Store: ${store}`
      ].filter(Boolean);

      return (
        <div className="query-summary">
          <span className="query-type">📋 Spec Search</span>
          <span className="query-details">
            {parts.length > 0 ? parts.join(' | ') : 'No specific criteria'}
          </span>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="search-history">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading search history...</p>
        </div>
        <style jsx>{`
          .search-history {
            padding: 24px;
            max-width: 1000px;
            margin: 0 auto;
          }
          .loading-state {
            text-align: center;
            padding: 40px;
          }
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(230, 209, 163, 0.2);
            border-top: 3px solid var(--accent);
            border-radius: 50%;
            margin: 0 auto 16px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="search-history">
      <div className="history-header">
        <div className="header-content">
          <h1>Search History</h1>
          <p>Review and manage your previous searches</p>
        </div>
        <div className="header-actions">
          {history.length > 0 && (
            <button 
              className="btn danger"
              onClick={handleClearAll}
              disabled={isClearing}
            >
              {isClearing ? 'Clearing...' : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="filters">
        <div className="filter-tabs">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All ({history.length})
          </button>
          <button 
            className={filter === 'picture' ? 'active' : ''} 
            onClick={() => setFilter('picture')}
          >
            📷 Image
          </button>
          <button 
            className={filter === 'spec' ? 'active' : ''} 
            onClick={() => setFilter('spec')}
          >
            📋 Specs
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No search history yet</h3>
          <p>Your search history will appear here once you start searching for products.</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((entry) => (
            <div key={entry.id} className="history-item">
              <div className="item-main">
                <div className="item-header">
                  {renderQuerySummary(entry)}
                  <div className="item-meta">
                    <span className="date">{formatDate(entry.created_at)}</span>
                    <span className="results-count">
                      {entry.results_count} result{entry.results_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {entry.results_summary && entry.results_summary.top_results && entry.results_summary.top_results.length > 0 && (
                  <div className="results-preview">
                    <h4>Top Results:</h4>
                    <div className="preview-items">
                      {entry.results_summary.top_results.map((result: any, idx: number) => (
                        <div key={idx} className="preview-item">
                          <div className="preview-info">
                            <div className="preview-main">
                              <span className="preview-title">{result.product_title}</span>
                              <span className="preview-similarity">
                                {(result.similarity * 100).toFixed(1)}% match
                              </span>
                            </div>
                            {result.url && (
                              <a 
                                href={result.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="preview-link"
                              >
                                View Product →
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="item-actions">
                <button 
                  className="btn secondary small"
                  onClick={() => handleDeleteSearch(entry.id)}
                  title="Delete this search"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .search-history {
          padding: 24px;
          max-width: 1000px;
          margin: 0 auto;
          color: var(--sand-200);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          gap: 20px;
        }

        .header-content h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px;
          color: var(--sand-200);
        }

        .header-content p {
          font-size: 16px;
          color: var(--sand-300);
          opacity: 0.9;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 14px;
          background: rgba(255, 125, 125, 0.1);
          border: 1px solid rgba(255, 125, 125, 0.3);
          color: #ff7d7d;
        }

        .alert-icon {
          font-size: 16px;
        }

        .filters {
          margin-bottom: 24px;
        }

        .filter-tabs {
          display: flex;
          gap: 4px;
          background: rgba(18, 52, 68, 0.6);
          border-radius: 8px;
          padding: 4px;
          border: 1px solid rgba(230, 209, 163, 0.15);
        }

        .filter-tabs button {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--sand-200);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-tabs button:hover {
          background: rgba(230, 209, 163, 0.1);
        }

        .filter-tabs button.active {
          background: var(--sand-300);
          color: var(--navy-900);
          font-weight: 500;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: linear-gradient(180deg, rgba(18, 52, 68, 0.4), rgba(18, 52, 68, 0.2));
          border: 1px solid rgba(230, 209, 163, 0.15);
          border-radius: 16px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px;
          color: var(--sand-200);
        }

        .empty-state p {
          color: var(--sand-300);
          opacity: 0.9;
          margin: 0;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .history-item {
          background: linear-gradient(180deg, rgba(18, 52, 68, 0.4), rgba(18, 52, 68, 0.2));
          border: 1px solid rgba(230, 209, 163, 0.15);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          transition: border-color 0.2s ease;
        }

        .history-item:hover {
          border-color: rgba(230, 209, 163, 0.25);
        }

        .item-main {
          flex: 1;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 16px;
        }

        .query-summary {
          flex: 1;
        }

        .query-type {
          display: block;
          font-weight: 600;
          color: var(--sand-200);
          margin-bottom: 4px;
        }

        .query-details {
          display: block;
          font-size: 13px;
          color: var(--sand-300);
          opacity: 0.8;
        }

        .item-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          text-align: right;
        }

        .date {
          font-size: 12px;
          color: var(--sand-300);
          opacity: 0.7;
        }

        .results-count {
          font-size: 12px;
          color: var(--accent);
          font-weight: 500;
        }

        .results-preview {
          margin-top: 12px;
        }

        .results-preview h4 {
          font-size: 13px;
          font-weight: 500;
          color: var(--sand-200);
          margin: 0 0 8px;
        }

        .preview-items {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .preview-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: rgba(13, 37, 49, 0.4);
          border-radius: 6px;
          border: 1px solid rgba(230, 209, 163, 0.1);
        }

        .preview-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .preview-main {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-title {
          font-size: 12px;
          color: var(--sand-200);
          flex: 1;
          margin-right: 8px;
        }

        .preview-similarity {
          font-size: 11px;
          color: var(--accent);
          font-weight: 500;
        }

        .preview-link {
          font-size: 11px;
          color: var(--accent);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
          white-space: nowrap;
        }

        .preview-link:hover {
          color: var(--sand-200);
        }

        .item-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .btn {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid;
        }

        .btn.small {
          padding: 6px 10px;
          font-size: 11px;
        }

        .btn.secondary {
          background: transparent;
          color: var(--sand-300);
          border-color: rgba(230, 209, 163, 0.3);
        }

        .btn.secondary:hover:not(:disabled) {
          background: rgba(230, 209, 163, 0.1);
          border-color: var(--sand-300);
        }

        .btn.danger {
          background: rgba(255, 125, 125, 0.1);
          color: #ff7d7d;
          border-color: rgba(255, 125, 125, 0.3);
        }

        .btn.danger:hover:not(:disabled) {
          background: rgba(255, 125, 125, 0.2);
          border-color: rgba(255, 125, 125, 0.5);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .search-history {
            padding: 16px;
          }

          .history-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .header-actions {
            align-self: flex-end;
          }

          .item-header {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .item-meta {
            align-items: flex-start;
            text-align: left;
          }

          .history-item {
            padding: 16px;
          }

          .filter-tabs {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
