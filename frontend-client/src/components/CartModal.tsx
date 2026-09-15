import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Trash2, ShieldCheck, ArrowRight } from 'lucide-react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  removeFromCart: (productId: string) => void;
  onCheckout: (customerId: string, customerEmail: string) => void;
  submitting: boolean;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cart,
  removeFromCart,
  onCheckout,
  submitting,
}) => {
  const [customerId, setCustomerId] = useState('cust-1001');
  const [customerEmail, setCustomerEmail] = useState('john.doe@example.com');

  if (!isOpen) return null;

  const total = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    onCheckout(customerId, customerEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Your Shopping Cart</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {cart.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Your cart is currently empty.</p>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-3.5 bg-slate-800/40 rounded-2xl border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-white line-clamp-1">{item.product.name}</h4>
                    <span className="text-xs text-slate-400">
                      Qty: {item.quantity} &bull; ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}

          {cart.length > 0 && (
            <form id="checkout-form" onSubmit={handleSubmit} className="pt-4 border-t border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">CUSTOMER ID (USER KEY)</label>
                <input
                  type="text"
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">CUSTOMER EMAIL</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Zero-Trust API Gateway: Token Bucket Rate Limiting & Outbox Protected</span>
              </div>
            </form>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">TOTAL AMOUNT</span>
              <span className="text-2xl font-black text-white">${total.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <span>Dispatching Saga...</span>
              ) : (
                <>
                  <span>Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
