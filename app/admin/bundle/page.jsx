'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function AdminBundlePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(''); // Stores the active tab ID currently saving
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    bundle_enabled: true,
    bundle_title: 'Complete Bundle',
    bundle_description: 'All products + future updates included',
    bundle_price: 207,
    bundle_original_price: 8497,
    bundle_timer_enabled: true,
    bundle_timer_days: 0,
    bundle_timer_hours: 24,
    bundle_timer_minutes: 0,
    bundle_timer_action: 'hide_timer',
    bundle_features: ['Instant Download', 'Lifetime Access', 'Free Future Updates', '7-Day Guarantee'],
    bundle_badge_text: 'Limited Time Deal',
    bundle_badge_color: '#f5c842',
    bundle_cta_text: 'Unlock Bundle →',
    bundle_show_discount: true,
    bundle_banner_image: '',
    bundle_sales_limit: 0,
    bundle_validity_days: 0,
    bundle_allow_repurchase: false,
    bundle_send_email: true,
  });
  const [stats, setStats] = useState({ activeSubscriptions: 0, revenue: 0, totalProducts: 0, bundleProducts: 0, totalSalesCount: 0 });
  const [products, setProducts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [productQuery, setProductQuery] = useState('');
  const [subscriptionQuery, setSubscriptionQuery] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadBundleAdmin();
  }, []);

  async function loadBundleAdmin() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bundle?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data.flag) {
        setSettings(data.settings);
        setStats(data.stats);
        setProducts(data.products || []);
        setSubscriptions(data.subscriptions || []);
      } else {
        setMessage(data.message || 'Unable to load bundle data');
      }
    } catch {
      setMessage('Connection error');
    }
    setLoading(false);
  }

  async function saveSectionSettings(sectionName, tabId) {
    setSaving(tabId);
    setMessage('');
    try {
      const res = await fetch('/api/admin/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-settings', ...settings }),
      });
      const data = await res.json();
      if (data.flag) {
        setSettings(data.settings);
        setMessage(`${sectionName} saved successfully!`);
        await loadBundleAdmin();
      } else {
        setMessage(data.message || 'Save failed');
      }
    } catch {
      setMessage('Connection error');
    }
    setSaving('');
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000);
  }

  async function toggleProduct(product) {
    const nextIncluded = !product.included_in_bundle;
    setProducts(prev => prev.map(p => p._id === product._id ? { ...p, included_in_bundle: nextIncluded } : p));
    try {
      const res = await fetch('/api/admin/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-product', product_id: product._id, included_in_bundle: nextIncluded }),
      });
      const data = await res.json();
      if (!data.flag) {
        setMessage(data.message || 'Product update failed');
        await loadBundleAdmin();
      } else {
        setStats(prev => ({
          ...prev,
          bundleProducts: prev.bundleProducts + (nextIncluded ? 1 : -1),
        }));
      }
    } catch {
      setMessage('Connection error');
      await loadBundleAdmin();
    }
  }

  async function updateSubscriptionStatus(subscription, status) {
    try {
      const res = await fetch('/api/admin/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-subscription-status', subscription_id: subscription._id, status }),
      });
      const data = await res.json();
      if (data.flag) await loadBundleAdmin();
      else setMessage(data.message || 'Subscription update failed');
    } catch {
      setMessage('Connection error');
    }
  }

  async function exportCSV() {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export-csv' }),
      });
      const data = await res.json();
      if (data.flag && data.csv) {
        const blob = new Blob([data.csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bundle-customers-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage('CSV exported successfully');
      } else {
        setMessage('Export failed');
      }
    } catch {
      setMessage('Connection error');
    }
    setExporting(false);
  }

  function addFeature() {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    if ((settings.bundle_features || []).includes(trimmed)) return;
    setSettings({ ...settings, bundle_features: [...(settings.bundle_features || []), trimmed] });
    setNewFeature('');
  }

  function removeFeature(index) {
    const updated = [...(settings.bundle_features || [])];
    updated.splice(index, 1);
    setSettings({ ...settings, bundle_features: updated });
  }

  function moveFeature(index, direction) {
    const updated = [...(settings.bundle_features || [])];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= updated.length) return;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSettings({ ...settings, bundle_features: updated });
  }

  const filteredProducts = useMemo(() => {
    const q = productQuery.toLowerCase().trim();
    return products.filter(product => !q || product.name?.toLowerCase().includes(q) || product.category?.toLowerCase().includes(q));
  }, [products, productQuery]);

  const filteredSubscriptions = useMemo(() => {
    const q = subscriptionQuery.toLowerCase().trim();
    return subscriptions.filter(sub => {
      const customer = sub.customer || {};
      return !q ||
        customer.name?.toLowerCase().includes(q) ||
        customer.email?.toLowerCase().includes(q) ||
        customer.phone?.toLowerCase().includes(q) ||
        sub.payment_id?.toLowerCase().includes(q);
    });
  }, [subscriptions, subscriptionQuery]);

  const discountPercent = settings.bundle_original_price > 0
    ? Math.round(((settings.bundle_original_price - settings.bundle_price) / settings.bundle_original_price) * 100)
    : 0;

  const inputClass = 'bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors';

  const tabs = [
    { id: 'general', label: '📦 General Settings' },
    { id: 'appearance', label: '🎨 Appearance' },
    { id: 'features', label: '✅ Features / Highlights' },
    { id: 'access', label: '🔒 Access & Limits' },
    { id: 'timer', label: '⏰ Countdown Timer' },
    { id: 'email', label: '📧 Email Notifications' },
    { id: 'products', label: '🛒 Included Products' },
    { id: 'customers', label: '👥 Bundle Customers' }
  ];

  return (
    <>
      <h1 className="font-syne text-2xl md:text-3xl font-bold text-white tracking-tight mb-8">🎁 Bundle Management</h1>
      <main className="mx-auto flex max-w-7xl flex-col gap-6 my-2 px-2 flex-1 w-full">
        
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#12121a] p-10 text-center text-gray-400">Loading bundle data...</div>
        ) : (
          <>
            {/* STATS */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['Active Subscribers', stats.activeSubscriptions, '#10b981'],
                ['Bundle Revenue', `₹${(stats.revenue || 0).toLocaleString()}`, '#f5c842'],
                ['Bundle Products', `${stats.bundleProducts}/${stats.totalProducts}`, '#8b5cf6'],
                ['Current Price', `₹${Number(settings.bundle_price || 0).toLocaleString()}`, '#3b82f6'],
                ['Total Sales', settings.bundle_sales_limit > 0 ? `${stats.totalSalesCount}/${settings.bundle_sales_limit}` : `${stats.totalSalesCount}`, '#f97316'],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-2xl border border-[#f5c842]/10 bg-[#12121a] p-5">
                  <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
                  <p className="mt-2 font-syne text-2xl font-bold" style={{ color }}>{value}</p>
                </div>
              ))}
            </section>

            {/* TAB CONTAINER */}
            <div className="w-full flex flex-col md:flex-row gap-6 lg:gap-10 items-start mt-4">
              {/* SIDEBAR TABS */}
              <div className="w-full md:w-64 shrink-0">
                <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setMessage(''); }}
                      className={`text-left whitespace-nowrap px-4 py-3 rounded-xl font-syne font-bold transition-all text-sm cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-[#f5c842]/10 text-[#f5c842] border-l-2 border-[#f5c842]'
                          : 'text-gray-400 border-l-2 border-transparent hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTIVE TAB CONTENT */}
              <div className="flex-1 w-full min-w-0">
                
                {/* 1. GENERAL SETTINGS */}
                {activeTab === 'general' && (
                  <div className="bg-[#12121a] rounded-2xl p-5 sm:p-8 border border-[#f5c842]/10 shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-xl font-syne font-bold text-white mb-6">General Bundle Settings</h2>
                    
                    <div className="flex flex-col gap-6 mb-8">
                      <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#1a1a2a] px-4 py-3 cursor-pointer">
                        <span>
                          <span className="block text-sm font-bold text-white">Bundle Enabled</span>
                          <span className="text-xs text-gray-500">Show and sell full-bundle checkout.</span>
                        </span>
                        <input type="checkbox" checked={!!settings.bundle_enabled} onChange={e => setSettings({ ...settings, bundle_enabled: e.target.checked })} className="h-5 w-5 accent-[#f5c842]" />
                      </label>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">Title</label>
                        <input className={inputClass} value={settings.bundle_title} onChange={e => setSettings({ ...settings, bundle_title: e.target.value })} />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">Description</label>
                        <textarea className={`${inputClass} min-h-24 resize-y`} value={settings.bundle_description} onChange={e => setSettings({ ...settings, bundle_description: e.target.value })} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">Sale Price ₹</label>
                          <input type="number" min="1" className={inputClass} value={settings.bundle_price} onChange={e => setSettings({ ...settings, bundle_price: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">Original Price ₹</label>
                          <input type="number" min="1" className={inputClass} value={settings.bundle_original_price} onChange={e => setSettings({ ...settings, bundle_original_price: Number(e.target.value) })} />
                        </div>
                      </div>
                      {discountPercent > 0 && (
                        <div className="text-xs text-gray-400">Auto-calculated discount: <span className="text-[#10b981] font-bold">{discountPercent}% OFF</span></div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                      <button
                        onClick={() => saveSectionSettings('General settings', 'general')}
                        disabled={saving === 'general'}
                        className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/20 cursor-pointer transition-transform ${saving === 'general' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                      >
                        {saving === 'general' ? 'Saving...' : 'Save General Settings'}
                      </button>
                      {message && <span className="font-semibold text-sm text-[#10b981] animate-pulse">{message}</span>}
                    </div>
                  </div>
                )}

                {/* 2. APPEARANCE */}
                {activeTab === 'appearance' && (
                  <div className="bg-[#12121a] rounded-2xl p-5 sm:p-8 border border-[#f5c842]/10 shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-xl font-syne font-bold text-white mb-6">🎨 Appearance</h2>
                    
                    <div className="flex flex-col gap-6 mb-8">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">Badge Text</label>
                        <input className={inputClass} value={settings.bundle_badge_text} onChange={e => setSettings({ ...settings, bundle_badge_text: e.target.value })} placeholder="e.g. Limited Time Deal, 🔥 Best Value" />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">Badge Color</label>
                        <div className="flex items-center gap-3">
                          <input type="color" value={settings.bundle_badge_color || '#f5c842'} onChange={e => setSettings({ ...settings, bundle_badge_color: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
                          <input className={`${inputClass} max-w-[140px]`} value={settings.bundle_badge_color} onChange={e => setSettings({ ...settings, bundle_badge_color: e.target.value })} placeholder="#f5c842" />
                          <div className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: `${settings.bundle_badge_color}20`, color: settings.bundle_badge_color, border: `1px solid ${settings.bundle_badge_color}30` }}>
                            {settings.bundle_badge_text || 'Preview'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">CTA Button Text</label>
                        <input className={inputClass} value={settings.bundle_cta_text} onChange={e => setSettings({ ...settings, bundle_cta_text: e.target.value })} placeholder="e.g. Unlock Bundle →, Grab Now" />
                      </div>
                      <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#1a1a2a] px-4 py-3 cursor-pointer">
                        <span>
                          <span className="block text-sm font-bold text-white">Show Discount Badge</span>
                          <span className="text-xs text-gray-500">Auto-calculated "{discountPercent}% OFF" badge on homepage.</span>
                        </span>
                        <input type="checkbox" checked={!!settings.bundle_show_discount} onChange={e => setSettings({ ...settings, bundle_show_discount: e.target.checked })} className="h-5 w-5 accent-[#f5c842]" />
                      </label>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">Banner Image URL</label>
                        <input className={inputClass} value={settings.bundle_banner_image} onChange={e => setSettings({ ...settings, bundle_banner_image: e.target.value })} placeholder="https://... (Cloudinary URL or leave empty)" />
                        {settings.bundle_banner_image && (
                          <div className="mt-4 rounded-xl border border-white/10 overflow-hidden max-h-32">
                            <img src={settings.bundle_banner_image} alt="Banner Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                      <button
                        onClick={() => saveSectionSettings('Appearance settings', 'appearance')}
                        disabled={saving === 'appearance'}
                        className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/20 cursor-pointer transition-transform ${saving === 'appearance' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                      >
                        {saving === 'appearance' ? 'Saving...' : 'Save Appearance'}
                      </button>
                      {message && <span className="font-semibold text-sm text-[#10b981] animate-pulse">{message}</span>}
                    </div>
                  </div>
                )}

                {/* 3. FEATURES LIST */}
                {activeTab === 'features' && (
                  <div className="bg-[#12121a] rounded-2xl p-5 sm:p-8 border border-[#f5c842]/10 shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-xl font-syne font-bold text-white mb-6">✅ Features / Highlights</h2>
                    <p className="text-xs text-gray-500 mb-4">These bullet points appear in the bundle section on the homepage.</p>
                    
                    <div className="flex flex-col gap-2.5 mb-6">
                      {(settings.bundle_features || []).map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a2a] px-3 py-2">
                          <span className="flex-1 text-sm text-white truncate">✓ {feat}</span>
                          <button onClick={() => moveFeature(i, -1)} disabled={i === 0} className="text-gray-500 hover:text-white text-xs disabled:opacity-30 cursor-pointer p-1">↑</button>
                          <button onClick={() => moveFeature(i, 1)} disabled={i === (settings.bundle_features?.length || 0) - 1} className="text-gray-500 hover:text-white text-xs disabled:opacity-30 cursor-pointer p-1">↓</button>
                          <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-300 text-xs cursor-pointer p-1">✕</button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mb-8">
                      <input
                        className={`${inputClass} flex-1`}
                        value={newFeature}
                        onChange={e => setNewFeature(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addFeature()}
                        placeholder="Add new feature..."
                      />
                      <button onClick={addFeature} className="rounded-xl bg-[#f5c842]/20 border border-[#f5c842]/30 px-5 py-2 text-sm font-bold text-[#f5c842] hover:bg-[#f5c842]/30 cursor-pointer transition-colors">Add</button>
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                      <button
                        onClick={() => saveSectionSettings('Features list', 'features')}
                        disabled={saving === 'features'}
                        className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/20 cursor-pointer transition-transform ${saving === 'features' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                      >
                        {saving === 'features' ? 'Saving...' : 'Save Features & Highlights'}
                      </button>
                      {message && <span className="font-semibold text-sm text-[#10b981] animate-pulse">{message}</span>}
                    </div>
                  </div>
                )}

                {/* 4. ACCESS CONTROL & LIMITS */}
                {activeTab === 'access' && (
                  <div className="bg-[#12121a] rounded-2xl p-5 sm:p-8 border border-[#f5c842]/10 shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-xl font-syne font-bold text-white mb-6">🔒 Access & Limits</h2>
                    
                    <div className="flex flex-col gap-6 mb-8">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">Bundle Validity</label>
                        <div className="flex items-center gap-3">
                          <select className={`${inputClass} max-w-[180px] cursor-pointer`} value={settings.bundle_validity_days === 0 ? 'lifetime' : 'custom'} onChange={e => setSettings({ ...settings, bundle_validity_days: e.target.value === 'lifetime' ? 0 : 365 })}>
                            <option value="lifetime">♾️ Lifetime</option>
                            <option value="custom">📅 Custom Days</option>
                          </select>
                          {settings.bundle_validity_days > 0 && (
                            <div className="flex items-center gap-2">
                              <input type="number" min="1" className={`${inputClass} max-w-[100px]`} value={settings.bundle_validity_days} onChange={e => setSettings({ ...settings, bundle_validity_days: Number(e.target.value) || 0 })} />
                              <span className="text-xs text-gray-400">days</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#1a1a2a] px-4 py-3 cursor-pointer">
                        <span>
                          <span className="block text-sm font-bold text-white">Allow Re-purchase</span>
                          <span className="text-xs text-gray-500">Let customers with expired/inactive bundles buy again.</span>
                        </span>
                        <input type="checkbox" checked={!!settings.bundle_allow_repurchase} onChange={e => setSettings({ ...settings, bundle_allow_repurchase: e.target.checked })} className="h-5 w-5 accent-[#f5c842]" />
                      </label>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">Sales Limit</label>
                        <div className="flex items-center gap-3">
                          <input type="number" min="0" className={`${inputClass} max-w-[140px]`} value={settings.bundle_sales_limit} onChange={e => setSettings({ ...settings, bundle_sales_limit: Number(e.target.value) || 0 })} />
                          <span className="text-xs text-gray-400">{settings.bundle_sales_limit === 0 ? '(Unlimited)' : `(${Math.max(0, settings.bundle_sales_limit - (stats.totalSalesCount || 0))} remaining)`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                      <button
                        onClick={() => saveSectionSettings('Access settings', 'access')}
                        disabled={saving === 'access'}
                        className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/20 cursor-pointer transition-transform ${saving === 'access' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                      >
                        {saving === 'access' ? 'Saving...' : 'Save Access & Limits'}
                      </button>
                      {message && <span className="font-semibold text-sm text-[#10b981] animate-pulse">{message}</span>}
                    </div>
                  </div>
                )}

                {/* 5. COUNTDOWN TIMER */}
                {activeTab === 'timer' && (
                  <div className="bg-[#12121a] rounded-2xl p-5 sm:p-8 border border-[#f5c842]/10 shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-xl font-syne font-bold text-white mb-6">⏰ Countdown Timer</h2>
                    
                    <div className="flex flex-col gap-6 mb-8">
                      <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#1a1a2a] px-4 py-3 cursor-pointer">
                        <span>
                          <span className="block text-sm font-bold text-white">Show Countdown Timer</span>
                          <span className="text-xs text-gray-500">Show urgency timer on landing page.</span>
                        </span>
                        <input type="checkbox" checked={!!settings.bundle_timer_enabled} onChange={e => setSettings({ ...settings, bundle_timer_enabled: e.target.checked })} className="h-5 w-5 accent-[#f5c842]" />
                      </label>

                      {settings.bundle_timer_enabled && (
                        <>
                          <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">Timer Duration</label>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Days</label>
                                <input type="number" min="0" className={inputClass} value={settings.bundle_timer_days} onChange={e => setSettings({ ...settings, bundle_timer_days: Number(e.target.value) || 0 })} />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Hours</label>
                                <input type="number" min="0" max="23" className={inputClass} value={settings.bundle_timer_hours} onChange={e => setSettings({ ...settings, bundle_timer_hours: Number(e.target.value) || 0 })} />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Minutes</label>
                                <input type="number" min="0" max="59" className={inputClass} value={settings.bundle_timer_minutes} onChange={e => setSettings({ ...settings, bundle_timer_minutes: Number(e.target.value) || 0 })} />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">Action On Expiration</label>
                            <select className={`${inputClass} cursor-pointer`} value={settings.bundle_timer_action} onChange={e => setSettings({ ...settings, bundle_timer_action: e.target.value })}>
                              <option value="hide_timer">Hide Timer Only (Boost Urgency)</option>
                              <option value="disable_checkout">Disable Checkout (Show "Offer Ended")</option>
                              <option value="show_expired">Show "Offer Expired" Badge & Disable Checkout</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                      <button
                        onClick={() => saveSectionSettings('Countdown settings', 'timer')}
                        disabled={saving === 'timer'}
                        className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/20 cursor-pointer transition-transform ${saving === 'timer' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                      >
                        {saving === 'timer' ? 'Saving...' : 'Save Countdown Timer'}
                      </button>
                      {message && <span className="font-semibold text-sm text-[#10b981] animate-pulse">{message}</span>}
                    </div>
                  </div>
                )}

                {/* 6. EMAIL NOTIFICATIONS */}
                {activeTab === 'email' && (
                  <div className="bg-[#12121a] rounded-2xl p-5 sm:p-8 border border-[#f5c842]/10 shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-xl font-syne font-bold text-white mb-6">📧 Email Notifications</h2>
                    
                    <div className="flex flex-col gap-6 mb-8">
                      <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#1a1a2a] px-4 py-3 cursor-pointer">
                        <span>
                          <span className="block text-sm font-bold text-white">Send Purchase Email</span>
                          <span className="text-xs text-gray-500">Send confirmation email with receipt to customer after bundle purchase.</span>
                        </span>
                        <input type="checkbox" checked={!!settings.bundle_send_email} onChange={e => setSettings({ ...settings, bundle_send_email: e.target.checked })} className="h-5 w-5 accent-[#f5c842]" />
                      </label>
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                      <button
                        onClick={() => saveSectionSettings('Email settings', 'email')}
                        disabled={saving === 'email'}
                        className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3 rounded-xl shadow-lg shadow-[#f5c842]/20 cursor-pointer transition-transform ${saving === 'email' ? 'opacity-70' : 'hover:scale-[1.02]'}`}
                      >
                        {saving === 'email' ? 'Saving...' : 'Save Email Settings'}
                      </button>
                      {message && <span className="font-semibold text-sm text-[#10b981] animate-pulse">{message}</span>}
                    </div>
                  </div>
                )}

                {/* 7. INCLUDED PRODUCTS */}
                {activeTab === 'products' && (
                  <div className="bg-[#12121a] rounded-2xl p-5 sm:p-8 border border-[#f5c842]/10 shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                      <h2 className="font-syne text-xl font-bold text-white">Included Products</h2>
                      <input className={`${inputClass} sm:max-w-xs`} placeholder="Search products..." value={productQuery} onChange={e => setProductQuery(e.target.value)} />
                    </div>

                    <div className="mt-5 max-h-[520px] overflow-auto rounded-xl border border-white/5">
                      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                        <thead className="bg-white/[0.03] text-gray-400">
                          <tr>
                            <th className="p-3 font-medium">Product</th>
                            <th className="p-3 font-medium">Category</th>
                            <th className="p-3 font-medium">Price</th>
                            <th className="p-3 font-medium">Status</th>
                            <th className="p-3 font-medium">Bundle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map(product => (
                            <tr key={product._id} className="border-t border-white/5">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#1a1a2a]">
                                    {product.images?.[0] ? <img src={product.images[0]} alt="" className="h-full w-full object-cover" /> : '📦'}
                                  </div>
                                  <span className="max-w-[260px] truncate font-semibold text-white">{product.name}</span>
                                </div>
                              </td>
                              <td className="p-3 text-gray-400">{product.category || 'Uncategorized'}</td>
                              <td className="p-3 text-[#f5c842]">₹{product.sale_price?.toLocaleString()}</td>
                              <td className="p-3">
                                <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${product.status ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-red-500/15 text-red-400'}`}>
                                  {product.status ? 'Active' : 'Hidden'}
                                </span>
                              </td>
                              <td className="p-3">
                                <label className="inline-flex cursor-pointer items-center gap-2">
                                  <input type="checkbox" checked={!!product.included_in_bundle} onChange={() => toggleProduct(product)} className="h-5 w-5 accent-[#f5c842]" />
                                  <span className="text-xs text-gray-400">{product.included_in_bundle ? 'Included' : 'Excluded'}</span>
                                </label>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 8. BUNDLE CUSTOMERS */}
                {activeTab === 'customers' && (
                  <div className="bg-[#12121a] rounded-2xl p-5 sm:p-8 border border-[#f5c842]/10 shadow-[var(--shadow-soft)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                      <h2 className="font-syne text-xl font-bold text-white">Bundle Customers</h2>
                      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                        <input className={`${inputClass} sm:max-w-sm`} placeholder="Search customer, email, phone, payment id..." value={subscriptionQuery} onChange={e => setSubscriptionQuery(e.target.value)} />
                        <button
                          onClick={exportCSV}
                          disabled={exporting || subscriptions.length === 0}
                          className="rounded-xl border border-[#f5c842]/30 bg-[#f5c842]/10 px-4 py-3 text-sm font-bold text-[#f5c842] hover:bg-[#f5c842]/20 disabled:opacity-50 cursor-pointer transition-colors whitespace-nowrap"
                        >
                          {exporting ? 'Exporting...' : '📤 Export CSV'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 overflow-auto rounded-xl border border-white/5">
                      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                        <thead className="bg-white/[0.03] text-gray-400">
                          <tr>
                            <th className="p-3 font-medium">Customer</th>
                            <th className="p-3 font-medium">Phone</th>
                            <th className="p-3 font-medium">Product</th>
                            <th className="p-3 font-medium">Amount</th>
                            <th className="p-3 font-medium">Coupon</th>
                            <th className="p-3 font-medium">Payment ID</th>
                            <th className="p-3 font-medium">Purchased</th>
                            <th className="p-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSubscriptions.length === 0 ? (
                            <tr><td colSpan={8} className="p-8 text-center text-gray-500">No bundle subscriptions found.</td></tr>
                          ) : filteredSubscriptions.map(sub => (
                            <tr key={sub._id} className="border-t border-white/5">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="font-semibold text-white">{sub.customer?.name || 'Unknown customer'}</div>
                                  {sub.customer?.is_blocked && (
                                    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-bold text-red-400 uppercase">🚫 Blocked</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">{sub.customer_email || sub.customer?.email || sub.customer_id}</div>
                              </td>
                              <td className="p-3 text-gray-400">{sub.customer?.phone || '-'}</td>
                              <td className="p-3 text-gray-400">{sub.product_name || 'Complete Bundle'}</td>
                              <td className="p-3 text-[#f5c842]">₹{Math.round(sub.amount || 0).toLocaleString()}</td>
                              <td className="p-3 text-gray-400">{sub.coupon_code || '-'}</td>
                              <td className="p-3 text-xs text-gray-500">{sub.payment_id}</td>
                              <td className="p-3 text-gray-400">{new Date(sub.purchase_date || sub.createdAt).toLocaleDateString('en-IN')}</td>
                              <td className="p-3">
                                <select value={sub.status} onChange={e => updateSubscriptionStatus(sub, e.target.value)} className="rounded-lg border border-white/10 bg-[#1a1a2a] px-3 py-2 text-sm text-white outline-none cursor-pointer">
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </>
        )}
      </main>
    </>
  );
}
