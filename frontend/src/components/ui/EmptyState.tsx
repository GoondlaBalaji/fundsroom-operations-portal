// src/components/ui/EmptyState.tsx
import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  description = 'There are no records to display.',
  action,
  icon,
}) => (
  <div className="empty-state">
    {icon || <Inbox size={48} />}
    <h3>{title}</h3>
    <p>{description}</p>
    {action}
  </div>
);
