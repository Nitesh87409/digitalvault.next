'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function AdminBundlePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState({
    bundle_enabled: true,
    bundle_title: 'Complete Bundle',
    bundle_description: 'All products + future updates included',
    bundle_price: 207,
    bundle_original_price: 8497,
  });
  const [stats, setStats] = useState({ activeSubscriptions: 0, revenue: 0, totalProducts: 0, bundleProducts: 0 });
  const [products, setProducts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [productQuery, setProductQuery] = useState('');
  const [subscriptionQuery, setSubscriptionQuery] = useState('');

  useEffect(() => {
    loadBundleAdmin();
  }, []);

  async function loadBundleAdmin() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bundle', { cache: 'no-store' });
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

  async function saveSettings() {
    setSaving(true);
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
        setMessage('Bundle settings saved');
        await loadBundleAdmin();
      } else {
        setMessage(data.message || 'Save failed');
      }
    } catch {
      setMessage('Connection error');
    }
    setSaving(false);
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

  const inputClass = 'bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] font-sans">
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-[#f5c842]/10 bg-[#0e0e18] px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="font-syne text-xl font-bold text-[#f5c842] no-underline">DigitalVault</Link>
          <Link href="/admin/dashboard" className="text-sm text-gray-500 no-underline hover:text-white">← Dashboard</Link>
        </div>
        <Link href="/" target="_blank" className="text-sm text-[#f5c842] no-underline">View Site</Link>
      </nav>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-syne text-3xl font-bold text-white">Bundle Management</h1>
            <p className="mt-2 text-sm text-gray-500">Manage full-bundle pricing, included products, and active bundle customers.</p>
          </div>
          {message && <div className="rounded-xl border border-[#f5c842]/20 bg-[#f5c842]/10 px-4 py-3 text-sm text-[#f5c842]">{message}</div>}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#12121a] p-10 text-center text-gray-400">Loading bundle data...</div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Active Subscribers', stats.activeSubscriptions, '#10b981'],
                ['Bundle Revenue', `₹${(stats.revenue || 0).toLocaleString()}`, '#f5c842'],
                ['Bundle Products', `${stats.bundleProducts}/${stats.totalProducts}`, '#8b5cf6'],
                ['Current Price', `₹${Number(settings.bundle_price || 0).toLocaleString()}`, '#3b82f6'],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-2xl border border-[#f5c842]/10 bg-[#12121a] p-5">
                  <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
                  <p className="mt-2 font-syne text-2xl font-bold" style={{ color }}>{value}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
              <div className="rounded-2xl border border-[#f5c842]/10 bg-[#12121a] p-5 sm:p-6">
                <h2 className="font-syne text-xl font-bold text-white">Bundle Settings</h2>
                <div className="mt-5 flex flex-col gap-4">
                  <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#1a1a2a] px-4 py-3">
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">Sale Price ₹</label>
                      <input type="number" min="1" className={inputClass} value={settings.bundle_price} onChange={e => setSettings({ ...settings, bundle_price: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#f5c842]">Original ₹</label>
                      <input type="number" min="1" className={inputClass} value={settings.bundle_original_price} onChange={e => setSettings({ ...settings, bundle_original_price: Number(e.target.value) })} />
                    </div>
                  </div>

                  <button onClick={saveSettings} disabled={saving} className="mt-2 rounded-xl border-none bg-gradient-to-br from-[#f5c842] to-[#e0a800] px-5 py-3 font-syne font-bold text-[#0a0a0f] shadow-lg shadow-[#f5c842]/20 disabled:opacity-70">
                    {saving ? 'Saving...' : 'Save Bundle Settings'}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#f5c842]/10 bg-[#12121a] p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#1a1a2a]">
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
            </section>

            <section className="rounded-2xl border border-[#f5c842]/10 bg-[#12121a] p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-syne text-xl font-bold text-white">Bundle Customers</h2>
                <input className={`${inputClass} sm:max-w-sm`} placeholder="Search customer, email, phone, payment id..." value={subscriptionQuery} onChange={e => setSubscriptionQuery(e.target.value)} />
              </div>

              <div className="mt-5 overflow-auto rounded-xl border border-white/5">
                <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                  <thead className="bg-white/[0.03] text-gray-400">
                    <tr>
                      <th className="p-3 font-medium">Customer</th>
                      <th className="p-3 font-medium">Phone</th>
                      <th className="p-3 font-medium">Amount</th>
                      <th className="p-3 font-medium">Coupon</th>
                      <th className="p-3 font-medium">Payment ID</th>
                      <th className="p-3 font-medium">Purchased</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-gray-500">No bundle subscriptions found.</td></tr>
                    ) : filteredSubscriptions.map(sub => (
                      <tr key={sub._id} className="border-t border-white/5">
                        <td className="p-3">
                          <div className="font-semibold text-white">{sub.customer?.name || 'Unknown customer'}</div>
                          <div className="text-xs text-gray-500">{sub.customer?.email || sub.customer_id}</div>
                        </td>
                        <td className="p-3 text-gray-400">{sub.customer?.phone || '-'}</td>
                        <td className="p-3 text-[#f5c842]">₹{Math.round((sub.amount || 0) / 100).toLocaleString()}</td>
                        <td className="p-3 text-gray-400">{sub.coupon_code || '-'}</td>
                        <td className="p-3 text-xs text-gray-500">{sub.payment_id}</td>
                        <td className="p-3 text-gray-400">{new Date(sub.purchase_date || sub.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-3">
                          <select value={sub.status} onChange={e => updateSubscriptionStatus(sub, e.target.value)} className="rounded-lg border border-white/10 bg-[#1a1a2a] px-3 py-2 text-sm text-white outline-none">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
