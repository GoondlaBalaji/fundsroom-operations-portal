// src/pages/Inventory.tsx
import React, { useEffect, useState } from 'react';
import {
  Plus, ArrowDownLeft, ArrowUpRight,
  AlertTriangle, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryApi } from '../api/inventory.api';
import { productsApi } from '../api/products.api';
import { useAuth } from '../context/AuthContext';
import { Pagination } from '../components/ui/Pagination';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { StockMovement, Product } from '../types';

export const Inventory: React.FC = () => {
  const { user } = useAuth();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [productFilter, setProductFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Inbound Stock Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inData, setInData] = useState({
    productId: '',
    quantity: 10,
    reason: 'Purchase Order Inward',
    referenceId: '',
  });

  const canRecordMovement = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const fetchLowStock = async () => {
    try {
      const data = await inventoryApi.getLowStock();
      setLowStockProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProductList = async () => {
    try {
      const res = await productsApi.list({ limit: 100 });
      setProducts(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.listMovements({
        movementType: typeFilter || undefined,
        productId: productFilter || undefined,
        page,
        limit,
      });
      setMovements(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch inventory logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
    fetchProductList();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [typeFilter, productFilter, page]);

  const openRecordModal = (preselectedProductId?: string) => {
    setInData({
      productId: preselectedProductId || (products[0]?.id || ''),
      quantity: 10,
      reason: 'Purchase Order Inward',
      referenceId: '',
    });
    setModalOpen(true);
  };

  const handleRecordIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inData.productId) {
      toast.error('Please select a product');
      return;
    }
    if (inData.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      await inventoryApi.createInMovement({
        productId: inData.productId,
        quantity: Number(inData.quantity),
        reason: inData.reason.trim(),
        referenceId: inData.referenceId.trim() || undefined,
      });
      toast.success('Stock received and updated successfully');
      setModalOpen(false);
      fetchMovements();
      fetchLowStock();
      fetchProductList();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record stock receipt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory & Stock Ledger</h1>
          <p className="page-subtitle">Complete audit trail of warehouse receipts, sales dispatches, and adjustments</p>
        </div>
        {canRecordMovement && (
          <button className="btn btn-primary" onClick={() => openRecordModal()}>
            <Plus size={16} />
            Receive Stock (IN)
          </button>
        )}
      </div>

      {/* Low Stock Alerts Section */}
      {lowStockProducts.length > 0 && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.04)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color="#f87171" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f87171', margin: 0 }}>
                Low Stock Threshold Alerts ({lowStockProducts.length})
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Stock level &le; minimum threshold
            </span>
          </div>

          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-accent)' }}>{p.sku}</div>
                  <div style={{ fontSize: '0.8rem', color: '#f87171', marginTop: 4, fontWeight: 500 }}>
                    Stock: {p.stock} / Min: {p.minStockAlert}
                  </div>
                </div>
                {canRecordMovement && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openRecordModal(p.id)}
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    + Restock
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ minWidth: 160 }}>
            <select
              className="input"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Movement Types</option>
              <option value="IN">IN (Stock Received / PO)</option>
              <option value="OUT">OUT (Sales Dispatch / Challan)</option>
            </select>
          </div>

          <div style={{ minWidth: 240, flex: '1 1 200px' }}>
            <select
              className="input"
              value={productFilter}
              onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>

          {(typeFilter || productFilter) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setTypeFilter(''); setProductFilter(''); setPage(1); }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size="lg" />
          </div>
        ) : movements.length === 0 ? (
          <EmptyState
            title="No inventory movements found"
            description="No stock in/out records match your current criteria"
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Product Details</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Reason / Reference</th>
                    <th>Reference ID</th>
                    <th>Logged By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const isIn = m.movementType === 'IN';
                    return (
                      <tr key={m.id}>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: isIn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isIn ? '#34d399' : '#f87171',
                          }}>
                            {isIn ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                            {m.movementType}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{m.product?.name || 'Unknown Product'}</div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-accent)' }}>
                          {m.product?.sku || '—'}
                        </td>
                        <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          <span style={{ color: isIn ? '#34d399' : '#f87171' }}>
                            {isIn ? `+${m.quantity}` : `-${m.quantity}`}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{m.reason}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {m.referenceId || '—'}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {m.createdBy?.name || 'Staff'}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(m.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Record IN Movement Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title">Record Stock Receipt (IN)</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordIn}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label">Select Product *</label>
                  <select
                    required
                    className="input"
                    value={inData.productId}
                    onChange={(e) => setInData({ ...inData, productId: e.target.value })}
                  >
                    <option value="">Select a product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — Current Stock: {p.stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">Quantity to Add *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="input"
                      value={inData.quantity}
                      onChange={(e) => setInData({ ...inData, quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="form-label">PO / Invoice #</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. PO-2026-089"
                      value={inData.referenceId}
                      onChange={(e) => setInData({ ...inData, referenceId: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Reason / Inward Note *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="e.g. Supplier delivery batch #42"
                    value={inData.reason}
                    onChange={(e) => setInData({ ...inData, reason: e.target.value })}
                  />
                </div>

                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  color: '#34d399'
                }}>
                  ✓ This will increment the product's on-hand warehouse inventory and write a permanent audit entry in the stock ledger.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Spinner size="sm" /> : 'Confirm Inward Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
