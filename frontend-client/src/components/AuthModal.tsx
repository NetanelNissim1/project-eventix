import React, { useState } from 'react';
import { User } from '../types';
import { X, Lock, User as UserIcon, KeyRound, ExternalLink, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('customer1');
  const [loginPassword, setLoginPassword] = useState('customer123');
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'ROLE_CUSTOMER' | 'ROLE_ADMIN'>('ROLE_CUSTOMER');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuickFill = (type: 'customer' | 'admin') => {
    if (type === 'customer') {
      setLoginIdentifier('customer1');
      setLoginPassword('customer123');
    } else {
      setLoginIdentifier('admin');
      setLoginPassword('admin123');
    }
  };

  const generateJwtToken = (username: string, email: string, roles: string[]): string => {
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      sub: username,
      email,
      roles,
      iss: "http://localhost:8081/realms/eventix",
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000)
    }));
    return `${header}.${payload}.mock-signature-eventix-secure-hash`;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      let roles = ['ROLE_CUSTOMER'];
      let email = 'customer1@eventix.com';
      let name = 'John Doe';

      if (loginIdentifier.toLowerCase().includes('admin')) {
        roles = ['ROLE_ADMIN', 'ROLE_CUSTOMER', 'ROLE_AUDITOR'];
        email = 'admin@eventix.com';
        name = 'System Administrator';
      }

      const token = generateJwtToken(loginIdentifier, email, roles);

      const user: User = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        username: loginIdentifier,
        name,
        email,
        roles,
        token
      };

      localStorage.setItem('eventix_user', JSON.stringify(user));
      onLoginSuccess(user);
      setLoading(false);
      onClose();
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const roles: string[] = [regRole];
      if (regRole === 'ROLE_ADMIN') {
        roles.push('ROLE_AUDITOR');
      }

      const token = generateJwtToken(regUsername, regEmail, roles);

      const user: User = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        username: regUsername,
        name: regName,
        email: regEmail,
        roles,
        token
      };

      localStorage.setItem('eventix_user', JSON.stringify(user));
      onLoginSuccess(user);
      setLoading(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Eventix IAM & Security</h2>
              <span className="text-[11px] text-slate-400 font-mono">OAuth2 & OIDC Identity Provider</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/30">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              mode === 'login'
                ? 'border-sky-500 text-sky-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              mode === 'register'
                ? 'border-sky-500 text-sky-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">USERNAME OR EMAIL</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="customer1 or admin"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">PASSWORD</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Demo Accounts Quick-Fill */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-2">QUICK DEMO LOGINS</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('customer')}
                    className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-left transition-all"
                  >
                    <span className="text-xs font-bold text-sky-400 block">Customer</span>
                    <span className="text-[10px] text-slate-400 font-mono">customer1 / customer123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin')}
                    className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-left transition-all"
                  >
                    <span className="text-xs font-bold text-amber-400 block">Admin & Auditor</span>
                    <span className="text-[10px] text-slate-400 font-mono">admin / admin123</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In with JWT'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">FULL NAME</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">USERNAME</label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="janedoe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">PASSWORD</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">ACCOUNT ROLE</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('ROLE_CUSTOMER')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      regRole === 'ROLE_CUSTOMER'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Customer
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('ROLE_ADMIN')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      regRole === 'ROLE_ADMIN'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Keycloak SSO Banner */}
          <div className="pt-3 border-t border-slate-800 text-center">
            <a
              href="http://localhost:8081/realms/eventix/account"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Manage Keycloak Realm (SSO Portal)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
