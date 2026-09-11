// src/pages/SalesChallanDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, Printer, MapPin, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { challansApi } from '../api/challans.api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { Challan } from '../types';

export const SalesChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Modals & Actions
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const canConfirm = (user?.role === 'ADMIN' || user?.role === 'WAREHOUSE' || user?.role === 'SALES');
  const canCancel = (user?.role === 'ADMIN' || user?.role === 'SALES');

  const loadChallan = async () => {
    if (!id) return;
    try {
      const data = await challansApi.getById(id);
      setChallan(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Challan not found');
      navigate('/challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallan();
  }, [id]);

  const handleConfirm = async () => {
    if (!id) return;
    setConfirming(true);
    try {
      const updated = await challansApi.confirm(id);
      toast.success(`Challan ${updated.challanNumber} confirmed! Stock deducted.`);
      setChallan(updated);
      setConfirmModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm challan. Check inventory levels.');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      const updated = await challansApi.cancel(id, { reason: cancelReason || 'Cancelled by staff' });
      toast.success(`Challan ${updated.challanNumber} has been cancelled.`);
      setChallan(updated);
      setCancelModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel challan');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!challan) return;
    setExportingPdf(true);
    try {
      await challansApi.downloadPdf(challan.id, challan.challanNumber);
      toast.success(`PDF invoice for ${challan.challanNumber} downloaded!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to export PDF invoice');
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (!challan) return null;

  return (
    <div className="page-container printable-area">
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print" style={{ marginBottom: 20 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/challans')}
          style={{ marginBottom: 12, paddingLeft: 0 }}
        >
          <ArrowLeft size={16} /> Back to Sales Challans
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="page-title" style={{ margin: 0 }}>{challan.challanNumber}</h1>
            <Badge status={challan.status} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              title="Download official PDF invoice document"
            >
              <Download size={15} /> {exportingPdf ? 'Exporting...' : 'Export PDF'}
            </button>

            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Printer size={15} /> Print
            </button>

            {challan.status === 'DRAFT' && canConfirm && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setConfirmModalOpen(true)}
              >
                <CheckCircle2 size={15} /> Confirm & Dispatch
              </button>
            )}

            {challan.status === 'DRAFT' && canCancel && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setCancelModalOpen(true)}
              >
                <XCircle size={15} /> Cancel Challan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Challan Document Layout */}
      <div className="card" style={{ padding: '32px 36px', background: 'var(--bg-surface)' }}>
        {/* Document Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid var(--border-default)',
          paddingBottom: 24,
          marginBottom: 24
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 8,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '1.1rem'
              }}>
                F
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>FUNDSROOM ENTERPRISES</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Wholesale & Industrial Distribution Logistics</div>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>
              GSTIN: 29AAACF9876Q1ZB • Reg Office: Sector 4, Ind. Area, Bangalore 560001
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-accent)' }}>
              DELIVERY CHALLAN
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'monospace', marginTop: 4 }}>
              {challan.challanNumber}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Date: {new Date(challan.createdAt).toLocaleDateString()}
            </div>
            <div style={{ marginTop: 6 }}>
              <Badge status={challan.status} />
            </div>
          </div>
        </div>

        {/* Customer & Shipment Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28 }}>
          {/* Bill To */}
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
              DISPATCH / BILL TO
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {challan.customer?.businessName || challan.customer?.name}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Attention: {challan.customer?.name}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
              <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
              {challan.customer ? (challan.customer as any).address || 'Address on file' : 'N/A'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              Phone: {challan.customer?.mobile || 'N/A'}
            </div>
            {(challan.customer as any)?.gstNumber && (
              <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: 4 }}>
                GSTIN: {(challan.customer as any).gstNumber}
              </div>
            )}
          </div>

          {/* Shipment Meta */}
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
              CHALLAN METADATA
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Created By:</span>
                <span style={{ fontWeight: 500 }}>{challan.createdBy?.name || 'Staff'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Creation Time:</span>
                <span>{new Date(challan.createdAt).toLocaleString()}</span>
              </div>
              {challan.confirmedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                  <span>Confirmed At:</span>
                  <span style={{ fontWeight: 500 }}>{new Date(challan.confirmedAt).toLocaleString()}</span>
                </div>
              )}
              {challan.cancelledAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                  <span>Cancelled At:</span>
                  <span style={{ fontWeight: 500 }}>{new Date(challan.cancelledAt).toLocaleString()}</span>
                </div>
              )}
              {challan.notes && (
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--border-default)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Notes: </span>
                  <span style={{ fontStyle: 'italic' }}>{challan.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ marginBottom: 28 }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--bg-overlay)' }}>
                <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                <th style={{ width: '45%' }}>Item Description (Snapshot)</th>
                <th style={{ width: '20%' }}>SKU</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Qty</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Unit Price</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {challan.items?.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{index + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.snapshotName}</div>
                    {item.product && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Current warehouse stock: {item.product.stock} units
                      </div>
                    )}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-accent)' }}>
                    {item.snapshotSku}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {item.quantity}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    ₹{Number(item.snapshotUnitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ₹{Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border-default)', fontWeight: 700 }}>
                <td colSpan={3} style={{ textAlign: 'right', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                  Total Dispatched Units:
                </td>
                <td style={{ textAlign: 'right', fontSize: '1rem', color: 'var(--text-accent)' }}>
                  {challan.totalQuantity}
                </td>
                <td style={{ textAlign: 'right', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                  Grand Total:
                </td>
                <td style={{ textAlign: 'right', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                  ₹{Number(challan.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer / Declarations */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 24,
          borderTop: '1px solid var(--border-default)',
          paddingTop: 24,
          marginTop: 20
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <p><strong>Terms & Declarations:</strong></p>
            <p>1. Goods described above are dispatched on the terms agreed upon in the master wholesale order.</p>
            <p>2. Please inspect all physical seal intactness before signing the receiver delivery acknowledgement.</p>
            <p>3. This document serves as an official delivery challan under applicable state GST rules.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
            <div style={{ borderBottom: '1px solid var(--border-default)', width: 180, height: 40 }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              Authorized Signatory
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Fundsroom Logistics
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title="Confirm Sales Challan Dispatch"
        message={
          <div>
            <p>Are you sure you want to confirm challan <strong>{challan.challanNumber}</strong>?</p>
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 6, fontSize: '0.85rem', color: '#34d399' }}>
              ✓ Stock for all {challan.items?.length || 0} line items will be validated and deducted from warehouse inventory.
              <br />✓ An OUT movement ledger entry will be recorded atomically.
            </div>
          </div>
        }
        confirmLabel={confirming ? 'Deducting Stock...' : 'Confirm & Deduct Stock'}
        confirmVariant="primary"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModalOpen(false)}
      />

      {/* Cancellation Dialog */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        title="Cancel Sales Challan"
        message={
          <div>
            <p>Are you sure you want to cancel challan <strong>{challan.challanNumber}</strong>?</p>
            <div style={{ marginTop: 12 }}>
              <label className="form-label">Cancellation Reason</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Customer cancelled order / item mismatch"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
        }
        confirmLabel={cancelling ? 'Cancelling...' : 'Cancel Challan'}
        confirmVariant="danger"
        onConfirm={handleCancel}
        onCancel={() => setCancelModalOpen(false)}
      />
    </div>
  );
};
