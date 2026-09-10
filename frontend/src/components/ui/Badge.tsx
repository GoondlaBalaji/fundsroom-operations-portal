// src/components/ui/Badge.tsx
import React from 'react';

interface BadgeProps {
  variant?: string;
  status?: string;
  type?: string;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant, status, type, children }) => {
  const val = (variant || status || type || 'default').toLowerCase().replace(/_/g, '-');
  const cls = `badge badge-${val}`;
  return <span className={cls}>{children || status || variant || type}</span>;
};

export const StatusBadge = ({ status }: { status: string }) => (
  <Badge status={status}>{status}</Badge>
);

export const CustomerTypeBadge = ({ type }: { type: string }) => (
  <Badge type={type}>{type}</Badge>
);

export const MovementBadge = ({ type }: { type: string }) => (
  <Badge type={type}>{type}</Badge>
);
