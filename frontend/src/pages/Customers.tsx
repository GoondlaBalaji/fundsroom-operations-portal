// src/pages/Customers.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit, Eye, Phone, Mail,
  Calendar, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi } from '../api/customers.api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { Customer, CustomerType, CustomerStatus } from '../types';

export const Customers: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'WHOLESALE' as CustomerType,
    address: '',
    status: 'ACTIVE' as CustomerStatus,
    followUpDate: '',
    notes: '',
  });

  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customersApi.list({
        search: search || undefined,
        status: statusFilter || undefined,
        customerType: typeFilter || undefined,
        page,
        limit,
      });
      setCustomers(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, typeFilter, page]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      address: '',
      status: 'ACTIVE',
      followUpDate: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      mobile: cust.mobile,
      email: cust.email || '',
      businessName: cust.businessName,
      gstNumber: cust.gstNumber || '',
      customerType: cust.customerType,
      address: cust.address,
      status: cust.status,
      followUpDate: cust.followUpDate ? cust.followUpDate.split('T')[0] : '',
      notes: cust.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim() || undefined,
        businessName: formData.businessName.trim(),
        gstNumber: formData.gstNumber.trim() || undefined,
        customerType: formData.customerType,
        address: formData.address.trim(),
        status: formData.status,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, payload);
        toast.success('Customer updated successfully');
      } else {
        await customersApi.create(payload);
        toast.success('Customer created successfully');
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers & CRM</h1>
          <p className="page-subtitle">Manage wholesale clients, leads, contact details, and follow-ups</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            Add Customer
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input"
              placeholder="Search by company, name, phone, or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 38 }}
            />
          </div>

          <div style={{ minWidth: 150 }}>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="LEAD">Lead</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div style={{ minWidth: 160 }}>
            <select
              className="input"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="RETAIL">Retail</option>
              <option value="DISTRIBUTOR">Distributor</option>
            </select>
          </div>

          {(search || statusFilter || typeFilter) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setPage(1); }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table / Content */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size="lg" />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={search || statusFilter || typeFilter ? "Try adjusting your search filters" : "Start building your customer directory by adding your first client"}
            action={canEdit && !search && !statusFilter && !typeFilter ? (
              <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                <Plus size={14} /> Add Customer
              </button>
            ) : undefined}
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Business & Contact</th>
                    <th>Contact Info</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Next Follow-Up</th>
                    <th>Created By</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((cust) => (
                    <tr key={cust.id}>
                      <td>
                        <div
                          style={{ fontWeight: 600, color: 'var(--text-accent)', cursor: 'pointer' }}
                          onClick={() => navigate(`/customers/${cust.id}`)}
                        >
                          {cust.businessName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {cust.name} {cust.gstNumber ? `• GST: ${cust.gstNumber}` : ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                          <Phone size={13} color="var(--text-muted)" />
                          <span>{cust.mobile}</span>
                        </div>
                        {cust.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            <Mail size={12} />
                            <span>{cust.email}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge status={cust.customerType} />
                      </td>
                      <td>
                        <Badge status={cust.status} />
                      </td>
                      <td>
                        {cust.followUpDate ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem', color: '#fbbf24' }}>
                            <Calendar size={13} />
                            <span>{new Date(cust.followUpDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {cust.createdBy?.name || 'Admin'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            title="View Details & Follow-ups"
                            onClick={() => navigate(`/customers/${cust.id}`)}
                          >
                            <Eye size={15} />
                          </button>
                          {canEdit && (
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              title="Edit Customer"
                              onClick={() => openEditModal(cust)}
                            >
                              <Edit size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">Business / Firm Name *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      placeholder="e.g. Apex Electronics Ltd"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Contact Person Name *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      placeholder="e.g. Rajesh Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      className="input"
                      placeholder="e.g. 9876543210"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="e.g. contact@apex.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">Customer Type *</label>
                    <select
                      className="input"
                      value={formData.customerType}
                      onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
                    >
                      <option value="WHOLESALE">Wholesale</option>
                      <option value="RETAIL">Retail</option>
                      <option value="DISTRIBUTOR">Distributor</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Status *</label>
                    <select
                      className="input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="LEAD">Lead</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">GST Number</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Billing / Delivery Address *</label>
                  <textarea
                    required
                    className="input"
                    rows={2}
                    placeholder="Enter complete office/warehouse address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">Scheduled Follow-Up Date</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Initial CRM Notes</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Notes about business, preference, credit..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Spinner size="sm" /> : editingCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
