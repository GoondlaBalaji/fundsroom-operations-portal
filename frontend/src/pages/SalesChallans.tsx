// src/pages/SalesChallans.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Trash2, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { challansApi } from '../api/challans.api';
import { customersApi } from '../api/customers.api';
import { productsApi } from '../api/products.api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { Challan, Customer, Product } from '../types';

interface LineItemInput {
  productId: string;
  quantity: number;
}

export const SalesChallans: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItemInput[]>([
    { productId: '', quantity: 1 }
  ]);

  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';

  const fetchDropdownData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        customersApi.list({ limit: 100 }),
        productsApi.list({ limit: 100 }),
      ]);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await challansApi.list({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit,
      });
      setChallans(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load sales challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    fetchChallans();
  }, [search, statusFilter, page]);

  const openCreateModal = () => {
    setCustomerId(customers[0]?.id || '');
    setNotes('');
    setItems([{ productId: products[0]?.id || '', quantity: 1 }]);
    setModalOpen(true);
  };

  const handleAddItem = () => {
    setItems([...items, { productId: products[0]?.id || '', quantity: 1 }]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) {
      toast.error('Challan must contain at least one product');
      return;
    }
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: 'productId' | 'quantity', value: any) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };

  // Calculate modal order summary
  const summary = items.reduce((acc, item) => {
    const prod = products.find(p => p.id === item.productId);
    const qty = Number(item.quantity) || 0;
    const price = prod ? Number(prod.unitPrice) : 0;
    acc.qty += qty;
    acc.total += qty * price;
    return acc;
  }, { qty: 0, total: 0 });

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }

    // Validate items
    for (const it of items) {
      if (!it.productId) {
        toast.error('Please select a product for all line items');
        return;
      }
      if (it.quantity <= 0) {
        toast.error('Quantities must be greater than zero');
        return;
      }
    }

    setSaving(true);
    try {
      const created = await challansApi.create({
        customerId,
        notes: notes.trim() || undefined,
        items: items.map(it => ({
          productId: it.productId,
          quantity: Number(it.quantity),
        })),
      });

      toast.success(`Draft Challan ${created.challanNumber} created!`);
      setModalOpen(false);
      fetchChallans();
      navigate(`/challans/${created.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create sales challan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Challans & Dispatch</h1>
          <p className="page-subtitle">Create delivery challans, verify warehouse stock, and confirm dispatches</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            Create Sales Challan
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input"
              placeholder="Search challan number or customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 38 }}
            />
          </div>

          <div style={{ minWidth: 160 }}>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {(search || statusFilter) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size="lg" />
          </div>
        ) : challans.length === 0 ? (
          <EmptyState
            title="No sales challans found"
            description={search || statusFilter ? "Try adjusting your filters" : "Create your first sales delivery challan to get started"}
            action={canCreate && !search && !statusFilter ? (
              <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                <Plus size={14} /> Create Challan
              </button>
            ) : undefined}
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Customer / Business</th>
                    <th>Items</th>
                    <th>Total Units</th>
                    <th>Total Value</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.map((ch) => (
                    <tr key={ch.id} onClick={() => navigate(`/challans/${ch.id}`)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 700, color: 'var(--text-accent)' }}>
                        {ch.challanNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ch.customer?.businessName || ch.customer?.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ch.customer?.name}</div>
                      </td>
                      <td>{ch._count?.items ?? ch.items?.length ?? 1} line item(s)</td>
                      <td style={{ fontWeight: 500 }}>{ch.totalQuantity} units</td>
                      <td style={{ fontWeight: 600 }}>
                        ₹{Number(ch.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <Badge status={ch.status} />
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {ch.createdBy?.name || 'Staff'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(ch.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          title="View Challan Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/challans/${ch.id}`);
                          }}
                        >
                          <Eye size={15} />
                        </button>
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

      {/* Create Challan Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Create Sales Challan (Draft)</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Items will be locked as draft until warehouse confirmation verifies stock.
                </p>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateChallan}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Select Customer */}
                <div>
                  <label className="form-label">Customer / Recipient *</label>
                  <select
                    required
                    className="input"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  >
                    <option value="">Select a customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.businessName} — {c.name} ({c.customerType})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Line Items Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>Products to Dispatch *</label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddItem}
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      <Plus size={13} /> Add Another Product
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.map((item, idx) => {
                      const selectedProd = products.find(p => p.id === item.productId);
                      const unitPrice = selectedProd ? Number(selectedProd.unitPrice) : 0;
                      const lineTotal = unitPrice * (Number(item.quantity) || 0);

                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2.5fr 1fr 1.2fr auto',
                            gap: 10,
                            alignItems: 'center',
                            background: 'var(--bg-subtle)',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-default)',
                          }}
                        >
                          <div>
                            <select
                              required
                              className="input"
                              value={item.productId}
                              onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                              style={{ fontSize: '0.85rem' }}
                            >
                              <option value="">Select product...</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} [{p.sku}] (On-hand: {p.stock}) - ₹{Number(p.unitPrice).toFixed(2)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <input
                              type="number"
                              required
                              min="1"
                              className="input"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                              style={{ fontSize: '0.85rem' }}
                            />
                          </div>

                          <div style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>

                          <div>
                            <button
                              type="button"
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => handleRemoveItem(idx)}
                              title="Remove item"
                              disabled={items.length <= 1}
                              style={{ color: 'var(--action-reject)' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Box */}
                <div style={{
                  background: 'var(--bg-subtle)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--border-default)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Units: </span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{summary.qty} units</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Value: </span>
                    <strong style={{ color: 'var(--action-approve)', fontSize: '1.15rem', fontWeight: 700 }}>
                      ₹{summary.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="form-label">Delivery / Challan Notes</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Urgent dispatch via BlueDart express, driver vehicle # DL-01-A-1234"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Spinner size="sm" /> : 'Create Draft Challan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
