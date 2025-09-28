import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedSearch } from './UnifiedSearch';
import { ProfileSettings } from './ProfileSettings';
import { SearchHistory } from './SearchHistory';
import { SavedItems } from './SavedItems';
import { HomeDashboard } from '@/components/HomeDashboard';

type DashboardView = 'home' | 'search' | 'profile' | 'history' | 'saved';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<DashboardView>('home');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (view: DashboardView) => {
    setCurrentView(view);
    setIsProfileOpen(false);
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'home': return 'Your Dashboard';
      case 'search': return 'AI-Powered Search';
      case 'profile': return 'Profile Settings';
      case 'history': return 'Search History';
      case 'saved': return 'Saved Items';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-brand" onClick={() => handleNavigation('home')} style={{cursor: 'pointer'}}>
            <img src="/scrapelight.png" alt="Scrapelight" className="brand-logo" onclick={() => handleNavigation('home')}/>
            <span className="brand-title">Scrapelight</span>
          </div>
          
          <div className="header-actions">
            {/* Navigation Menu */}
            <nav className="main-nav">
              <button 
                className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
                onClick={() => handleNavigation('home')}
              >
                🏠 Home
              </button>
              <button 
                className={`nav-item ${currentView === 'search' ? 'active' : ''}`}
                onClick={() => handleNavigation('search')}
              >
                🔍 Search
              </button>
              <button 
                className={`nav-item ${currentView === 'history' ? 'active' : ''}`}
                onClick={() => handleNavigation('history')}
              >
                📋 History
              </button>
              <button 
                className={`nav-item ${currentView === 'saved' ? 'active' : ''}`}
                onClick={() => handleNavigation('saved')}
              >
                💾 Saved
              </button>
            </nav>

            <div className="user-menu">
              <button 
                className="user-button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="user-avatar">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{user?.username}</span>
                <span className="chevron">▼</span>
              </button>
              
              {isProfileOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="user-info">
                      <div className="user-name-full">{user?.username}</div>
                      <div className="user-email">{user?.email}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-actions">
                    <button 
                      className="dropdown-item"
                      onClick={() => handleNavigation('profile')}
                    >
                      Profile Settings
                    </button>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="main-content">
          {currentView === 'home' && <HomeDashboard onNavigate={handleNavigation} />}

          {currentView === 'search' && (
            <div className="search-section">
              <UnifiedSearch />
            </div>
          )}

          {currentView === 'profile' && <ProfileSettings />}
          {currentView === 'history' && <SearchHistory />}
          {currentView === 'saved' && <SavedItems />}
        </div>
      </main>

      {/* Click outside to close dropdown */}
      {isProfileOpen && (
        <div className="dropdown-overlay" onClick={() => setIsProfileOpen(false)} />
      )}

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: var(--navy-900);
          color: var(--sand-200);
        }

        /* Header */
        .dashboard-header {
          background: linear-gradient(180deg, rgba(18, 52, 68, 0.95), rgba(18, 52, 68, 0.85));
          border-bottom: 1px solid rgba(230, 209, 163, 0.15);
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 16px 24px;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        //.brand-logo {
        //  height: 48px;
        //  width: 48px;
        //  object-fit: contain;
        //  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
        //}
        
        .brand-logo {
          height: 36px;
          width: 36px;
          object-fit: contain;
        }
        
        .brand-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--accent);
        }

        .brand-text h1 {
          margin: 0 0 2px;
          font-size: 22px;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: 0.3px;
        }

        .brand-text p {
          margin: 0;
          font-size: 12px;
          opacity: 0.8;
          color: var(--sand-300);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .main-nav {
          display: flex;
          gap: 8px;
          background: rgba(13, 37, 49, 0.4);
          border-radius: 10px;
          padding: 4px;
          border: 1px solid rgba(230, 209, 163, 0.15);
        }

        .nav-item {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          background: transparent;
          color: var(--sand-200);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          background: rgba(230, 209, 163, 0.1);
          color: var(--sand-200);
        }

        .nav-item.active {
          background: var(--sand-300);
          color: var(--navy-900);
          font-weight: 600;
        }

        .user-menu {
          position: relative;
        }

        .user-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(230, 209, 163, 0.1);
          border: 1px solid rgba(230, 209, 163, 0.2);
          border-radius: 10px;
          color: var(--sand-200);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .user-button:hover {
          background: rgba(230, 209, 163, 0.15);
          border-color: rgba(230, 209, 163, 0.3);
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--sand-300), var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
          color: var(--navy-900);
        }

        .user-name {
          font-weight: 500;
        }

        .chevron {
          font-size: 10px;
          opacity: 0.7;
          transition: transform 0.2s ease;
        }

        .user-button:hover .chevron {
          transform: rotate(180deg);
        }

        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: var(--navy-800);
          border: 1px solid rgba(230, 209, 163, 0.2);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          min-width: 220px;
          overflow: hidden;
          z-index: 1000;
          animation: dropdownSlide 0.2s ease-out;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .dropdown-header {
          padding: 16px;
          background: rgba(230, 209, 163, 0.05);
        }

        .user-name-full {
          font-weight: 600;
          font-size: 15px;
          color: var(--sand-200);
          margin-bottom: 2px;
        }

        .user-email {
          font-size: 12px;
          color: var(--sand-300);
          opacity: 0.8;
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(230, 209, 163, 0.15);
        }

        .dropdown-actions {
          padding: 8px 0;
        }

        .dropdown-item {
          width: 100%;
          padding: 10px 16px;
          background: none;
          border: none;
          color: var(--sand-200);
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .dropdown-item:hover {
          background: rgba(230, 209, 163, 0.1);
        }

        .dropdown-item.logout {
          color: #ff7d7d;
        }

        .dropdown-item.logout:hover {
          background: rgba(255, 125, 125, 0.1);
        }

        .dropdown-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 50;
        }

        /* Main Content */
        .dashboard-main {
          padding: 32px 24px 48px;
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .welcome-section {
          margin-bottom: 32px;
          text-align: center;
        }

        .welcome-section h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px;
          color: var(--sand-200);
        }

        .welcome-section p {
          font-size: 16px;
          color: var(--sand-300);
          opacity: 0.9;
          margin: 0;
          max-width: 600px;
          margin: 0 auto;
        }

        .search-section {
          background: linear-gradient(180deg, rgba(18, 52, 68, 0.4), rgba(18, 52, 68, 0.2));
          border: 1px solid rgba(230, 209, 163, 0.15);
          border-radius: 16px;
          padding: 24px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .dashboard-header {
            padding: 12px 16px;
          }

          .brand-text h1 {
            font-size: 18px;
          }

          .brand-text p {
            display: none;
          }

          .header-actions {
            gap: 12px;
          }

          .main-nav {
            gap: 4px;
            padding: 2px;
          }

          .nav-item {
            padding: 6px 10px;
            font-size: 11px;
          }

          .user-name {
            display: none;
          }

          .dashboard-main {
            padding: 24px 16px 36px;
          }

          .welcome-section h2 {
            font-size: 24px;
          }

          .welcome-section p {
            font-size: 14px;
          }

          .search-section {
            padding: 20px;
            border-radius: 12px;
          }

          .user-dropdown {
            right: -8px;
            min-width: 200px;
          }
        }

        @media (max-width: 480px) {
          .brand-logo {
            height: 36px;
            width: 36px;
          }

          .brand-text h1 {
            font-size: 16px;
          }

          .welcome-section {
            margin-bottom: 24px;
          }

          .welcome-section h2 {
            font-size: 20px;
          }

          .search-section {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
