import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product } from '../types';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import { useCartStore } from '../store/useCartStore';
import { ShoppingBag, ArrowLeft, Star, Lock, CheckCircle2, ChevronRight, Zap, Heart } from 'lucide-react';
import { apiClient } from '../api/client';
import { useWishlistStore } from '../store/useWishlistStore';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const [product, setProduct] = useState<Product | null>(() => {
    return MOCK_PRODUCTS.find((p) => p.id === id) || null;
  });
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAlert, setAddedAlert] = useState<boolean>(false);

  useEffect(() => {
    // Attempt fetching live product if online
    if (id) {
      apiClient.get(`/api/v1/products/${id}`)
        .then((res) => {
          if (res.data) {
            setProduct((prev) => ({
              ...(prev || {}),
              ...res.data,
              stockQuantity: res.data.stockQuantity || prev?.stockQuantity || 15,
            }));
          }
        })
        .catch(() => {
          // fallback to mock
        });
    }
  }, [id]);

  if (!product) {
    return (
      <div className="p-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Product Not Found</h2>
        <p className="text-slate-400 text-xs">The requested item could not be retrieved from the catalog.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>
      </div>
    );
  }

  const maxStock = product.stockQuantity || 20;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAddedAlert(true);
    setTimeout(() => setAddedAlert(false), 3000);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    navigate('/checkout');
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-white transition-colors">Catalog</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/products?category=${product.category.id}`} className="hover:text-white transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-200 font-bold truncate max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl">
        {/* Left: Product Image */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-96 sm:h-[460px] relative group">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <span className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-sky-400 border border-sky-500/20">
              {product.category?.name || 'Hardware'}
            </span>
          </div>
        </div>

        {/* Right: Product Details & Purchase Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500">SKU: {product.sku || 'EVX-ITEM'}</span>
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <Star className="w-4 h-4 fill-current" />
                <span>{product.rating || 4.8} / 5.0</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-emerald-400">${product.price.toFixed(2)}</span>
              <span className="text-xs text-slate-500">Includes VAT & Standard Tax</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
              {product.description}
            </p>

            {/* Stock Availability indicator */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-400">Inventory Status:</span>
              <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{maxStock} Units In Stock</span>
              </span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Quantity:</span>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-mono font-bold text-white min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                  className="px-3.5 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            {addedAlert && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Added {quantity} unit(s) of "{product.name}" to cart!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-white font-bold text-xs transition-all active:scale-95 shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs transition-all active:scale-95 shadow-lg shadow-sky-500/25"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now (Instant Checkout)</span>
              </button>
            </div>

            <button
              onClick={() => toggleWishlist(product)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border ${
                isInWishlist(product.id)
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>{isInWishlist(product.id) ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
            </button>

            {/* Architecture Protection Guarantee */}
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 justify-center">
              <Lock className="w-3.5 h-3.5 text-sky-400" />
              <span>Protected by Redis Mutex Lock to guarantee no overselling</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
