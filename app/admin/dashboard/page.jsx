'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, customers: 0, paidOrders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productModal, setProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', category: '', original_price: '', sale_price: '', file_url: '', included_in_bundle: false });
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const descRef = useRef(null);
  const router = useRouter();

  const headers = { 'Content-Type': 'application/json' };

  useEffect(() => {
    const a = JSON.parse(localStorage.getItem('admin_data') || '{}');
    setAdmin(a);
    loadAll();
    loadCategories();
  }, []);

  useEffect(() => {
    if (tab === 'products') loadProducts();
    if (tab === 'orders') loadOrders();
    if (tab === 'customers') loadCustomers();
  }, [tab]);

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories', { headers });
      const data = await res.json();
      if (data.flag) setCategories(data.categories || []);
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

  async function loadCustomers() {
    const res = await fetch('/api/customers', { headers });
    const data = await res.json();
    if (data.flag) setCustomers(data.customers || []);
  }

  function openModal(product = null) {
    setEditProduct(product);
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
    setModalError('');
    setProductModal(true);
    setTimeout(() => {
      if (descRef.current) descRef.current.innerHTML = product?.description || '';
    }, 50);
  }

  function handleFiles(files) {
    const remaining = 10 - images.length - newFiles.length;
    if (remaining <= 0) { alert('Max 10 images!'); return; }
    setNewFiles(prev => [...prev, ...Array.from(files).slice(0, remaining)]);
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
    if (data.flag) { setProductModal(false); loadProducts(); loadAll(); }
    else setModalError(data.message || 'Error saving.');
    setSaving(false);
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/product/${id}`, { method: 'DELETE', headers });
    loadProducts(); loadAll();
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

  const sidebarItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'products', icon: '📦', label: 'Products' },
    { id: 'orders', icon: '🛒', label: 'Orders' },
    { id: 'customers', icon: '👥', label: 'Customers' },
  ];

  return (
    <div className="flex min-h-screen font-sans bg-[#0a0a0f] text-[#e8e8f0] relative">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed md:sticky top-0 left-0 h-screen w-[260px] shrink-0 bg-[#0e0e18] border-r border-[#f5c842]/10 p-6 flex flex-col z-50 transform transition-transform duration-300 overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex justify-between items-center mb-8 px-2 shrink-0">
          <div className="font-syne text-xl font-bold text-[#f5c842]">DigitalVault</div>
          <button className="md:hidden text-gray-400 hover:text-white text-xl border-none bg-transparent cursor-pointer" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {sidebarItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => { setTab(item.id); setSidebarOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer font-sans text-sm border-none w-full text-left transition-all duration-200 ${tab === item.id ? 'bg-[#f5c842]/10 text-[#f5c842]' : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-lg">{item.icon}</span> {item.label}
            </button>
          ))}
          <div className="border-t border-white/5 my-2 mx-2"></div>
          <Link href="/admin/categories" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm no-underline">
            <span className="text-lg">📂</span> Categories
          </Link>
          <Link href="/admin/coupons" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm no-underline">
            <span className="text-lg">🎟️</span> Coupons
          </Link>
          <Link href="/admin/bundle" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm no-underline">
            <span className="text-lg">🎁</span> Bundle
          </Link>
          <Link href="/admin/customers" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm no-underline">
            <span className="text-lg">👥</span> All Customers
          </Link>
          <Link href="/admin/reviews" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm no-underline">
            <span className="text-lg">⭐</span> Reviews
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm no-underline">
            <span className="text-lg">⚙️</span> Settings
          </Link>
        </nav>
        <div className="border-t border-white/5 pt-3 mt-4 shrink-0">
          <Link href="/" target="_blank" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm no-underline mb-1">
            <span className="text-lg">🌐</span> View Site
          </Link>
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer font-sans text-sm border-none bg-transparent text-red-500 hover:bg-red-500/10 transition-all w-full text-left">
            <span className="text-lg">🚪</span> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-w-0 p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-[#f5c842] text-2xl p-1 bg-white/5 rounded-lg border border-white/10 cursor-pointer flex items-center justify-center w-10 h-10 shrink-0" onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <h1 className="font-syne text-2xl md:text-3xl font-bold text-white tracking-tight">
                {tab === 'dashboard' && '📊 Dashboard'}
                {tab === 'products' && '📦 Products'}
                {tab === 'orders' && '🛒 Orders'}
                {tab === 'customers' && '👥 Customers'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">Welcome back, {admin?.name || 'Admin'}!</p>
            </div>
          </div>
          {tab === 'products' && (
            <button onClick={() => openModal()} className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer px-5 py-2.5 rounded-xl text-sm w-full sm:w-auto shadow-lg shadow-[#f5c842]/20 hover:scale-[1.02] transition-transform">
              + Add Product
            </button>
          )}
        </div>

        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div className="flex flex-col gap-6">
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
                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${o.payment_status === 1 ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-[#f5c842]/15 text-[#f5c842]'}`}>
                              {o.payment_status === 1 ? '✓ Paid' : '⏳ Pending'}
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
            {products.length === 0 ? (
              <div className="text-center p-10 md:p-16 text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                <div className="text-5xl mb-4">📦</div>
                <p>No products yet.</p>
                <button onClick={() => openModal()} className="mt-4 bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer px-5 py-2.5 rounded-xl shadow-lg shadow-[#f5c842]/20 hover:scale-[1.02] transition-transform">Add First Product</button>
              </div>
            ) : products.map(p => (
              <div key={p._id} className="bg-[#12121a] border border-[#f5c842]/10 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-[#f5c842]/30 transition-colors">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1a1a2a] shrink-0 flex items-center justify-center text-2xl border border-white/5">
                  {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" alt="" /> : '📦'}
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="font-bold text-white mb-1.5 font-syne truncate text-base">{p.name}</div>
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
                  <button onClick={() => openModal(p)} className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold text-[#f5c842] bg-[#f5c842]/10 border border-[#f5c842]/20 cursor-pointer hover:bg-[#f5c842]/20 transition-colors">Edit</button>
                  <button onClick={() => deleteProduct(p._id)} className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold text-red-500 bg-red-500/10 border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full min-w-[700px] border-collapse text-sm text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    {['Customer', 'Email', 'Product', 'Amount', 'Status', 'Date'].map(h => (
                      <th key={h} className="p-4 text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={6} className="p-10 text-center text-gray-500">No orders yet.</td></tr>
                  ) : orders.map((o, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-white font-medium">{o.name}</td>
                      <td className="p-4 text-gray-500 text-xs">{o.email}</td>
                      <td className="p-4 text-gray-400">{o.product_id?.name || '-'}</td>
                      <td className="p-4 text-[#f5c842] font-bold">₹{o.amount?.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${o.payment_status === 1 ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-[#f5c842]/15 text-[#f5c842]'}`}>
                          {o.payment_status === 1 ? '✓ Paid' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {tab === 'customers' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Total', val: customers.length },
                { label: 'VIP', val: customers.filter(c => c.tag === 'vip' || c.total_spent >= 5000).length },
                { label: 'Blocked', val: customers.filter(c => c.is_blocked).length },
                { label: 'New', val: customers.filter(c => c.total_orders === 0).length },
              ].map(s => (
                <div key={s.label} className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl p-4 sm:p-5 hover:border-[#f5c842]/30 transition-colors min-w-0">
                  <p className="text-gray-500 text-xs mb-1 font-medium truncate">{s.label}</p>
                  <p className="font-syne text-xl sm:text-2xl font-bold text-white truncate">{s.val}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl overflow-hidden flex flex-col">
              <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-syne font-bold text-white text-base">Recent Customers</h3>
                <Link href="/admin/customers" className="text-[#f5c842] text-sm no-underline hover:underline">View all →</Link>
              </div>

              {/* Mobile Cards Layout */}
              <div className="md:hidden flex flex-col divide-y divide-white/5">
                {customers.slice(0, 8).map((c, i) => (
                  <div key={i} className="p-4 flex flex-col gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <Link href={`/admin/customers/${c._id}`} className="text-white font-medium hover:text-[#f5c842] transition-colors truncate block">{c.name}</Link>
                        <p className="text-gray-500 text-xs truncate">{c.email}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap shrink-0 ${c.is_blocked ? 'bg-red-500/15 text-red-500' : 'bg-[#10b981]/15 text-[#10b981]'}`}>
                        {c.is_blocked ? '🚫 Blocked' : '✓ Active'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-[#0a0a0f] rounded-lg p-3 border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider">Orders</span>
                        <span className="text-white font-bold">{c.total_orders || 0}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-gray-500 text-[10px] uppercase tracking-wider">Spent</span>
                        <span className="text-[#f5c842] font-bold">₹{(c.total_spent || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto w-full custom-scrollbar">
                <table className="w-full min-w-[800px] border-collapse text-sm text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400 font-medium">
                      {['Name', 'Email', 'Orders', 'Spent', 'Status'].map(h => (
                        <th key={h} className="p-4 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.slice(0, 8).map((c, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <Link href={`/admin/customers/${c._id}`} className="text-white no-underline font-medium hover:text-[#f5c842] transition-colors whitespace-nowrap">{c.name}</Link>
                        </td>
                        <td className="p-4 text-gray-500 text-xs whitespace-nowrap">{c.email}</td>
                        <td className="p-4 text-white whitespace-nowrap">{c.total_orders || 0}</td>
                        <td className="p-4 text-[#f5c842] font-bold whitespace-nowrap">₹{(c.total_spent || 0).toLocaleString()}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${c.is_blocked ? 'bg-red-500/15 text-red-500' : 'bg-[#10b981]/15 text-[#10b981]'}`}>
                            {c.is_blocked ? '🚫 Blocked' : '✓ Active'}
                          </span>
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

      {/* Product Modal */}
      {productModal && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col backdrop-blur-sm p-0 md:p-6 lg:p-10">
          <div className="flex flex-col bg-[#0e0e18] w-full h-full md:rounded-2xl border-none md:border border-[#f5c842]/20 overflow-hidden shadow-2xl">
            <div className="bg-[#12121a] border-b border-white/10 p-4 md:p-6 flex items-center justify-between shrink-0">
              <h3 className="font-syne font-bold text-white text-lg">{editProduct ? 'Edit Product' : 'Add Product'}</h3>
              <div className="flex items-center gap-3">
                {modalError && <span className="text-red-500 text-xs bg-red-500/10 px-2 py-1 rounded hidden sm:block">{modalError}</span>}
                <button onClick={saveProduct} disabled={saving} className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer px-5 py-2 rounded-xl text-sm ${saving ? 'opacity-70' : 'hover:scale-[1.02]'} transition-transform shadow-lg shadow-[#f5c842]/20`}>
                  {saving ? 'Saving...' : '💾 Save'}
                </button>
                <button onClick={() => setProductModal(false)} className="bg-white/5 border border-white/10 text-gray-400 w-10 h-10 rounded-xl cursor-pointer hover:bg-white/10 hover:text-white flex items-center justify-center transition-all">✕</button>
              </div>
            </div>
            {modalError && <div className="sm:hidden text-red-500 text-xs bg-red-500/10 px-4 py-2 border-b border-white/5">{modalError}</div>}
            
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
                    {categories.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-2 uppercase tracking-wider">🖼️ Images (Max 10)</label>
                  <div onClick={() => document.getElementById('img-upload').click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                    className="border-2 border-dashed border-[#f5c842]/20 rounded-xl p-5 text-center cursor-pointer hover:border-[#f5c842]/50 hover:bg-[#f5c842]/5 transition-all">
                    <div className="text-2xl mb-1.5">📁</div>
                    <p className="text-[#f5c842] text-xs font-semibold">Click or Drag & Drop</p>
                    <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest">JPG, PNG, WEBP</p>
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
                  {[['bold','B',{fontWeight:800}],['italic','I',{fontStyle:'italic'}],['underline','U',{textDecoration:'underline'}],['strikeThrough','S',{textDecoration:'line-through'}]].map(([cmd,label,style]) => (
                    <button key={cmd} onClick={() => fmt(cmd)} className="bg-white/5 border border-white/10 text-gray-200 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors shrink-0" style={style}>{label}</button>
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
          `}</style>
        </div>
      )}
    </div>
  );
}
