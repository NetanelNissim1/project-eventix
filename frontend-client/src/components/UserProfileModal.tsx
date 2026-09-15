import React, { useState } from 'react';
import { User } from '../types';
import { X, Key, Copy, Check, LogOut, UserCheck } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onLogout }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyToken = () => {
    if (user.token) {
      navigator.clipboard.writeText(user.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user.name}</h2>
              <span className="text-[11px] text-slate-400 font-mono">@{user.username} &bull; {user.email}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-1.5">ASSIGNED REALM ROLES</span>
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                ACTIVE JWT TOKEN (BEARER)
              </span>

              <button
                onClick={handleCopyToken}
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 font-mono"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 break-all max-h-24 overflow-y-auto">
              {user.token || 'No active token'}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => { onLogout(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
