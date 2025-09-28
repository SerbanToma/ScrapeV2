import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, updateUserProfile, changePassword } from '@/api/client';
import type { UserProfile, UserUpdateRequest, PasswordChangeRequest } from '@/types/api';

export function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username,
        email: user.email
      });
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await getUserProfile();
      setProfile(profileData);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) return;

    const updates: UserUpdateRequest = {};
    if (profileForm.username !== user.username) {
      updates.username = profileForm.username;
    }
    if (profileForm.email !== user.email) {
      updates.email = profileForm.email;
    }

    if (Object.keys(updates).length === 0) {
      setError('No changes to save');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      await updateUserProfile(updates);
      await refreshUser();
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    const passwordData: PasswordChangeRequest = {
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password
    };

    try {
      setIsChangingPassword(true);
      await changePassword(passwordData);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setSuccess('Password changed successfully');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-settings">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
        <style jsx>{`
          .profile-settings {
            padding: 24px;
            max-width: 800px;
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
    <div className="profile-settings">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information and preferences</p>
      </div>

      {error && (
        <div className="alert error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="alert success">
          <span className="alert-icon">✅</span>
          {success}
        </div>
      )}

      {/* Profile Stats */}
      {profile && (
        <div className="stats-section">
          <h2>Account Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{profile.search_count}</div>
              <div className="stat-label">Total Searches</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{profile.saved_items_count}</div>
              <div className="stat-label">Saved Items</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </div>
              <div className="stat-label">Member Since</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {profile.last_login ? new Date(profile.last_login).toLocaleDateString() : 'N/A'}
              </div>
              <div className="stat-label">Last Login</div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <div className="settings-section">
        <h2>Profile Information</h2>
        <form onSubmit={handleProfileSubmit} className="settings-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={profileForm.username}
              onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
              disabled={isUpdatingProfile}
              required
              minLength={3}
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              disabled={isUpdatingProfile}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn primary"
            disabled={isUpdatingProfile}
          >
            {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Password Change */}
      <div className="settings-section">
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="settings-form">
          <div className="form-group">
            <label htmlFor="current_password">Current Password</label>
            <input
              type="password"
              id="current_password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              disabled={isChangingPassword}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="new_password">New Password</label>
            <input
              type="password"
              id="new_password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              disabled={isChangingPassword}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password">Confirm New Password</label>
            <input
              type="password"
              id="confirm_password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              disabled={isChangingPassword}
              required
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="btn primary"
            disabled={isChangingPassword}
          >
            {isChangingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .profile-settings {
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
          color: var(--sand-200);
        }

        .profile-header {
          margin-bottom: 32px;
        }

        .profile-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px;
          color: var(--sand-200);
        }

        .profile-header p {
          font-size: 16px;
          color: var(--sand-300);
          opacity: 0.9;
          margin: 0;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 14px;
        }

        .alert.error {
          background: rgba(255, 125, 125, 0.1);
          border: 1px solid rgba(255, 125, 125, 0.3);
          color: #ff7d7d;
        }

        .alert.success {
          background: rgba(125, 255, 125, 0.1);
          border: 1px solid rgba(125, 255, 125, 0.3);
          color: #7dff7d;
        }

        .alert-icon {
          font-size: 16px;
        }

        .stats-section {
          margin-bottom: 32px;
        }

        .stats-section h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 16px;
          color: var(--sand-200);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: linear-gradient(180deg, rgba(18, 52, 68, 0.6), rgba(18, 52, 68, 0.4));
          border: 1px solid rgba(230, 209, 163, 0.15);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--accent);
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: var(--sand-300);
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .settings-section {
          background: linear-gradient(180deg, rgba(18, 52, 68, 0.4), rgba(18, 52, 68, 0.2));
          border: 1px solid rgba(230, 209, 163, 0.15);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .settings-section h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 20px;
          color: var(--sand-200);
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: var(--sand-200);
        }

        .form-group input {
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid rgba(230, 209, 163, 0.25);
          background: rgba(13, 37, 49, 0.65);
          color: var(--sand-200);
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--sand-400);
        }

        .form-group input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-group input::placeholder {
          color: rgba(240, 223, 191, 0.6);
        }

        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid;
          align-self: flex-start;
        }

        .btn.primary {
          background: var(--sand-300);
          color: var(--navy-900);
          border-color: var(--sand-300);
        }

        .btn.primary:hover:not(:disabled) {
          background: var(--accent);
          border-color: var(--accent);
          transform: translateY(-1px);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .profile-settings {
            padding: 16px;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
          }

          .settings-section {
            padding: 20px;
          }

          .stat-card {
            padding: 16px;
          }

          .stat-value {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}

