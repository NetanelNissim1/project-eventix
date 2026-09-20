import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requiredRole && (!user?.roles || !user.roles.includes(requiredRole))) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
        </div>
        <span className="text-xs font-mono font-bold text-rose-400 tracking-wider uppercase mb-2">
          403 Forbidden
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">
          Administrator Access Required
        </h1>
        <p className="text-sm text-slate-400 max-w-md mb-8">
          This area is strictly restricted to system administrators. Your account does not have the required administrative permissions.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Store Catalog
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
