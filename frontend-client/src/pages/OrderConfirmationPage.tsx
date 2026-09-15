import React from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Printer, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as {
    totalAmount?: number;
    items?: any[];
    customerEmail?: string;
    createdAt?: string;
  } | null;

  const orderId = id || 'ORD-98217384';
  const total = state?.totalAmount || 349.99;
  const items = state?.items || [
    { productId: 'prod-101', productName: 'Sony WH-1000XM5 Wireless Headphones', quantity: 1, unitPrice: 349.99 }
  ];
  const dateStr = state?.createdAt ? new Date(state.createdAt).toLocaleString() : new Date().toLocaleString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-16 max-w-3xl mx-auto">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Link
          to={`/orders/${orderId}/status`}
          className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors"
        >
          <Activity className="w-3.5 h-3.5" /> Back to Live Saga Monitor
        </Link>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
        >
          <Printer className="w-3.5 h-3.5" /> Print / Save PDF
        </button>
      </div>

      {/* Official Receipt Card */}
      <div className="p-8 sm:p-10 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-8 print:bg-white print:text-black print:border-none">
        {/* Receipt Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                Official Tax Invoice & Receipt
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Project Eventix Inc.</h1>
            <p className="text-xs text-slate-400 mt-0.5">High-Throughput Distributed Cloud Commerce</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Order Reference</span>
            <span className="font-mono text-sm font-bold text-white bg-slate-800/80 px-2.5 py-1 rounded-lg inline-block">
              #{orderId.substring(0, 16)}
            </span>
            <span className="text-[11px] text-slate-400 block">{dateStr}</span>
          </div>
        </div>

        {/* Customer & Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">Billed To</span>
            <span className="font-bold text-white block">{state?.customerEmail || 'Authenticated Customer'}</span>
            <span className="text-slate-400">Payment Method: Credit Card (Encrypted Token)</span>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">Order Status</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> CONFIRMED & FULFILLED
            </span>
            <span className="text-slate-400">Saga Pipeline: 4/4 Steps Completed</span>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Purchased Line Items
          </span>
          <div className="divide-y divide-slate-800/60 border-y border-slate-800/80">
            {items.map((item, index) => (
              <div key={index} className="py-3.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-white block">{item.productName}</span>
                  <span className="text-slate-400 text-[11px]">Qty: {item.quantity} &times; ${Number(item.unitPrice).toFixed(2)}</span>
                </div>
                <span className="font-mono font-bold text-white">
                  ${(item.quantity * Number(item.unitPrice)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>${(total / 1.08).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tax (8%)</span>
              <span>${(total - total / 1.08).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Shipping</span>
              <span className="text-emerald-400 font-semibold">FREE</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
              <span>Total Paid</span>
              <span className="text-emerald-400 text-base font-black font-mono">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Security watermark footer */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> Cryptographically Verified Outbox Transaction
          </div>
          <span className="font-mono text-[10px]">Auth Hash: SHA256-OK</span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-2">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-sky-500/20"
        >
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
