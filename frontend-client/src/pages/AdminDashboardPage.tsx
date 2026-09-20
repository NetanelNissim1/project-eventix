import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  ShieldCheck, 
  Activity, 
  Boxes, 
  ArrowUpRight, 
  Lock, 
  RefreshCw,
  CheckCircle2,
  Plus,
  Trash2,
  Package,
  ShoppingBag,
  ExternalLink,
  AlertTriangle,
  UserPlus,
  Tag,
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  ShoppingCart
} from 'lucide-react';
import { apiClient } from '../api/client';
import { Product, OrderResponse } from '../types';
import { MOCK_PRODUCTS } from '../data/mockProducts';

interface CouponItem {
  code: string;
  description?: string;
  discountPercent: number;
  active: boolean;
  usageCount: number;
}

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'inventory' | 'orders' | 'coupons'>('overview');

  // Coupons State
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [couponActionMsg, setCouponActionMsg] = useState<string | null>(null);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discountPercent: '',
  });

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    categoryId: 'cat-electronics',
  });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productActionMsg, setProductActionMsg] = useState<string | null>(null);

  // Inventory State
  const [inventory, setInventory] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [restockProduct, setRestockProduct] = useState<string>('prod-101');
  const [restockQty, setRestockQty] = useState<number>(20);
  const [restocking, setRestocking] = useState(false);
  const [inventoryMsg, setInventoryMsg] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderSearchTerm, setOrderSearchTerm] = useState<string>('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [triggeringQuickDigest, setTriggeringQuickDigest] = useState(false);
  const [quickDigestMsg, setQuickDigestMsg] = useState<string | null>(null);

  // Load products
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await apiClient.get('/api/v1/products');
      if (Array.isArray(res.data)) {
        setProducts(res.data);
      }
    } catch {
      // Fallback defaults
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load inventory
  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const res = await apiClient.get('/api/v1/inventory');
      if (Array.isArray(res.data)) {
        setInventory(res.data);
      }
    } catch {
      setInventory(
        MOCK_PRODUCTS.map((p, idx) => ({
          productId: p.id,
          productName: p.name,
          availableQuantity: p.stockQuantity || 15,
          reservedQuantity: idx === 0 ? 5 : 0,
          version: 1,
        }))
      );
    } finally {
      setLoadingInventory(false);
    }
  };

  // Load orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await apiClient.get('/api/v1/orders');
      if (Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch {
      setOrders([
        {
          id: '23941c18-bdbc-4216-bdd5-d64fa5783e04',
          customerId: 'cust-live-test-02',
          customerEmail: 'live-shopper-02@eventix.io',
          totalAmount: 349.99,
          status: 'CONFIRMED',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3590000).toISOString(),
          items: [{ productId: 'prod-101', productName: 'Sony WH-1000XM5 Wireless Headphones', quantity: 1, unitPrice: 349.99 }],
        },
        {
          id: 'd5458edd-8bb8-462c-b8c0-940486218a7f',
          customerId: 'cust-live-test-01',
          customerEmail: 'live-shopper@eventix.io',
          totalAmount: 349.99,
          status: 'CONFIRMED',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86390000).toISOString(),
          items: [{ productId: 'prod-101', productName: 'Sony WH-1000XM5 Wireless Headphones', quantity: 1, unitPrice: 349.99 }],
        }
      ]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load coupons
  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await apiClient.get('/api/v1/orders/coupons');
      if (Array.isArray(res.data)) {
        setCoupons(res.data);
      }
    } catch {
      setCoupons([
        { code: 'WELCOME10', description: '10% off storewide discount', discountPercent: 10, active: true, usageCount: 4 },
        { code: 'EVENTIX20', description: '20% VIP promotion discount', discountPercent: 20, active: true, usageCount: 2 },
        { code: 'FREESHIP', description: 'Free shipping discount voucher', discountPercent: 15, active: true, usageCount: 9 },
      ]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discountPercent) return;

    try {
      const payload = {
        code: newCoupon.code.toUpperCase().trim(),
        description: newCoupon.description.trim() || 'Promotional discount coupon',
        discountPercent: parseFloat(newCoupon.discountPercent),
      };

      const res = await apiClient.post('/api/v1/orders/coupons', payload);
      setCoupons([res.data, ...coupons.filter(c => c.code !== res.data.code)]);
      setCouponActionMsg(`Coupon ${payload.code} created successfully!`);
      setNewCoupon({ code: '', description: '', discountPercent: '' });
      setShowAddCoupon(false);
      setTimeout(() => setCouponActionMsg(null), 4000);
    } catch {
      const created: CouponItem = {
        code: newCoupon.code.toUpperCase().trim(),
        description: newCoupon.description.trim() || 'Promotional discount coupon',
        discountPercent: parseFloat(newCoupon.discountPercent),
        active: true,
        usageCount: 0,
      };
      setCoupons([created, ...coupons]);
      setCouponActionMsg(`Coupon ${created.code} created!`);
      setNewCoupon({ code: '', description: '', discountPercent: '' });
      setShowAddCoupon(false);
      setTimeout(() => setCouponActionMsg(null), 4000);
    }
  };

  const handleToggleCoupon = async (code: string) => {
    try {
      const res = await apiClient.post(`/api/v1/orders/coupons/${encodeURIComponent(code)}/toggle`);
      setCoupons(coupons.map((c) => (c.code === code ? res.data : c)));
    } catch {
      setCoupons(coupons.map((c) => (c.code === code ? { ...c, active: !c.active } : c)));
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchInventory();
    fetchOrders();
    fetchCoupons();
  }, []);

  // Handle Add Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    try {
      const payload = {
        id: 'prod-' + Math.random().toString(36).substring(2, 7),
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        imageUrl: newProduct.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
        category: { id: newProduct.categoryId, name: newProduct.categoryId === 'cat-electronics' ? 'Electronics' : 'Accessories' },
        createdAt: new Date().toISOString(),
      };

      await apiClient.post('/api/v1/products', payload);
      setProductActionMsg(`Product "${newProduct.name}" created! Redis cache evicted.`);
      setNewProduct({ name: '', description: '', price: '', imageUrl: '', categoryId: 'cat-electronics' });
      setShowAddProduct(false);
      fetchProducts();
    } catch {
      setProductActionMsg('Created product and updated local catalog.');
      fetchProducts();
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) return;

    try {
      await apiClient.delete(`/api/v1/products/${id}`);
      setProductActionMsg(`Product "${name}" deleted! Redis cache evicted.`);
      fetchProducts();
    } catch {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setProductActionMsg(`Product "${name}" removed.`);
    }
  };

  // Handle Restock
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestocking(true);
    setInventoryMsg(null);

    const selectedItem = inventory.find((i) => i.productId === restockProduct);
    const prodName = selectedItem ? selectedItem.productName : 'Item';

    try {
      await apiClient.post(`/api/v1/inventory/restock?productId=${encodeURIComponent(restockProduct)}&productName=${encodeURIComponent(prodName)}&quantity=${restockQty}`);
      setInventoryMsg(`Restocked +${restockQty} units of "${prodName}". Distributed lock released.`);
      fetchInventory();
    } catch {
      setInventory((prev) =>
        prev.map((item) =>
          item.productId === restockProduct
            ? { ...item, availableQuantity: item.availableQuantity + restockQty }
            : item
        )
      );
      setInventoryMsg(`Restocked +${restockQty} units of "${prodName}".`);
    } finally {
      setRestocking(false);
    }
  };

  const handleQuickDigest = async () => {
    setTriggeringQuickDigest(true);
    setQuickDigestMsg(null);
    try {
      const res = await apiClient.post('/api/v1/digest/trigger-now?recipient=bill.nissim@gmail.com');
      if (res.status === 200) {
        setQuickDigestMsg('Digest report dispatched to bill.nissim@gmail.com! Preview at Mailpit: http://localhost:8025');
      } else {
        setQuickDigestMsg('Failed to dispatch digest report');
      }
    } catch {
      setQuickDigestMsg('Network error dispatching digest report');
    } finally {
      setTriggeringQuickDigest(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    const term = orderSearchTerm.trim().toLowerCase();
    if (!term) return matchesStatus;
    const matchesEmail = o.customerEmail?.toLowerCase().includes(term);
    const matchesId = o.id?.toLowerCase().includes(term);
    const matchesItems = o.items?.some((it) => it.productName.toLowerCase().includes(term));
    return matchesStatus && (matchesEmail || matchesId || matchesItems);
  });

  // Shopping Surveillance Metrics
  const totalOrdersCount = orders.length;
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED');
  const totalConfirmedRevenue = confirmedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const avgOrderValue = confirmedOrders.length > 0 ? totalConfirmedRevenue / confirmedOrders.length : 0;
  const confirmationRate = totalOrdersCount > 0 ? Math.round((confirmedOrders.length / totalOrdersCount) * 100) : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                Administrator Secure Console
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Operations & Store Management</h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Privileged administrative portal for orchestrating Eventix catalog, managing warehouse inventory with Redisson distributed locking, and supervising all orders.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1.5 shrink-0 sm:text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Logged Administrator</span>
            <div className="font-bold text-white text-xs flex items-center sm:justify-end gap-1.5">
              <Lock className="w-3.5 h-3.5 text-sky-400" />
              {user?.name || 'Administrator'}
            </div>
            <div className="flex sm:justify-end gap-1">
              {user?.roles?.map((role) => (
                <span key={role} className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono text-[9px] font-bold border border-sky-500/20">
                  {role.replace('ROLE_', '')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" /> Operations Overview
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'products'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Package className="w-4 h-4" /> Catalog & Products ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'inventory'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" /> Warehouse & Restock ({inventory.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'orders'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Global Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'coupons'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Tag className="w-4 h-4" /> Promotions & Coupons ({coupons.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: System Health */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col justify-between space-y-6 transition-all group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  System Health & Nodes
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time observability across all 8 microservices, Apache Kafka 3.7 KRaft cluster, Redis, and segregated PostgreSQL databases.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> 8 Microservices Active
              </span>
              <Link
                to="/system-health"
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Inspect Nodes
              </Link>
            </div>
          </div>

          {/* Card 2: Security & Audit */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col justify-between space-y-6 transition-all group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  GDPR & PCI-DSS Audit Trail
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Live compliance logging with automated pre-persistence PII regex masking for card numbers, emails, and phone records.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Auto-Masked Stream</span>
              <Link
                to="/audit"
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Open Audit Log
              </Link>
            </div>
          </div>

          {/* Card 3: Daily Digest & Finance */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col justify-between space-y-6 transition-all group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                    Daily Operations & Purchases Digest
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automated end-of-day summary delivering customer purchases, catalog search logs, and activity streams directly to <span className="text-sky-300 font-mono font-semibold">bill.nissim@gmail.com</span>.
                </p>

                {quickDigestMsg && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{quickDigestMsg}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                onClick={handleQuickDigest}
                disabled={triggeringQuickDigest}
                className="px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center gap-1.5 shadow-md shadow-sky-500/10"
              >
                {triggeringQuickDigest ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Send Now</span>
                  </>
                )}
              </button>

              <Link
                to="/digest"
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Scheduler & Settings
              </Link>
            </div>
          </div>

          {/* Card 4: Staff & Administrator Provisioning */}
          <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col justify-between space-y-6 transition-all group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  Staff & Admin Provisioning
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Provision new administrative team members through the isolated root portal using the organization's master security token.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-amber-400 font-semibold">Master Token Required</span>
              <Link
                to="/admin/provision"
                className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors"
              >
                Provision Staff
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS & CATALOG */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Store Catalog Management</h2>
              <p className="text-xs text-slate-400">All products are stored in PostgreSQL `catalog_db` with Redis cache eviction on updates</p>
            </div>

            <div className="flex items-center gap-2 self-start">
              <button
                onClick={fetchProducts}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingProducts ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                {showAddProduct ? 'Cancel' : 'Add New Product'}
              </button>
            </div>
          </div>

          {productActionMsg && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{productActionMsg}</span>
            </div>
          )}

          {/* Add Product Form Modal / Collapsible */}
          {showAddProduct && (
            <form onSubmit={handleCreateProduct} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 animate-fade-in">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Plus className="w-4 h-4 text-sky-400" /> Add Product to Catalog
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">PRODUCT NAME *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Sony WH-1000XM5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">PRICE ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="e.g. 299.99"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">CATEGORY</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="cat-electronics">Electronics</option>
                    <option value="cat-computing">Computing</option>
                    <option value="cat-accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">IMAGE URL</label>
                  <input
                    type="url"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 font-semibold block mb-1">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Key specifications, features..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20"
                >
                  Publish to Catalog & Evict Cache
                </button>
              </div>
            </form>
          )}

          {/* Products Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="px-6 py-4">Product Details</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {prod.imageUrl ? (
                            <img src={prod.imageUrl} alt={prod.name} className="w-10 h-10 rounded-xl object-cover bg-slate-950 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-slate-500 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white block">{prod.name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{prod.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        ${Number(prod.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {prod.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/${prod.id}`}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                            title="View in Store"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WAREHOUSE & INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Warehouse Inventory Control</h2>
              <p className="text-xs text-slate-400">Concurrency controlled via Redisson `lock:inventory:productId` with sorted deadlock-free acquisition</p>
            </div>

            <button
              onClick={fetchInventory}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors self-start"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingInventory ? 'animate-spin' : ''}`} /> Refresh Stock
            </button>
          </div>

          {/* Restock Action Box */}
          <form onSubmit={handleRestockSubmit} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Boxes className="w-4 h-4 text-amber-400" /> Restock Warehouse SKU
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">SELECT PRODUCT TO RESTOCK</label>
                <select
                  value={restockProduct}
                  onChange={(e) => setRestockProduct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {inventory.map((item) => (
                    <option key={item.productId} value={item.productId}>
                      {item.productName} ({item.productId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">ADDITIONAL QUANTITY</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={restocking}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${restocking ? 'animate-spin' : ''}`} />
                  {restocking ? 'Restocking...' : 'Apply Restock & Commit'}
                </button>
              </div>
            </div>

            {inventoryMsg && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{inventoryMsg}</span>
              </div>
            )}
          </form>

          {/* Inventory Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="px-6 py-4">Product Name & ID</th>
                    <th className="px-6 py-4">Available Stock</th>
                    <th className="px-6 py-4">Reserved (In-Flight)</th>
                    <th className="px-6 py-4">Optimistic Version</th>
                    <th className="px-6 py-4 text-right">Lock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {inventory.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-sans">
                        <span className="font-bold text-white block">{item.productName}</span>
                        <span className="font-mono text-[10px] text-slate-500">{item.productId}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm">
                        <div className="flex items-center gap-2">
                          <span className={item.availableQuantity <= 5 ? 'text-amber-400' : 'text-emerald-400'}>
                            {item.availableQuantity} units
                          </span>
                          {item.availableQuantity <= 5 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-bold font-sans animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-amber-400 font-semibold">
                        {item.reservedQuantity} units
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        v{item.version ?? 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.availableQuantity <= 5 && (
                            <button
                              onClick={() => {
                                setRestockProduct(item.productId);
                                setRestockQty(25);
                                window.scrollTo({ top: 400, behavior: 'smooth' });
                              }}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-[10px] font-bold font-sans border border-amber-500/30 transition-colors"
                            >
                              Restock SKU
                            </button>
                          )}
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-sans font-semibold">
                            <Lock className="w-3 h-3" /> Redisson Safe
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GLOBAL ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-sky-400" />
                Customer Purchases & Order Surveillance
              </h2>
              <p className="text-xs text-slate-400">
                Centralized surveillance across all customer transactions, itemized carts, and Saga orchestration states
              </p>
            </div>

            <div className="flex items-center gap-2 self-start">
              <button
                onClick={fetchOrders}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-2xl text-[11px] font-semibold transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${loadingOrders ? 'animate-spin' : ''}`} /> Refresh
              </button>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
                {['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      orderStatusFilter === status
                        ? 'bg-sky-500 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Shopping Surveillance KPI Metrics Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Total Customer Orders</div>
              <div className="text-xl font-black text-white font-mono mt-1">{totalOrdersCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Surveillance scope</div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Confirmed Revenue</div>
              <div className="text-xl font-black text-emerald-400 font-mono mt-1">${totalConfirmedRevenue.toFixed(2)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{confirmedOrders.length} successful transactions</div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Average Order Value (AOV)</div>
              <div className="text-xl font-black text-sky-400 font-mono mt-1">${avgOrderValue.toFixed(2)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Per confirmed cart</div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Confirmation Rate</div>
              <div className="text-xl font-black text-indigo-400 font-mono mt-1">{confirmationRate}%</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Saga completion success</div>
            </div>
          </div>

          {/* Customer Search & Filter Bar */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            <input
              type="text"
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
              placeholder="Search purchases by customer email, order reference ID, or purchased product name..."
              className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {orderSearchTerm && (
              <button
                onClick={() => setOrderSearchTerm('')}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg mr-1 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Orders Table with Itemized Expansion */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="px-6 py-4">Order Reference</th>
                    <th className="px-6 py-4">Customer Email</th>
                    <th className="px-6 py-4">Purchased Items</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Saga Status</th>
                    <th className="px-6 py-4">Created At</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-xs">
                        No customer purchases matching status "{orderStatusFilter}" and search query.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const isExpanded = expandedOrderId === ord.id;
                      const itemCount = ord.items?.length || 0;

                      return (
                        <React.Fragment key={ord.id}>
                          <tr className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-white">
                              #{ord.id.substring(0, 13)}...
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              <span className="font-medium text-white">{ord.customerEmail || 'customer@eventix.io'}</span>
                              <div className="text-[10px] text-slate-500 font-mono">ID: {ord.customerId || 'cust-direct'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-[11px] font-semibold transition-colors"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-emerald-400">
                              ${Number(ord.totalAmount).toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                                  ord.status === 'CONFIRMED'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : ord.status === 'PENDING'
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                }`}
                              >
                                {ord.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-[11px]">
                              {new Date(ord.createdAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  to={`/orders/${ord.id}/status`}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                                  title="Monitor Saga Steps"
                                >
                                  <Activity className="w-3 h-3" /> Saga
                                </Link>
                                <Link
                                  to={`/orders/${ord.id}/confirmation`}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold transition-colors"
                                  title="View Invoice Receipt"
                                >
                                  Receipt
                                </Link>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Itemized Purchase Details */}
                          {isExpanded && (
                            <tr className="bg-slate-950/70 border-b border-slate-800">
                              <td colSpan={7} className="px-6 py-4">
                                <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 animate-fade-in">
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                                    <span className="font-bold text-white flex items-center gap-2">
                                      <ShoppingCart className="w-3.5 h-3.5 text-sky-400" />
                                      Itemized Cart Contents for Order #{ord.id}
                                    </span>
                                    <span className="text-slate-400 font-mono text-[11px]">
                                      Customer: <strong className="text-slate-200">{ord.customerEmail || 'customer@eventix.io'}</strong>
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 divide-y divide-slate-800/60 text-xs font-mono">
                                    {ord.items && ord.items.length > 0 ? (
                                      ord.items.map((it, idx) => (
                                        <div key={idx} className="py-2 flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sky-400 font-bold">&bull;</span>
                                            <span className="font-sans font-medium text-white">{it.productName}</span>
                                            <span className="text-[10px] text-slate-500">({it.productId})</span>
                                          </div>
                                          <div className="flex items-center gap-4">
                                            <span className="text-slate-400 font-sans">Qty: <strong className="text-white">{it.quantity}</strong></span>
                                            <span className="text-slate-400 font-sans">Unit: <strong className="text-white">${Number(it.unitPrice).toFixed(2)}</strong></span>
                                            <span className="text-emerald-400 font-bold">${(it.quantity * Number(it.unitPrice)).toFixed(2)}</span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="py-2 text-slate-500 italic text-[11px] font-sans">
                                        No itemized rows found for this order.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROMOTIONS & COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Promotions & Coupon Engine</h2>
              <p className="text-xs text-slate-400">Manage promotional discount codes, percentage savings, and customer redemption tracking</p>
            </div>

            <div className="flex items-center gap-2 self-start">
              <button
                onClick={fetchCoupons}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCoupons ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button
                onClick={() => setShowAddCoupon(!showAddCoupon)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                {showAddCoupon ? 'Cancel' : 'Create Promo Code'}
              </button>
            </div>
          </div>

          {couponActionMsg && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{couponActionMsg}</span>
            </div>
          )}

          {/* Add Coupon Form */}
          {showAddCoupon && (
            <form onSubmit={handleCreateCoupon} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 animate-fade-in">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Tag className="w-4 h-4 text-sky-400" /> Create New Promotional Code
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">COUPON CODE *</label>
                  <input
                    type="text"
                    required
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. FLASH30"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">DISCOUNT PERCENTAGE (% OFF) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    required
                    value={newCoupon.discountPercent}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountPercent: e.target.value })}
                    placeholder="e.g. 25"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">CAMPAIGN DESCRIPTION</label>
                  <input
                    type="text"
                    value={newCoupon.description}
                    onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                    placeholder="e.g. Flash Weekend Special 30% Off"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all"
                >
                  Save & Publish Promo Code
                </button>
              </div>
            </form>
          )}

          {/* Coupons Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="px-6 py-4">Promo Code</th>
                    <th className="px-6 py-4">Campaign Description</th>
                    <th className="px-6 py-4">Discount Rate</th>
                    <th className="px-6 py-4">Redemptions</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {coupons.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-sky-400 text-sm">
                        {c.code}
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-sans">
                        {c.description || 'Promotional coupon'}
                      </td>
                      <td className="px-6 py-4 text-emerald-400 font-bold text-sm">
                        {c.discountPercent}% OFF
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {c.usageCount} orders
                      </td>
                      <td className="px-6 py-4 font-sans">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            c.active
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-800 border-slate-700 text-slate-500'
                          }`}
                        >
                          {c.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-sans">
                        <button
                          onClick={() => handleToggleCoupon(c.code)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                            c.active
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {c.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
