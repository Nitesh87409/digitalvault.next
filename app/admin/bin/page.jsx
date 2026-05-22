'use client';
import { useState, useEffect } from 'react';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

const TYPE_FILTERS = [
  { value: 'all', label: '🗂️ All Items' },
  { value: 'product', label: '📦 Products' },
  { value: 'category', label: '📂 Categories' },
  { value: 'coupon', label: '🎟️ Coupons' },
  { value: 'review', label: '⭐ Reviews' },
  { value: 'faq', label: '❓ FAQs' },
  { value: 'testimonial', label: '💬 Testimonials' },
];

export default function AdminBin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [autoDeleteDays, setAutoDeleteDays] = useState(30);
  const [editDays, setEditDays] = useState(30);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [emptyModal, setEmptyModal] = useState(false);
  const headers = { 'Content-Type': 'application/json' };

  useEffect(() => {
    loadBin();
  }, [filter]);

  async function loadBin() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bin?type=${filter}`, { headers });
      const data = await res.json();
      if (data.flag) {
        setItems(data.items || []);
        setAutoDeleteDays(data.bin_auto_delete_days ?? 30);
        setEditDays(data.bin_auto_delete_days ?? 30);
      }
    } catch(e) {}
    setLoading(false);
  }

  async function restoreItem(binId) {
    const res = await fetch('/api/admin/bin', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'restore', bin_id: binId })
    });
    const data = await res.json();
    if (data.flag) loadBin();
  }

  async function permanentDelete(binId) {
    const res = await fetch(`/api/admin/bin?id=${binId}`, { method: 'DELETE', headers });
    const data = await res.json();
    if (data.flag) loadBin();
  }

  async function emptyBin() {
    const res = await fetch(`/api/admin/bin?all=true`, { method: 'DELETE', headers });
    const data = await res.json();
    if (data.flag) loadBin();
  }

  async function saveAutoDeleteDays() {
    setSavingSettings(true);
    await fetch('/api/admin/bin', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'update-settings', bin_auto_delete_days: editDays })
    });
    setAutoDeleteDays(editDays);
    setSavingSettings(false);
    loadBin();
  }

  function timeLeft(autoDeleteAt) {
    if (!autoDeleteAt) return 'Never';
    const diff = new Date(autoDeleteAt).getTime() - Date.now();
    if (diff <= 0) return 'Expiring...';
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  }

  function timeSince(date) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="font-syne text-2xl md:text-3xl font-bold text-white tracking-tight">🗑️ Recycle Bin</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} items in bin · Auto-delete: {autoDeleteDays > 0 ? `${autoDeleteDays} days` : 'Disabled'}</p>
        </div>
        {items.length > 0 && (
          <button onClick={() => setEmptyModal(true)} className="bg-red-500/10 border border-red-500/20 text-red-500 font-syne font-bold cursor-pointer px-5 py-2.5 rounded-xl text-sm w-full sm:w-auto hover:bg-red-500/20 transition-colors">
            🗑️ Empty Bin
          </button>
        )}
      </div>

      <div className="w-full max-w-6xl mx-auto my-2 px-2 flex-1 flex flex-col gap-6">

        {/* Auto-Delete Settings */}
        <div className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl p-5">
          <h3 className="font-syne font-bold text-white text-sm mb-3 flex items-center gap-2">⏰ Auto-Delete Settings</h3>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1">
              <p className="text-gray-400 text-xs mb-2">Items will be permanently deleted after this many days (0 = never auto-delete)</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={editDays}
                  onChange={e => setEditDays(e.target.value)}
                  className="bg-[#1a1a2a] border border-white/10 text-white outline-none px-4 py-2.5 rounded-xl text-sm font-sans w-24 text-center focus:border-[#f5c842]/50 transition-colors"
                />
                <span className="text-gray-500 text-sm">days</span>
                {Number(editDays) !== autoDeleteDays && (
                  <button onClick={saveAutoDeleteDays} disabled={savingSettings} className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer px-4 py-2 rounded-xl text-xs shadow-lg shadow-[#f5c842]/20 hover:scale-[1.02] transition-transform">
                    {savingSettings ? 'Saving...' : '💾 Save'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                filter === f.value
                  ? 'bg-[#f5c842]/10 text-[#f5c842] border-[#f5c842]/30'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="bg-[#12121a] border border-white/5 rounded-2xl overflow-hidden flex flex-col flex-1">
          {loading ? (
            <div className="p-16 text-center text-gray-500">Loading bin...</div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center gap-3">
              <span className="text-5xl">🗑️</span>
              <p className="text-gray-500 text-sm">Recycle bin is empty</p>
              <p className="text-gray-600 text-xs">Deleted items will appear here</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="md:hidden flex flex-col divide-y divide-white/5">
                {items.map(item => (
                  <div key={item._id} className="p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0">{item.type_label?.split(' ')[0]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">{item.type}</span>
                          <span className="text-gray-500 text-xs">Deleted {timeSince(item.deleted_at)}</span>
                        </div>
                        {item.auto_delete_at && (
                          <p className="text-red-400/60 text-[10px] mt-1">Auto-delete in {timeLeft(item.auto_delete_at)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => restoreItem(item._id)} className="flex-1 bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#10b981]/20 transition-colors">
                        ♻️ Restore
                      </button>
                      <button onClick={() => setDeleteModal({ open: true, item })} className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer hover:bg-red-500/20 transition-colors">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[700px] border-collapse text-sm text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400">
                      {['Type', 'Name', 'Deleted', 'Auto-Delete', 'Actions'].map(h => (
                        <th key={h} className="p-4 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <span className="text-[10px] bg-white/5 text-gray-300 px-2.5 py-1 rounded-full uppercase font-bold tracking-wider whitespace-nowrap">
                            {item.type_label}
                          </span>
                        </td>
                        <td className="p-4 text-white font-medium max-w-[250px] truncate">{item.name}</td>
                        <td className="p-4 text-gray-500 text-xs whitespace-nowrap" title={new Date(item.deleted_at).toLocaleString('en-IN')}>
                          {timeSince(item.deleted_at)}
                        </td>
                        <td className="p-4">
                          {item.auto_delete_at ? (
                            <span className="text-red-400/70 text-xs">{timeLeft(item.auto_delete_at)}</span>
                          ) : (
                            <span className="text-gray-600 text-xs">Never</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => restoreItem(item._id)} className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#10b981]/20 transition-colors whitespace-nowrap">
                              ♻️ Restore
                            </button>
                            <button onClick={() => setDeleteModal({ open: true, item })} className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-red-500/20 transition-colors whitespace-nowrap">
                              Delete Forever
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Permanent Delete Modal */}
      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null })}
        onConfirm={() => permanentDelete(deleteModal.item?._id)}
        permanent
        itemName={deleteModal.item?.name}
      />

      {/* Empty Bin Modal */}
      <DeleteConfirmModal
        open={emptyModal}
        onClose={() => setEmptyModal(false)}
        onConfirm={emptyBin}
        permanent
        title="Empty Entire Bin?"
        message={`This will permanently delete all ${items.length} items. This action cannot be undone.`}
      />
    </>
  );
}
