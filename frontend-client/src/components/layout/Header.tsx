import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Zap, User, LogOut, ChevronDown, Package, ShieldCheck, Heart, Activity } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useWishlistStore } from '../../store/useWishlistStore';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const cartCount = useCartStore((state) => state.totalCount());
  const wishlistCount = useWishlistStore((state) => state.totalCount());
  const { user, isAuthenticated, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 shrink-0">
          <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-sky-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white">EVENTIX</span>
            <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20">
              EDA 2.0
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, brands, categories..."
            className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 transition-all focus:outline-none"
          />
        </form>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <Link
            to="/products"
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
          >
            Catalog
          </Link>

          <Link
            to="/system-health"
            className="hidden md:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:bg-slate-800/60 rounded-lg transition-all"
          >
            <Activity className="w-3.5 h-3.5" />
            Health
          </Link>

          <Link
            to="/support"
            className="hidden md:block px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
          >
            Support
          </Link>

          <Link
            to="/audit"
            className="hidden lg:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            Audit
          </Link>

          <Link
            to="/digest"
            className="hidden lg:block px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
          >
            Digest
          </Link>
        </nav>

        {/* User Auth & Cart Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-semibold text-white transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
                <span className="hidden sm:inline max-w-[90px] truncate">{user.name || user.username}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1 flex gap-1">
                      {user.roles?.map((r) => (
                        <span key={r} className="px-1.5 py-0.5 rounded bg-sky-500/10 text-[9px] font-mono text-sky-400 font-bold">
                          {r.replace('ROLE_', '')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to="/account/orders"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Package className="w-4 h-4 text-sky-400" />
                    My Orders
                  </Link>

                  <Link
                    to="/account/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4 text-sky-400" />
                    Account Profile
                  </Link>

                  <div className="border-t border-slate-800 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-1.5">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-md shadow-sky-600/20"
              >
                Register
              </Link>
            </div>
          )}

          {/* Wishlist Icon */}
          <Link
            to="/wishlist"
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Saved Wishlist"
          >
            <Heart className="w-5 h-5 text-rose-400" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[11px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon */}
          <Link
            to="/cart"
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="View Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-sky-500 text-white text-[11px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-lg animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};
