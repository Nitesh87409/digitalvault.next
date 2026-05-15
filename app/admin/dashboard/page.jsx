'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, customers: 0, paidOrders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productModal, setProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'Uncategorized', original_price: '', sale_price: '', file_url: '' });
  const [images, setImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const descRef = useRef(null);
  const router = useRouter();

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const headers = { 'Content-Type': 'application/json', 'authorization': token };

  useEffect(() => {
    if (!token) { router.push('/admin/login'); return; }
    const a = JSON.parse(localStorage.getItem('admin_data') || '{}');
    setAdmin(a);
    loadAll();
  }, []);

  useEffect(() => {
    if (tab === 'products') loadProducts();
    if (tab === 'orders') loadOrders();
    if (tab === 'customers') loadCustomers();
  }, [tab]);

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
        const upRes = await fetch('/api/upload', { method: 'POST', headers: { 'authorization': token }, body: fd });
        const upData = await upRes.json();
        if (upData.flag) uploadedImages.push(upData.url);
      } catch(e) {}
    }

    const payload = { name, description, category, original_price: Number(original_price), sale_price: Number(sale_price), file_url, images: uploadedImages };
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

  function logout() {
    localStorage.removeItem('admin_token');
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

  const inp = { background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' };
  const toolbarBtn = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e8e8f0', padding: '5px 11px', borderRadius: '7px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' };

  return (
    <div className="admin-shell" style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0f', minHeight: '100vh', color: '#e8e8f0', display: 'flex' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Sidebar */}
      <div className="admin-sidebar" style={{ width: '240px', background: '#0e0e18', borderRight: '1px solid rgba(245,200,66,0.1)', minHeight: '100vh', padding: '24px 16px', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#f5c842', marginBottom: '32px', padding: '0 8px' }}>DigitalVault</div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', border: 'none', width: '100%', textAlign: 'left', background: tab === item.id ? 'rgba(245,200,66,0.08)' : 'none', color: tab === item.id ? '#f5c842' : '#6b7280', transition: 'all 0.2s' }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '8px 0' }}></div>
          <Link href="/admin/coupons" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '10px', color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>
            <span>🎟️</span> Coupons
          </Link>
          <Link href="/admin/customers" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '10px', color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>
            <span>👥</span> All Customers
          </Link>
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
          <Link href="/" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '10px', color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '4px' }}>
            <span>🌐</span> View Site
          </Link>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', border: 'none', background: 'none', color: '#ef4444', width: '100%', textAlign: 'left' }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main" style={{ marginLeft: '240px', flex: 1, padding: '32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
              {tab === 'dashboard' && '📊 Dashboard'}
              {tab === 'products' && '📦 Products'}
              {tab === 'orders' && '🛒 Orders'}
              {tab === 'customers' && '👥 Customers'}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '4px' }}>Welcome back, {admin?.name}!</p>
          </div>
          {tab === 'products' && (
            <button onClick={() => openModal()} style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '10px', fontSize: '0.875rem' }}>+ Add Product</button>
          )}
        </div>

        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total Revenue', val: '₹' + (stats.revenue || 0).toLocaleString(), icon: '💰', color: '#f5c842', sub: 'From paid orders' },
                { label: 'Total Orders', val: stats.orders, icon: '🛒', color: '#8b5cf6', sub: `${stats.paidOrders} paid` },
                { label: 'Conversion Rate', val: (stats.conversionRate || 0) + '%', icon: '📈', color: '#10b981', sub: 'Paid vs total' },
                { label: 'Products', val: stats.products, icon: '📦', color: '#3b82f6', sub: 'Active products' },
                { label: 'Customers', val: stats.customers, icon: '👥', color: '#f97316', sub: 'Registered users' },
                { label: 'Avg Order Value', val: '₹' + (stats.paidOrders > 0 ? Math.round(stats.revenue / stats.paidOrders).toLocaleString() : 0), icon: '💎', color: '#ec4899', sub: 'Per paid order' },
              ].map(s => (
                <div key={s.label} style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.08)', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '3rem', opacity: 0.08 }}>{s.icon}</div>
                  <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 500 }}>{s.label}</p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 700, color: s.color, marginBottom: '4px' }}>{s.val}</p>
                  <p style={{ color: '#4b5563', fontSize: '0.75rem' }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Manage Coupons', href: '/admin/coupons', icon: '🎟️', color: '#f5c842' },
                { label: 'All Customers', href: '/admin/customers', icon: '👥', color: '#8b5cf6' },
                { label: 'View Live Site', href: '/', icon: '🌐', color: '#10b981' },
                { label: 'Add Product', onClick: () => { setTab('products'); openModal(); }, icon: '➕', color: '#3b82f6' },
              ].map(q => (
                q.href ? (
                  <Link key={q.label} href={q.href} target={q.href === '/' ? '_blank' : undefined} style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', transition: 'border-color 0.2s' }}>
                    <span style={{ fontSize: '1.2rem' }}>{q.icon}</span>
                    <span style={{ color: q.color, fontSize: '0.875rem', fontWeight: 600 }}>{q.label}</span>
                  </Link>
                ) : (
                  <button key={q.label} onClick={q.onClick} style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'DM Sans, sans-serif' }}>
                    <span style={{ fontSize: '1.2rem' }}>{q.icon}</span>
                    <span style={{ color: q.color, fontSize: '0.875rem', fontWeight: 600 }}>{q.label}</span>
                  </button>
                )
              ))}
            </div>

            {/* Recent Orders */}
            <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#fff', fontSize: '1rem' }}>🕐 Recent Orders</h3>
                <button onClick={() => setTab('orders')} style={{ background: 'none', border: 'none', color: '#f5c842', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' }}>View all →</button>
              </div>
              {recentOrders.length === 0 ? (
                <p style={{ padding: '24px', color: '#6b7280', fontSize: '0.875rem', textAlign: 'center' }}>No orders yet.</p>
              ) : recentOrders.slice(0, 8).map((o, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.875rem' }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 500 }}>{o.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{o.email}</div>
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{o.product_id?.name || 'Product'}</div>
                  <div style={{ color: '#f5c842', fontWeight: 700 }}>₹{o.amount?.toLocaleString()}</div>
                  <span style={{ background: o.payment_status === 1 ? 'rgba(16,185,129,0.15)' : 'rgba(245,200,66,0.15)', color: o.payment_status === 1 ? '#10b981' : '#f5c842', padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>
                    {o.payment_status === 1 ? '✓ Paid' : '⏳ Pending'}
                  </span>
                  <div style={{ color: '#4b5563', fontSize: '0.75rem' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {tab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
                <p>No products yet.</p>
                <button onClick={() => openModal()} style={{ marginTop: '16px', background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '10px' }}>Add First Product</button>
              </div>
            ) : products.map(p => (
              <div key={p._id} style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.08)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', background: '#1a1a2a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {p.images?.[0] ? <img src={p.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '📦'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff', marginBottom: '4px', fontFamily: 'Syne, sans-serif' }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#f5c842', fontWeight: 700 }}>₹{p.sale_price?.toLocaleString()}</span>
                    <span style={{ color: '#6b7280', textDecoration: 'line-through', fontSize: '0.875rem' }}>₹{p.original_price?.toLocaleString()}</span>
                    <span style={{ color: '#10b981', fontSize: '0.8rem' }}>{Math.round((p.original_price - p.sale_price) / p.original_price * 100)}% off</span>
                    <span style={{ background: 'rgba(245,200,66,0.1)', color: '#f5c842', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245,200,66,0.2)' }}>{p.category || 'Uncategorized'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openModal(p)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', color: '#f5c842', background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.2)', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => deleteProduct(p._id)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Customer', 'Email', 'Product', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 20px', color: '#6b7280', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No orders yet.</td></tr>
                ) : orders.map((o, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 20px', color: '#fff', fontWeight: 500 }}>{o.name}</td>
                    <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: '0.8rem' }}>{o.email}</td>
                    <td style={{ padding: '14px 20px', color: '#9ca3af' }}>{o.product_id?.name || '-'}</td>
                    <td style={{ padding: '14px 20px', color: '#f5c842', fontWeight: 700 }}>₹{o.amount?.toLocaleString()}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: o.payment_status === 1 ? 'rgba(16,185,129,0.15)' : 'rgba(245,200,66,0.15)', color: o.payment_status === 1 ? '#10b981' : '#f5c842', padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>
                        {o.payment_status === 1 ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: '0.8rem' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {tab === 'customers' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total', val: customers.length },
                { label: 'VIP', val: customers.filter(c => c.tag === 'vip' || c.total_spent >= 5000).length },
                { label: 'Blocked', val: customers.filter(c => c.is_blocked).length },
                { label: 'New', val: customers.filter(c => c.total_orders === 0).length },
              ].map(s => (
                <div key={s.label} style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.08)', borderRadius: '14px', padding: '20px' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '4px' }}>{s.label}</p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>{s.val}</p>
                </div>
              ))}
            </div>
            <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#fff' }}>Recent Customers</h3>
                <Link href="/admin/customers" style={{ color: '#f5c842', fontSize: '0.875rem', textDecoration: 'none' }}>View all →</Link>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Name', 'Email', 'Orders', 'Spent', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 24px', color: '#6b7280', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 8).map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 24px' }}>
                        <Link href={`/admin/customers/${c._id}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>{c.name}</Link>
                      </td>
                      <td style={{ padding: '12px 24px', color: '#6b7280' }}>{c.email}</td>
                      <td style={{ padding: '12px 24px', color: '#fff' }}>{c.total_orders || 0}</td>
                      <td style={{ padding: '12px 24px', color: '#f5c842', fontWeight: 700 }}>₹{(c.total_spent || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 24px' }}>
                        <span style={{ background: c.is_blocked ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: c.is_blocked ? '#ef4444' : '#10b981', padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>
                          {c.is_blocked ? '🚫 Blocked' : '✓ Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {productModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#0e0e18', borderBottom: '1px solid rgba(245,200,66,0.15)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>{editProduct ? 'Edit Product' : 'Add Product'}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {modalError && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{modalError}</span>}
              <button onClick={saveProduct} disabled={saving} style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: 'pointer', padding: '8px 20px', borderRadius: '8px', fontSize: '0.875rem', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : '💾 Save'}
              </button>
              <button onClick={() => setProductModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
          </div>
          <div className="admin-modal-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Left */}
            <div className="admin-modal-left" style={{ width: '25%', minWidth: '260px', background: '#0e0e18', borderRight: '1px solid rgba(245,200,66,0.1)', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f5c842', display: 'block', marginBottom: '8px' }}>📦 Product Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} placeholder="Product name" />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f5c842', display: 'block', marginBottom: '8px' }}>📂 Category *</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="Uncategorized">Uncategorized</option>
                  <option value="AI Tools">AI Tools</option>
                  <option value="Courses">Courses</option>
                  <option value="Templates">Templates</option>
                  <option value="E-books">E-books</option>
                  <option value="Presets">Presets</option>
                  <option value="Software">Software</option>
                  <option value="Graphics">Graphics</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f5c842', display: 'block', marginBottom: '8px' }}>🖼️ Images (Max 10)</label>
                <div onClick={() => document.getElementById('img-upload').click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  style={{ border: '2px dashed rgba(245,200,66,0.2)', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>📁</div>
                  <p style={{ color: '#f5c842', fontSize: '0.8rem', fontWeight: 600 }}>Click or Drag & Drop</p>
                  <p style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '4px' }}>JPG, PNG, WEBP</p>
                </div>
                <input id="img-upload" type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
                {(images.length > 0 || newFiles.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginTop: '10px' }}>
                    {images.map((src, i) => (
                      <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', height: '70px' }}>
                        <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        <button onClick={() => setImages(images.filter((_, j) => j !== i))} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239,68,68,0.9)', border: 'none', color: '#fff', width: '18px', height: '18px', borderRadius: '50%', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                      </div>
                    ))}
                    {newFiles.map((file, i) => (
                      <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', height: '70px', border: '1px dashed rgba(245,200,66,0.4)' }}>
                        <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        <div style={{ position: 'absolute', top: '2px', left: '2px', background: '#f5c842', color: '#000', fontSize: '8px', fontWeight: 700, padding: '1px 4px', borderRadius: '4px' }}>NEW</div>
                        <button onClick={() => setNewFiles(newFiles.filter((_, j) => j !== i))} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239,68,68,0.9)', border: 'none', color: '#fff', width: '18px', height: '18px', borderRadius: '50%', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f5c842', display: 'block', marginBottom: '8px' }}>💰 Pricing</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Original Price (₹) *</label>
                    <input type="number" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} style={inp} placeholder="8497" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Sale Price (₹) *</label>
                    <input type="number" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} style={inp} placeholder="1999" />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f5c842', display: 'block', marginBottom: '8px' }}>⬇️ Download File URL *</label>
                <input value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} style={inp} placeholder="https://drive.google.com/..." />
              </div>
            </div>
            {/* Right — Rich Editor */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ background: '#12121a', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                {[['bold','B',{fontWeight:800}],['italic','I',{fontStyle:'italic'}],['underline','U',{textDecoration:'underline'}],['strikeThrough','S',{textDecoration:'line-through'}]].map(([cmd,label,style]) => (
                  <button key={cmd} onClick={() => fmt(cmd)} style={{ ...toolbarBtn, ...style }}>{label}</button>
                ))}
                <div style={{ width:'1px', height:'24px', background:'rgba(255,255,255,0.1)', margin:'0 4px' }}></div>
                <button onClick={() => fmt('insertUnorderedList')} style={toolbarBtn}>• List</button>
                <button onClick={() => fmt('insertOrderedList')} style={toolbarBtn}>1. List</button>
                <select onChange={e => { fmt('fontSize', e.target.value); e.target.value=''; }} style={{ ...toolbarBtn, padding:'5px 8px' }}>
                  <option value="">Size</option>
                  {[['1','Small'],['3','Normal'],['5','Large'],['7','Huge']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select onChange={e => { fmt('foreColor', e.target.value); e.target.value=''; }} style={{ ...toolbarBtn, padding:'5px 8px' }}>
                  <option value="">Color</option>
                  {[['#f5c842','Gold'],['#ffffff','White'],['#10b981','Green'],['#ef4444','Red'],['#3b82f6','Blue']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select onChange={e => { fmt('formatBlock', e.target.value); e.target.value=''; }} style={{ ...toolbarBtn, padding:'5px 8px' }}>
                  <option value="">Heading</option>
                  {[['h1','H1'],['h2','H2'],['h3','H3'],['p','Normal']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <button onClick={() => fmt('removeFormat')} style={{ ...toolbarBtn, color:'#ef4444' }}>✕ Clear</button>
              </div>
              <div ref={descRef} contentEditable suppressContentEditableWarning style={{ flex:1, padding:'28px 36px', fontSize:'15px', lineHeight:'1.8', color:'#e8e8f0', outline:'none', overflowY:'auto', background:'#0a0a0f' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
