// src/components/layout/AppLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Shield, ChevronDown, HelpCircle } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { user } = useAuth();

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {/* Institutional Workbench Topbar (FinScan AI style) */}
        <header className="institutional-topbar">
          <div className="topbar-left">
            <div className="topbar-brand">
              <div className="topbar-brand-icon">
                <Shield size={14} color="#FFFFFF" />
              </div>
              <span className="topbar-brand-name">Fundsroom ERP</span>
              <span className="topbar-committee-pill">OPERATIONS DESK</span>
            </div>

            <div className="dossier-pill" title="Current Operations Workspace">
              <span className="dossier-label">Dossier:</span>
              <span className="dossier-id">APP-25195</span>
              <span className="dossier-name">(Wholesale & Distribution • Active Desk)</span>
              <ChevronDown size={13} color="#71717A" />
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-pill pill-ready">
              <span className="pill-dot"></span>
              READY FOR REVIEW
            </div>

            <div className="topbar-pill pill-sla">
              SLA 99.9% OPERATIONAL (LIVE)
            </div>

            <div className="topbar-help-btn" title="Audit & Policy Invariants">
              <HelpCircle size={15} />
            </div>

            <div className="topbar-user">
              <div className="topbar-user-avatar">{initials}</div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{user?.name || 'Operations Officer'}</span>
                <span className="topbar-user-role">{user?.role} Officer</span>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
