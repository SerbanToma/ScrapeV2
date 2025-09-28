import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
        <style jsx>{`
          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: var(--navy-900);
          }

          .loading-spinner {
            text-align: center;
            color: var(--sand-200);
          }

          .spinner {
            width: 40px;
            height: 40px;
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

          .loading-spinner p {
            margin: 0;
            font-size: 14px;
            opacity: 0.8;
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  return <>{children}</>;
}

