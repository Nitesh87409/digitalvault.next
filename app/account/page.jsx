'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Download, ShoppingBag, Shield, LogOut, Edit2, CheckCircle, Home, ShoppingCart, CheckCircle2, Lock } from 'lucide-react';

export default function AccountPage() {
  const [customer, setCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({ name: '', phone: '' });
  const [passForm, setPassForm] = useState({ current: '', newp: '', conf: '' });
  const [downloads, setDownloads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profileMsg, setProfileMsg] = useState(null);
  const [passMsg, setPassMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const c = localStorage.getItem('dv_customer');
    if (!c) { router.push('/login?redirect=/account'); return; }
    const parsed = JSON.parse(c);
    setCustomer(parsed);
    setForm({ name: parsed.name || '', phone: parsed.phone || '' });

    const loadCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
      setCartCount(cart.reduce((s, i) => s + i.qty, 0));
    };
    loadCartCount();
    window.addEventListener('cart-updated', loadCartCount);
    window.addEventListener('storage', loadCartCount);
    return () => {
      window.removeEventListener('cart-updated', loadCartCount);
      window.removeEventListener('storage', loadCartCount);
    };
  }, []);

  useEffect(() => {
    if (customer && activeTab === 'downloads') loadDownloads();
    if (customer && activeTab === 'orders') loadOrders();
  }, [activeTab, customer]);

  async function loadDownloads() {
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'my-orders', email: customer.email })
      });
      const data = await res.json();
      setDownloads(data.orders || []);
    } catch(e) {}
  }

  async function loadOrders() {
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'my-orders', email: customer.email })
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch(e) {}
  }

  async function saveProfile() {
    if (!form.name) { setProfileMsg({ msg: 'Name is required.', ok: false }); return; }
    if (form.phone && !/^\d{10}$/.test(form.phone)) { setProfileMsg({ msg: 'Enter valid 10-digit phone.', ok: false }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/customer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', name: form.name, phone: form.phone })
      });
      const data = await res.json();
      if (data.flag) {
        const updated = { ...customer, name: form.name, phone: form.phone };
        localStorage.setItem('dv_customer', JSON.stringify(updated));
        setCustomer(updated);
        setProfileMsg({ msg: '✅ Profile updated!', ok: true });
      } else {
        setProfileMsg({ msg: data.message, ok: false });
      }
    } catch(e) { setProfileMsg({ msg: 'Error. Try again.', ok: false }); }
    setLoading(false);
    setTimeout(() => setProfileMsg(null), 3000);
  }

  async function changePassword() {
    if (!passForm.current || !passForm.newp || !passForm.conf) { setPassMsg({ msg: 'Fill all fields.', ok: false }); return; }
    if (passForm.newp.length < 6) { setPassMsg({ msg: 'Min 6 characters.', ok: false }); return; }
    if (passForm.newp !== passForm.conf) { setPassMsg({ msg: 'Passwords do not match.', ok: false }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/customer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change-password', current_password: passForm.current, new_password: passForm.newp })
      });
      const data = await res.json();
      if (data.flag) {
        setPassMsg({ msg: '✅ Password changed!', ok: true });
        setPassForm({ current: '', newp: '', conf: '' });
      } else {
        setPassMsg({ msg: data.message, ok: false });
      }
    } catch(e) { setPassMsg({ msg: 'Error. Try again.', ok: false }); }
    setLoading(false);
    setTimeout(() => setPassMsg(null), 3000);
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST', body: JSON.stringify({ role: 'customer' }) });
    localStorage.removeItem('dv_customer');
    router.push('/login');
  }

  if (!customer) return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #f5c842', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
    </div>
  );

  const initials = customer.name?.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  const tabs = [
    { id: 'profile', icon: '👤', label: 'My Profile' },
    { id: 'downloads', icon: '⬇️', label: 'My Downloads' },
    { id: 'orders', icon: '🛒', label: 'Order History' },
    { id: 'password', icon: '🔐', label: 'Change Password' },
  ];

  return (
    <div className="account-page-wrapper">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      
      {/* ----------------- DESKTOP LAYOUT (Unchanged, hidden on mobile) ----------------- */}
      <div className="hidden md:block">
        <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0f', minHeight: '100vh', color: '#e8e8f0' }}>
          {/* Nav */}
          <nav style={{ background: 'rgba(10,10,15,0.95)', borderBottom: '1px solid rgba(245,200,66,0.1)', backdropFilter: 'blur(20px)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link href="/" style={{ fontFamily: 'Syne,sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#f5c842', textDecoration: 'none' }}>DigitalVault</Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Link href="/" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>← Store</Link>
                <Link href="/cart" style={{ color: '#9ca3af' }}>
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                </Link>
                <button onClick={logout} style={{ fontSize: '0.8rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Logout</button>
              </div>
            </div>
          </nav>

          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
            {/* Profile Header */}
            <div className="p-5 sm:p-6 mb-6" style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#f5c842,#e0a800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#0a0a0f', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.name}</h1>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '2px', wordBreak: 'break-all' }}>{customer.email}</p>
              </div>
            </div>

            {/* Layout */}
            <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] gap-5 items-start">
              {/* Sidebar */}
              <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '16px', padding: '12px' }}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                      borderRadius: '12px', cursor: 'pointer', width: '100%', textAlign: 'left',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', border: 'none',
                      background: activeTab === tab.id ? 'rgba(245,200,66,0.1)' : 'none',
                      color: activeTab === tab.id ? '#f5c842' : '#6b7280',
                      borderColor: activeTab === tab.id ? 'rgba(245,200,66,0.2)' : 'transparent',
                      marginBottom: '4px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '8px 0' }}></div>
                <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', border: 'none', background: 'none', color: '#ef4444' }}>
                  <span>🚪</span> Logout
                </button>
              </div>

              {/* Content */}
              <div className="p-5 sm:p-7" style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '16px' }}>

                {/* PROFILE */}
                {activeTab === 'profile' && (
                  <div>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>My Profile</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
                      {[
                        { label: 'Full Name', key: 'name', type: 'text' },
                        { label: 'Email (cannot change)', key: 'email', type: 'email', disabled: true, value: customer.email },
                        { label: 'Phone Number', key: 'phone', type: 'tel' },
                      ].map(f => (
                        <div key={f.key}>
                          <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>{f.label}</label>
                          <input
                            type={f.type}
                            value={f.disabled ? f.value : form[f.key]}
                            onChange={f.disabled ? undefined : e => setForm({ ...form, [f.key]: e.target.value })}
                            disabled={f.disabled}
                            style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: f.disabled ? '#6b7280' : '#fff', outline: 'none', width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', opacity: f.disabled ? 0.5 : 1, cursor: f.disabled ? 'not-allowed' : 'text', fontFamily: 'DM Sans, sans-serif' }}
                          />
                        </div>
                      ))}
                      {profileMsg && <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '0.8rem', background: profileMsg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: profileMsg.ok ? '#10b981' : '#ef4444', border: `1px solid ${profileMsg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>{profileMsg.msg}</div>}
                      <button onClick={saveProfile} disabled={loading} className="w-full sm:w-auto" style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne,sans-serif', fontWeight: 700, border: 'none', cursor: 'pointer', padding: '12px 24px', borderRadius: '12px', fontSize: '0.9rem' }}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}

                {/* DOWNLOADS */}
                {activeTab === 'downloads' && (
                  <div>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>My Downloads</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '20px' }}>All purchased products — download anytime</p>
                    {downloads.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div>
                        <h3 style={{ color: '#fff', marginBottom: '8px', fontFamily: 'Syne,sans-serif' }}>No purchases yet</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '20px' }}>Browse our products and make your first purchase!</p>
                        <Link href="/" style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', padding: '10px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontFamily: 'Syne,sans-serif' }}>Browse Products →</Link>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {downloads.map((order, i) => {
                          const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                          const productName = order.product_id?.name || 'Digital Product';
                          const productId = order.product_id?._id || order.product_id;
                          const dlUrl = productId ? `/api/download?token=${order.download_token}&pid=${productId}` : `/download?token=${order.download_token}`;
                          return (
                            <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ background: '#0e0e18', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '18px' }}>
                              <div className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
                                <div style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', background: '#1a1a2a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                  {order.product_id?.images?.[0] ? <img src={order.product_id.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '📦'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{productName}</h3>
                                  <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>{date} · ₹{order.amount?.toLocaleString()}</p>
                                </div>
                              </div>
                              <a href={dlUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto justify-center" style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontWeight: 700, fontFamily: 'Syne,sans-serif', textDecoration: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                ⬇️ Download
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ORDERS */}
                {activeTab === 'orders' && (
                  <div>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>Order History</h2>
                    {orders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛒</div>
                        <p style={{ color: '#6b7280' }}>No orders yet.</p>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              {['#', 'Product', 'Date', 'Amount', 'Status'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6b7280', fontWeight: 500 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((order, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '12px', color: '#4b5563' }}>{i + 1}</td>
                                <td style={{ padding: '12px', color: '#e8e8f0', fontWeight: 500 }}>{order.product_id?.name || 'Digital Product'}</td>
                                <td style={{ padding: '12px', color: '#6b7280' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td style={{ padding: '12px', color: '#f5c842', fontWeight: 700 }}>₹{order.amount?.toLocaleString()}</td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{ background: order.payment_status === 1 ? 'rgba(16,185,129,0.15)' : 'rgba(245,200,66,0.15)', color: order.payment_status === 1 ? '#10b981' : '#f5c842', padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>
                                    {order.payment_status === 1 ? '✓ Paid' : '⏳ Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* PASSWORD */}
                {activeTab === 'password' && (
                  <div>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>Change Password</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
                      {[
                        { label: 'Current Password', key: 'current' },
                        { label: 'New Password', key: 'newp' },
                        { label: 'Confirm New Password', key: 'conf' },
                      ].map(f => (
                        <div key={f.key}>
                          <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>{f.label}</label>
                          <input
                            type="password"
                            value={passForm[f.key]}
                            onChange={e => setPassForm({ ...passForm, [f.key]: e.target.value })}
                            placeholder="••••••••"
                            style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' }}
                          />
                        </div>
                      ))}
                      {passMsg && <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '0.8rem', background: passMsg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: passMsg.ok ? '#10b981' : '#ef4444', border: `1px solid ${passMsg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>{passMsg.msg}</div>}
                      <button onClick={changePassword} disabled={loading} className="w-full sm:w-auto" style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne,sans-serif', fontWeight: 700, border: 'none', cursor: 'pointer', padding: '12px 24px', borderRadius: '12px', fontSize: '0.9rem' }}>
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- MOBILE LAYOUT (Hidden on desktop) ----------------- */}
      <div className="block md:hidden bg-gradient-to-b from-[#0a0a0f] to-[#04040a] min-h-screen font-sans pb-28 text-white relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#f5c842]/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Top Branding Section */}
        <div className="px-5 pt-8 pb-5 relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-[#f5c842] font-['Syne'] font-bold text-lg tracking-wide mb-5">
            DigitalVault
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl font-['Syne'] font-bold text-white mb-2">
            My Account
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-gray-400 text-[13px]">
            Manage your account and preferences
          </motion.p>
        </div>

        {/* Profile Hero Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mx-4 mb-6 relative rounded-[24px] p-[1px] overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f5c842]/30 via-transparent to-purple-500/30 opacity-60"></div>
          <div className="relative bg-[#0d0d14]/90 backdrop-blur-xl rounded-[24px] p-5 shadow-2xl z-10 flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#f5c842] to-[#d69b00] flex items-center justify-center text-[#0a0a0f] font-['Syne'] font-bold text-xl shadow-[0_0_20px_rgba(245,200,66,0.3)]">
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-['Syne'] font-bold text-white leading-tight">{customer.name}</h2>
                <p className="text-[11px] text-gray-400 mt-1">{customer.email}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setActiveTab('profile')} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={logout} className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Horizontal Tab Navigation */}
        <div className="px-4 mb-6 relative z-10">
          <div className="flex justify-between bg-[#12121a]/80 backdrop-blur-md rounded-2xl p-1.5 border border-white/5 shadow-lg">
            {[
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'downloads', icon: Download, label: 'Downloads' },
              { id: 'orders', icon: ShoppingBag, label: 'Orders' },
              { id: 'password', icon: Shield, label: 'Security' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="relative flex flex-col items-center flex-1 py-3 transition-colors">
                <tab.icon size={18} className={`mb-1.5 ${activeTab === tab.id ? 'text-[#f5c842]' : 'text-gray-500'}`} />
                <span className={`text-[10px] font-medium ${activeTab === tab.id ? 'text-[#f5c842]' : 'text-gray-500'}`}>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div layoutId="mobile-tab-indicator" className="absolute bottom-0 w-8 h-[2px] bg-[#f5c842] rounded-full shadow-[0_0_8px_#f5c842]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="px-4 relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {/* Profile Form Card */}
                <div className="bg-[#12121a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 mb-5 shadow-lg">
                  <h3 className="text-base font-['Syne'] font-bold text-white mb-1">My Profile</h3>
                  <p className="text-[11px] text-gray-400 mb-6">Update your personal information</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] text-gray-400 font-medium ml-1 mb-1.5 block">Full Name</label>
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[#0a0a0f]/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#f5c842]/50 focus:shadow-[inset_0_0_20px_rgba(245,200,66,0.05)] transition-all" />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 font-medium ml-1 mb-1.5 block">Email Address</label>
                      <input type="email" disabled value={customer.email} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-sm text-gray-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 font-medium ml-1 mb-1.5 block">Phone Number</label>
                      <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-[#0a0a0f]/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#f5c842]/50 focus:shadow-[inset_0_0_20px_rgba(245,200,66,0.05)] transition-all" />
                    </div>
                    
                    {profileMsg && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${profileMsg.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {profileMsg.ok && <CheckCircle2 size={14} />} {profileMsg.msg}
                      </div>
                    )}
                    
                    <button onClick={saveProfile} disabled={loading} className="w-full mt-2 bg-gradient-to-r from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne'] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_5px_20px_rgba(245,200,66,0.3)] hover:shadow-[0_5px_25px_rgba(245,200,66,0.5)] transition-shadow">
                      <CheckCircle size={18} />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

                {/* Account Info Card */}
                <div className="bg-[#12121a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-lg">
                  <h3 className="text-base font-['Syne'] font-bold text-white mb-4">Account Information</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><User size={16} /></div>
                        <span className="text-sm text-gray-300">Member Since</span>
                      </div>
                      <span className="text-sm font-medium text-white">12 May 2024</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><Shield size={16} /></div>
                        <span className="text-sm text-gray-300">Account Status</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)] border border-emerald-500/20">Active</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'downloads' && (
              <motion.div key="downloads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                 {downloads.length === 0 ? (
                   <div className="text-center py-12 bg-[#12121a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] shadow-lg">
                      <div className="text-4xl mb-4">📦</div>
                      <h3 className="text-base font-['Syne'] font-bold text-white">No purchases yet</h3>
                      <p className="text-[11px] text-gray-400 mt-2 px-6">Browse our products and make your first purchase!</p>
                      <Link href="/" className="inline-block mt-6 bg-[#f5c842]/10 text-[#f5c842] border border-[#f5c842]/20 font-['Syne'] font-bold py-2.5 px-6 rounded-xl text-xs">Browse Products</Link>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {downloads.map((order, i) => {
                       const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                       const productName = order.product_id?.name || 'Digital Product';
                       const productId = order.product_id?._id || order.product_id;
                       const dlUrl = productId ? `/api/download?token=${order.download_token}&pid=${productId}` : `/download?token=${order.download_token}`;
                       return (
                         <div key={i} className="bg-[#12121a]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-[52px] h-[52px] rounded-[14px] overflow-hidden bg-black/50 border border-white/5 flex-shrink-0 flex items-center justify-center text-xl">
                                 {order.product_id?.images?.[0] ? <img src={order.product_id.images[0]} className="w-full h-full object-cover" alt="" /> : '📦'}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[13px] font-bold text-white truncate">{productName}</h4>
                                <p className="text-[11px] text-gray-400 mt-0.5">{date} • <span className="text-[#f5c842]">₹{order.amount?.toLocaleString()}</span></p>
                              </div>
                            </div>
                            <a href={dlUrl} target="_blank" rel="noopener noreferrer" className="bg-[#f5c842]/15 hover:bg-[#f5c842]/25 text-[#f5c842] p-3 rounded-xl transition-colors flex-shrink-0 ml-2 shadow-[0_0_10px_rgba(245,200,66,0.1)]">
                              <Download size={16} />
                            </a>
                         </div>
                       )
                     })}
                   </div>
                 )}
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {orders.length === 0 ? (
                   <div className="text-center py-12 bg-[#12121a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] shadow-lg">
                      <div className="text-4xl mb-4">🛍️</div>
                      <h3 className="text-base font-['Syne'] font-bold text-white">No orders yet</h3>
                      <Link href="/" className="inline-block mt-6 bg-white/5 text-white border border-white/10 font-['Syne'] font-bold py-2.5 px-6 rounded-xl text-xs">Shop Now</Link>
                   </div>
                ) : (
                  <div className="space-y-3">
                     {orders.map((order, i) => (
                        <div key={i} className="bg-[#12121a]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-lg">
                           <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-3">
                             <div className="pr-2">
                               <h4 className="text-[13px] font-bold text-white leading-tight">{order.product_id?.name || 'Digital Product'}</h4>
                               <p className="text-[11px] text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                             </div>
                             <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0 border ${order.payment_status === 1 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#f5c842]/10 text-[#f5c842] border-[#f5c842]/20'}`}>
                               {order.payment_status === 1 ? 'Paid' : 'Pending'}
                             </span>
                           </div>
                           <div className="flex justify-between items-center pt-1">
                             <span className="text-[11px] text-gray-400">Total Amount</span>
                             <span className="text-sm font-bold text-[#f5c842]">₹{order.amount?.toLocaleString()}</span>
                           </div>
                        </div>
                     ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="bg-[#12121a]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-lg">
                  <h3 className="text-base font-['Syne'] font-bold text-white mb-1">Security Settings</h3>
                  <p className="text-[11px] text-gray-400 mb-6">Update your password to keep your account secure</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] text-gray-400 font-medium ml-1 mb-1.5 block">Current Password</label>
                      <input type="password" value={passForm.current} onChange={e => setPassForm({...passForm, current: e.target.value})} placeholder="••••••••" className="w-full bg-[#0a0a0f]/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#f5c842]/50 focus:shadow-[inset_0_0_20px_rgba(245,200,66,0.05)] transition-all" />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 font-medium ml-1 mb-1.5 block">New Password</label>
                      <input type="password" value={passForm.newp} onChange={e => setPassForm({...passForm, newp: e.target.value})} placeholder="••••••••" className="w-full bg-[#0a0a0f]/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#f5c842]/50 focus:shadow-[inset_0_0_20px_rgba(245,200,66,0.05)] transition-all" />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 font-medium ml-1 mb-1.5 block">Confirm Password</label>
                      <input type="password" value={passForm.conf} onChange={e => setPassForm({...passForm, conf: e.target.value})} placeholder="••••••••" className="w-full bg-[#0a0a0f]/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#f5c842]/50 focus:shadow-[inset_0_0_20px_rgba(245,200,66,0.05)] transition-all" />
                    </div>
                    
                    {passMsg && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${passMsg.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {passMsg.ok && <CheckCircle2 size={14} />} {passMsg.msg}
                      </div>
                    )}
                    
                    <button onClick={changePassword} disabled={loading} className="w-full mt-2 bg-white text-[#0a0a0f] font-['Syne'] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(255,255,255,0.1)] hover:shadow-[0_5px_25px_rgba(255,255,255,0.2)] transition-shadow">
                      <Lock size={18} />
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
