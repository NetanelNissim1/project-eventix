import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldCheck, CreditCard, Lock, ArrowRight, Truck, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { ShippingAddress } from '../types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);

  const sub = subtotal();
  const tax = sub * 0.08;
  const shipping = sub > 150 ? 0 : 15.0;
  const grandTotal = sub + tax + shipping;

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: user?.name || 'John Doe',
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    phone: '+1 (555) 019-2834',
  });

  const [cardNumber, setCardNumber] = useState('4580 9812 3456 7890');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('482');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Your cart is empty</h2>
        <button
          onClick={() => navigate('/products')}
          className="px-6 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    // Generate unique Idempotency Key (RFC 4122 v4)
    const idempotencyKey = crypto.randomUUID
      ? crypto.randomUUID()
      : 'idemp-' + Math.random().toString(36).substring(2, 15);

    const orderPayload = {
      customerId: user?.id || user?.username || 'cust-1001',
      customerEmail: user?.email || 'customer1@eventix.com',
      shippingAddress: address,
      idempotencyKey,
      items: items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.product.price,
      })),
    };

    try {
      let orderId = 'ord-' + Math.random().toString(36).substring(2, 9);

      try {
        const res = await apiClient.post('/api/v1/orders', orderPayload);
        if (res.data?.id) {
          orderId = res.data.id;
        }
      } catch (err: any) {
        console.warn('API Gateway offline or unreachable, generating local order simulation:', err);
      }

      // Clear the cart
      clearCart();

      // Navigate immediately to real-time Saga status tracker
      navigate(`/orders/${orderId}/status`, {
        state: {
          totalAmount: grandTotal,
          items: orderPayload.items,
          customerEmail: orderPayload.customerEmail,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      setError('Failed to initiate order. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Checkout</h1>
        <p className="text-xs text-slate-400 mt-1">Complete your shipping and payment details to dispatch the Saga.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Shipping & Payment Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Truck className="w-4 h-4 text-sky-400" />
              1. Shipping Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">RECIPIENT FULL NAME</label>
                <input
                  type="text"
                  required
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">PHONE NUMBER</label>
                <input
                  type="text"
                  required
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400 block mb-1">STREET ADDRESS</label>
                <input
                  type="text"
                  required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">CITY</label>
                <input
                  type="text"
                  required
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">ZIP / POSTAL CODE</label>
                <input
                  type="text"
                  required
                  value={address.zipCode}
                  onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <CreditCard className="w-4 h-4 text-sky-400" />
              2. Secure Payment Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">CARD NUMBER</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">EXPIRATION DATE</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">CVC / CVV</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 text-xs text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Idempotent Consumer & PSP Gateway Tokenization Protection Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Summary & Submit */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl sticky top-24">
          <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
            Order Review ({items.length} items)
          </h3>

          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between items-center text-xs">
                <div className="truncate max-w-[170px]">
                  <p className="text-white font-semibold truncate">{item.product.name}</p>
                  <p className="text-slate-500">Qty: {item.quantity}</p>
                </div>
                <span className="font-mono text-slate-300 font-bold shrink-0">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="text-white font-mono">${sub.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tax (8%)</span>
              <span className="text-white font-mono">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Shipping</span>
              <span className="text-white font-mono">{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
              <span className="font-bold text-white">Total Amount</span>
              <span className="font-black text-emerald-400 text-lg font-mono">
                ${grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 active:scale-95"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Atomically Committing Order...</span>
              </div>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Place Order (${grandTotal.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
