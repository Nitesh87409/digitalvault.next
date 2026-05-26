'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Download, ShoppingBag, Shield, LogOut, Edit2, CheckCircle, Home, ShoppingCart, CheckCircle2, Lock } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useSettings } from '@/hooks/useSettings';
import { optimizeCloudinary } from '@/lib/cloudinary-image';

export default function AccountPage() {
  const [customer, setCustomer] = useState(null);
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({ name: '', phone: '' });
  const [passForm, setPassForm] = useState({ current: '', newp: '', conf: '' });
  const [downloads, setDownloads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profileMsg, setProfileMsg] = useState(null);
  const [passMsg, setPassMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [reviewFormOpen, setReviewFormOpen] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const c = localStorage.getItem('dv_customer');
    if (!c) { router.push('/login?redirect=/account'); return; }
    const parsed = JSON.parse(c);
    setCustomer(parsed);
    setForm({ name: parsed.name || '', phone: parsed.phone || '' });
    setPassTab(parsed.has_password ? 'update' : 'reset');

    // Fetch up-to-date customer data (like registration date and active status) from database
    fetch('/api/customer')
      .then(res => res.json())
      .then(data => {
        if (data.flag && data.customer) {
          localStorage.setItem('dv_customer', JSON.stringify(data.customer));
          setCustomer(data.customer);
          setForm({ name: data.customer.name || '', phone: data.customer.phone || '' });
        }
      })
      .catch(console.error);

    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);

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

  function toggleReviewForm(productId) {
    setReviewFormOpen(reviewFormOpen === productId ? null : productId);
    setReviewRating(5);
    setReviewText('');
    setReviewMsg(null);
  }

  async function submitReview(productId) {
    if (!productId || reviewSubmitting) return;
    setReviewSubmitting(true);
    setReviewMsg(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          rating: reviewRating,
          review_text: reviewText,
        }),
      });
      const data = await res.json();
      if (data.flag) {
        setReviewMsg({ ok: true, msg: 'Review submitted successfully.' });
        setReviewText('');
      } else {
        setReviewMsg({ ok: false, msg: data.message || 'Error submitting review.' });
      }
    } catch(e) {
      setReviewMsg({ ok: false, msg: 'Server error. Try again.' });
    }
    setReviewSubmitting(false);
  }

  function renderReviewForm(productId, productName) {
    return (
      <div className="border-t border-[var(--line-soft)] mt-[14px] pt-[14px] w-full">
        <h4 className="font-['Syne',sans-serif] text-[var(--heading)] font-bold text-[0.9rem] mb-3">Review {productName}</h4>
        {reviewMsg && (
          <div className={`px-3 py-2.5 rounded-lg mb-3 text-[0.8rem] ${reviewMsg.ok ? 'bg-emerald-500/10 text-[#10b981]' : 'bg-red-500/10 text-[#ef4444]'}`}>
            {reviewMsg.msg}
          </div>
        )}
        <div className="mb-3">
          <label className="block text-[var(--muted-2)] text-[0.7rem] font-bold uppercase mb-1.5">Rating</label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} type="button" onClick={() => setReviewRating(star)} className={`bg-none border-none cursor-pointer text-[1.4rem] p-0 ${star <= reviewRating ? 'text-[#f5c842]' : 'text-[#6b7280]'}`}>
                &#9733;
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={reviewText}
          onChange={e => setReviewText(e.target.value)}
          maxLength={1000}
          placeholder="What did you like or dislike?"
          className="w-full min-h-[82px] resize-y bg-[var(--surface-2)] border border-[var(--line)] text-[var(--heading)] outline-none rounded-[10px] px-3 py-2.5 text-[0.85rem] font-sans mb-3"
        />
        <button onClick={() => submitReview(productId)} disabled={reviewSubmitting} className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-bold font-['Syne',sans-serif] border-none px-4 py-2 rounded-lg text-[0.85rem] ${reviewSubmitting ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:opacity-90 transition-opacity'}`}>
          {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    );
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

  const [passTab, setPassTab] = useState('update'); // 'update' or 'reset'
  const [otpStep, setOtpStep] = useState(1); // 1: identifier, 2: otp & password
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  async function sendOtp() {
    setPassMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', identifier: customer.email })
      });
      const data = await res.json();
      if (data.flag) {
        setOtpStep(2);
        setPassMsg({ msg: 'OTP sent to your email.', ok: true });
        setTimer(data.cooldown || 60);
      } else {
        setPassMsg({ msg: data.message || 'Failed to send OTP.', ok: false });
      }
    } catch (e) {
      setPassMsg({ msg: 'Connection error.', ok: false });
    }
    setLoading(false);
  }

  async function resetPassword() {
    if (!otpCode) { setPassMsg({ msg: 'Please enter OTP code.', ok: false }); return; }
    if (!passForm.newp) { setPassMsg({ msg: 'Please enter new password.', ok: false }); return; }
    if (passForm.newp.length < 6) { setPassMsg({ msg: 'Password must be at least 6 characters.', ok: false }); return; }
    if (passForm.newp !== passForm.conf) { setPassMsg({ msg: 'Passwords do not match.', ok: false }); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reset', 
          identifier: customer.email, 
          otp: otpCode, 
          new_password: passForm.newp 
        })
      });
      const data = await res.json();
      if (data.flag) {
        setPassMsg({ msg: '✅ Password ' + (customer.has_password ? 'reset' : 'set') + ' successfully!', ok: true });
        const updated = { ...customer, has_password: true };
        localStorage.setItem('dv_customer', JSON.stringify(updated));
        setCustomer(updated);
        setOtpStep(1);
        setPassTab('update');
        setPassForm({ current: '', newp: '', conf: '' });
        setOtpCode('');
      } else {
        setPassMsg({ msg: data.message || 'Reset failed.', ok: false });
      }
    } catch (e) {
      setPassMsg({ msg: 'Connection error.', ok: false });
    }
    setLoading(false);
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
    <div className="bg-[var(--bg)] min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-[#f5c842] border-t-transparent rounded-full animate-[spin_0.8s_linear_infinite]"></div>
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
        <div className="font-sans bg-[var(--bg)] min-h-screen text-[var(--text)]">
          {/* Nav */}
          <nav className="bg-[var(--nav-bg)] border-b border-[#f5c842]/10 backdrop-blur-[20px] px-6 py-4 sticky top-0 z-[100]">
            <div className="max-w-[1100px] mx-auto flex items-center justify-between">
              <Link
                href="/"
                className="font-['Syne',sans-serif] text-[1.2rem] font-bold text-[#f5c842] no-underline flex items-center gap-2"
                style={settings.app_name_size ? { fontSize: `${settings.app_name_size}px` } : {}}
              >
                {settings.app_logo ? (
                  <img src={settings.app_logo} alt={settings.app_name} className="h-[28px] w-auto object-contain" loading="eager" />
                ) : null}
                {settings.app_name}
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/" className="text-[0.875rem] text-[var(--muted-2)] no-underline">← Store</Link>
                <ThemeToggle />
                <Link href="/cart" className="text-[var(--muted)]">
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                </Link>
                <button onClick={logout} className="text-[0.8rem] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-3.5 py-1.5 rounded-lg cursor-pointer font-sans">Logout</button>
              </div>
            </div>
          </nav>

          <div className="max-w-[1100px] mx-auto px-5 py-8">
            {/* Profile Header */}
            <div className="p-5 sm:p-6 mb-6 bg-[var(--surface)] border border-[var(--border)] rounded-[16px] flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f5c842] to-[#e0a800] flex items-center justify-center font-['Syne',sans-serif] font-bold text-[1.5rem] text-[#0a0a0f] shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-['Syne',sans-serif] text-[1.4rem] font-bold text-[var(--heading)] truncate">{customer.name}</h1>
                  {customer.is_premium && (
                    <span className="bg-gradient-to-r from-[#f5c842] to-[#e0a800] text-[#0a0a0f] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(245,200,66,0.3)] flex items-center gap-1.5 shrink-0">
                      <span>✨</span> PREMIUM MEMBER
                    </span>
                  )}
                </div>
                <p className="text-[var(--muted-2)] text-[0.875rem] mt-1 break-all">{customer.email}</p>
              </div>
            </div>

            {/* Layout */}
            <div className="flex flex-col md:grid md:grid-cols-[220px_1fr] gap-5 items-start">
              {/* Sidebar */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-3 w-full">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-[12px] cursor-pointer w-full text-left font-sans text-[0.875rem] border mb-1 transition-all duration-200 ${
                      activeTab === tab.id 
                        ? 'bg-[#f5c842]/10 text-[#f5c842] border-[#f5c842]/20' 
                        : 'bg-transparent text-[#6b7280] border-transparent'
                    }`}
                  >
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
                <div className="border-t border-[var(--line-soft)] my-2"></div>
                <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-[12px] cursor-pointer w-full text-left font-sans text-[0.875rem] border-none bg-transparent text-[#ef4444]">
                  <span>🚪</span> Logout
                </button>
              </div>

              {/* Content */}
              <div className="p-5 sm:p-7 bg-[var(--surface)] border border-[var(--border)] rounded-[16px] w-full">

                {/* PROFILE */}
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="font-['Syne',sans-serif] text-[1.1rem] font-bold text-[var(--heading)] mb-5">My Profile</h2>
                    <div className="flex flex-col gap-4 max-w-[480px]">
                      {[
                        { label: 'Full Name', key: 'name', type: 'text' },
                        { label: 'Email (cannot change)', key: 'email', type: 'email', disabled: true, value: customer.email },
                        { label: 'Phone Number', key: 'phone', type: 'tel' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="text-[0.75rem] text-[var(--muted)] block mb-1.5 font-semibold">{f.label}</label>
                          <input
                            type={f.type}
                            value={f.disabled ? f.value : form[f.key]}
                            onChange={f.disabled ? undefined : e => setForm({ ...form, [f.key]: e.target.value })}
                            disabled={f.disabled}
                            className={`bg-[var(--surface-2)] border border-[var(--line)] outline-none w-full px-4 py-3 rounded-[12px] text-[0.875rem] font-sans ${
                              f.disabled 
                                ? 'text-[var(--muted-2)] opacity-50 cursor-not-allowed' 
                                : 'text-[var(--heading)] opacity-100 cursor-text'
                            }`}
                          />
                        </div>
                      ))}
                      {profileMsg && (
                        <div className={`px-3.5 py-2.5 rounded-[10px] text-[0.8rem] border ${
                          profileMsg.ok 
                            ? 'bg-emerald-500/10 text-[#10b981] border-emerald-500/20' 
                            : 'bg-red-500/10 text-[#ef4444] border-red-500/20'
                        }`}>
                          {profileMsg.msg}
                        </div>
                      )}
                      <button onClick={saveProfile} disabled={loading} className="w-full sm:w-auto bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none cursor-pointer px-6 py-3 rounded-[12px] text-[0.9rem]">
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}

                {/* DOWNLOADS */}
                {activeTab === 'downloads' && (
                  <div>
                    <h2 className="font-['Syne',sans-serif] text-[1.1rem] font-bold text-[var(--heading)] mb-1.5">My Downloads</h2>
                    <p className="text-[var(--muted-2)] text-[0.8rem] mb-5">All purchased products — download anytime</p>
                    {downloads.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="text-[3rem] mb-3">📦</div>
                        <h3 className="text-[var(--heading)] mb-2 font-['Syne',sans-serif] font-bold">No purchases yet</h3>
                        <p className="text-[var(--muted-2)] text-[0.875rem] mb-5">Browse our products and make your first purchase!</p>
                        <Link href="/" className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] px-6 py-2.5 rounded-[10px] no-underline font-bold font-['Syne',sans-serif]">Browse Products →</Link>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {downloads.map((order, i) => {
                          const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                          const productName = order.product_id?.name || 'Digital Product';
                          const productId = order.product_id?._id || order.product_id;
                          const dlUrl = productId ? `/api/download?token=${order.download_token}&pid=${productId}` : `/download?token=${order.download_token}`;
                          return (
                            <div key={i} className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 bg-[var(--surface-muted)] border border-[var(--line-soft)] rounded-[14px] p-[18px]">
                              <Link href={`/product/${productId}`} className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0 no-underline text-inherit">
                                <div className="w-16 h-16 rounded-[10px] overflow-hidden bg-[var(--surface-2)] shrink-0 flex items-center justify-center text-[1.5rem]">
                                  {order.product_id?.images?.[0] ? <img src={optimizeCloudinary(order.product_id.images[0], 128)} className="w-full h-full object-cover" loading="lazy" alt="" /> : '📦'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-[var(--heading)] text-[0.95rem] mb-0.5 truncate">{productName}</h3>
                                  <p className="text-[var(--muted-2)] text-[0.75rem]">{date} · ₹{order.amount?.toLocaleString()}</p>
                                </div>
                              </Link>
                              {productId && (
                                <button onClick={() => toggleReviewForm(productId)} className="w-full sm:w-auto justify-center bg-[#f5c842]/10 text-[#f5c842] font-bold font-['Syne',sans-serif] border border-[#f5c842]/20 px-4 py-2.5 rounded-lg text-[0.875rem] flex items-center gap-1.5 shrink-0 cursor-pointer">
                                  {reviewFormOpen === productId ? 'Cancel' : 'Write Review'}
                                </button>
                              )}
                              <a href={dlUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto justify-center bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-bold font-['Syne',sans-serif] no-underline px-4 py-2.5 rounded-lg text-[0.875rem] flex items-center gap-1.5 shrink-0">
                                ⬇️ Download
                              </a>
                              {productId && reviewFormOpen === productId && renderReviewForm(productId, productName)}
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
                    <h2 className="font-['Syne',sans-serif] text-[1.1rem] font-bold text-[var(--heading)] mb-5">Order History</h2>
                    {orders.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="text-[3rem] mb-3">🛒</div>
                        <p className="text-[var(--muted-2)]">No orders yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[0.85rem]">
                          <thead>
                            <tr className="border-b border-[var(--line-soft)]">
                              {['#', 'Product', 'Date', 'Amount', 'Status'].map(h => (
                                <th key={h} className="text-left px-3 py-2.5 text-[var(--muted-2)] font-medium">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((order, i) => (
                              <tr key={i} className="border-b border-[var(--line-soft)]">
                                <td className="p-3 text-[#4b5563]">{i + 1}</td>
                                <td className="p-3 text-[var(--text)] font-medium">{order.product_id?.name || 'Digital Product'}</td>
                                <td className="p-3 text-[var(--muted-2)]">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td className="p-3 text-[#f5c842] font-bold">₹{order.amount?.toLocaleString()}</td>
                                <td className="p-3">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold ${order.payment_status === 1 ? 'bg-emerald-500/15 text-[#10b981]' : 'bg-[#f5c842]/15 text-[#f5c842]'}`}>
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
                    <h2 className="font-['Syne',sans-serif] text-[1.1rem] font-bold text-[var(--heading)] mb-5">Security & Password</h2>
                    
                    <div className="flex gap-2 mb-6 bg-[var(--surface-2)] p-1 rounded-[12px] w-fit">
                      {customer.has_password && (
                        <button
                          onClick={() => setPassTab('update')}
                          className={`px-4 py-2 rounded-lg border text-[0.875rem] font-semibold cursor-pointer transition-all duration-200 ${
                            passTab === 'update' 
                              ? 'bg-[var(--surface)] text-[#f5c842] border-[var(--line)]' 
                              : 'bg-transparent text-[var(--muted)] border-transparent'
                          }`}
                        >
                          Update Password
                        </button>
                      )}
                      <button
                        onClick={() => setPassTab('reset')}
                        className={`px-4 py-2 rounded-lg border text-[0.875rem] font-semibold cursor-pointer transition-all duration-200 ${
                          passTab === 'reset' 
                            ? 'bg-[var(--surface)] text-[#f5c842] border-[var(--line)]' 
                            : 'bg-transparent text-[var(--muted)] border-transparent'
                        }`}
                      >
                        {customer.has_password ? 'Reset with OTP' : 'Set Password'}
                      </button>
                    </div>

                    <div className="flex flex-col gap-4 max-w-[480px]">
                      {passTab === 'update' ? (
                        <>
                          {[
                            { label: 'Current Password', key: 'current' },
                            { label: 'New Password', key: 'newp' },
                            { label: 'Confirm New Password', key: 'conf' },
                          ].map(f => (
                            <div key={f.key}>
                              <label className="text-[0.75rem] text-[var(--muted)] block mb-1.5 font-semibold">{f.label}</label>
                              <input
                                type="password"
                                value={passForm[f.key]}
                                onChange={e => setPassForm({ ...passForm, [f.key]: e.target.value })}
                                placeholder="••••••••"
                                className="bg-[var(--surface-2)] border border-[var(--line)] text-[var(--heading)] outline-none w-full px-4 py-3 rounded-[12px] text-[0.875rem] font-sans"
                              />
                            </div>
                          ))}
                          {passMsg && (
                            <div className={`px-3.5 py-2.5 rounded-[10px] text-[0.8rem] border ${
                              passMsg.ok 
                                ? 'bg-emerald-500/10 text-[#10b981] border-emerald-500/20' 
                                : 'bg-red-500/10 text-[#ef4444] border-red-500/20'
                            }`}>
                              {passMsg.msg}
                            </div>
                          )}
                          <button onClick={changePassword} disabled={loading} className="w-full sm:w-auto bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none cursor-pointer px-6 py-3 rounded-[12px] text-[0.9rem]">
                            {loading ? 'Updating...' : 'Update Password'}
                          </button>
                        </>
                      ) : (
                        <>
                          {otpStep === 1 ? (
                            <div className="text-center p-5 bg-[var(--surface-2)] rounded-[16px] border border-[var(--line)]">
                              <p className="text-[0.875rem] text-[var(--text)] mb-4">We will send an OTP to <strong>{customer.email}</strong> to verify your identity.</p>
                              {passMsg && (
                                <div className={`px-3.5 py-2.5 rounded-[10px] text-[0.8rem] mb-4 border ${
                                  passMsg.ok 
                                    ? 'bg-emerald-500/10 text-[#10b981] border-emerald-500/20' 
                                    : 'bg-red-500/10 text-[#ef4444] border-red-500/20'
                                }`}>
                                  {passMsg.msg}
                                </div>
                              )}
                              <button onClick={sendOtp} disabled={loading} className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none cursor-pointer px-6 py-3 rounded-[12px] text-[0.9rem]">
                                {loading ? 'Sending...' : 'Send OTP Code'}
                              </button>
                            </div>
                          ) : (
                            <>
                              <div>
                                <label className="text-[0.75rem] text-[var(--muted)] block mb-1.5 font-semibold">Enter OTP Code</label>
                                <input
                                  type="text"
                                  maxLength={settings.otp_length}
                                  value={otpCode}
                                  onChange={e => setOtpCode(e.target.value)}
                                  placeholder={"0".repeat(settings.otp_length)}
                                  className="bg-[var(--surface-2)] border border-[var(--line)] text-[var(--heading)] outline-none w-full px-4 py-3 rounded-[12px] text-[1.25rem] tracking-[4px] text-center"
                                />
                              </div>
                              <div>
                                <label className="text-[0.75rem] text-[var(--muted)] block mb-1.5 font-semibold">New Password</label>
                                <input
                                  type="password"
                                  value={passForm.newp}
                                  onChange={e => setPassForm({ ...passForm, newp: e.target.value })}
                                  placeholder="••••••••"
                                  className="bg-[var(--surface-2)] border border-[var(--line)] text-[var(--heading)] outline-none w-full px-4 py-3 rounded-[12px] text-[0.875rem]"
                                />
                              </div>
                              <div>
                                <label className="text-[0.75rem] text-[var(--muted)] block mb-1.5 font-semibold">Confirm New Password</label>
                                <input
                                  type="password"
                                  value={passForm.conf}
                                  onChange={e => setPassForm({ ...passForm, conf: e.target.value })}
                                  placeholder="••••••••"
                                  className="bg-[var(--surface-2)] border border-[var(--line)] text-[var(--heading)] outline-none w-full px-4 py-3 rounded-[12px] text-[0.875rem]"
                                />
                              </div>
                              {passMsg && (
                                <div className={`px-3.5 py-2.5 rounded-[10px] text-[0.8rem] border ${
                                  passMsg.ok 
                                    ? 'bg-emerald-500/10 text-[#10b981] border-emerald-500/20' 
                                    : 'bg-red-500/10 text-[#ef4444] border-red-500/20'
                                }`}>
                                  {passMsg.msg}
                                </div>
                              )}
                              <button onClick={resetPassword} disabled={loading} className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none cursor-pointer px-6 py-3 rounded-[12px] text-[0.9rem]">
                                {loading ? 'Resetting...' : (customer.has_password ? 'Reset Password' : 'Set Password')}
                              </button>
                              <div className="flex justify-between mt-2">
                                <button onClick={() => setOtpStep(1)} className="bg-none border-none text-[var(--muted)] cursor-pointer text-[0.8rem]">← Back</button>
                                <button onClick={sendOtp} disabled={timer > 0 || loading} className={`bg-none border-none cursor-pointer text-[0.8rem] ${timer > 0 ? 'text-[var(--muted-2)] cursor-not-allowed' : 'text-[#f5c842]'}`}>
                                  {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                                </button>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- MOBILE LAYOUT (Hidden on desktop) ----------------- */}
      <div className="theme-page relative block overflow-hidden pb-28 font-sans md:hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#f5c842]/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Top Branding Section */}
        <div className="px-5 pt-6 pb-4 relative z-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#f5c842] font-['Syne'] font-bold text-lg tracking-wide flex items-center gap-2"
              style={settings.app_name_size ? { fontSize: `${settings.app_name_size}px` } : {}}
            >
              {settings.app_logo ? (
                <img src={settings.app_logo} alt={settings.app_name} className="h-6 w-auto object-contain" loading="eager" />
              ) : null}
              {settings.app_name}
            </motion.div>
            <ThemeToggle />
          </div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl font-['Syne'] font-bold text-[var(--heading)] mb-1">
            My Account
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-[var(--muted)] text-[12px]">
            Manage your account and preferences
          </motion.p>
        </div>

        {/* Profile Hero Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mx-4 mb-6 relative rounded-[24px] p-[1px] overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f5c842]/30 via-transparent to-purple-500/30 opacity-60"></div>
          <div className="theme-card relative z-10 flex items-start justify-between rounded-[24px] p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#f5c842] to-[#d69b00] flex items-center justify-center text-[#0a0a0f] font-['Syne'] font-bold text-xl shadow-[0_0_20px_rgba(245,200,66,0.3)]">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-['Syne'] font-bold text-[var(--heading)] leading-tight">{customer.name}</h2>
                  {customer.is_premium && (
                    <span className="bg-[#f5c842]/10 border border-[#f5c842]/30 text-[#f5c842] text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 flex items-center gap-0.5 shadow-[0_0_10px_rgba(245,200,66,0.15)]">
                      <span>★</span> PRO
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-1">{customer.email}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setActiveTab('profile')} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[var(--text)] transition-colors">
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
          <div className="flex justify-between bg-[var(--surface)] backdrop-blur-md rounded-2xl p-1.5 border border-[var(--line)] shadow-lg">
            {[
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'downloads', icon: Download, label: 'Downloads' },
              { id: 'orders', icon: ShoppingBag, label: 'Orders' },
              { id: 'password', icon: Shield, label: 'Security' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="relative flex flex-col items-center flex-1 py-3 transition-colors">
                <tab.icon size={18} className={`mb-1.5 ${activeTab === tab.id ? 'text-[#f5c842]' : 'text-[var(--muted-2)]'}`} />
                <span className={`text-[10px] font-medium ${activeTab === tab.id ? 'text-[#f5c842]' : 'text-[var(--muted-2)]'}`}>{tab.label}</span>
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
                <div className="bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)] rounded-[24px] p-6 mb-5 shadow-lg">
                  <h3 className="text-base font-['Syne'] font-bold text-[var(--heading)] mb-1">My Profile</h3>
                  <p className="text-[11px] text-[var(--muted)] mb-6">Update your personal information</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] text-[var(--muted)] font-medium ml-1 mb-1.5 block">Full Name</label>
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-4 py-3.5 text-sm text-[var(--heading)] focus:outline-none focus:border-[#f5c842]/50 focus:shadow-[inset_0_0_20px_rgba(245,200,66,0.05)] transition-all" />
                    </div>
                    <div>
                      <label className="text-[11px] text-[var(--muted)] font-medium ml-1 mb-1.5 block">Email Address</label>
                      <input type="email" disabled value={customer.email} className="w-full bg-[var(--surface-muted)] border border-[var(--line-soft)] rounded-xl px-4 py-3.5 text-sm text-[var(--muted-2)] cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-[11px] text-[var(--muted)] font-medium ml-1 mb-1.5 block">Phone Number</label>
                      <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-4 py-3.5 text-sm text-[var(--heading)] focus:outline-none focus:border-[#f5c842]/50 focus:shadow-[inset_0_0_20px_rgba(245,200,66,0.05)] transition-all" />
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
                <div className="bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)] rounded-[24px] p-6 shadow-lg">
                  <h3 className="text-base font-['Syne'] font-bold text-[var(--heading)] mb-4">Account Information</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><User size={16} /></div>
                        <span className="text-sm text-[var(--text)]">Member Since</span>
                      </div>
                      <span className="text-sm font-medium text-[var(--heading)]">
                        {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active Member'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><Shield size={16} /></div>
                        <span className="text-sm text-[var(--text)]">Account Status</span>
                      </div>
                      {customer?.is_blocked ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.2)] border border-rose-500/20">Blocked</span>
                      ) : customer?.is_premium ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#f5c842] to-[#e0a800] text-[#0a0a0f] px-3 py-1 rounded-full shadow-[0_0_10px_rgba(245,200,66,0.3)]">Premium</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)] border border-emerald-500/20">Active</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'downloads' && (
              <motion.div key="downloads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                 {downloads.length === 0 ? (
                   <div className="text-center py-12 bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)] rounded-[24px] shadow-lg">
                      <div className="text-4xl mb-4">📦</div>
                      <h3 className="text-base font-['Syne'] font-bold text-[var(--heading)]">No purchases yet</h3>
                      <p className="text-[11px] text-[var(--muted)] mt-2 px-6">Browse our products and make your first purchase!</p>
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
                         <div key={i} className="bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                            <Link href={`/product/${productId}`} className="flex items-center gap-3.5 min-w-0 flex-1 no-underline text-inherit">
                              <div className="w-[52px] h-[52px] rounded-[14px] overflow-hidden bg-black/50 border border-white/5 flex-shrink-0 flex items-center justify-center text-xl">
                                 {order.product_id?.images?.[0] ? <img src={optimizeCloudinary(order.product_id.images[0], 96)} className="w-full h-full object-cover" loading="lazy" alt="" /> : '📦'}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[13px] font-bold text-[var(--heading)] truncate">{productName}</h4>
                                <p className="text-[11px] text-[var(--muted)] mt-0.5">{date} • <span className="text-[#f5c842]">₹{order.amount?.toLocaleString()}</span></p>
                              </div>
                            </Link>
                            {productId && (
                              <button onClick={() => toggleReviewForm(productId)} className="bg-[#f5c842]/15 hover:bg-[#f5c842]/25 text-[#f5c842] px-3 py-2.5 rounded-xl transition-colors flex-shrink-0 text-[11px] font-['Syne'] font-bold border border-[#f5c842]/20">
                                {reviewFormOpen === productId ? 'Cancel' : 'Write Review'}
                              </button>
                            )}
                            <a href={dlUrl} target="_blank" rel="noopener noreferrer" className="bg-[#f5c842]/15 hover:bg-[#f5c842]/25 text-[#f5c842] p-3 rounded-xl transition-colors flex-shrink-0 shadow-[0_0_10px_rgba(245,200,66,0.1)]">
                              <Download size={16} />
                            </a>
                            {productId && reviewFormOpen === productId && renderReviewForm(productId, productName)}
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
                   <div className="text-center py-12 bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)] rounded-[24px] shadow-lg">
                      <div className="text-4xl mb-4">🛍️</div>
                      <h3 className="text-base font-['Syne'] font-bold text-[var(--heading)]">No orders yet</h3>
                      <Link href="/" className="inline-block mt-6 bg-[var(--surface-muted)] text-[var(--heading)] border border-[var(--line)] font-['Syne'] font-bold py-2.5 px-6 rounded-xl text-xs">Shop Now</Link>
                   </div>
                ) : (
                  <div className="space-y-3">
                     {orders.map((order, i) => (
                        <div key={i} className="bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)] rounded-2xl p-4 shadow-lg">
                           <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-3">
                             <div className="pr-2">
                               <h4 className="text-[13px] font-bold text-[var(--heading)] leading-tight">{order.product_id?.name || 'Digital Product'}</h4>
                               <p className="text-[11px] text-[var(--muted)] mt-1">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                             </div>
                             <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0 border ${order.payment_status === 1 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#f5c842]/10 text-[#f5c842] border-[#f5c842]/20'}`}>
                               {order.payment_status === 1 ? 'Paid' : 'Pending'}
                             </span>
                           </div>
                           <div className="flex justify-between items-center pt-1">
                             <span className="text-[11px] text-[var(--muted)]">Total Amount</span>
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
                <div className="bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)] rounded-[24px] p-6 shadow-lg">
                  <h3 className="text-base font-['Syne'] font-bold text-[var(--heading)] mb-1">Security Settings</h3>
                  <p className="text-[11px] text-[var(--muted)] mb-6">Update your password to keep your account secure</p>
                  
                  <div className="flex gap-2 mb-6 bg-[var(--surface-2)] p-1 rounded-xl">
                    {customer.has_password && (
                      <button 
                        onClick={() => setPassTab('update')}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${passTab === 'update' ? 'bg-[var(--surface)] text-[#f5c842] shadow-sm' : 'text-[var(--muted)]'}`}
                      >
                        Update
                      </button>
                    )}
                    <button 
                      onClick={() => setPassTab('reset')}
                      className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${passTab === 'reset' ? 'bg-[var(--surface)] text-[#f5c842] shadow-sm' : 'text-[var(--muted)]'}`}
                    >
                      {customer.has_password ? 'Reset OTP' : 'Set Password'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {passTab === 'update' ? (
                      <>
                        <div>
                          <label className="text-[11px] text-[var(--muted)] font-medium ml-1 mb-1.5 block">Current Password</label>
                          <input type="password" value={passForm.current} onChange={e => setPassForm({...passForm, current: e.target.value})} placeholder="••••••••" className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-4 py-3.5 text-sm text-[var(--heading)] focus:outline-none focus:border-[#f5c842]/50 focus:shadow-[inset_0_0_20px_rgba(245,200,66,0.05)] transition-all" />
                        </div>
                        <div>
                          <label className="text-[11px] text-[var(--muted)] font-medium ml-1 mb-1.5 block">New Password</label>
                          <input type="password" value={passForm.newp} onChange={e => setPassForm({...passForm, newp: e.target.value})} placeholder="••••••••" className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-4 py-3.5 text-sm text-[var(--heading)] focus:outline-none focus:border-[#f5c842]/50 focus:shadow-[inset_0_0_20px_rgba(245,200,66,0.05)] transition-all" />
                        </div>
                        <div>
                          <label className="text-[11px] text-[var(--muted)] font-medium ml-1 mb-1.5 block">Confirm Password</label>
                          <input type="password" value={passForm.conf} onChange={e => setPassForm({...passForm, conf: e.target.value})} placeholder="••••••••" className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-4 py-3.5 text-sm text-[var(--heading)] focus:outline-none focus:border-[#f5c842]/50 focus:shadow-[inset_0_0_20px_rgba(245,200,66,0.05)] transition-all" />
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
                      </>
                    ) : (
                      <>
                        {otpStep === 1 ? (
                          <div className="text-center p-4 bg-[var(--surface-2)] rounded-2xl border border-[var(--line)]">
                            <p className="text-xs text-[var(--text)] mb-4">OTP will be sent to <strong>{customer.email}</strong></p>
                            {passMsg && (
                              <div className={`p-3 rounded-xl text-xs mb-4 flex items-center gap-2 ${passMsg.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {passMsg.msg}
                              </div>
                            )}
                            <button onClick={sendOtp} disabled={loading} className="w-full bg-gradient-to-r from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne'] font-bold py-3 rounded-xl text-sm">
                              {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="text-[11px] text-[var(--muted)] font-medium ml-1 mb-1.5 block">OTP Code</label>
                              <input type="text" maxLength={settings.otp_length} value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder={"0".repeat(settings.otp_length)} className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-4 py-3.5 text-lg text-center tracking-[4px] text-[var(--heading)] focus:outline-none focus:border-[#f5c842]/50 transition-all" />
                            </div>
                            <div>
                              <label className="text-[11px] text-[var(--muted)] font-medium ml-1 mb-1.5 block">New Password</label>
                              <input type="password" value={passForm.newp} onChange={e => setPassForm({...passForm, newp: e.target.value})} placeholder="••••••••" className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-4 py-3.5 text-sm text-[var(--heading)] focus:outline-none focus:border-[#f5c842]/50 transition-all" />
                            </div>
                            <div>
                              <label className="text-[11px] text-[var(--muted)] font-medium ml-1 mb-1.5 block">Confirm Password</label>
                              <input type="password" value={passForm.conf} onChange={e => setPassForm({...passForm, conf: e.target.value})} placeholder="••••••••" className="w-full bg-[var(--surface-2)] border border-[var(--line)] rounded-xl px-4 py-3.5 text-sm text-[var(--heading)] focus:outline-none focus:border-[#f5c842]/50 transition-all" />
                            </div>
                            
                            {passMsg && (
                              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${passMsg.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {passMsg.msg}
                              </div>
                            )}
                            
                            <button onClick={resetPassword} disabled={loading} className="w-full mt-2 bg-gradient-to-r from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne'] font-bold py-3.5 rounded-xl shadow-lg">
                              {loading ? 'Resetting...' : (customer.has_password ? 'Reset Password' : 'Set Password')}
                            </button>
                            <div className="flex justify-between items-center mt-2 px-1">
                              <button onClick={() => setOtpStep(1)} className="text-[10px] text-[var(--muted)]">← Change Method</button>
                              <button onClick={sendOtp} disabled={timer > 0 || loading} className={`text-[10px] font-bold ${timer > 0 ? 'text-[var(--muted-2)]' : 'text-[#f5c842]'}`}>
                                {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
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


