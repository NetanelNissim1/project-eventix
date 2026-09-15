import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Lock, Activity, Sparkles, Star } from 'lucide-react';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../data/mockProducts';
import { useCartStore } from '../store/useCartStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const featuredProducts = MOCK_PRODUCTS.filter((p) => p.isFeatured);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-8 sm:p-16 lg:p-20 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-2xl relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Event-Driven E-Commerce Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Engineered for Extreme Speed & Zero Data Loss.
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Experience ultra-responsive shopping backed by Spring Boot 3, Redis distributed locks, Apache Kafka, and real-time STOMP WebSocket tracking.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/products"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/25 transition-all active:scale-95"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/products?category=cat-electronics"
              className="px-6 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-all"
            >
              Featured Electronics
            </Link>
          </div>
        </div>
      </section>

      {/* Enterprise Architecture Value Props */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Transactional Outbox CDC</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every order is saved atomically alongside an outbox event, streamed via Debezium CDC into Kafka with zero message loss.
          </p>
        </div>

        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Redisson Distributed Locks</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Eliminates overselling under high concurrency by acquiring Redis mutex locks across inventory microservices.
          </p>
        </div>

        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Real-Time STOMP WebSockets</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Watch your order progress live through each Saga phase (Order → Stock → Payment → Completed) without polling.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Popular Categories</h2>
            <p className="text-xs text-slate-400 mt-1">Browse our top rated product categories</p>
          </div>
          <Link to="/products" className="text-xs text-sky-400 font-bold hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {MOCK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/products?category=${cat.id}`)}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-sky-500/40 rounded-2xl text-left transition-all group hover:shadow-lg hover:shadow-sky-500/5"
            >
              <h4 className="font-bold text-white group-hover:text-sky-400 transition-colors text-sm">{cat.name}</h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{cat.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Featured Hardware & Devices</h2>
            <p className="text-xs text-slate-400 mt-1">Handpicked gear with active real-time inventory locks</p>
          </div>
          <Link to="/products" className="text-xs text-sky-400 font-bold hover:underline flex items-center gap-1">
            Browse catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((p) => (
            <div
              key={p.id}
              className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-sky-500/5"
            >
              <Link to={`/products/${p.id}`} className="block">
                <div className="h-52 w-full overflow-hidden bg-slate-800 relative">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {p.stockQuantity && p.stockQuantity < 10 && (
                    <span className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-black text-slate-950 uppercase tracking-wider">
                      Only {p.stockQuantity} Left
                    </span>
                  )}
                </div>

                <div className="p-5 pb-2">
                  <div className="flex items-center gap-1 text-amber-400 text-xs mb-1.5 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{p.rating}</span>
                  </div>
                  <h3 className="font-bold text-sm text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </Link>

              <div className="p-5 pt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">PRICE</span>
                  <span className="text-lg font-black text-emerald-400">${p.price.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => addItem(p, 1)}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 active:scale-95"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
