import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();

  const sub = subtotal();
  const tax = sub * 0.08;
  const shipping = sub > 150 || sub === 0 ? 0 : 15.0;
  const grandTotal = sub + tax + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Your Cart is Empty</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          You haven't selected any items yet. Explore the product catalog and add high-performance items to your cart.
        </p>
        <div className="pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Start Shopping</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Shopping Cart</h1>
        <p className="text-xs text-slate-400 mt-1">Review your items before proceeding to zero-loss checkout.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Cart Line Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-slate-700"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-20 h-20 rounded-2xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                />
                <div className="space-y-1">
                  <Link
                    to={`/products/${item.product.id}`}
                    className="text-sm font-bold text-white hover:text-sky-400 transition-colors line-clamp-1"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-slate-500 font-mono">
                    Unit Price: ${item.product.price.toFixed(2)}
                  </p>
                  <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    In Stock
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-slate-800">
                {/* Quantity Buttons */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-mono font-bold text-white min-w-[2.5rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal for item */}
                <div className="text-right min-w-[5rem]">
                  <span className="text-sm font-black text-white block">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
            <Link to="/products" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right: Order Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl sticky top-24">
          <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
            Order Summary
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Items Subtotal</span>
              <span className="text-white font-mono">${sub.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Estimated Tax (8%)</span>
              <span className="text-white font-mono">${tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Shipping & Delivery</span>
              <span className="text-white font-mono">
                {shipping === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `$${shipping.toFixed(2)}`}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between text-sm">
              <span className="font-bold text-white">Estimated Total</span>
              <span className="font-black text-emerald-400 text-lg font-mono">
                ${grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all active:scale-95"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Guaranteed Zero-Loss Saga processing. No duplicate charges via unique idempotency keys.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
