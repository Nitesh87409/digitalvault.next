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

  const inp = { background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' };
  const btn = { background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '10px', fontSize: '0.875rem', whiteSpace: 'nowrap' };

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0f', minHeight: '100vh', color: '#e8e8f0' }}>
      {/* Nav */}
      <nav style={{ background: '#0e0e18', borderBottom: '1px solid rgba(245,200,66,0.1)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/admin/dashboard" style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#f5c842', textDecoration: 'none' }}>DigitalVault</Link>
          <Link href="/admin/dashboard" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>← Dashboard</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', color: '#fff', marginBottom: '24px' }}>Manage Categories</h1>

        {/* Add Category Form */}
        <div style={{ background: '#0e0e18', padding: '24px', borderRadius: '16px', border: '1px solid rgba(245,200,66,0.1)', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#f5c842', marginBottom: '16px', fontFamily: 'Syne, sans-serif' }}>Add New Category</h2>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' }}>{error}</div>}
          <form onSubmit={addCategory} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter category name (e.g., AI Tools)" 
                style={inp} 
                disabled={saving}
              />
            </div>
            <button type="submit" style={{ ...btn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
              {saving ? 'Adding...' : '+ Add Category'}
            </button>
          </form>
        </div>

        {/* Category List */}
        <div style={{ background: '#0e0e18', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#12121a', display: 'flex', color: '#a0a0b0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <div style={{ flex: 2 }}>Category Name</div>
            <div style={{ flex: 2 }}>Slug</div>
            <div style={{ flex: 1 }}>Created</div>
            <div style={{ width: '80px', textAlign: 'right' }}>Actions</div>
          </div>
          
          {categories.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>No categories found. Add one above.</div>
          ) : (
            categories.map(c => (
              <div key={c._id} style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
                <div style={{ flex: 2, color: '#fff', fontWeight: 500 }}>{c.name}</div>
                <div style={{ flex: 2, color: '#a0a0b0', fontFamily: 'monospace' }}>{c.slug}</div>
                <div style={{ flex: 1, color: '#a0a0b0' }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                <div style={{ width: '80px', textAlign: 'right' }}>
                  <button onClick={() => deleteCategory(c._id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
