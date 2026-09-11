// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './router/PrivateRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { SalesChallans } from './pages/SalesChallans';
import { SalesChallanDetail } from './pages/SalesChallanDetail';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#FFFFFF',
              color: '#18181B',
              border: '1px solid #E2DDD5',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
              fontSize: '0.85rem',
              fontWeight: 500,
              borderRadius: '4px',
            },
            success: {
              iconTheme: {
                primary: '#15803D',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#991B1B',
                secondary: '#FFFFFF',
              },
            },
          }}
        />

        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/products" element={<Products />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/challans" element={<SalesChallans />} />
              <Route path="/challans/:id" element={<SalesChallanDetail />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
