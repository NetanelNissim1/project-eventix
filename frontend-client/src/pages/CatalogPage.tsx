import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Product } from '../types';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../data/mockProducts';
import { useCartStore } from '../store/useCartStore';
import { Search, Filter, SlidersHorizontal, Star, ShoppingBag, Check, Heart } from 'lucide-react';
import { apiClient } from '../api/client';
import { useWishlistStore } from '../store/useWishlistStore';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(false);

  // Filters state
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [searchQuery, setSearchQuery] = useState<string>(searchParam);
  const [maxPrice, setMaxPrice] = useState<number>(3500);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating' | 'name'>('price-asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  // Fetch live products from backend if online
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/v1/products');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          // Merge with mock details for rich UI
          const merged = res.data.map((p: any) => ({
            ...p,
            stockQuantity: p.stockQuantity || 15,
            rating: p.rating || 4.8,
            sku: p.sku || 'EVX-' + p.id.toUpperCase(),
          }));
          setProducts(merged);
        }
      } catch (e) {
        // Fallback to mock data silently
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Synchronize URL search params
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat !== null) setSelectedCategory(cat);

    const q = searchParams.get('search');
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  // Log customer search query to daily digest activity stream
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    const timer = setTimeout(() => {
      apiClient.post('/api/v1/digest/record-activity', {
        action: 'SEARCH',
        customerEmail: 'shopper@eventix.io',
        details: searchQuery.trim(),
      }).catch(() => { /* fire and forget */ });
    }, 1500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (catId) {
      newParams.set('category', catId);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set('search', val);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCat = !selectedCategory || p.category?.id === selectedCategory;
        const matchesSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrice = p.price <= maxPrice;
        const matchesStock = !inStockOnly || (p.stockQuantity !== undefined && p.stockQuantity > 0);
        return matchesCat && matchesSearch && matchesPrice && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return a.name.localeCompare(b.name);
      });
  }, [products, selectedCategory, searchQuery, maxPrice, inStockOnly, sortBy]);

  // Pagination slice
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Product Catalog</h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore high-performance hardware, gadgets, and computing devices backed by Redis sub-millisecond caching.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Sidebar Filters */}
        <aside className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-sky-400" />
              Filters
            </h3>
            {(selectedCategory || searchQuery || maxPrice < 3500 || inStockOnly) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSearchQuery('');
                  setMaxPrice(3500);
                  setInStockOnly(false);
                  setSearchParams({});
                }}
                className="text-[11px] text-sky-400 hover:underline"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
              Category
            </label>
            <div className="space-y-1">
              <button
                onClick={() => handleCategoryChange('')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  !selectedCategory
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span>All Categories</span>
                {!selectedCategory && <Check className="w-3.5 h-3.5" />}
              </button>

              {MOCK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span>{cat.name}</span>
                  {selectedCategory === cat.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Max Price
              </label>
              <span className="text-xs font-bold text-emerald-400">${maxPrice}</span>
            </div>
            <input
              type="range"
              min="50"
              max="3500"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-sky-500 bg-slate-950 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>$50</span>
              <span>$3,500</span>
            </div>
          </div>

          {/* In-Stock Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-slate-300">In-Stock Only</span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-950 border-slate-700"
              />
            </label>
          </div>
        </aside>

        {/* Right Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Bar Sort & Search */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Filter by keyword..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-3 text-xs">
              <span className="text-slate-400 font-semibold shrink-0">
                {filteredProducts.length} items found
              </span>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-400"></div>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl">
              <Filter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No products found</h3>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters, category, or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((p) => (
                <div
                  key={p.id}
                  className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-sky-500/5"
                >
                  <Link to={`/products/${p.id}`} className="block">
                    <div className="h-48 w-full overflow-hidden bg-slate-800 relative">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(p);
                        }}
                        className={`absolute top-3 left-3 p-2 rounded-xl backdrop-blur-md transition-all ${
                          isInWishlist(p.id)
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-slate-900/70 text-slate-400 hover:text-rose-400 border border-slate-700/60'
                        }`}
                        title={isInWishlist(p.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        <Heart className={`w-4 h-4 ${isInWishlist(p.id) ? 'fill-rose-400' : ''}`} />
                      </button>
                      {p.stockQuantity !== undefined && p.stockQuantity < 10 && (
                        <span className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-black text-slate-950 uppercase tracking-wider">
                          Only {p.stockQuantity} Left
                        </span>
                      )}
                    </div>

                    <div className="p-5 pb-2">
                      <div className="flex items-center gap-1 text-amber-400 text-xs mb-1.5 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{p.rating || 4.8}</span>
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
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
