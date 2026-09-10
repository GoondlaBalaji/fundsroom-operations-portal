// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill all fields'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role: string) => {
    const creds: Record<string, [string, string]> = {
      admin: ['admin@fundsroom.com', 'Password@123'],
      sales: ['sales@fundsroom.com', 'Password@123'],
      warehouse: ['warehouse@fundsroom.com', 'Password@123'],
      accounts: ['accounts@fundsroom.com', 'Password@123'],
    };
    const [e, p] = creds[role];
    setEmail(e); setPassword(p);
  };

  return (
    <div className="login-page">
      <div className="login-card animate-in">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Building2 size={26} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Fundsroom ERP</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Operations Portal — Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div className="alert alert-danger" style={{ fontSize: 13 }}>
              <Lock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{
                position: 'absolute', left: 11, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)',
              }} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@company.com"
                style={{ paddingLeft: 34 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{
                position: 'absolute', left: 11, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)',
              }} />
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                style={{ paddingLeft: 34, paddingRight: 38 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2,
                }}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Login Buttons */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Quick Demo Login
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['admin', 'sales', 'warehouse', 'accounts'].map((role) => (
              <button
                key={role}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => quickLogin(role)}
                style={{ justifyContent: 'center', textTransform: 'capitalize' }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
