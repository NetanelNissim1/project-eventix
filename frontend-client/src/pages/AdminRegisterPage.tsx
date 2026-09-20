import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldCheck, Mail, User as UserIcon, AlertCircle, ArrowRight, Lock, KeyRound } from 'lucide-react';
import { User } from '../types';

const MASTER_ADMIN_KEY = 'EVENTIX-ROOT-SECRET-2026';

export const AdminRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [securityToken, setSecurityToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Password verification
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Administrative password must contain at least 6 characters.');
      return;
    }

    // 2. Strict Master Security Token verification
    if (securityToken.trim() !== MASTER_ADMIN_KEY) {
      setError('Security Authorization Failed: Invalid Administrative Master Key. Access denied.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Elevated administrative roles
      const roles: string[] = ['ROLE_ADMIN', 'ROLE_AUDITOR'];

      // Generate stateless JWT token with administrative claims
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          sub: username,
          email,
          roles,
          iss: 'http://localhost:8081/realms/eventix',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000),
        })
      );
      const token = `${header}.${payload}.mock-admin-sig-${Math.random().toString(36).substring(2, 9)}`;

      const newUser: User = {
        id: 'adm-' + Math.random().toString(36).substring(2, 9),
        username,
        name: fullName,
        email,
        roles,
        token,
      };

      login(newUser);
      setLoading(false);
      navigate('/admin', { replace: true });
    }, 400);
  };

  return (
    <div className="py-12 sm:py-16 max-w-md mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 mb-1">
            PRIVILEGED ACCESS PORTAL
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Staff Provisioning</h1>
          <p className="text-xs text-slate-400">Register privileged Administrator account with root master token</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">OFFICIAL STAFF NAME *</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dana Scully"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">ADMIN USERNAME *</label>
            <div className="relative">
              <span className="text-slate-500 absolute left-3.5 top-2 text-xs font-bold font-mono">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="staff_username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">ORGANIZATION EMAIL *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@eventix.io"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Master Administrative Security Key */}
          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                ADMIN MASTER KEY *
              </label>
              <span className="text-[10px] text-amber-400/80 font-mono">Required</span>
            </div>
            <input
              type="password"
              required
              value={securityToken}
              onChange={(e) => setSecurityToken(e.target.value)}
              placeholder="Enter master authorization key..."
              className="w-full bg-slate-950 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />
            <p className="text-[10px] text-slate-500">
              Demo Key: <code className="text-amber-400/80 font-mono select-all">EVENTIX-ROOT-SECRET-2026</code>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">PASSWORD *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">CONFIRM *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span>Provisioning Credentials...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Provision Administrator Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          <span>Looking for Customer Store? </span>
          <Link to="/register" className="text-sky-400 font-bold hover:underline">
            Register as Customer
          </Link>
        </div>
      </div>
    </div>
  );
};
