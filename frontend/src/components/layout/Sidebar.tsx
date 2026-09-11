// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, BarChart3,
  FileText, LogOut, CheckCircle, Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  pageInfo: string;
  tag: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    icon: <LayoutDashboard size={14} />,
    label: 'Dashboard_Metrics.pdf',
    pageInfo: '1 page',
    tag: 'Live Sync',
  },
  {
    to: '/customers',
    icon: <Users size={14} />,
    label: 'Customer_Ledger_CRM.pdf',
    pageInfo: 'Dossier',
    tag: 'Native Layer',
    roles: ['ADMIN', 'SALES', 'ACCOUNTS'],
  },
  {
    to: '/products',
    icon: <Package size={14} />,
    label: 'Product_Catalog_SKU.pdf',
    pageInfo: 'Catalog',
    tag: 'Native Layer',
  },
  {
    to: '/inventory',
    icon: <BarChart3 size={14} />,
    label: 'Inventory_Audit_Log.pdf',
    pageInfo: 'Ledger',
    tag: 'Verified Ref',
  },
  {
    to: '/challans',
    icon: <FileText size={14} />,
    label: 'Sales_Challan_Orders.pdf',
    pageInfo: 'Official',
    tag: 'Native Layer',
  },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role as UserRole))
  );

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <aside className="sidebar">
      {/* Dossier Header Info Box (from screenshot) */}
      <div className="sidebar-dossier-header">
        <div className="dossier-subhead">
          <span>OPERATIONS DOSSIER</span>
          <span className="dossier-code">APP-25195</span>
        </div>
        <div className="dossier-applicant-name">Fundsroom Wholesale</div>

        <div className="dossier-meta-grid">
          <div className="dossier-meta-row">
            <span className="meta-label">ROLE:</span>
            <span className="meta-value">{user?.role}</span>
          </div>
          <div className="dossier-meta-row">
            <span className="meta-label">DESK:</span>
            <span className="meta-value text-success">● VERIFIED LIVE</span>
          </div>
        </div>
      </div>

      {/* Dossier Index Section Label */}
      <div className="sidebar-section-header">
        <span>DOSSIER INDEX ({visibleItems.length})</span>
        <span className="shortcut-hint">[ / ]</span>
      </div>

      {/* Dossier Card Items List */}
      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `dossier-index-card${isActive ? ' active' : ''}`}
          >
            <div className="card-top">
              <span className="card-icon">{item.icon}</span>
              <span className="card-filename truncate">{item.label}</span>
              <CheckCircle size={13} className="card-status-icon" />
            </div>
            <div className="card-badges">
              <span className="badge-pages">{item.pageInfo}</span>
              <span className="badge-layer">{item.tag}</span>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Footer Actions & Profile */}
      <div className="sidebar-footer">
        {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
          <button
            className="btn btn-secondary btn-sm w-full sidebar-upload-btn"
            onClick={() => navigate('/challans')}
          >
            <Plus size={13} /> Create Challan
          </button>
        )}

        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name truncate">{user?.name}</div>
            <div className="user-role">{user?.role} Officer</div>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={logout}
            title="Sign Out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
};
