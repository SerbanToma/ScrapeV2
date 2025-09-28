import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { LandingPage } from '@/components/LandingPage';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      {isAuthenticated ? (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ) : (
        <LandingPage onGetStarted={() => {}} />
      )}
      <style jsx global>{`
        :root {
          --navy-900: #0e2b3a;
          --navy-800: #123444;
          --navy-700: #173e51;
          --sand-200: #f0dfbf;
          --sand-300: #e6d1a3;
          --sand-400: #d8be89;
          --accent: #f8e7c7;
        }
        body {
          margin: 0;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          background: var(--navy-900);
          color: var(--sand-200);
        }
        a { color: var(--accent); }
        .container { max-width: 1100px; margin: 0 auto; padding: 24px; }
        header { margin-bottom: 24px; }
        .brand { display: flex; align-items: center; gap: 14px; }
        .brand img { height: 56px; width: 56px; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3)); }
        .brand-text h1 { margin: 0 0 4px; letter-spacing: 0.5px; }
        .brand-text p { margin: 0; opacity: 0.9; }
        .layout { display: grid; grid-template-columns: 1fr; gap: 24px; }
        .card {
          border: 1px solid rgba(230, 209, 163, 0.18);
          border-radius: 12px;
          padding: 16px;
          background: linear-gradient(180deg, rgba(18, 52, 68, 0.55), rgba(18, 52, 68, 0.35));
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        }
        form { display: grid; gap: 12px; }
        .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .grid { display: grid; gap: 12px; grid-template-columns: 1fr; }
        @media (min-width: 700px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        label { display: grid; gap: 6px; font-size: 14px; }
        input, select, button {
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(230, 209, 163, 0.25);
          background: rgba(13, 37, 49, 0.65);
          color: var(--sand-200);
        }
        input::placeholder { color: rgba(240, 223, 191, 0.6); }
        select option { color: #000; }
        button { cursor: pointer; transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease; }
        button:hover { border-color: var(--sand-400); }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .results { list-style: none; padding: 0; display: grid; gap: 12px; }
        .result { display: grid; gap: 12px; grid-template-columns: 1fr; }
        @media (min-width: 600px) { .result { grid-template-columns: 1fr 200px; align-items: start; } }
        .meta { display: grid; gap: 6px; }
        .meta span { opacity: 0.9; font-size: 13px; }
        .img img { max-width: 200px; border-radius: 10px; border: 1px solid rgba(230, 209, 163, 0.25); background: #fff; }
        .error { 
          color: #ff7d7d; 
          background: rgba(255, 125, 125, 0.1); 
          border: 1px solid rgba(255, 125, 125, 0.3); 
          padding: 8px 12px; 
          border-radius: 6px; 
          margin: 8px 0; 
          animation: messageSlide 0.3s ease-out; 
        }
        .success { 
          color: #7dff7d; 
          background: rgba(125, 255, 125, 0.1); 
          border: 1px solid rgba(125, 255, 125, 0.3); 
          padding: 8px 12px; 
          border-radius: 6px; 
          margin: 8px 0; 
          animation: messageSlide 0.3s ease-out; 
        }
        @keyframes messageSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .toggle { display: inline-flex; gap: 8px; margin-bottom: 10px; padding: 4px; background: rgba(18, 52, 68, 0.6); border-radius: 10px; border: 1px solid rgba(230, 209, 163, 0.18); }
        .toggle button { border-radius: 8px; padding: 8px 12px; border: 1px solid transparent; background: transparent; color: var(--sand-200); }
        .toggle button:hover { background: rgba(230, 209, 163, 0.08); }
        .toggle button.active { background: var(--sand-300); color: var(--navy-900); border-color: var(--sand-400); }
        .results-one { display: grid; gap: 12px; margin-top: 8px; }
        .pager { display: flex; align-items: center; gap: 12px; justify-content: center; }
        .pager button { width: 40px; height: 40px; border-radius: 10px; background: rgba(230, 209, 163, 0.15); }
        .pager button:hover { background: rgba(230, 209, 163, 0.25); }
        .results-footer { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-top: 16px; 
          padding-top: 12px; 
          border-top: 1px solid rgba(230, 209, 163, 0.15); 
        }
        .results-info { 
          display: flex; 
          flex-direction: column; 
          gap: 4px; 
        }
        .results-count { 
          font-size: 13px; 
          color: var(--sand-200); 
          font-weight: 500; 
        }
        .results-hint { 
          font-size: 11px; 
          color: var(--sand-300); 
          opacity: 0.7; 
        }
        .pager-info { 
          font-size: 12px; 
          color: var(--sand-300); 
          min-width: 40px; 
          text-align: center; 
        }
        @media (max-width: 600px) { 
          .results-footer { flex-direction: column; gap: 12px; text-align: center; }
          .results-hint { display: none; }
        }
        .result-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
        .result-header a { flex: 1; }
        .save-btn { 
          background: transparent; 
          border: 1px solid rgba(230, 209, 163, 0.3); 
          border-radius: 6px; 
          padding: 6px 8px; 
          font-size: 16px; 
          cursor: pointer; 
          transition: all 0.2s ease;
          color: var(--sand-200);
        }
        .save-btn:hover:not(:disabled) { 
          background: rgba(230, 209, 163, 0.1); 
          border-color: var(--sand-400); 
          transform: scale(1.05);
        }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .save-btn.saved { 
          background: rgba(125, 255, 125, 0.1); 
          border-color: rgba(125, 255, 125, 0.3); 
          color: #7dff7d; 
        }
        .file-upload { position: relative; margin-bottom: 12px; }
        .file-input { position: absolute; opacity: 0; width: 0; height: 0; }
        .file-label { 
          display: block; 
          padding: 12px 16px; 
          background: rgba(13, 37, 49, 0.65); 
          border: 1px solid rgba(230, 209, 163, 0.25); 
          border-radius: 10px; 
          color: var(--sand-200); 
          cursor: pointer; 
          transition: all 0.2s ease; 
          text-align: center; 
        }
        .file-label:hover { 
          border-color: var(--sand-400); 
          background: rgba(13, 37, 49, 0.8); 
        }
      `}</style>
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}


