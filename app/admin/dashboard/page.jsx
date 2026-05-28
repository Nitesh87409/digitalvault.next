'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

export default function AdminDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, customers: 0, paidOrders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [bundleAlert, setBundleAlert] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catParents, setCatParents] = useState([]);
  const [catChildren, setCatChildren] = useState([]);
  const [productModal, setProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', category: '', original_price: '', sale_price: '', file_url: '', included_in_bundle: false });
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const descRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const DRAFT_KEY = 'admin_product_draft';

  // Check for draft on mount
  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        if (d?.form?.name || d?.form?.file_url) {
          setHasDraft(true);
          setDraftSavedAt(d.savedAt || null);
        }
      } catch {}
    }
  }, []);

  function saveDraft() {
    const description = descRef.current?.innerHTML || '';
    const draft = { form: { ...form, description }, images, savedAt: new Date().toISOString() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setHasDraft(true);
    setDraftSavedAt(draft.savedAt);
    // Brief toast-like feedback via modalError (repurposed)
    setModalError('✅ Draft saved!');
    setTimeout(() => setModalError(''), 2000);
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setDraftSavedAt(null);
  }

  function clearDraftAfterSave() {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setDraftSavedAt(null);
  }

  // Search & Filter states
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderDetail, setOrderDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const headers = { 'Content-Type': 'application/json' };

  useEffect(() => {
    const a = JSON.parse(localStorage.getItem('admin_data') || '{}');
    setAdmin(a);
    loadAll();
    loadCategories();
  }, []);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && ['dashboard', 'products', 'orders'].includes(t)) {
      setTab(t);
    } else {
      setTab('dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    if (tab === 'products') loadProducts();
    if (tab === 'orders') loadOrders();
  }, [tab]);

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories', { headers });
      const data = await res.json();
      if (data.flag) {
        setCategories(data.categories || []);
        setCatParents(data.parents || []);
        setCatChildren(data.children || []);
      }
    } catch(e) {}
  }

  async function loadAll() {
    try {
      const [statsRes, pRes] = await Promise.all([
        fetch('/api/stats', { headers }),
        fetch('/api/product', { headers }),
      ]);
      const [statsData, pData] = await Promise.all([statsRes.json(), pRes.json()]);

      if (statsData.flag) {
        setStats({
          revenue: statsData.totalRevenue || 0,
          orders: statsData.totalOrders || 0,
          paidOrders: statsData.paidOrders || 0,
          products: statsData.totalProducts || 0,
          customers: statsData.totalCustomers || 0,
          conversionRate: statsData.totalOrders > 0
            ? ((statsData.paidOrders / statsData.totalOrders) * 100).toFixed(1)
            : 0,
        });
        setRecentOrders(statsData.recentOrders || []);
        setChartData(statsData.chartData || []);
        setBundleAlert(statsData.bundleAlert || null);
      }
      if (pData.flag) setProducts(pData.products || []);
    } catch(e) {}
  }

  async function loadProducts() {
    const res = await fetch('/api/product', { headers });
    const data = await res.json();
    if (data.flag) setProducts(data.products || []);
  }

  async function loadOrders() {
    const res = await fetch('/api/order', { headers });
    const data = await res.json();
    if (data.flag) setOrders(data.orders || []);
  }

  function openModal(product = null) {
    setEditProduct(product);
    setModalError('');

    // If adding new product, try to restore draft
    if (!product) {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        try {
          const d = JSON.parse(raw);
          if (d?.form) {
            const { description: draftDesc, ...draftForm } = d.form;
            setForm(draftForm);
            setImages(d.images || []);
            setNewFiles([]);
            setProductModal(true);
            setTimeout(() => {
              if (descRef.current) descRef.current.innerHTML = draftDesc || '';
            }, 50);
            return;
          }
        } catch {}
      }
    }

    setForm({
      name: product?.name || '',
      description: '',
      category: product?.category || 'Uncategorized',
      original_price: product?.original_price || '',
      sale_price: product?.sale_price || '',
      file_url: product?.file_url || '',
      included_in_bundle: !!product?.included_in_bundle,
    });
    setImages(product?.images || []);
    setNewFiles([]);
    setProductModal(true);
    setTimeout(() => {
      if (descRef.current) descRef.current.innerHTML = product?.description || '';
    }, 50);
  }

  function handleFiles(files) {
    const MAX_IMAGES = 10;
    const MIN_SIZE_BYTES = 5 * 1024; // 5KB
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    const remaining = MAX_IMAGES - images.length - newFiles.length;
    if (remaining <= 0) {
      alert('Max 10 images are allowed. You have reached the limit!');
      return;
    }

    const validFiles = [];
    const errors = [];

    Array.from(files).forEach(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" has an invalid format (Only JPG, PNG, WEBP, and GIF are allowed).`);
        return;
      }
      if (file.size < MIN_SIZE_BYTES) {
        errors.push(`"${file.name}" is too small (Min size is 5 KB).`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        errors.push(`"${file.name}" is too large (Max size is 5 MB).`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      const toAdd = validFiles.slice(0, remaining);
      if (validFiles.length > remaining) {
        alert(`Only ${remaining} images could be added. Max limit is 10.`);
      }
      setNewFiles(prev => [...prev, ...toAdd]);
    }
  }

  async function saveProduct() {
    const { name, category, original_price, sale_price, file_url } = form;
    const description = descRef.current?.innerHTML || '';
    if (!name || !original_price || !sale_price || !file_url || !category) { setModalError('All fields required.'); return; }
    setSaving(true); setModalError('');

    let uploadedImages = [...images];
    for (const file of newFiles) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const upData = await upRes.json();
        if (upData.flag) uploadedImages.push(upData.url);
      } catch(e) {}
    }

    const payload = { name, description, category, original_price: Number(original_price), sale_price: Number(sale_price), file_url, images: uploadedImages, included_in_bundle: !!form.included_in_bundle };
    const url = editProduct ? `/api/product/${editProduct._id}` : '/api/product';
    const method = editProduct ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
    const data = await res.json();
    if (data.flag) { setProductModal(false); clearDraftAfterSave(); loadProducts(); loadAll(); }
    else setModalError(data.message || 'Error saving.');
    setSaving(false);
  }

  async function softDeleteProduct(id) {
    const res = await fetch('/api/admin/bin', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'soft-delete', type: 'product', id })
    });
    const data = await res.json();
    if (data.flag) { loadProducts(); loadAll(); }
  }

  async function toggleProductStatus(product) {
    await fetch(`/api/product/${product._id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: !product.status })
    });
    loadProducts(); loadAll();
  }

  async function updateOrderStatus(orderId, newStatus) {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'update-status', order_id: orderId, payment_status: newStatus })
    });
    const data = await res.json();
    if (data.flag) loadOrders();
  }

  async function exportOrdersCSV() {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'export-csv' })
    });
    const data = await res.json();
    if (data.flag && data.csv) {
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST', headers, body: JSON.stringify({ role: 'admin' }) });
    localStorage.removeItem('admin_data');
    router.push('/admin/login');
  }

  function fmt(cmd, val = null) {
    descRef.current?.focus();
    document.execCommand(cmd, false, val);
  }

  // Filtered products
  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchSearch = !orderSearch ||
      o.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.razorpay_payment_id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.product_id?.name?.toLowerCase().includes(orderSearch.toLowerCase());
    const matchStatus = orderStatusFilter === 'all' ||
      (orderStatusFilter === 'paid' && o.payment_status === 1) ||
      (orderStatusFilter === 'pending' && o.payment_status === 0) ||
      (orderStatusFilter === 'refunded' && o.payment_status === 2);
    return matchSearch && matchStatus;
  });

  // Revenue chart helpers
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  const sidebarItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'products', icon: '📦', label: 'Products' },
    { id: 'orders', icon: '🛒', label: 'Orders' },
  ];

  const pageTitle = 
    tab === 'dashboard' ? '📊 Dashboard' :
    tab === 'products' ? '📦 Products' :
    tab === 'orders' ? '🛒 Orders' : '';

  const headerActions = tab === 'products' ? (
    <div className="relative">
      <button onClick={() => openModal()} className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer px-5 py-2.5 rounded-xl text-sm w-full sm:w-auto shadow-lg shadow-[#f5c842]/20 hover:scale-[1.02] transition-transform">
        + Add Product
      </button>
      {hasDraft && (
        <span className="absolute -top-2 -right-2 bg-amber-400 text-[#0a0a0f] text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg animate-pulse tracking-wide uppercase leading-none">Draft</span>
      )}
    </div>
  ) : tab === 'orders' ? (
    <button onClick={exportOrdersCSV} className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] font-syne font-bold cursor-pointer px-5 py-2.5 rounded-xl text-sm w-full sm:w-auto hover:bg-[#10b981]/20 transition-colors">
      📥 Export CSV
    </button>
  ) : null;

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
        <h1 className="font-syne text-2xl md:text-3xl font-bold text-white tracking-tight">{pageTitle}</h1>
        {headerActions && <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">{headerActions}</div>}
      </div>

        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div className="flex flex-col gap-6">

            {/* Bundle Sales Limit Alert */}
            {bundleAlert && (
              <div className={`rounded-2xl p-5 border flex items-center gap-4 ${bundleAlert.critical ? 'bg-red-500/10 border-red-500/30' : 'bg-[#f5c842]/10 border-[#f5c842]/30'}`}>
                <span className="text-3xl">{bundleAlert.critical ? '🚨' : '⚠️'}</span>
                <div className="flex-1">
                  <p className={`font-syne font-bold ${bundleAlert.critical ? 'text-red-400' : 'text-[#f5c842]'}`}>
                    Bundle Sales Limit {bundleAlert.critical ? 'Almost Full!' : 'Warning'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {bundleAlert.current} / {bundleAlert.limit} sold ({bundleAlert.percentage}%)
                    {bundleAlert.critical && ' — Only ' + (bundleAlert.limit - bundleAlert.current) + ' remaining!'}
                  </p>
                </div>
                <div className="w-20 h-20 relative shrink-0">
                  <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke={bundleAlert.critical ? '#ef4444' : '#f5c842'} strokeWidth="3"
                      strokeDasharray={`${bundleAlert.percentage}, 100`} strokeLinecap="round" />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center font-syne font-bold text-sm ${bundleAlert.critical ? 'text-red-400' : 'text-[#f5c842]'}`}>
                    {bundleAlert.percentage}%
                  </span>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Total Revenue', val: '₹' + (stats.revenue || 0).toLocaleString(), icon: '💰', color: '#f5c842', sub: 'From paid orders' },
                { label: 'Total Orders', val: stats.orders, icon: '🛒', color: '#8b5cf6', sub: `${stats.paidOrders} paid` },
                { label: 'Conversion Rate', val: (stats.conversionRate || 0) + '%', icon: '📈', color: '#10b981', sub: 'Paid vs total' },
                { label: 'Products', val: stats.products, icon: '📦', color: '#3b82f6', sub: 'Active products' },
                { label: 'Customers', val: stats.customers, icon: '👥', color: '#f97316', sub: 'Registered users' },
                { label: 'Avg Order Value', val: '₹' + (stats.paidOrders > 0 ? Math.round(stats.revenue / stats.paidOrders).toLocaleString() : 0), icon: '💎', color: '#ec4899', sub: 'Per paid order' },
              ].map(s => (
                <div key={s.label} className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl p-6 relative overflow-hidden group hover:border-[#f5c842]/30 transition-colors">
                  <div className="absolute top-[-10px] right-[-10px] text-5xl opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all pointer-events-none select-none">{s.icon}</div>
                  <p className="text-gray-500 text-xs mb-2 font-medium">{s.label}</p>
                  <p className="font-syne text-3xl font-bold mb-1" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-gray-600 text-xs">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Revenue Chart */}
            {chartData.length > 0 && (
              <div className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <h3 className="font-syne font-bold text-white text-base">📈 Revenue (Last 30 Days)</h3>
                  <span className="text-gray-500 text-xs">
                    Total: ₹{chartData.reduce((s, d) => s + d.revenue, 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-end gap-[3px] sm:gap-1 h-36 sm:h-48">
                    {chartData.map((d, i) => (
                      <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative" title={`${d.label}: ₹${d.revenue.toLocaleString()} (${d.orders} orders)`}>
                        <div
                          className={`w-full rounded-t-sm sm:rounded-t transition-all duration-300 group-hover:opacity-100 min-h-[2px] ${
                            d.revenue > 0
                              ? 'bg-gradient-to-t from-[#f5c842] to-[#e0a800] opacity-80'
                              : 'bg-white/[0.03] opacity-30'
                          }`}
                          style={{
                            height: `${Math.max(2, (d.revenue / maxRevenue) * 100)}%`,
                          }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 pointer-events-none">
                          <div className="bg-[#1a1a2a] border border-white/10 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                            <p className="text-white font-bold">₹{d.revenue.toLocaleString()}</p>
                            <p className="text-gray-400">{d.label} · {d.orders} orders</p>
                          </div>
                        </div>
                        {i % 5 === 0 && (
                          <span className="text-[7px] sm:text-[9px] text-gray-600 mt-1.5 hidden sm:block">{d.label.split(' ')[0]}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Manage Coupons', href: '/admin/coupons', icon: '🎟️', color: '#f5c842' },
                { label: 'All Customers', href: '/admin/customers', icon: '👥', color: '#8b5cf6' },
                { label: 'View Live Site', href: '/', icon: '🌐', color: '#10b981' },
                { label: 'Add Product', onClick: () => { setTab('products'); openModal(); }, icon: '➕', color: '#3b82f6' },
              ].map(q => (
                q.href ? (
                  <Link key={q.label} href={q.href} target={q.href === '/' ? '_blank' : undefined} className="bg-[#12121a] border border-white/5 rounded-xl p-4 no-underline flex items-center gap-3 hover:border-white/20 transition-all hover:bg-white/5">
                    <span className="text-xl">{q.icon}</span>
                    <span className="text-sm font-semibold truncate" style={{ color: q.color }}>{q.label}</span>
                  </Link>
                ) : (
                  <button key={q.label} onClick={q.onClick} className="bg-[#12121a] border border-white/5 rounded-xl p-4 cursor-pointer flex items-center gap-3 hover:border-white/20 transition-all hover:bg-white/5 w-full text-left font-sans">
                    <span className="text-xl">{q.icon}</span>
                    <span className="text-sm font-semibold truncate" style={{ color: q.color }}>{q.label}</span>
                  </button>
                )
              ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl overflow-hidden flex flex-col">
              <div className="p-5 sm:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="font-syne font-bold text-white text-base">🕐 Recent Orders</h3>
                <button onClick={() => setTab('orders')} className="bg-transparent border-none text-[#f5c842] cursor-pointer text-sm font-sans hover:underline">View all →</button>
              </div>
              <div className="overflow-x-auto w-full custom-scrollbar">
                {recentOrders.length === 0 ? (
                  <p className="p-6 text-gray-500 text-sm text-center">No orders yet.</p>
                ) : (
                  <table className="w-full min-w-[700px] text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-400 font-medium">
                        <th className="p-4 font-medium">Customer</th>
                        <th className="p-4 font-medium">Product</th>
                        <th className="p-4 font-medium">Amount</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.slice(0, 8).map((o, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <div className="text-white font-medium">{o.name}</div>
                            <div className="text-gray-500 text-xs mt-0.5">{o.email}</div>
                          </td>
                          <td className="p-4 text-gray-400">{o.product_id?.name || 'Product'}</td>
                          <td className="p-4 text-[#f5c842] font-bold">₹{o.amount?.toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${o.payment_status === 1 ? 'bg-[#10b981]/15 text-[#10b981]' : o.payment_status === 2 ? 'bg-red-500/15 text-red-500' : 'bg-[#f5c842]/15 text-[#f5c842]'}`}>
                              {o.payment_status === 1 ? '✓ Completed' : o.payment_status === 2 ? '↩ Refunded' : '⏳ Pending'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {tab === 'products' && (
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <input
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="🔍 Search products by name or category..."
              className="bg-[#12121a] border border-white/10 text-white outline-none px-4 py-3 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors w-full"
            />

            <p className="text-gray-500 text-xs">{filteredProducts.length} of {products.length} products</p>

            {filteredProducts.length === 0 ? (
              <div className="text-center p-10 md:p-16 text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                <div className="text-5xl mb-4">📦</div>
                <p>{productSearch ? 'No products match your search.' : 'No products yet.'}</p>
                {!productSearch && <button onClick={() => openModal()} className="mt-4 bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer px-5 py-2.5 rounded-xl shadow-lg shadow-[#f5c842]/20 hover:scale-[1.02] transition-transform">Add First Product</button>}
              </div>
            ) : filteredProducts.map(p => (
              <div key={p._id} className={`bg-[#12121a] border rounded-xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-colors ${p.status === false ? 'border-red-500/20 opacity-60' : 'border-[#f5c842]/10 hover:border-[#f5c842]/30'}`}>
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1a1a2a] shrink-0 flex items-center justify-center text-2xl border border-white/5">
                  {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" alt="" /> : '📦'}
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="font-bold text-white mb-1.5 font-syne truncate text-base flex items-center gap-2">
                    {p.name}
                    {p.status === false && <span className="text-[10px] bg-red-500/15 text-red-500 px-2 py-0.5 rounded font-bold uppercase">Hidden</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center mt-1">
                    <span className="text-[#f5c842] font-bold text-sm">₹{p.sale_price?.toLocaleString()}</span>
                    <span className="text-gray-500 line-through text-xs">₹{p.original_price?.toLocaleString()}</span>
                    <span className="text-[#10b981] text-[10px] font-bold tracking-wider uppercase bg-[#10b981]/10 px-2 py-0.5 rounded">{Math.round((p.original_price - p.sale_price) / p.original_price * 100)}% off</span>
                    <span className="bg-[#f5c842]/10 text-[#f5c842] text-[10px] px-2 py-0.5 rounded border border-[#f5c842]/20 truncate max-w-[120px]">{p.category || 'Uncategorized'}</span>
                    {p.included_in_bundle && (
                      <span className="bg-[#8b5cf6]/10 text-[#c4b5fd] text-[10px] px-2 py-0.5 rounded border border-[#8b5cf6]/20">Bundle</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                  <button onClick={() => toggleProductStatus(p)} title={p.status === false ? 'Show product' : 'Hide product'} className={`px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors border ${p.status === false ? 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20 hover:bg-[#10b981]/20' : 'text-gray-400 bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    {p.status === false ? '👁️' : '🙈'}
                  </button>
                  <button onClick={() => openModal(p)} className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold text-[#f5c842] bg-[#f5c842]/10 border border-[#f5c842]/20 cursor-pointer hover:bg-[#f5c842]/20 transition-colors">Edit</button>
                  <button onClick={() => setDeleteTarget(p)} className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold text-red-500 bg-red-500/10 border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div className="flex flex-col gap-5">
            {/* Search + Filter Tab Row */}
            <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
              <input
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                placeholder="🔍 Search by name, email, payment ID, or product..."
                className="flex-1 bg-[#12121a] border border-white/10 text-white outline-none px-4 py-3 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors"
              />
              
              {/* Dynamic Status Filter Pills */}
              <div className="flex bg-[#12121a] p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-hide max-w-full shrink-0">
                {[
                  { id: 'all', label: 'All Orders', count: orders.length },
                  { id: 'pending', label: '⏳ Pending', count: orders.filter(o => o.payment_status === 0).length },
                  { id: 'paid', label: '✓ Completed', count: orders.filter(o => o.payment_status === 1).length },
                  { id: 'refunded', label: '↩ Refunded', count: orders.filter(o => o.payment_status === 2).length }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setOrderStatusFilter(filter.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold font-syne cursor-pointer border-none transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      orderStatusFilter === filter.id
                        ? 'bg-[#f5c842]/10 text-[#f5c842] shadow'
                        : 'bg-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {filter.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      orderStatusFilter === filter.id
                        ? 'bg-[#f5c842]/20 text-[#f5c842]'
                        : 'bg-white/5 text-gray-500'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-gray-500 text-xs">{filteredOrders.length} of {orders.length} orders</p>

            <div className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl overflow-hidden flex flex-col">
              <div className="overflow-x-auto w-full custom-scrollbar">
                <table className="w-full min-w-[900px] border-collapse text-sm text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      {['Customer', 'Email', 'Product', 'Amount', 'Coupon', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} className="p-4 text-gray-400 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr><td colSpan={8} className="p-10 text-center text-gray-500">No orders found.</td></tr>
                    ) : filteredOrders.map((o, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setOrderDetail(o)}>
                        <td className="p-4 text-white font-medium">{o.name}</td>
                        <td className="p-4 text-gray-500 text-xs">{o.email}</td>
                        <td className="p-4 text-gray-400">{o.product_id?.name || '-'}</td>
                        <td className="p-4 text-[#f5c842] font-bold">₹{o.amount?.toLocaleString()}</td>
                        <td className="p-4 text-gray-500 text-xs">{o.coupon_code || '-'}</td>
                        <td className="p-4">
                          <select
                            value={o.payment_status}
                            onChange={e => { e.stopPropagation(); updateOrderStatus(o._id, Number(e.target.value)); }}
                            onClick={e => e.stopPropagation()}
                            className={`border-none cursor-pointer px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider outline-none ${o.payment_status === 1 ? 'bg-[#10b981]/15 text-[#10b981]' : o.payment_status === 2 ? 'bg-red-500/15 text-red-500' : 'bg-[#f5c842]/15 text-[#f5c842]'}`}
                          >
                            <option value={0}>⏳ Pending</option>
                            <option value={1}>✓ Completed</option>
                            <option value={2}>↩ Refunded</option>
                          </select>
                        </td>
                        <td className="p-4 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-4">
                          <button onClick={e => { e.stopPropagation(); setOrderDetail(o); }} className="bg-white/5 border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* Order Detail Modal */}
      {orderDetail && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setOrderDetail(null)}>
          <div className="bg-[#12121a] border border-[#f5c842]/20 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-syne font-bold text-white text-lg">🧾 Order Details</h3>
              <button onClick={() => setOrderDetail(null)} className="bg-white/5 border border-white/10 text-gray-400 w-8 h-8 rounded-lg cursor-pointer hover:bg-white/10 hover:text-white transition-all flex items-center justify-center">✕</button>
            </div>
            <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {[
                { label: 'Customer', value: orderDetail.name },
                { label: 'Email', value: orderDetail.email },
                { label: 'Phone', value: orderDetail.phone || '-' },
                { label: 'Product', value: orderDetail.product_id?.name || orderDetail.product_name || '-' },
                { label: 'Amount Paid', value: `₹${orderDetail.amount?.toLocaleString()}`, color: '#f5c842' },
                { label: 'Original Price', value: `₹${(orderDetail.original_amount || 0).toLocaleString()}` },
                { label: 'Discount', value: `₹${(orderDetail.discount_amount || 0).toLocaleString()}`, color: '#10b981' },
                { label: 'Coupon', value: orderDetail.coupon_code || 'None' },
                { label: 'Payment ID', value: orderDetail.razorpay_payment_id || '-' },
                { label: 'Order ID', value: orderDetail.razorpay_order_id || '-' },
                { label: 'Downloads', value: orderDetail.download_count || 0 },
                { label: 'Status', value: orderDetail.payment_status === 1 ? '✓ Completed' : orderDetail.payment_status === 2 ? '↩ Refunded' : '⏳ Pending' },
                { label: 'Date', value: new Date(orderDetail.createdAt).toLocaleString('en-IN') },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-gray-500 text-sm">{item.label}</span>
                  <span className="text-white text-sm font-medium text-right max-w-[60%] break-all" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {productModal && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col backdrop-blur-sm p-0 md:p-6 lg:p-10">
          <div className="flex flex-col bg-[#0e0e18] w-full h-full md:rounded-2xl border-none md:border border-[#f5c842]/20 overflow-hidden shadow-2xl">
            <div className="bg-[#12121a] border-b border-white/10 p-4 md:p-6 flex items-center justify-between shrink-0">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-syne font-bold text-white text-lg">{editProduct ? 'Edit Product' : 'Add Product'}</h3>
                {!editProduct && draftSavedAt && (
                  <span className="text-[10px] text-amber-400/70 font-sans">Draft · Last saved {new Date(draftSavedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {modalError && <span className={`text-xs px-2 py-1 rounded hidden sm:block ${modalError.startsWith('✅') ? 'text-[#10b981] bg-[#10b981]/10' : 'text-red-500 bg-red-500/10'}`}>{modalError}</span>}
                {!editProduct && (
                  <button
                    onClick={saveDraft}
                    className="bg-amber-400/10 border border-amber-400/30 text-amber-400 font-syne font-bold border-none cursor-pointer px-4 py-2 rounded-xl text-sm hover:bg-amber-400/20 transition-colors"
                    title="Save as draft to continue later"
                  >
                    📝 Draft
                  </button>
                )}
                {!editProduct && hasDraft && (
                  <button
                    onClick={() => { discardDraft(); setProductModal(false); }}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 font-syne font-bold border-none cursor-pointer px-3 py-2 rounded-xl text-xs hover:bg-red-500/20 transition-colors"
                    title="Discard draft"
                  >
                    🗑️ Discard
                  </button>
                )}
                <button onClick={saveProduct} disabled={saving} className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer px-5 py-2 rounded-xl text-sm ${saving ? 'opacity-70' : 'hover:scale-[1.02]'} transition-transform shadow-lg shadow-[#f5c842]/20`}>
                  {saving ? 'Saving...' : '💾 Publish'}
                </button>
                <button onClick={() => setProductModal(false)} className="bg-white/5 border border-white/10 text-gray-400 w-10 h-10 rounded-xl cursor-pointer hover:bg-white/10 hover:text-white flex items-center justify-center transition-all">✕</button>
              </div>
            </div>
            {modalError && <div className={`sm:hidden text-xs px-4 py-2 border-b border-white/5 ${modalError.startsWith('✅') ? 'text-[#10b981] bg-[#10b981]/10' : 'text-red-500 bg-red-500/10'}`}>{modalError}</div>}
            
            <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden custom-scrollbar">
              {/* Left Settings Pane */}
              <div className="w-full lg:w-80 xl:w-96 bg-[#0e0e18] border-b lg:border-b-0 lg:border-r border-white/5 p-5 md:p-6 lg:overflow-y-auto flex flex-col gap-6 shrink-0 custom-scrollbar">
                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-2 uppercase tracking-wider">📦 Product Name *</label>
                  <input className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-2 uppercase tracking-wider">📂 Category *</label>
                  <select className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-sm font-sans cursor-pointer focus:border-[#f5c842]/50 transition-colors appearance-none" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select a Category</option>
                    {catParents.map(parent => {
                      const subs = catChildren.filter(c => c.parent_id?.toString() === parent._id?.toString());
                      return subs.length > 0 ? (
                        <optgroup key={parent._id} label={`📁 ${parent.name}`}>
                          {subs.map(sub => (
                            <option key={sub._id} value={sub.name}>{sub.name}</option>
                          ))}
                        </optgroup>
                      ) : (
                        <option key={parent._id} value={parent.name}>{parent.name}</option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-2 uppercase tracking-wider">🖼️ Images (Max 10)</label>
                  <div onClick={() => document.getElementById('img-upload').click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                    className="border-2 border-dashed border-[#f5c842]/20 rounded-xl p-4 text-center cursor-pointer hover:border-[#f5c842]/50 hover:bg-[#f5c842]/5 transition-all bg-[#12121a]">
                    <div className="text-2xl mb-1">📁</div>
                    <p className="text-[#f5c842] text-xs font-bold font-syne">Click or Drag & Drop</p>
                    <div className="mt-2 flex flex-col gap-0.5 text-[9px] text-gray-400 font-sans tracking-wide uppercase">
                      <span>📏 Ideal Size: 1:1 Square (e.g. 800px × 800px)</span>
                      <span>⚖️ File Size: Min 5 KB — Max 5 MB</span>
                      <span>🎨 Formats: JPG, PNG, WEBP, GIF</span>
                    </div>
                  </div>
                  <input id="img-upload" type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
                  {(images.length > 0 || newFiles.length > 0) && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {images.map((src, i) => (
                        <div key={i} className="relative rounded-lg overflow-hidden h-20 border border-white/10 group">
                          <img src={src} className="w-full h-full object-cover" alt="" />
                          <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-red-500/90 border-none text-white w-5 h-5 rounded-full cursor-pointer text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">✕</button>
                        </div>
                      ))}
                      {newFiles.map((file, i) => (
                        <div key={i} className="relative rounded-lg overflow-hidden h-20 border border-[#f5c842]/40 border-dashed group">
                          <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-80" alt="" />
                          <div className="absolute top-1 left-1 bg-[#f5c842] text-black text-[8px] font-bold px-1.5 py-0.5 rounded shadow">NEW</div>
                          <button onClick={() => setNewFiles(newFiles.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-red-500/90 border-none text-white w-5 h-5 rounded-full cursor-pointer text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-2 uppercase tracking-wider">💰 Pricing</label>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Original Price (₹) *</label>
                      <input type="number" className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} placeholder="8497" />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Sale Price (₹) *</label>
                      <input type="number" className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} placeholder="1999" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-2 uppercase tracking-wider">⬇️ Download File URL *</label>
                  <input className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors" value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} placeholder="https://drive.google.com/..." />
                </div>
                <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#1a1a2a] px-4 py-3 cursor-pointer">
                  <span>
                    <span className="block text-xs font-semibold text-[#f5c842] uppercase tracking-wider">Bundle Access</span>
                    <span className="block text-[11px] text-gray-500 mt-1">Include this product in the full bundle</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={!!form.included_in_bundle}
                    onChange={e => setForm({ ...form, included_in_bundle: e.target.checked })}
                    className="h-5 w-5 accent-[#f5c842]"
                  />
                </label>
              </div>
              {/* Right Rich Editor */}
              <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden bg-[#0a0a0f] relative min-h-[400px] lg:min-h-0 shrink-0 lg:shrink">
                <div className="bg-[#12121a] border-b border-white/10 p-2 md:p-3 flex flex-wrap gap-1.5 items-center shrink-0 sticky top-0 z-10 w-full max-w-full min-w-0 overflow-x-auto custom-scrollbar">
                  {[['bold','B','font-extrabold'],['italic','I','italic'],['underline','U','underline'],['strikeThrough','S','line-through']].map(([cmd,label,className]) => (
                    <button key={cmd} onClick={() => fmt(cmd)} className={`bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors shrink-0 ${className}`}>{label}</button>
                  ))}
                  <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block shrink-0"></div>
                  <button onClick={() => fmt('insertUnorderedList')} className="bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors shrink-0">• List</button>
                  <button onClick={() => fmt('insertOrderedList')} className="bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors shrink-0">1. List</button>
                  <select onChange={e => { fmt('fontSize', e.target.value); e.target.value=''; }} className="bg-white/5 border border-white/10 text-gray-200 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors outline-none appearance-none shrink-0">
                    <option value="" className="bg-[#12121a]">Size</option>
                    {[['1','Small'],['3','Normal'],['5','Large'],['7','Huge']].map(([v,l]) => <option key={v} value={v} className="bg-[#12121a]">{l}</option>)}
                  </select>
                  <select onChange={e => { fmt('foreColor', e.target.value); e.target.value=''; }} className="bg-white/5 border border-white/10 text-gray-200 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors outline-none appearance-none shrink-0">
                    <option value="" className="bg-[#12121a]">Color</option>
                    {[['#f5c842','Gold'],['#ffffff','White'],['#10b981','Green'],['#ef4444','Red'],['#3b82f6','Blue']].map(([v,l]) => <option key={v} value={v} className="bg-[#12121a]">{l}</option>)}
                  </select>
                  <select onChange={e => { fmt('formatBlock', e.target.value); e.target.value=''; }} className="bg-white/5 border border-white/10 text-gray-200 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors outline-none appearance-none shrink-0">
                    <option value="" className="bg-[#12121a]">Heading</option>
                    {[['h1','H1'],['h2','H2'],['h3','H3'],['p','Normal']].map(([v,l]) => <option key={v} value={v} className="bg-[#12121a]">{l}</option>)}
                  </select>
                  <button onClick={() => fmt('removeFormat')} className="bg-white/5 border border-white/10 text-red-400 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-red-500/20 transition-colors ml-auto shrink-0">✕ Clear</button>
                </div>
                <div ref={descRef} className="flex-1 w-full min-h-[300px] lg:min-h-0 p-5 md:p-8 text-[15px] leading-[1.8] text-gray-200 outline-none overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words focus:ring-2 focus:ring-[#f5c842]/20 inset-0" contentEditable suppressContentEditableWarning />
              </div>
            </div>
          </div>
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
          `}
          </style>
        </div>
      )}
      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => softDeleteProduct(deleteTarget?._id)}
        itemName={deleteTarget?.name}
      />
    </>
  );
}
