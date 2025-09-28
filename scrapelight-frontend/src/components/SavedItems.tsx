import React, { useState, useEffect } from 'react';
import { getSavedItems, deleteSavedItem, updateSavedItem, getSavedItemTags } from '@/api/client';
import { toProxiedImageUrl } from '@/api/client';
import type { SavedItem, SavedItemUpdate } from '@/types/api';

export function SavedItems() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // Edit state
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ notes: string; tags: string }>({
    notes: '',
    tags: ''
  });

  useEffect(() => {
    loadItems();
    loadTags();
  }, [selectedTag]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = selectedTag ? { tag: selectedTag } : {};
      const data = await getSavedItems(params);
      setItems(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load saved items');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await getSavedItemTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to remove this item from your saved list?')) {
      return;
    }

    try {
      await deleteSavedItem(itemId);
      setItems(items.filter(item => item.id !== itemId));
      // Refresh tags as they might have changed
      loadTags();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to delete item');
    }
  };

  const startEditing = (item: SavedItem) => {
    setEditingItem(item.id);
    setEditForm({
      notes: item.notes || '',
      tags: (item.tags || []).join(', ')
    });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditForm({ notes: '', tags: '' });
  };

  const saveEdits = async () => {
    if (editingItem === null) return;

    try {
      const updates: SavedItemUpdate = {
        notes: editForm.notes.trim() || undefined,
        tags: editForm.tags.trim() 
          ? editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : []
      };

      const updatedItem = await updateSavedItem(editingItem, updates);
      setItems(items.map(item => 
        item.id === editingItem ? updatedItem : item
      ));
      setEditingItem(null);
      setEditForm({ notes: '', tags: '' });
      // Refresh tags as they might have changed
      loadTags();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update item');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="saved-items">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading saved items...</p>
        </div>
        <style jsx>{`
          .saved-items {
            padding: 24px;
            max-width: 1200px;
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
    <div className="saved-items">
      <div className="items-header">
        <div className="header-content">
          <h1>Saved Items</h1>
          <p>Your favorite products and lighting solutions</p>
        </div>
        <div className="header-stats">
          <span className="items-count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {error && (
        <div className="alert error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Filters */}
      {availableTags.length > 0 && (
        <div className="filters">
          <div className="filter-section">
            <label>Filter by tag:</label>
            <select 
              value={selectedTag} 
              onChange={(e) => setSelectedTag(e.target.value)}
              className="tag-filter"
            >
              <option value="">All items</option>
              {availableTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💾</div>
          <h3>No saved items yet</h3>
          <p>
            {selectedTag 
              ? `No items found with the tag "${selectedTag}".`
              : 'Start saving items from your search results to build your personal collection.'
            }
          </p>
          {selectedTag && (
            <button 
              className="btn secondary"
              onClick={() => setSelectedTag('')}
            >
              View All Items
            </button>
          )}
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              {item.product_image_url && (
                <div className="item-image">
                  <img 
                    src={toProxiedImageUrl(item.product_image_url)} 
                    alt={item.product_title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="item-content">
                <div className="item-header">
                  <h3 className="item-title">{item.product_title}</h3>
                  <div className="item-actions">
                    <button 
                      className="btn icon"
                      onClick={() => startEditing(item)}
                      title="Edit notes and tags"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn icon danger"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Remove from saved items"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {item.product_data && (
                  <div className="item-specs">
                    {item.product_data.bulb_type && (
                      <span className="spec">💡 {item.product_data.bulb_type}</span>
                    )}
                    {item.product_data.dimensions && (
                      <span className="spec">📏 {item.product_data.dimensions}</span>
                    )}
                  </div>
                )}

                {editingItem === item.id ? (
                  <div className="edit-form">
                    <div className="form-group">
                      <label>Notes:</label>
                      <textarea
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        placeholder="Add your personal notes..."
                        rows={3}
                      />
                    </div>
                    <div className="form-group">
                      <label>Tags (comma-separated):</label>
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                        placeholder="modern, ceiling, bedroom..."
                      />
                    </div>
                    <div className="form-actions">
                      <button className="btn primary small" onClick={saveEdits}>
                        Save
                      </button>
                      <button className="btn secondary small" onClick={cancelEditing}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {item.notes && (
                      <div className="item-notes">
                        <p>{item.notes}</p>
                      </div>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div className="item-tags">
                        {item.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="item-footer">
                  <span className="save-date">Saved {formatDate(item.created_at)}</span>
                  {item.product_url && (
                    <a 
                      href={item.product_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-product"
                    >
                      View Product →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .saved-items {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          color: var(--sand-200);
        }

        .items-header {
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

        .header-stats {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .items-count {
          font-size: 14px;
          color: var(--accent);
          font-weight: 500;
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
          background: linear-gradient(180deg, rgba(18, 52, 68, 0.4), rgba(18, 52, 68, 0.2));
          border: 1px solid rgba(230, 209, 163, 0.15);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .filter-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-section label {
          font-size: 14px;
          color: var(--sand-200);
          font-weight: 500;
        }

        .tag-filter {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid rgba(230, 209, 163, 0.25);
          background: rgba(13, 37, 49, 0.65);
          color: var(--sand-200);
          font-size: 14px;
        }

        .tag-filter option {
          background: var(--navy-800);
          color: var(--sand-200);
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
          margin: 0 0 20px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .item-card {
          background: linear-gradient(180deg, rgba(18, 52, 68, 0.6), rgba(18, 52, 68, 0.4));
          border: 1px solid rgba(230, 209, 163, 0.15);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .item-card:hover {
          border-color: rgba(230, 209, 163, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .item-image {
          height: 180px;
          overflow: hidden;
          background: rgba(13, 37, 49, 0.3);
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-content {
          padding: 16px;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 12px;
        }

        .item-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: var(--sand-200);
          line-height: 1.3;
          flex: 1;
        }

        .item-actions {
          display: flex;
          gap: 6px;
        }

        .item-specs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .spec {
          font-size: 11px;
          color: var(--sand-300);
          background: rgba(13, 37, 49, 0.5);
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid rgba(230, 209, 163, 0.1);
        }

        .item-notes {
          margin-bottom: 12px;
        }

        .item-notes p {
          font-size: 13px;
          color: var(--sand-300);
          margin: 0;
          line-height: 1.4;
          background: rgba(13, 37, 49, 0.3);
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid rgba(230, 209, 163, 0.1);
        }

        .item-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }

        .tag {
          font-size: 10px;
          color: var(--navy-900);
          background: var(--sand-400);
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 500;
        }

        .item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: var(--sand-300);
          opacity: 0.8;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(230, 209, 163, 0.1);
        }

        .save-date {
          font-size: 11px;
        }

        .view-product {
          color: var(--accent);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .view-product:hover {
          color: var(--sand-200);
        }

        .edit-form {
          background: rgba(13, 37, 49, 0.4);
          border: 1px solid rgba(230, 209, 163, 0.15);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .form-group {
          margin-bottom: 12px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          font-size: 12px;
          color: var(--sand-200);
          margin-bottom: 4px;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 6px 8px;
          border-radius: 4px;
          border: 1px solid rgba(230, 209, 163, 0.25);
          background: rgba(13, 37, 49, 0.5);
          color: var(--sand-200);
          font-size: 12px;
          resize: vertical;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--sand-400);
        }

        .form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .btn {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid;
        }

        .btn.small {
          padding: 4px 8px;
          font-size: 10px;
        }

        .btn.icon {
          padding: 4px 6px;
          font-size: 12px;
          background: transparent;
          color: var(--sand-300);
          border-color: rgba(230, 209, 163, 0.2);
        }

        .btn.icon:hover {
          background: rgba(230, 209, 163, 0.1);
          border-color: var(--sand-300);
        }

        .btn.icon.danger {
          color: #ff7d7d;
          border-color: rgba(255, 125, 125, 0.2);
        }

        .btn.icon.danger:hover {
          background: rgba(255, 125, 125, 0.1);
          border-color: rgba(255, 125, 125, 0.3);
        }

        .btn.primary {
          background: var(--sand-300);
          color: var(--navy-900);
          border-color: var(--sand-300);
        }

        .btn.primary:hover {
          background: var(--accent);
          border-color: var(--accent);
        }

        .btn.secondary {
          background: transparent;
          color: var(--sand-200);
          border-color: rgba(230, 209, 163, 0.3);
        }

        .btn.secondary:hover {
          background: rgba(230, 209, 163, 0.1);
          border-color: var(--sand-300);
        }

        @media (max-width: 768px) {
          .saved-items {
            padding: 16px;
          }

          .items-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .items-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .item-header {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .item-actions {
            align-self: flex-end;
          }

          .filter-section {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}

