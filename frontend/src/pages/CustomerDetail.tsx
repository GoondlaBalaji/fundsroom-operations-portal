// src/pages/CustomerDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar,
  MessageSquare, Clock, Plus, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi } from '../api/customers.api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Spinner, PageSpinner } from '../components/ui/Spinner';
import type { Customer, CustomerFollowUp, Challan } from '../types';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<CustomerFollowUp[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);

  // New Follow-Up Form
  const [newNote, setNewNote] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const canAddNote = user?.role === 'ADMIN' || user?.role === 'SALES';

  const loadCustomerData = async () => {
    if (!id) return;
    try {
      const data = await customersApi.getById(id);
      setCustomer(data);
      if (data.followUps) {
        setFollowUps(data.followUps);
      }
      if (data.challans) {
        setChallans(data.challans);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Customer not found');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newNote.trim()) return;

    setSubmittingNote(true);
    try {
      await customersApi.addFollowUp(id, {
        note: newNote.trim(),
        followUpDate: newFollowUpDate ? new Date(newFollowUpDate).toISOString() : undefined,
      });
      toast.success('Follow-up note logged');
      setNewNote('');
      setNewFollowUpDate('');
      loadCustomerData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to log follow-up');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (!customer) return null;

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/customers')}
          style={{ marginBottom: 12, paddingLeft: 0 }}
        >
          <ArrowLeft size={16} /> Back to Customers
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 className="page-title" style={{ margin: 0 }}>{customer.businessName}</h1>
              <Badge status={customer.customerType} />
              <Badge status={customer.status} />
            </div>
            <p className="page-subtitle" style={{ marginTop: 4 }}>
              Contact: <strong>{customer.name}</strong> • Created on {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
            <Link to="/challans" className="btn btn-primary btn-sm">
              <FileText size={15} />
              Create Challan for Client
            </Link>
          )}
        </div>
      </div>

      {/* Grid: Left Column Info, Right Column Follow-ups & Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        {/* Left: Customer Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 18, borderBottom: '1px solid var(--border-default)', paddingBottom: 10 }}>
              Client Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Business Name</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{customer.businessName}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Primary Contact</div>
                <div style={{ fontWeight: 500 }}>{customer.name}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mobile Phone</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                    <Phone size={14} color="var(--text-accent)" />
                    {customer.mobile}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, wordBreak: 'break-all' }}>
                    <Mail size={14} color="var(--text-accent)" />
                    {customer.email || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GST Number</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{customer.gstNumber || 'Unregistered'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Account Manager</div>
                  <div style={{ fontWeight: 500 }}>{customer.createdBy?.name || 'System Admin'}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Address</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 4 }}>
                  <MapPin size={15} color="var(--text-muted)" style={{ marginTop: 3, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.9rem' }}>{customer.address}</span>
                </div>
              </div>

              {customer.notes && (
                <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>General Notes</div>
                  <p style={{ fontSize: '0.85rem', marginTop: 4, color: 'var(--text-secondary)' }}>{customer.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Challans History Card */}
          <div className="card">
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Sales Challan Orders ({challans.length})</h3>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                        No challans created yet
                      </td>
                    </tr>
                  ) : (
                    challans.map((ch) => (
                      <tr key={ch.id} onClick={() => navigate(`/challans/${ch.id}`)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{ch.challanNumber}</td>
                        <td><Badge status={ch.status} /></td>
                        <td style={{ fontWeight: 500 }}>₹{Number(ch.totalAmount).toLocaleString('en-IN')}</td>
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
        </div>

        {/* Right: CRM Follow-Up Timeline & Logger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Add Follow-Up Card */}
          {canAddNote && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={16} color="var(--primary-500)" />
                Log CRM Interaction / Follow-up Note
              </h3>
              <form onSubmit={handleAddFollowUp}>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">Interaction Note *</label>
                  <textarea
                    required
                    rows={3}
                    className="input"
                    placeholder="e.g. Spoke to Rajesh. They requested quotation for 500 units of industrial connectors. Next call on Friday."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'flex-end' }}>
                  <div>
                    <label className="form-label">Next Follow-Up Due Date</label>
                    <input
                      type="date"
                      className="input"
                      value={newFollowUpDate}
                      onChange={(e) => setNewFollowUpDate(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={submittingNote}>
                    {submittingNote ? <Spinner size="sm" /> : <><Plus size={14} /> Add Note</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Timeline of Follow-ups */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border-default)', paddingBottom: 10 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} /> Follow-Up Timeline ({followUps.length})
              </h3>
              {customer.followUpDate && (
                <span style={{ fontSize: '0.8rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} /> Next: {new Date(customer.followUpDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {followUps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <MessageSquare size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p>No follow-up notes logged yet.</p>
                <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Record your customer conversations above.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {followUps.map((fu) => (
                  <div
                    key={fu.id}
                    style={{
                      position: 'relative',
                      paddingLeft: 24,
                      borderLeft: '2px solid var(--primary-500)',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: -6,
                      top: 4,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: 'var(--primary-500)',
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {fu.createdBy?.name || 'Staff Member'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(fu.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {fu.note}
                    </p>

                    {fu.followUpDate && (
                      <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} />
                        Next action scheduled for: {new Date(fu.followUpDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
