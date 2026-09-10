// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Package, FileText, CheckCircle, AlertTriangle,
  ArrowUpRight, ArrowDownLeft, Clock, PlusCircle, RefreshCw, Calendar,
  ArrowRight
} from 'lucide-react';
import { dashboardApi } from '../api/dashboard.api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import type { DashboardStats } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <PageSpinner />;
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>. Here is your operations and inventory overview.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
            <Link to="/challans" className="btn btn-primary btn-sm">
              <PlusCircle size={14} />
              New Challan
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/customers')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Users size={22} />
          </div>
          <div className="stat-value">{stats?.totalCustomers ?? 0}</div>
          <div className="stat-label">Total Customers</div>
          <div className="stat-footer" style={{ color: '#60a5fa' }}>
            View customers <ArrowRight size={12} />
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Package size={22} />
          </div>
          <div className="stat-value">{stats?.totalProducts ?? 0}</div>
          <div className="stat-label">Active Products</div>
          <div className="stat-footer" style={{ color: '#c084fc' }}>
            Manage catalog <ArrowRight size={12} />
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/inventory')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper" style={{
            background: (stats?.lowStockCount ?? 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: (stats?.lowStockCount ?? 0) > 0 ? '#f87171' : '#34d399'
          }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-value" style={{ color: (stats?.lowStockCount ?? 0) > 0 ? '#f87171' : 'inherit' }}>
            {stats?.lowStockCount ?? 0}
          </div>
          <div className="stat-label">Low Stock Alerts</div>
          <div className="stat-footer" style={{ color: (stats?.lowStockCount ?? 0) > 0 ? '#f87171' : 'var(--text-muted)' }}>
            {(stats?.lowStockCount ?? 0) > 0 ? 'Requires immediate restock' : 'All stock levels healthy'}
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/challans')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <FileText size={22} />
          </div>
          <div className="stat-value">{stats?.draftChallans ?? 0}</div>
          <div className="stat-label">Draft Challans</div>
          <div className="stat-footer" style={{ color: '#fbbf24' }}>
            Pending confirmation <ArrowRight size={12} />
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/challans')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle size={22} />
          </div>
          <div className="stat-value">{stats?.confirmedChallans ?? 0}</div>
          <div className="stat-label">Confirmed Challans</div>
          <div className="stat-footer" style={{ color: '#34d399' }}>
            Fulfilled orders <ArrowRight size={12} />
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
        <div className="alert-banner" style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#f87171'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#f87171' }}>
                {stats.lowStockProducts.length} Product(s) Below Minimum Stock Level
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {stats.lowStockProducts.map(p => `${p.name} (${p.stock}/${p.minStockAlert})`).join(' • ')}
              </div>
            </div>
          </div>
          <Link to="/inventory" className="btn btn-danger btn-sm" style={{ whiteSpace: 'nowrap' }}>
            Restock Now
          </Link>
        </div>
      )}

      {/* 2-Column Section: Recent Challans & Upcoming Follow-ups */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Recent Challans Card */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Sales Challans</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest outbound shipments and drafts</p>
            </div>
            <Link to="/challans" className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {!stats?.recentChallans?.length ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No challans recorded yet
                    </td>
                  </tr>
                ) : (
                  stats.recentChallans.slice(0, 5).map((ch) => (
                    <tr key={ch.id} onClick={() => navigate(`/challans/${ch.id}`)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{ch.challanNumber}</td>
                      <td>{ch.customer?.businessName || ch.customer?.name || 'N/A'}</td>
                      <td>₹{Number(ch.totalAmount).toLocaleString('en-IN')}</td>
                      <td>
                        <Badge status={ch.status} />
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(ch.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Follow-ups Card */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Upcoming CRM Follow-ups</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scheduled customer calls and meetings</p>
            </div>
            <Link to="/customers" className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>
              View CRM <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ padding: 16 }}>
            {!stats?.upcomingFollowUps?.length ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 16px' }}>
                <Clock size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p>No upcoming follow-ups scheduled</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.upcomingFollowUps.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => navigate(`/customers/${cust.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cust.businessName || cust.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Contact: {cust.mobile}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.8rem',
                        color: '#fbbf24',
                        background: 'rgba(245, 158, 11, 0.1)',
                        padding: '4px 8px',
                        borderRadius: 6
                      }}>
                        <Calendar size={12} />
                        {cust.followUpDate ? new Date(cust.followUpDate).toLocaleDateString() : 'Pending'}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Badge status={cust.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Movements Log Card */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Stock Movement Audit Log</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Track IN & OUT stock audit events with timestamps</p>
          </div>
          <Link to="/inventory" className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>
            Full Stock Log <ArrowRight size={14} />
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Reason / Reference</th>
                <th>Logged By</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {!stats?.recentMovements?.length ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    No inventory movements recorded yet
                  </td>
                </tr>
              ) : (
                stats.recentMovements.slice(0, 5).map((mv) => (
                  <tr key={mv.id}>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: mv.movementType === 'IN' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: mv.movementType === 'IN' ? '#34d399' : '#f87171',
                      }}>
                        {mv.movementType === 'IN' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {mv.movementType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{mv.product?.name || 'Unknown Product'}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{mv.product?.sku || 'N/A'}</td>
                    <td style={{ fontWeight: 600 }}>
                      {mv.movementType === 'IN' ? `+${mv.quantity}` : `-${mv.quantity}`}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{mv.reason}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{mv.createdBy?.name || 'System'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(mv.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
