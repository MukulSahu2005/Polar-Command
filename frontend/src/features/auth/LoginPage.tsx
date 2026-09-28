import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button, Input, Badge } from '@/components/ui';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    setError('');
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      toast.success('Welcome to Polar Command');
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Use the demo credentials below.');
    }
  };

  const fillDemo = () => {
    setEmail('operator@polar.demo');
    setPassword('polar123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Floating particles / snow effect */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `fadeIn ${2 + Math.random() * 3}s ease-in-out infinite alternate`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-600 mb-4 shadow-lg shadow-cyan-900/50">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M4.22 4.22l.71.71m12.73 12.73l.71.71M3 12h1m16 0h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white tracking-wider mb-1">POLAR COMMAND</h1>
          <p className="text-slate-400 text-sm font-mono tracking-widest uppercase text-xs">Remote Operations Console</p>
          <p className="text-slate-500 text-xs font-mono mt-1">Antarctic Research Telemetry Network · v4.2-EXP</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/40 border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              <h2 className="text-sm font-semibold text-slate-800 tracking-wide uppercase font-mono">Operator Authentication</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email / Personnel ID"
                type="email"
                id="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="operator@polar.demo"
                autoComplete="email"
              />
              <Input
                label="Security Passphrase"
                type="password"
                id="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                autoComplete="current-password"
                error={error}
              />
              <Button type="submit" variant="primary" className="w-full justify-center" loading={loading} size="lg">
                {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
              </Button>
            </form>
          </div>

          {/* Demo credentials box */}
          <div className="bg-slate-50 border-t border-slate-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="cyan" size="xs">DEMO ACCESS</Badge>
                  <span className="text-[10px] text-slate-400 font-mono">PROTOTYPE MODE</span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-mono text-slate-600">
                    <span className="text-slate-400">ID:</span> operator@polar.demo
                  </div>
                  <div className="text-xs font-mono text-slate-600">
                    <span className="text-slate-400">KEY:</span> polar123
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fillDemo} type="button">
                Fill Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-slate-500 text-[10px] font-mono tracking-wide">
            STATIONS: MAITRI · BHARATI · COORDINATES: 70°45'S / 69°24'S
          </p>
          <p className="text-slate-600 text-[10px] font-mono">
            SIH 2026 — PS 26060 · DEMO TELEMETRY ONLY
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
