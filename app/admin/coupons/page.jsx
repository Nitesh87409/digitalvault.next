'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    code: '', discount_type: 'percentage', discount_value: '',
    min_order: '', max_uses: '', per_user_limit: '1',
    start_date: '', end_date: '', user_type: 'all',
    specific_emails: '', status: true
  });
  const router = useRouter();
  const headers = { 'Content-Type': 'application/json' };

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    const res = await fetch('/api/coupon', { headers });
    const data = await res.json();
    if (data.flag) setCoupons(data.coupons);
  }

  function openModal(coupon = null) {
    setEditing(coupon);
    setError('');
    if (coupon) {
      setForm({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order: coupon.min_order || '',
        max_uses: coupon.max_uses || '',
        per_user_limit: coupon.per_user_limit || 1,
        start_date: coupon.start_date ? coupon.start_date.split('T')[0] : '',
        end_date: coupon.end_date ? coupon.end_date.split('T')[0] : '',
        user_type: coupon.user_type || 'all',
        specific_emails: coupon.specific_emails?.join(', ') || '',
        status: coupon.status,
      });
    } else {
      setForm({ code: '', discount_type: 'percentage', discount_value: '', min_order: '', max_uses: '', per_user_limit: '1', start_date: '', end_date: '', user_type: 'all', specific_emails: '', status: true });
    }
    setModal(true);
  }

  async function saveCoupon() {
    if (!form.code || !form.discount_value) { setError('Code and discount value required.'); return; }
    setSaving(true);
    const payload = {
      ...form,
      discount_value: Number(form.discount_value),
      min_order: Number(form.min_order) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      per_user_limit: Number(form.per_user_limit) || 1,
      specific_emails: form.specific_emails ? form.specific_emails.split(',').map(e => e.trim()) : [],
    };

    const res = await fetch('/api/coupon', {
      method: editing ? 'PUT' : 'POST',
      headers,
      body: JSON.stringify(editing ? { id: editing._id, ...payload } : payload)
    });
    const data = await res.json();
    if (data.flag) { setModal(false); loadCoupons(); }
    else setError(data.message);
    setSaving(false);
  }

  async function deleteCoupon(id) {
    if (!confirm('Delete this coupon?')) return;
    await fetch(`/api/coupon?id=${id}`, { method: 'DELETE', headers });
    loadCoupons();
  }

  async function toggleStatus(coupon) {
    await fetch('/api/coupon', { method: 'PUT', headers, body: JSON.stringify({ id: coupon._id, status: !coupon.status }) });
    loadCoupons();
  }

  const inp = { background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' };

  const isExpired = (coupon) => coupon.end_date && new Date(coupon.end_date) < new Date();

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0f', minHeight: '100vh', color: '#e8e8f0' }}>
      {/* Nav */}
      <nav style={{ background: '#0e0e18', borderBottom: '1px solid rgba(245,200,66,0.1)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/admin/dashboard" style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#f5c842', textDecoration: 'none' }}>DigitalVault</Link>
          <Link href="/admin/dashboard" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>← Dashboard</Link>
        </div>
        <button onClick={() => openModal()} style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '10px', fontSize: '0.875rem' }}>
          + Create Coupon
        </button>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>🎟️ Coupon Management</h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>{coupons.length} coupons total</p>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Coupons', val: coupons.length },
            { label: 'Active', val: coupons.filter(c => c.status && !isExpired(c)).length },
            { label: 'Total Used', val: coupons.reduce((s, c) => s + c.used_count, 0) },
            { label: 'Revenue Generated', val: '₹' + coupons.reduce((s, c) => s + (c.total_revenue || 0), 0).toLocaleString() },
          ].map(s => (
            <div key={s.label} style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '14px', padding: '20px' }}>
              <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '4px' }}>{s.label}</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Coupons Table */}
        <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Code', 'Discount', 'Min Order', 'Uses', 'Expiry', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 16px', color: '#6b7280', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No coupons yet. Create your first coupon!</td></tr>
              ) : coupons.map(c => (
                <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#f5c842', background: 'rgba(245,200,66,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', letterSpacing: '1px' }}>{c.code}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#10b981', fontWeight: 600 }}>
                    {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#9ca3af' }}>₹{c.min_order || 0}</td>
                  <td style={{ padding: '14px 16px', color: '#9ca3af' }}>
                    {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}
                  </td>
                  <td style={{ padding: '14px 16px', color: isExpired(c) ? '#ef4444' : '#9ca3af', fontSize: '0.8rem' }}>
                    {c.end_date ? new Date(c.end_date).toLocaleDateString('en-IN') : 'Never'}
                    {isExpired(c) && <span style={{ marginLeft: '4px', fontSize: '0.7rem' }}>(Expired)</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => toggleStatus(c)} style={{ background: c.status && !isExpired(c) ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: c.status && !isExpired(c) ? '#10b981' : '#ef4444', border: 'none', cursor: 'pointer', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {c.status && !isExpired(c) ? '● Active' : '● Inactive'}
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openModal(c)} style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.2)', color: '#f5c842', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>Edit</button>
                      <button onClick={() => deleteCoupon(c._id)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 50, overflow: 'auto', padding: '40px 16px' }}>
          <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.2)', borderRadius: '20px', width: '100%', maxWidth: '600px', margin: '0 auto', padding: '32px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg,#f5c842,#e0a800)', borderRadius: '20px 20px 0 0' }}></div>
            <button onClick={() => setModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#9ca3af', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>

            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>
              {editing ? '✏️ Edit Coupon' : '🎟️ Create Coupon'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Coupon Code *</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE50" style={{ ...inp, letterSpacing: '2px', fontWeight: 700, fontSize: '1rem' }} disabled={!!editing} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Discount Type *</label>
                <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })} style={inp}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Discount Value *</label>
                <input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_type === 'percentage' ? '50' : '100'} style={inp} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Min Order (₹)</label>
                <input type="number" value={form.min_order} onChange={e => setForm({ ...form, min_order: e.target.value })} placeholder="499" style={inp} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Total Usage Limit</label>
                <input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" style={inp} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Per User Limit</label>
                <input type="number" value={form.per_user_limit} onChange={e => setForm({ ...form, per_user_limit: e.target.value })} placeholder="1" style={inp} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Start Date</label>
                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inp} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>End Date (Expiry)</label>
                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inp} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>User Type</label>
                <select value={form.user_type} onChange={e => setForm({ ...form, user_type: e.target.value })} style={inp}>
                  <option value="all">All Users</option>
                  <option value="new">New Users Only</option>
                  <option value="specific">Specific Emails</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value === 'true' })} style={inp}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {form.user_type === 'specific' && (
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Specific Emails (comma separated)</label>
                  <input value={form.specific_emails} onChange={e => setForm({ ...form, specific_emails: e.target.value })} placeholder="user1@gmail.com, user2@gmail.com" style={inp} />
                </div>
              )}
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', marginTop: '16px' }}>{error}</div>}

            <button onClick={saveCoupon} disabled={saving} style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: 'pointer', width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', marginTop: '20px', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : editing ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
