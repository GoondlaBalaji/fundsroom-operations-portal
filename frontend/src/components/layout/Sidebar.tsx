// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, BarChart3,
  FileText, LogOut, Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
  {
    to: '/customers', icon: <Users size={17} />, label: 'Customers',
    roles: ['ADMIN', 'SALES', 'ACCOUNTS'],
  },
  { to: '/products', icon: <Package size={17} />, label: 'Products' },
  {
    to: '/inventory', icon: <BarChart3 size={17} />, label: 'Inventory',
  },
  {
    to: '/challans', icon: <FileText size={17} />, label: 'Sales Challans',
  },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

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
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={16} color="white" />
          </div>
          <div>
            <div className="sidebar-logo-text">Fundsroom</div>
            <div className="sidebar-logo-sub">ERP Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name truncate">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={logout}
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
