'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const headers = { 'Content-Type': 'application/json' };

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const res = await fetch('/api/categories', { headers });
    const data = await res.json();
    if (data.flag) setCategories(data.categories);
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

  async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE', headers });
    const data = await res.json();
    if (data.flag) {
      loadCategories();
    } else {
      alert(data.message);
    }
  }

  return (
    <div className="font-sans bg-[#0a0a0f] min-h-screen text-[#e8e8f0] flex flex-col">
      {/* Nav */}
      <nav className="bg-[#0e0e18] border-b border-[#f5c842]/10 p-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/admin/dashboard" className="font-syne text-lg sm:text-xl font-bold text-[#f5c842] no-underline">DigitalVault</Link>
          <Link href="/admin/dashboard" className="text-sm text-gray-500 no-underline hover:text-white transition-colors">← Dashboard</Link>
        </div>
      </nav>

      <div className="w-full max-w-4xl mx-auto my-6 sm:my-10 px-4 sm:px-6 flex-1">
        <h1 className="font-syne text-2xl sm:text-3xl font-bold text-white mb-6">Manage Categories</h1>

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
            <table className="w-full min-w-[500px] text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#12121a] border-b border-white/5 text-gray-400 uppercase tracking-wider text-xs">
                  <th className="p-4 font-medium">Category Name</th>
                  <th className="p-4 font-medium">Slug</th>
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-500 text-sm">No categories found. Add one above.</td></tr>
                ) : (
                  categories.map(c => (
                    <tr key={c._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-white font-medium">{c.name}</td>
                      <td className="p-4 text-gray-500 font-mono text-xs">{c.slug}</td>
                      <td className="p-4 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => deleteCategory(c._id)} className="bg-red-500/10 text-red-500 border-none px-3 py-1.5 rounded-lg cursor-pointer text-xs font-bold hover:bg-red-500/20 transition-colors">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
