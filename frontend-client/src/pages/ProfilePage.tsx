import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { User, Shield, Key, Copy, Check, Save, MapPin, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 019-2834');
  const [copied, setCopied] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, phone });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword === confirmPassword) {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
  };

  const handleCopyToken = () => {
    if (user?.token) {
      navigator.clipboard.writeText(user.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <User className="w-8 h-8 text-sky-400" />
          Account Profile & Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal details, credentials, and inspect your active OAuth2 / Keycloak session.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Profile Form & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Personal Information
            </h3>

            {savedAlert && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Profile details saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">FULL NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">EMAIL ADDRESS (PRIMARY)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-400 font-mono cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Email is bound to your IAM identity account.</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">PHONE NUMBER</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Change Security Password
            </h3>

            {passwordSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Password updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">CURRENT PASSWORD</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">NEW PASSWORD</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">CONFIRM NEW PASSWORD</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Token and Roles Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Shield className="w-4 h-4 text-emerald-400" />
              Security & Realm Roles
            </h3>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                ASSIGNED REALM ROLES
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user?.roles?.map((r) => (
                  <span
                    key={r}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  STATELESS JWT (BEARER)
                </span>
                <button
                  onClick={handleCopyToken}
                  className="text-[10px] text-sky-400 hover:underline flex items-center gap-1 font-mono"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 break-all max-h-32 overflow-y-auto">
                {user?.token || 'No active token'}
              </div>
            </div>
          </div>

          {/* Saved Address Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <MapPin className="w-4 h-4 text-sky-400" />
              Default Shipping Address
            </h3>
            <div className="text-xs text-slate-300 space-y-0.5">
              <p className="font-bold text-white">{name || 'Default Recipient'}</p>
              <p className="text-slate-400">742 Evergreen Terrace</p>
              <p className="text-slate-400">Springfield, IL 62704</p>
              <p className="text-slate-500 text-[11px]">{phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
