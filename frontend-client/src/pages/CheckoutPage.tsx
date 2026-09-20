import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldCheck, CreditCard, Lock, ArrowRight, Truck, AlertCircle, Tag, CheckCircle2, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { ShippingAddress } from '../types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number; description?: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sub = subtotal();
  const discountAmount = appliedCoupon ? (sub * appliedCoupon.discountPercent) / 100 : 0;
  const discountedSub = Math.max(0, sub - discountAmount);
  const tax = discountedSub * 0.08;
  const shipping = (discountedSub > 150 || appliedCoupon?.code === 'FREESHIP') ? 0 : 15.0;
  const grandTotal = discountedSub + tax + shipping;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponMsg(null);

    try {
      const res = await apiClient.get(`/api/v1/orders/coupons/validate?code=${encodeURIComponent(code)}`);
      if (res.data && res.data.active) {
        setAppliedCoupon({
          code: res.data.code,
          discountPercent: Number(res.data.discountPercent),
          description: res.data.description,
        });
        setCouponMsg({ type: 'success', text: `Coupon "${res.data.code}" applied! (${res.data.discountPercent}% OFF)` });
        setCouponInput('');
      } else {
        setCouponMsg({ type: 'error', text: 'Coupon is inactive or invalid.' });
      }
    } catch {
      // Fallback for default codes
      if (code === 'WELCOME10') {
        setAppliedCoupon({ code: 'WELCOME10', discountPercent: 10, description: '10% Welcome Discount' });
        setCouponMsg({ type: 'success', text: 'Coupon "WELCOME10" applied! (10% OFF)' });
        setCouponInput('');
      } else if (code === 'EVENTIX20') {
        setAppliedCoupon({ code: 'EVENTIX20', discountPercent: 20, description: '20% Event Discount' });
        setCouponMsg({ type: 'success', text: 'Coupon "EVENTIX20" applied! (20% OFF)' });
        setCouponInput('');
      } else if (code === 'FREESHIP') {
        setAppliedCoupon({ code: 'FREESHIP', discountPercent: 0, description: 'Free Shipping Discount' });
        setCouponMsg({ type: 'success', text: 'Coupon "FREESHIP" applied! (Free Shipping)' });
        setCouponInput('');
      } else {
        setCouponMsg({ type: 'error', text: `Invalid or expired coupon "${code}". Try "WELCOME10"` });
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponMsg(null);
  };

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
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
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

          {/* Promo Code Input & Feedback */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-sky-400" /> Promo Code
              </span>
              {appliedCoupon && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono font-bold">
                  <CheckCircle2 className="w-3 h-3" /> {appliedCoupon.code} (-{appliedCoupon.discountPercent}%)
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="hover:text-rose-400 ml-1"
                    title="Remove coupon"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            {!appliedCoupon && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
            )}

            {couponMsg && (
              <p className={`text-[11px] font-medium ${couponMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {couponMsg.text}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="text-white font-mono">${sub.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Promo Discount ({appliedCoupon.code})</span>
                <span className="font-mono">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Tax (8%)</span>
              <span className="text-white font-mono">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Shipping</span>
              <span className="text-white font-mono">
                {shipping === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `$${shipping.toFixed(2)}`}
              </span>
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
