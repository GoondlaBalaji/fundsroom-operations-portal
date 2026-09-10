// src/components/ui/Spinner.tsx
import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = { sm: 16, md: 24, lg: 40 };
  const s = sizes[size];
  return (
    <div
      className="loading-spinner"
      style={{ width: s, height: s }}
    />
  );
};

export const PageSpinner: React.FC = () => (
  <div className="loading-center">
    <Spinner size="lg" />
  </div>
);
