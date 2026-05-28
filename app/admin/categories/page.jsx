'use client';
import { useState, useEffect } from 'react';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

export default function AdminCategories() {
  const [parents, setParents] = useState([]);
  const [children, setChildren] = useState([]);
  const [products, setProducts] = useState([]);

  // Add parent category
  const [parentName, setParentName] = useState('');
  const [parentSaving, setParentSaving] = useState(false);
  const [parentError, setParentError] = useState('');

  // Add sub-category
  const [subForms, setSubForms] = useState({}); // { parentId: { open, name, saving } }

  // Rename
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Expand/collapse
  const [expanded, setExpanded] = useState({});

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);

  const headers = { 'Content-Type': 'application/json' };

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories', { headers }),
        fetch('/api/product', { headers }),
      ]);
      const [catData, prodData] = await Promise.all([catRes.json(), prodRes.json()]);
      if (catData.flag) {
        setParents(catData.parents || []);
        setChildren(catData.children || []);
      }
      if (prodData.flag) setProducts(prodData.products || []);
    } catch (e) {}
  }

  function getChildrenOf(parentId) {
    return children.filter(c => c.parent_id?.toString() === parentId.toString());
  }

  function getProductCount(categoryName) {
    return products.filter(p => p.category === categoryName).length;
  }

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // ─── Add parent category ───
  async function addParent(e) {
    e.preventDefault();
    setParentError('');
    if (!parentName.trim()) { setParentError('Name is required'); return; }
    setParentSaving(true);
    const res = await fetch('/api/categories', {
      method: 'POST', headers,
      body: JSON.stringify({ name: parentName.trim() }),
    });
    const data = await res.json();
    if (data.flag) { setParentName(''); loadAll(); }
    else setParentError(data.message);
    setParentSaving(false);
  }

  // ─── Add sub-category ───
  function openSubForm(parentId) {
    setSubForms(prev => ({ ...prev, [parentId]: { open: true, name: '', saving: false } }));
    setExpanded(prev => ({ ...prev, [parentId]: true }));
  }

  function setSubName(parentId, name) {
    setSubForms(prev => ({ ...prev, [parentId]: { ...prev[parentId], name } }));
  }

  function closeSubForm(parentId) {
    setSubForms(prev => ({ ...prev, [parentId]: { open: false, name: '', saving: false } }));
  }

  async function addSub(e, parentId) {
    e.preventDefault();
    const sf = subForms[parentId];
    if (!sf?.name?.trim()) return;
    setSubForms(prev => ({ ...prev, [parentId]: { ...prev[parentId], saving: true } }));
    const res = await fetch('/api/categories', {
      method: 'POST', headers,
      body: JSON.stringify({ name: sf.name.trim(), parent_id: parentId }),
    });
    const data = await res.json();
    if (data.flag) { closeSubForm(parentId); loadAll(); }
    else {
      setSubForms(prev => ({ ...prev, [parentId]: { ...prev[parentId], saving: false, error: data.message } }));
    }
  }

  // ─── Rename ───
  async function renameCategory(id) {
    if (!editName.trim()) return;
    setEditSaving(true); setEditError('');
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ name: editName.trim() }),
    });
    const data = await res.json();
    if (data.flag) { setEditingId(null); setEditName(''); loadAll(); }
    else setEditError(data.message);
    setEditSaving(false);
  }

  // ─── Delete ───
  async function softDeleteCategory(id) {
    await fetch('/api/admin/bin', {
      method: 'POST', headers,
      body: JSON.stringify({ action: 'soft-delete', type: 'category', id }),
    });
    loadAll();
  }

  return (
    <>
      <h1 className="font-syne text-2xl md:text-3xl font-bold text-white tracking-tight mb-8">📂 Categories</h1>

      <div className="w-full max-w-4xl mx-auto my-2 px-2 flex-1 flex flex-col gap-6">

        {/* ── Add Parent Category ── */}
        <div className="bg-[#0e0e18] p-5 sm:p-6 rounded-2xl border border-[#f5c842]/10">
          <h2 className="text-base text-[#f5c842] mb-4 font-syne font-bold">＋ Add New Category</h2>
          {parentError && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-3 text-sm">{parentError}</div>}
          <form onSubmit={addParent} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={parentName}
              onChange={e => setParentName(e.target.value)}
              placeholder="Category name (e.g. Courses)"
              className="bg-[#1a1a2a] border border-white/10 text-white outline-none flex-1 px-4 py-3 rounded-xl text-sm font-sans focus:border-[#f5c842]/50 transition-colors"
              disabled={parentSaving}
            />
            <button
              type="submit"
              disabled={parentSaving}
              className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer px-6 py-3 rounded-xl text-sm whitespace-nowrap shadow-lg shadow-[#f5c842]/20 w-full sm:w-auto ${parentSaving ? 'opacity-70' : 'hover:scale-[1.02]'} transition-transform`}
            >
              {parentSaving ? 'Adding...' : '+ Add Category'}
            </button>
          </form>
        </div>

        {/* ── Category Tree ── */}
        <div className="bg-[#0e0e18] rounded-2xl border border-white/5 overflow-hidden">
          {parents.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">No categories yet. Add one above.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {parents.map(parent => {
                const subs = getChildrenOf(parent._id);
                const isExpanded = expanded[parent._id];
                const sf = subForms[parent._id];
                const parentCount = getProductCount(parent.name);

                return (
                  <div key={parent._id}>
                    {/* ── Parent Row ── */}
                    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors group">

                      {/* Expand toggle */}
                      <button
                        onClick={() => toggleExpand(parent._id)}
                        className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-all border ${subs.length > 0 ? 'border-[#f5c842]/20 text-[#f5c842] bg-[#f5c842]/5 hover:bg-[#f5c842]/10' : 'border-white/5 text-gray-600 cursor-default'}`}
                        disabled={subs.length === 0}
                        title={subs.length > 0 ? (isExpanded ? 'Collapse' : 'Expand') : 'No sub-categories'}
                      >
                        {subs.length > 0 ? (isExpanded ? '▾' : '▸') : '—'}
                      </button>

                      {/* Name / Edit */}
                      <div className="flex-1 min-w-0">
                        {editingId === parent._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') renameCategory(parent._id); if (e.key === 'Escape') setEditingId(null); }}
                              className="bg-[#1a1a2a] border border-[#f5c842]/50 text-white outline-none px-3 py-1.5 rounded-lg text-sm font-sans w-full max-w-[200px]"
                              autoFocus
                              disabled={editSaving}
                            />
                            <button onClick={() => renameCategory(parent._id)} disabled={editSaving} className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#10b981]/20 transition-colors">
                              {editSaving ? '...' : '✓'}
                            </button>
                            <button onClick={() => setEditingId(null)} className="bg-white/5 border border-white/10 text-gray-400 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors">✕</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-bold text-sm font-syne">{parent.name}</span>
                            {subs.length > 0 && (
                              <span className="text-[9px] text-[#f5c842]/60 bg-[#f5c842]/5 border border-[#f5c842]/10 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                {subs.length} sub
                              </span>
                            )}
                            {parentCount > 0 && (
                              <span className="text-[9px] text-[#10b981]/70 bg-[#10b981]/5 border border-[#10b981]/10 px-1.5 py-0.5 rounded-full font-bold">
                                {parentCount} products
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openSubForm(parent._id)}
                          className="bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#c4b5fd] px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#8b5cf6]/20 transition-colors whitespace-nowrap"
                        >
                          + Sub
                        </button>
                        <button
                          onClick={() => { setEditingId(parent._id); setEditName(parent.name); setEditError(''); }}
                          className="bg-[#f5c842]/10 border border-[#f5c842]/20 text-[#f5c842] px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#f5c842]/20 transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteTarget(parent)}
                          className="bg-red-500/10 text-red-500 border-none px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-red-500/20 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* ── Sub-category rows (expanded) ── */}
                    {isExpanded && (
                      <div className="bg-[#0a0a14] border-t border-white/5">
                        {subs.map(sub => {
                          const subCount = getProductCount(sub.name);
                          return (
                            <div key={sub._id} className="flex items-center gap-3 pl-10 pr-4 py-3 hover:bg-white/[0.015] transition-colors group border-b border-white/[0.03] last:border-0">
                              <span className="text-gray-600 text-xs shrink-0">└</span>
                              <div className="flex-1 min-w-0">
                                {editingId === sub._id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editName}
                                      onChange={e => setEditName(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') renameCategory(sub._id); if (e.key === 'Escape') setEditingId(null); }}
                                      className="bg-[#1a1a2a] border border-[#f5c842]/50 text-white outline-none px-3 py-1.5 rounded-lg text-sm font-sans w-full max-w-[200px]"
                                      autoFocus
                                      disabled={editSaving}
                                    />
                                    <button onClick={() => renameCategory(sub._id)} disabled={editSaving} className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#10b981]/20 transition-colors">
                                      {editSaving ? '...' : '✓'}
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="bg-white/5 border border-white/10 text-gray-400 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors">✕</button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-gray-300 text-sm">{sub.name}</span>
                                    {subCount > 0 && (
                                      <span className="text-[9px] text-[#10b981]/70 bg-[#10b981]/5 border border-[#10b981]/10 px-1.5 py-0.5 rounded-full font-bold">
                                        {subCount} products
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setEditingId(sub._id); setEditName(sub.name); setEditError(''); }}
                                  className="bg-[#f5c842]/10 border border-[#f5c842]/20 text-[#f5c842] px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#f5c842]/20 transition-colors"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(sub)}
                                  className="bg-red-500/10 text-red-500 border-none px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-red-500/20 transition-colors"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* ── Inline Add Sub-category Form ── */}
                        {sf?.open ? (
                          <form
                            onSubmit={e => addSub(e, parent._id)}
                            className="flex items-center gap-2 pl-10 pr-4 py-3 border-t border-white/5 bg-[#8b5cf6]/5"
                          >
                            <span className="text-gray-600 text-xs shrink-0">└</span>
                            <input
                              type="text"
                              value={sf.name}
                              onChange={e => setSubName(parent._id, e.target.value)}
                              placeholder="Sub-category name..."
                              className="bg-[#1a1a2a] border border-[#8b5cf6]/40 text-white outline-none flex-1 px-3 py-2 rounded-lg text-sm font-sans focus:border-[#8b5cf6]/70 transition-colors"
                              autoFocus
                              disabled={sf.saving}
                            />
                            <button type="submit" disabled={sf.saving} className="bg-[#8b5cf6] text-white border-none px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-[#7c3aed] transition-colors whitespace-nowrap">
                              {sf.saving ? '...' : '+ Add'}
                            </button>
                            <button type="button" onClick={() => closeSubForm(parent._id)} className="bg-white/5 border border-white/10 text-gray-400 px-2.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors">✕</button>
                            {sf.error && <span className="text-red-400 text-xs">{sf.error}</span>}
                          </form>
                        ) : (
                          <button
                            onClick={() => openSubForm(parent._id)}
                            className="w-full text-left pl-10 pr-4 py-2.5 text-[#8b5cf6]/60 text-xs hover:text-[#c4b5fd] hover:bg-[#8b5cf6]/5 transition-all border-t border-white/[0.03]"
                          >
                            └ + Add sub-category
                          </button>
                        )}
                      </div>
                    )}

                    {/* ── Collapsed: show "+ Sub" hint ── */}
                    {!isExpanded && subs.length === 0 && sf?.open && (
                      <div className="bg-[#0a0a14] border-t border-white/5">
                        <form
                          onSubmit={e => addSub(e, parent._id)}
                          className="flex items-center gap-2 pl-10 pr-4 py-3 bg-[#8b5cf6]/5"
                        >
                          <span className="text-gray-600 text-xs shrink-0">└</span>
                          <input
                            type="text"
                            value={sf.name || ''}
                            onChange={e => setSubName(parent._id, e.target.value)}
                            placeholder="Sub-category name..."
                            className="bg-[#1a1a2a] border border-[#8b5cf6]/40 text-white outline-none flex-1 px-3 py-2 rounded-lg text-sm font-sans focus:border-[#8b5cf6]/70 transition-colors"
                            autoFocus
                            disabled={sf.saving}
                          />
                          <button type="submit" disabled={sf.saving} className="bg-[#8b5cf6] text-white border-none px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-[#7c3aed] transition-colors whitespace-nowrap">
                            {sf.saving ? '...' : '+ Add'}
                          </button>
                          <button type="button" onClick={() => closeSubForm(parent._id)} className="bg-white/5 border border-white/10 text-gray-400 px-2.5 py-2 rounded-lg text-xs cursor-pointer hover:bg-white/10 transition-colors">✕</button>
                          {sf.error && <span className="text-red-400 text-xs">{sf.error}</span>}
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {editError && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm">{editError}</div>}
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
