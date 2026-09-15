import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import { Heart, ShoppingBag, Trash2, ArrowRight, Star } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const addItem = useCartStore((state) => state.addItem);

  const handleMoveToCart = (product: any) => {
    addItem(product, 1);
    removeItem(product.id);
  };

  const handleAddAllToCart = () => {
    items.forEach((item) => addItem(item, 1));
    clearWishlist();
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <h1 className="text-3xl font-black text-white tracking-tight">Saved Wishlist</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Keep track of products you love and move them directly into your cart.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddAllToCart}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20"
            >
              <ShoppingBag className="w-4 h-4" /> Move All to Cart
            </button>
            <button
              onClick={clearWishlist}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-semibold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-16 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Your wishlist is empty</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Browse our high-performance hardware catalog and click the heart icon on any item to save it here.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-lg shadow-sky-500/20"
            >
              Explore Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((product) => (
            <div
              key={product.id}
              className="group bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/5"
            >
              <div className="space-y-3">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={() => removeItem(product.id)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-slate-900/80 hover:bg-rose-500 text-rose-400 hover:text-white border border-slate-700/60 backdrop-blur-md transition-all"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/90 text-sky-400 border border-slate-700/60 backdrop-blur-md">
                    {product.category?.name || 'Hardware'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-[11px] mb-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{product.rating || '4.9'}</span>
                  </div>
                  <Link
                    to={`/products/${product.id}`}
                    className="text-sm font-bold text-white hover:text-sky-400 transition-colors line-clamp-1"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Price</span>
                  <span className="text-base font-black text-white">${product.price.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => handleMoveToCart(product)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-slate-950 border border-sky-500/30 hover:border-transparent rounded-xl text-xs font-bold transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Move to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
