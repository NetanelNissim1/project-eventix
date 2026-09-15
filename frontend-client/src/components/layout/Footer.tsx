import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Server, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-base mb-3">
              <div className="bg-sky-500 p-1.5 rounded-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span>PROJECT EVENTIX</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              High-concurrency, event-driven enterprise e-commerce architecture powered by Spring Boot 3, Java 21, Apache Kafka, Redis, and React.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase mb-3 tracking-wider">Shop & Discover</h4>
            <ul className="space-y-2">
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/products?category=cat-electronics" className="hover:text-white transition-colors">Electronics</Link></li>
              <li><Link to="/products?category=cat-computing" className="hover:text-white transition-colors">Computing</Link></li>
              <li><Link to="/products?category=cat-accessories" className="hover:text-white transition-colors">Accessories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase mb-3 tracking-wider">Customer & Account</h4>
            <ul className="space-y-2">
              <li><Link to="/wishlist" className="hover:text-white transition-colors">Saved Wishlist</Link></li>
              <li><Link to="/account/orders" className="hover:text-white transition-colors">Order History</Link></li>
              <li><Link to="/support" className="hover:text-white transition-colors">Support & FAQs</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase mb-3 tracking-wider">System & Architecture</h4>
            <ul className="space-y-2">
              <li><Link to="/system-health" className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1.5"><Activity className="w-3 h-3" /> System Health</Link></li>
              <li><Link to="/audit" className="hover:text-white transition-colors flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-400" /> Audit Log Console</Link></li>
              <li><Link to="/digest" className="hover:text-white transition-colors flex items-center gap-1.5"><Server className="w-3 h-3 text-indigo-400" /> Daily Digest Report</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>&copy; {new Date().getFullYear()} Project Eventix. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span>Privacy Policy</span>
            <span>Security Architecture</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
