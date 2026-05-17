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

  const isExpired = (coupon) => coupon.end_date && new Date(coupon.end_date) < new Date();

  return (
    <div className="font-sans bg-[#0a0a0f] min-h-screen text-[#e8e8f0] flex flex-col relative">
      {/* Nav */}
      <nav className="bg-[#0e0e18] border-b border-[#f5c842]/10 p-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/admin/dashboard" className="font-syne text-lg sm:text-xl font-bold text-[#f5c842] no-underline">DigitalVault</Link>
          <Link href="/admin/dashboard" className="text-sm text-gray-500 no-underline hover:text-white transition-colors">← Dashboard</Link>
        </div>
        <button onClick={() => openModal()} className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-[#f5c842]/20 hover:scale-[1.02] transition-transform">
          + Create Coupon
        </button>
      </nav>

      <div className="w-full max-w-6xl mx-auto my-6 sm:my-10 px-4 sm:px-6 flex-1">
        <h1 className="font-syne text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">🎟️ Coupon Management</h1>
        <p className="text-gray-500 text-sm mb-8">{coupons.length} coupons total</p>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Coupons', val: coupons.length },
            { label: 'Active', val: coupons.filter(c => c.status && !isExpired(c)).length },
            { label: 'Total Used', val: coupons.reduce((s, c) => s + c.used_count, 0) },
            { label: 'Revenue Generated', val: '₹' + coupons.reduce((s, c) => s + (c.total_revenue || 0), 0).toLocaleString() },
          ].map(s => (
            <div key={s.label} className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl p-5 hover:border-[#f5c842]/30 transition-colors">
              <p className="text-gray-500 text-xs mb-1 font-medium">{s.label}</p>
              <p className="font-syne text-2xl font-bold text-white">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Coupons Table */}
        <div className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full min-w-[800px] border-collapse text-sm text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400">
                  {['Code', 'Discount', 'Min Order', 'Uses', 'Expiry', 'Status', 'Actions'].map(h => (
                    <th key={h} className="p-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr><td colSpan={7} className="p-10 text-center text-gray-500">No coupons yet. Create your first coupon!</td></tr>
                ) : coupons.map(c => (
                  <tr key={c._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="font-syne font-bold text-[#f5c842] bg-[#f5c842]/10 px-2.5 py-1 rounded text-xs tracking-wider border border-[#f5c842]/20">{c.code}</span>
                    </td>
                    <td className="p-4 text-[#10b981] font-bold">
                      {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                    </td>
                    <td className="p-4 text-gray-400">₹{c.min_order || 0}</td>
                    <td className="p-4 text-gray-400">
                      {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}
                    </td>
                    <td className="p-4">
                      <div className={`text-xs ${isExpired(c) ? 'text-red-500' : 'text-gray-400'}`}>
                        {c.end_date ? new Date(c.end_date).toLocaleDateString('en-IN') : 'Never'}
                        {isExpired(c) && <span className="ml-1 text-[10px]">(Expired)</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <button onClick={() => toggleStatus(c)} className={`border-none cursor-pointer px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${c.status && !isExpired(c) ? 'bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/25' : 'bg-red-500/15 text-red-500 hover:bg-red-500/25'}`}>
                        {c.status && !isExpired(c) ? '● Active' : '● Inactive'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => openModal(c)} className="bg-[#f5c842]/10 border border-[#f5c842]/20 text-[#f5c842] cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#f5c842]/20 transition-colors">Edit</button>
                        <button onClick={() => deleteCoupon(c._id)} className="bg-red-500/10 border border-red-500/20 text-red-500 cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
          <div className="bg-[#12121a] border border-[#f5c842]/20 rounded-2xl w-full max-w-2xl relative shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#f5c842] to-[#e0a800]"></div>
            
            <div className="p-5 sm:p-6 border-b border-white/5 flex justify-between items-center shrink-0">
              <h3 className="font-syne text-lg sm:text-xl font-bold text-white">
                {editing ? '✏️ Edit Coupon' : '🎟️ Create Coupon'}
              </h3>
              <button onClick={() => setModal(false)} className="bg-white/5 border border-white/10 text-gray-400 w-8 h-8 rounded-lg cursor-pointer hover:bg-white/10 hover:text-white transition-all flex items-center justify-center">✕</button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Coupon Code *</label>
                  <input className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl font-mono text-lg font-bold tracking-widest focus:border-[#f5c842]/50 transition-colors" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE50" disabled={!!editing} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Discount Type *</label>
                  <select className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm font-sans cursor-pointer focus:border-[#f5c842]/50 transition-colors appearance-none" value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Discount Value *</label>
                  <input type="number" className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_type === 'percentage' ? '50' : '100'} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Min Order (₹)</label>
                  <input type="number" className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors" value={form.min_order} onChange={e => setForm({ ...form, min_order: e.target.value })} placeholder="499" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Total Usage Limit</label>
                  <input type="number" className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Per User Limit</label>
                  <input type="number" className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors" value={form.per_user_limit} onChange={e => setForm({ ...form, per_user_limit: e.target.value })} placeholder="1" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Start Date</label>
                  <input type="date" className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors [color-scheme:dark]" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">End Date (Expiry)</label>
                  <input type="date" className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors [color-scheme:dark]" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">User Type</label>
                  <select className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm font-sans cursor-pointer focus:border-[#f5c842]/50 transition-colors appearance-none" value={form.user_type} onChange={e => setForm({ ...form, user_type: e.target.value })}>
                    <option value="all">All Users</option>
                    <option value="new">New Users Only</option>
                    <option value="specific">Specific Emails</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Status</label>
                  <select className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm font-sans cursor-pointer focus:border-[#f5c842]/50 transition-colors appearance-none" value={form.status} onChange={e => setForm({ ...form, status: e.target.value === 'true' })}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                {form.user_type === 'specific' && (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Specific Emails (comma separated)</label>
                    <input className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors" value={form.specific_emails} onChange={e => setForm({ ...form, specific_emails: e.target.value })} placeholder="user1@gmail.com, user2@gmail.com" />
                  </div>
                )}
              </div>

              {error && <div className="text-red-500 text-sm bg-red-500/10 px-4 py-3 rounded-xl mt-4 border border-red-500/20">{error}</div>}

              <button onClick={saveCoupon} disabled={saving} className={`w-full mt-6 bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer py-3.5 rounded-xl text-base shadow-lg shadow-[#f5c842]/20 transition-transform ${saving ? 'opacity-70' : 'hover:scale-[1.02]'}`}>
                {saving ? 'Saving...' : editing ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
