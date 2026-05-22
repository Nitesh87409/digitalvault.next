'use client';
import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const TAG_COLORS = {
  vip: { bg: 'rgba(245,200,66,0.15)', color: '#f5c842', label: '💎 VIP' },
  high_spender: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', label: '💰 High Spender' },
  normal: { bg: 'rgba(255,255,255,0.05)', color: '#9ca3af', label: '👤 Normal' },
  new: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: '🆕 New' },
  risky: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: '⚠️ Risky' },
};

export default function CustomerDetail({ params }) {
  const { id } = use(params);
  const [data, setData] = useState(null);
  const [bundleInfo, setBundleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const headers = { 'Content-Type': 'application/json' };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  async function loadCustomer() {
    const res = await fetch(`/api/customers?id=${id}`, { headers });
    const d = await res.json();
    if (d.flag) {
      setData(d);
      // Load bundle subscription info
      loadBundleInfo(d.customer.email);
    }
    setLoading(false);
  }

  async function loadBundleInfo(email) {
    try {
      const res = await fetch(`/api/admin/bundle`, { headers });
      const d = await res.json();
      if (d.flag && d.customers) {
        const sub = d.customers.find(c => c.customer_email === email);
        setBundleInfo(sub || null);
      }
    } catch(e) {}
  }

  async function toggleBlock() {
    const action = data.customer.is_blocked ? 'unblock' : 'block';
    await fetch('/api/customers', { method: 'PUT', headers, body: JSON.stringify({ id, action }) });
    loadCustomer();
  }

  async function updateTag(tag) {
    await fetch('/api/customers', { method: 'PUT', headers, body: JSON.stringify({ id, action: 'tag', tag }) });
    loadCustomer();
  }

  if (loading) return (
    <div className="flex items-center justify-center py-[100px]">
      <div className="text-gold font-dm">Loading...</div>
    </div>
  );

  if (!data) return (
    <div className="text-white p-10 font-dm">Customer not found.</div>
  );

  const { customer, orders, stats } = data;
  const initials = customer.name?.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  const tag = TAG_COLORS[customer.tag] || TAG_COLORS.normal;

  return (
    <>
      <div className="max-w-[1100px] mx-auto p-[2px]">

        {/* Customer Header */}
        <div className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl p-5 sm:p-7 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-gradient-to-br from-[#f5c842] to-[#e0a800] flex items-center justify-center font-syne font-bold text-xl sm:text-2xl text-[#0a0a0f] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="font-syne text-xl sm:text-2xl font-bold text-white">{customer.name}</h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: tag.bg, color: tag.color }}>{tag.label}</span>
              {customer.is_blocked && <span className="bg-red-500/15 text-red-500 px-2.5 py-1 rounded-full text-xs font-semibold">🚫 Blocked</span>}
            </div>
            <p className="text-gray-400 text-sm mb-1">{customer.email} · {customer.phone || 'No phone'}</p>
            <p className="text-gray-600 text-xs">
              Joined {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              {customer.last_login && ` · Last active: ${new Date(customer.last_login).toLocaleDateString('en-IN')}`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
            <button onClick={toggleBlock} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-sans cursor-pointer border ${customer.is_blocked ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
              {customer.is_blocked ? '✓ Unblock' : '🚫 Block User'}
            </button>
            <select onChange={e => updateTag(e.target.value)} defaultValue={customer.tag} className="flex-1 sm:flex-none bg-[#1a1a2a] border border-white/10 text-white px-3 py-2 rounded-xl text-sm cursor-pointer font-sans outline-none appearance-none">
              <option value="normal">👤 Normal</option>
              <option value="new">🆕 New</option>
              <option value="vip">💎 VIP</option>
              <option value="high_spender">💰 High Spender</option>
              <option value="risky">⚠️ Risky</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Total Orders', val: stats.totalOrders, icon: '🛒' },
            { label: 'Total Spent', val: '₹' + stats.totalSpent.toLocaleString(), icon: '💰' },
            { label: 'Avg Order', val: '₹' + stats.avgOrder.toLocaleString(), icon: '📊' },
            { label: 'Total Downloads', val: stats.totalDownloads, icon: '⬇️' },
          ].map(s => (
            <div key={s.label} className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl p-4 sm:p-5">
              <p className="text-gray-500 text-xs mb-1">{s.icon} {s.label}</p>
              <p className="font-syne text-xl sm:text-2xl font-bold text-white">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Bundle Subscription Status */}
        <div className="bg-[#12121a] border border-[#8b5cf6]/20 rounded-2xl p-5 sm:p-6 mb-6">
          <h2 className="font-syne text-base font-bold text-white mb-4 flex items-center gap-2">
            🎁 Bundle Subscription
          </h2>
          {bundleInfo ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">Status</p>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${bundleInfo.status === 'active' ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-red-500/15 text-red-500'}`}>
                  {bundleInfo.status === 'active' ? '✓ Active' : '✕ Inactive'}
                </span>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Amount Paid</p>
                <p className="text-[#f5c842] font-bold">₹{(bundleInfo.amount || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Purchased</p>
                <p className="text-white text-sm">{new Date(bundleInfo.purchase_date || bundleInfo.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Expires</p>
                <p className="text-white text-sm">
                  {bundleInfo.expiry_date
                    ? new Date(bundleInfo.expiry_date).toLocaleDateString('en-IN')
                    : 'Lifetime Access'}
                </p>
              </div>
              {bundleInfo.coupon_code && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Coupon Used</p>
                  <span className="font-mono text-[#f5c842] text-xs bg-[#f5c842]/10 px-2 py-1 rounded border border-[#f5c842]/20">{bundleInfo.coupon_code}</span>
                </div>
              )}
              {bundleInfo.payment_id && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-gray-500 text-xs mb-1">Payment ID</p>
                  <p className="text-gray-400 text-xs font-mono break-all">{bundleInfo.payment_id}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <span className="text-3xl mb-2 block">📦</span>
              <p className="text-gray-500 text-sm">No bundle subscription found</p>
              <p className="text-gray-600 text-xs mt-1">This customer hasn't purchased the bundle yet</p>
            </div>
          )}
        </div>

        {/* Coupons Used */}
        {customer.coupons_used && customer.coupons_used.length > 0 && (
          <div className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl overflow-hidden mb-6">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-syne text-base font-bold text-white">🎟️ Coupons Used</h2>
              <span className="text-gray-500 text-xs">{customer.coupons_used.length} coupons</span>
            </div>
            <div className="p-4 flex flex-wrap gap-3">
              {customer.coupons_used.map((cu, i) => (
                <div key={i} className="bg-[#0e0e18] border border-[#f5c842]/10 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="font-mono text-[#f5c842] text-sm font-bold bg-[#f5c842]/10 px-2 py-1 rounded border border-[#f5c842]/20">{cu.code}</span>
                  <span className="text-gray-500 text-xs">
                    {cu.used_at ? new Date(cu.used_at).toLocaleDateString('en-IN') : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order History */}
        <div className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-syne text-base font-bold text-white">🧾 Order History</h2>
            <span className="text-gray-500 text-xs">{orders.length} orders</span>
          </div>
          {orders.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[700px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Product', 'Amount', 'Coupon', 'Date', 'Downloads', 'Status'].map(h => (
                      <th key={h} className="text-left p-4 text-gray-500 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1a1a2a] flex items-center justify-center text-xl shrink-0 border border-white/5">
                            {order.product_id?.images?.[0] ? <img src={order.product_id.images[0]} className="w-full h-full object-cover" alt="" /> : '📦'}
                          </div>
                          <span className="text-white font-medium truncate max-w-[200px]">{order.product_id?.name || 'Digital Product'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-[#f5c842] font-bold">₹{order.amount?.toLocaleString()}</td>
                      <td className="p-4">
                        {order.coupon_code ? (
                          <span className="font-mono text-[#f5c842] text-[10px] bg-[#f5c842]/10 px-1.5 py-0.5 rounded border border-[#f5c842]/20">{order.coupon_code}</span>
                        ) : (
                          <span className="text-gray-600 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="p-4 text-gray-400">{order.download_count || 0}x</td>
                      <td className="p-4">
                        <span className="bg-[#10b981]/15 text-[#10b981] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">✓ Paid</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
