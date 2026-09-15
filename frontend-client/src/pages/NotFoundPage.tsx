import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, Home, ShoppingBag } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-3xl bg-sky-500/20 blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400">
            <Compass className="w-12 h-12" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-widest block">
            Error 404 &bull; Route Not Found
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Lost in Cyberspace?
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page you are looking for does not exist or has moved across our distributed microservices mesh.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Home className="w-4 h-4" /> Home Page
          </Link>
          <Link
            to="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20"
          >
            <ShoppingBag className="w-4 h-4" /> Browse Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
