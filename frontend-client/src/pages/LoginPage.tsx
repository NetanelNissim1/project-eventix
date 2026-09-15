import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, User as UserIcon, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { User } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/products';
  const login = useAuthStore((state) => state.login);

  const [identifier, setIdentifier] = useState('customer1');
  const [password, setPassword] = useState('customer123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickLogin = (role: 'customer' | 'admin') => {
    if (role === 'customer') {
      setIdentifier('customer1');
      setPassword('customer123');
    } else {
      setIdentifier('admin');
      setPassword('admin123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setTimeout(() => {
      let roles = ['ROLE_CUSTOMER'];
      let email = 'customer1@eventix.com';
      let name = 'John Doe';

      if (identifier.toLowerCase().includes('admin')) {
        roles = ['ROLE_ADMIN', 'ROLE_CUSTOMER', 'ROLE_AUDITOR'];
        email = 'admin@eventix.com';
        name = 'System Administrator';
      }

      // Generate RFC 7519 standard stateless JWT token format
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          sub: identifier,
          email,
          roles,
          iss: 'http://localhost:8081/realms/eventix',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000),
        })
      );
      const token = `${header}.${payload}.mock-sig-${Math.random().toString(36).substring(2, 9)}`;

      const user: User = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        username: identifier,
        name,
        email,
        roles,
        token,
      };

      login(user);
      setLoading(false);
      navigate(redirect, { replace: true });
    }, 400);
  };

  return (
    <div className="py-12 sm:py-16 max-w-md mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sign In</h1>
          <p className="text-xs text-slate-400">Enter your credentials to access your protected account</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">USERNAME OR EMAIL</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="customer1 or email"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-400">PASSWORD</label>
              <Link to="/forgot-password" className="text-[11px] text-sky-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500"
              />
              <span>Remember this session</span>
            </label>
          </div>

          {/* Quick Demo Logins */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">1-CLICK DEMO ACCOUNTS</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('customer')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all"
              >
                <span className="text-xs font-bold text-sky-400 block">Customer</span>
                <span className="text-[10px] text-slate-500 font-mono">customer1 / customer123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all"
              >
                <span className="text-xs font-bold text-amber-400 block">Admin & Auditor</span>
                <span className="text-[10px] text-slate-500 font-mono">admin / admin123</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>Authenticating JWT...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          <span>Don't have an account yet? </span>
          <Link to="/register" className="text-sky-400 font-bold hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};
