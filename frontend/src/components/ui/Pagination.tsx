// src/components/ui/Pagination.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page, totalPages, total, limit, onPageChange,
}) => {
  if (totalPages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <span>Showing {start}–{end} of {total}</span>
      <div className="pagination-controls">
        <button
          className="btn btn-secondary btn-sm btn-icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 13 }}>Page {page} of {totalPages}</span>
        <button
          className="btn btn-secondary btn-sm btn-icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
