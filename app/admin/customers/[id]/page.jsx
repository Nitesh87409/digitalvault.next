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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const headers = { 'Content-Type': 'application/json' };

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadCustomer() {
    const res = await fetch(`/api/customers?id=${id}`, { headers });
    const d = await res.json();
    if (d.flag) setData(d);
    setLoading(false);
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
    <div style={{ background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#f5c842', fontFamily: 'DM Sans, sans-serif' }}>Loading...</div>
    </div>
  );

  if (!data) return <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#fff', padding: '40px', fontFamily: 'DM Sans, sans-serif' }}>Customer not found.</div>;

  const { customer, orders, stats } = data;
  const initials = customer.name?.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  const tag = TAG_COLORS[customer.tag] || TAG_COLORS.normal;

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0f', minHeight: '100vh', color: '#e8e8f0' }}>
      <nav style={{ background: '#0e0e18', borderBottom: '1px solid rgba(245,200,66,0.1)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link href="/admin/dashboard" style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#f5c842', textDecoration: 'none' }}>DigitalVault</Link>
        <Link href="/admin/customers" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>← Customers</Link>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Customer Header */}
        <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '16px', padding: '28px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#f5c842,#e0a800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#0a0a0f', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{customer.name}</h1>
              <span style={{ background: tag.bg, color: tag.color, padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>{tag.label}</span>
              {customer.is_blocked && <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>🚫 Blocked</span>}
            </div>
            <p style={{ color: '#9ca3af', marginBottom: '4px' }}>{customer.email} · {customer.phone}</p>
            <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>Joined {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={toggleBlock} style={{ background: customer.is_blocked ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${customer.is_blocked ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: customer.is_blocked ? '#10b981' : '#ef4444', cursor: 'pointer', padding: '8px 16px', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' }}>
              {customer.is_blocked ? '✓ Unblock' : '🚫 Block User'}
            </button>
            <select onChange={e => updateTag(e.target.value)} defaultValue={customer.tag} style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '8px 12px', borderRadius: '10px', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              <option value="normal">👤 Normal</option>
              <option value="new">🆕 New</option>
              <option value="vip">💎 VIP</option>
              <option value="high_spender">💰 High Spender</option>
              <option value="risky">⚠️ Risky</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Orders', val: stats.totalOrders, icon: '🛒' },
            { label: 'Total Spent', val: '₹' + stats.totalSpent.toLocaleString(), icon: '💰' },
            { label: 'Avg Order', val: '₹' + stats.avgOrder.toLocaleString(), icon: '📊' },
            { label: 'Total Downloads', val: stats.totalDownloads, icon: '⬇️' },
          ].map(s => (
            <div key={s.label} style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '14px', padding: '20px' }}>
              <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '4px' }}>{s.icon} {s.label}</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Order History */}
        <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>🧾 Order History</h2>
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{orders.length} orders</span>
          </div>
          {orders.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No orders yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Product', 'Amount', 'Date', 'Downloads', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 24px', color: '#6b7280', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: '#1a1a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                          {order.product_id?.images?.[0] ? <img src={order.product_id.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '📦'}
                        </div>
                        <span style={{ color: '#fff', fontWeight: 500 }}>{order.product_id?.name || 'Digital Product'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', color: '#f5c842', fontWeight: 700 }}>₹{order.amount?.toLocaleString()}</td>
                    <td style={{ padding: '14px 24px', color: '#6b7280', fontSize: '0.8rem' }}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '14px 24px', color: '#9ca3af' }}>{order.download_count || 0}x</td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>✓ Paid</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
