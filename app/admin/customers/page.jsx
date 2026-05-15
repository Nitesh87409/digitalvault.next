'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const TAG_COLORS = {
  vip: { bg: 'rgba(245,200,66,0.15)', color: '#f5c842', label: '💎 VIP' },
  high_spender: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', label: '💰 High Spender' },
  normal: { bg: 'rgba(255,255,255,0.05)', color: '#9ca3af', label: '👤 Normal' },
  new: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: '🆕 New' },
  risky: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: '⚠️ Risky' },
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const headers = { 'authorization': token };

  useEffect(() => {
    if (!token) { router.push('/admin/login'); return; }
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    const res = await fetch('/api/customers', { headers });
    const data = await res.json();
    if (data.flag) setCustomers(data.customers);
    setLoading(false);
  }

  async function toggleBlock(customer) {
    const action = customer.is_blocked ? 'unblock' : 'block';
    await fetch('/api/customers', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: customer._id, action })
    });
    loadCustomers();
  }

  const filtered = customers.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.tag === filter || (filter === 'blocked' && c.is_blocked);
    return matchSearch && matchFilter;
  });

  const totalRevenue = customers.reduce((s, c) => s + (c.total_spent || 0), 0);

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0f', minHeight: '100vh', color: '#e8e8f0' }}>
      <nav style={{ background: '#0e0e18', borderBottom: '1px solid rgba(245,200,66,0.1)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link href="/admin/dashboard" style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#f5c842', textDecoration: 'none' }}>DigitalVault</Link>
        <Link href="/admin/dashboard" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>← Dashboard</Link>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>👥 Customer Management</h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>{customers.length} total customers</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total', val: customers.length, color: '#fff' },
            { label: 'VIP', val: customers.filter(c => c.tag === 'vip').length, color: '#f5c842' },
            { label: 'New', val: customers.filter(c => c.tag === 'new').length, color: '#10b981' },
            { label: 'Blocked', val: customers.filter(c => c.is_blocked).length, color: '#ef4444' },
            { label: 'Revenue', val: '₹' + totalRevenue.toLocaleString(), color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '14px', padding: '18px' }}>
              <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '4px' }}>{s.label}</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{ flex: 1, background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' }}
          />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' }}>
            <option value="all">All Customers</option>
            <option value="vip">VIP</option>
            <option value="new">New</option>
            <option value="high_spender">High Spender</option>
            <option value="risky">Risky</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>Loading customers...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Customer', 'Email', 'Orders', 'Total Spent', 'Joined', 'Tag', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 16px', color: '#6b7280', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No customers found.</td></tr>
                ) : filtered.map(c => {
                  const tag = TAG_COLORS[c.tag] || TAG_COLORS.normal;
                  return (
                    <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#f5c842,#e0a800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#0a0a0f', fontSize: '0.875rem', flexShrink: 0 }}>
                            {c.name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ color: '#fff', fontWeight: 500 }}>{c.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#9ca3af' }}>{c.email}</td>
                      <td style={{ padding: '14px 16px', color: '#fff', fontWeight: 600 }}>{c.total_orders || 0}</td>
                      <td style={{ padding: '14px 16px', color: '#f5c842', fontWeight: 700 }}>₹{(c.total_spent || 0).toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '0.8rem' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: tag.bg, color: tag.color, padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>{tag.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: c.is_blocked ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: c.is_blocked ? '#ef4444' : '#10b981', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {c.is_blocked ? '🚫 Blocked' : '✓ Active'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Link href={`/admin/customers/${c._id}`} style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.2)', color: '#f5c842', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', textDecoration: 'none' }}>View</Link>
                          <button onClick={() => toggleBlock(c)} style={{ background: c.is_blocked ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${c.is_blocked ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, color: c.is_blocked ? '#10b981' : '#ef4444', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem' }}>
                            {c.is_blocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
