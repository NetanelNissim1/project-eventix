import React from 'react';
import { Product } from '../types';
import { Plus, Tag } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  addToCart: (product: Product) => void;
  loading: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({ products, addToCart, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-400"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Enterprise Product Catalog</h1>
        <p className="text-slate-400 mt-2 text-sm">
          High-performance Redis-cached catalog with PostgreSQL persistence. Pick an item to initiate real-time Saga checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-sky-500/5"
          >
            <div>
              <div className="h-48 w-full overflow-hidden bg-slate-800 relative">
                <img
                  src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {p.category && (
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-slate-300 flex items-center gap-1 border border-slate-700/50">
                    <Tag className="w-3 h-3 text-sky-400" />
                    {p.category.name}
                  </span>
                )}
              </div>

              <div className="p-5">
                <h3 className="font-bold text-lg text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                  {p.name}
                </h3>
                <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-between mt-4">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">PRICE</span>
                <span className="text-xl font-black text-emerald-400">${p.price.toFixed(2)}</span>
              </div>

              <button
                onClick={() => addToCart(p)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
