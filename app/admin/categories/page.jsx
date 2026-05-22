'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const router = useRouter();
  const headers = { 'Content-Type': 'application/json' };

  useEffect(() => {
    loadCategories();
    loadProductCounts();
  }, []);

  async function loadCategories() {
    const res = await fetch('/api/categories', { headers });
    const data = await res.json();
    if (data.flag) setCategories(data.categories);
  }

  async function loadProductCounts() {
    try {
      const res = await fetch('/api/product', { headers });
      const data = await res.json();
      if (data.flag) setProducts(data.products || []);
    } catch(e) {}
  }

  function getProductCount(categoryName) {
    return products.filter(p => p.category === categoryName).length;
  }

  async function addCategory(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Category name is required.'); return; }
    
    setSaving(true);
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (data.flag) {
      setName('');
      loadCategories();
    } else {
      setError(data.message);
    }
    setSaving(false);
  }

  async function renameCategory(id) {
    if (!editName.trim()) return;
    setEditSaving(true);
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: editName.trim() })
    });
    const data = await res.json();
    if (data.flag) {
      setEditingId(null);
      setEditName('');
      loadCategories();
      loadProductCounts();
    } else {
      setError(data.message);
    }
    setEditSaving(false);
  }

  async function softDeleteCategory(id) {
    const res = await fetch('/api/admin/bin', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'soft-delete', type: 'category', id })
    });
    const data = await res.json();
    if (data.flag) {
      loadCategories();
    } else {
      setError(data.message || 'Error moving to bin');
    }
  }

  return (
    <>
      <h1 className="font-syne text-2xl md:text-3xl font-bold text-white tracking-tight mb-8">📂 Categories</h1>
      <div className="w-full max-w-4xl mx-auto my-2 px-2 flex-1">

        {/* Add Category Form */}
        <div className="bg-[#0e0e18] p-5 sm:p-6 rounded-2xl border border-[#f5c842]/10 mb-8">
          <h2 className="text-lg text-[#f5c842] mb-4 font-syne font-bold">Add New Category</h2>
          {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={addCategory} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-full sm:flex-1">
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter category name (e.g., AI Tools)" 
                className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors"
                disabled={saving}
              />
            </div>
            <button 
              type="submit" 
              className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer px-6 py-3 rounded-xl text-sm whitespace-nowrap shadow-lg shadow-[#f5c842]/20 w-full sm:w-auto ${saving ? 'opacity-70' : 'hover:scale-[1.02]'} transition-transform`} 
              disabled={saving}
            >
              {saving ? 'Adding...' : '+ Add Category'}
            </button>
          </form>
        </div>

        {/* Category List */}
        <div className="bg-[#0e0e18] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full min-w-[600px] text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#12121a] border-b border-white/5 text-gray-400 uppercase tracking-wider text-xs">
                  <th className="p-4 font-medium">Category Name</th>
                  <th className="p-4 font-medium">Slug</th>
                  <th className="p-4 font-medium text-center">Products</th>
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 text-sm">No categories found. Add one above.</td></tr>
                ) : (
                  categories.map(c => (
                    <tr key={c._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-white font-medium">
                        {editingId === c._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') renameCategory(c._id); if (e.key === 'Escape') setEditingId(null); }}
                              className="bg-[#1a1a2a] border border-[#f5c842]/50 text-white outline-none px-3 py-1.5 rounded-lg text-sm font-sans w-full max-w-[200px]"
                              autoFocus
                              disabled={editSaving}
                            />
                            <button onClick={() => renameCategory(c._id)} disabled={editSaving} className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#10b981]/20 transition-colors whitespace-nowrap">
                              {editSaving ? '...' : '✓'}
                            </button>
                            <button onClick={() => setEditingId(null)} className="bg-white/5 border border-white/10 text-gray-400 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors">✕</button>
                          </div>
                        ) : (
                          c.name
                        )}
                      </td>
                      <td className="p-4 text-gray-500 font-mono text-xs">{c.slug}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getProductCount(c.name) > 0 ? 'bg-[#f5c842]/10 text-[#f5c842]' : 'bg-white/5 text-gray-500'}`}>
                          {getProductCount(c.name)}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { setEditingId(c._id); setEditName(c.name); setError(''); }} 
                            className="bg-[#f5c842]/10 border border-[#f5c842]/20 text-[#f5c842] px-3 py-1.5 rounded-lg cursor-pointer text-xs font-bold hover:bg-[#f5c842]/20 transition-colors"
                          >
                            ✏️ Rename
                          </button>
                          <button 
                            onClick={() => setDeleteTarget(c)} 
                            className="bg-red-500/10 text-red-500 border-none px-3 py-1.5 rounded-lg cursor-pointer text-xs font-bold hover:bg-red-500/20 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => softDeleteCategory(deleteTarget?._id)}
        itemName={deleteTarget?.name}
      />
    </>
  );
}
