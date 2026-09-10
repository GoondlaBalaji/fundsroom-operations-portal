// src/components/ui/ConfirmModal.tsx
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'success' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose?: () => void;
  onCancel?: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, title, message, confirmLabel = 'Confirm',
  confirmVariant = 'danger', isLoading, onConfirm, onClose, onCancel,
}) => {
  if (!isOpen) return null;
  const handleDismiss = onCancel || onClose || (() => {});

  return (
    <div className="modal-overlay" onClick={handleDismiss}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning-text)' }} />
            <span className="modal-title">{title}</span>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={handleDismiss}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{message}</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleDismiss} disabled={isLoading}>
            Cancel
          </button>
          <button
            className={`btn btn-${confirmVariant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
