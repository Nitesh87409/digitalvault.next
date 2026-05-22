'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const TAG_COLORS = {
  vip: { bg: 'bg-[#f5c842]/15', color: 'text-[#f5c842]', label: '💎 VIP' },
  high_spender: { bg: 'bg-[#8b5cf6]/15', color: 'text-[#8b5cf6]', label: '💰 High Spender' },
  normal: { bg: 'bg-white/5', color: 'text-gray-400', label: '👤 Normal' },
  new: { bg: 'bg-[#10b981]/15', color: 'text-[#10b981]', label: '🆕 New' },
  risky: { bg: 'bg-red-500/15', color: 'text-red-500', label: '⚠️ Risky' },
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const headers = { 'Content-Type': 'application/json' };

  useEffect(() => {
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
    <>
      <h1 className="font-syne text-2xl md:text-3xl font-bold text-white tracking-tight mb-8">👥 Customer Management</h1>
      <div className="w-full max-w-7xl mx-auto my-2 px-2 flex-1 flex flex-col">
        <p className="text-gray-500 text-sm mb-6 sm:mb-8">{customers.length} total customers</p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Total', val: customers.length, color: '#fff' },
            { label: 'VIP', val: customers.filter(c => c.tag === 'vip').length, color: '#f5c842' },
            { label: 'New', val: customers.filter(c => c.tag === 'new').length, color: '#10b981' },
            { label: 'Blocked', val: customers.filter(c => c.is_blocked).length, color: '#ef4444' },
            { label: 'Revenue', val: '₹' + totalRevenue.toLocaleString(), color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl p-4 sm:p-5 hover:border-[#f5c842]/30 transition-colors min-w-0">
              <p className="text-gray-500 text-xs mb-1 font-medium truncate">{s.label}</p>
              <p className="font-syne text-xl sm:text-2xl font-bold truncate" style={{ color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 bg-[#12121a] border border-white/10 text-white outline-none px-4 py-3 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors w-full"
          />
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)} 
            className="bg-[#12121a] border border-white/10 text-white outline-none px-4 py-3 rounded-xl text-sm font-sans cursor-pointer focus:border-[#f5c842]/50 transition-colors appearance-none sm:w-48 w-full"
          >
            <option value="all">All Customers</option>
            <option value="vip">VIP</option>
            <option value="new">New</option>
            <option value="high_spender">High Spender</option>
            <option value="risky">Risky</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl overflow-hidden flex flex-col flex-1">
          {loading ? (
            <div className="p-16 text-center text-gray-500">Loading customers...</div>
          ) : (
            <>
              {/* Mobile Cards Layout */}
              <div className="md:hidden flex flex-col divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">No customers found.</div>
                ) : filtered.map(c => {
                  const tag = TAG_COLORS[c.tag] || TAG_COLORS.normal;
                  return (
                    <div key={c._id} className="p-4 flex flex-col gap-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5c842] to-[#e0a800] flex items-center justify-center font-syne font-bold text-[#0a0a0f] text-base shrink-0 shadow-sm shadow-[#f5c842]/20">
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-white font-medium truncate block">{c.name}</span>
                          <p className="text-gray-500 text-xs truncate">{c.email}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`${tag.bg} ${tag.color} px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap`}>
                              {tag.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${c.is_blocked ? 'bg-red-500/15 text-red-500' : 'bg-[#10b981]/15 text-[#10b981]'}`}>
                              {c.is_blocked ? '🚫 Blocked' : '✓ Active'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center bg-[#0a0a0f] rounded-lg p-3 border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-[10px] uppercase tracking-wider">Orders</span>
                          <span className="text-white font-bold">{c.total_orders || 0}</span>
                        </div>
                        <div className="flex flex-col text-center">
                          <span className="text-gray-500 text-[10px] uppercase tracking-wider">Spent</span>
                          <span className="text-[#f5c842] font-bold">₹{(c.total_spent || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-gray-500 text-[10px] uppercase tracking-wider">Joined</span>
                          <span className="text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Link href={`/admin/customers/${c._id}`} className="flex-1 text-center bg-[#f5c842]/10 border border-[#f5c842]/20 text-[#f5c842] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#f5c842]/20 transition-colors no-underline">View</Link>
                        <button onClick={() => toggleBlock(c)} className={`flex-1 text-center px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors border ${c.is_blocked ? 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/20' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'}`}>
                          {c.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto w-full custom-scrollbar">
                <table className="w-full min-w-[900px] border-collapse text-sm text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400">
                    {['Customer', 'Email', 'Orders', 'Total Spent', 'Joined', 'Tag', 'Status', 'Actions'].map(h => (
                      <th key={h} className="p-4 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="p-10 text-center text-gray-500">No customers found.</td></tr>
                  ) : filtered.map(c => {
                    const tag = TAG_COLORS[c.tag] || TAG_COLORS.normal;
                    return (
                      <tr key={c._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f5c842] to-[#e0a800] flex items-center justify-center font-syne font-bold text-[#0a0a0f] text-sm shrink-0 shadow-sm shadow-[#f5c842]/20">
                              {c.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white font-medium truncate max-w-[150px]">{c.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-400 truncate max-w-[180px] whitespace-nowrap" title={c.email}>{c.email}</td>
                        <td className="p-4 text-white font-bold whitespace-nowrap">{c.total_orders || 0}</td>
                        <td className="p-4 text-[#f5c842] font-bold whitespace-nowrap">₹{(c.total_spent || 0).toLocaleString()}</td>
                        <td className="p-4 text-gray-500 text-xs whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`${tag.bg} ${tag.color} px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap`}>
                            {tag.label}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${c.is_blocked ? 'bg-red-500/15 text-red-500' : 'bg-[#10b981]/15 text-[#10b981]'}`}>
                            {c.is_blocked ? '🚫 Blocked' : '✓ Active'}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Link href={`/admin/customers/${c._id}`} className="bg-[#f5c842]/10 border border-[#f5c842]/20 text-[#f5c842] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#f5c842]/20 transition-colors no-underline">View</Link>
                            <button onClick={() => toggleBlock(c)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border ${c.is_blocked ? 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/20' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'}`}>
                              {c.is_blocked ? 'Unblock' : 'Block'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
