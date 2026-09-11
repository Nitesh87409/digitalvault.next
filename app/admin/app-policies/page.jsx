'use client';
import { useState, useEffect, useRef } from 'react';

export default function AppPoliciesAdminPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  
  const [formData, setFormData] = useState({ appName: '', slug: '', contactEmail: '' });
  const privacyRef = useRef(null);
  const termsRef = useRef(null);
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchPolicies();
  }, []);

  async function fetchPolicies() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/app-policies?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data.flag) {
        setPolicies(data.appPolicies || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const loadRichEditors = (privacy, terms) => {
    setTimeout(() => {
      if (privacyRef.current) privacyRef.current.innerHTML = privacy || '';
      if (termsRef.current) termsRef.current.innerHTML = terms || '';
    }, 50);
  };

  const fmtPrivacy = (cmd, val = null) => {
    privacyRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const fmtTerms = (cmd, val = null) => {
    termsRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  function handleAddNew() {
    setEditingPolicy(null);
    setFormData({ appName: '', slug: '', contactEmail: '' });
    setShowModal(true);
    loadRichEditors('', '');
    setMessage({ type: '', text: '' });
  }

  function handleEdit(policy) {
    setEditingPolicy(policy);
    setFormData({ appName: policy.appName, slug: policy.slug, contactEmail: policy.contactEmail || '' });
    setShowModal(true);
    loadRichEditors(policy.privacyPolicy, policy.termsConditions);
    setMessage({ type: '', text: '' });
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this app policy? This will break Play Store links if currently used!')) return;
    try {
      const res = await fetch(`/api/admin/app-policies/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.flag) {
        fetchPolicies();
      } else {
        alert(data.message || 'Error deleting');
      }
    } catch (e) {
      alert('Connection error');
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const payload = {
      ...formData,
      privacyPolicy: privacyRef.current?.innerHTML || '',
      termsConditions: termsRef.current?.innerHTML || '',
    };

    const url = editingPolicy ? `/api/admin/app-policies/${editingPolicy._id}` : '/api/admin/app-policies';
    const method = editingPolicy ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.flag) {
        setMessage({ type: 'success', text: data.message });
        fetchPolicies();
        setTimeout(() => setShowModal(false), 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Error saving policy' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Connection error' });
    }
    setSaving(false);
  }

  function copyToClipboard(slug, type) {
    const url = `${window.location.origin}/apps/${slug}/${type}`;
    navigator.clipboard.writeText(url);
    alert(`Copied: ${url}`);
  }

  const Toolbar = ({ fmt }) => (
    <div className="flex flex-wrap gap-2 p-2 bg-[#1a1a24] border-b border-[#2a2a36]">
      <button type="button" onClick={() => fmt('bold')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] font-bold">B</button>
      <button type="button" onClick={() => fmt('italic')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] italic">I</button>
      <button type="button" onClick={() => fmt('underline')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] underline">U</button>
      <div className="w-px h-6 bg-[#3a3a46] mx-1"></div>
      <button type="button" onClick={() => fmt('formatBlock', 'H2')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] font-bold">H2</button>
      <button type="button" onClick={() => fmt('formatBlock', 'H3')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] font-bold">H3</button>
      <button type="button" onClick={() => fmt('formatBlock', 'P')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46]">P</button>
      <div className="w-px h-6 bg-[#3a3a46] mx-1"></div>
      <button type="button" onClick={() => fmt('insertUnorderedList')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46]">• List</button>
      <button type="button" onClick={() => fmt('insertOrderedList')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46]">1. List</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold font-syne text-white">App Policies</h1>
          <p className="text-gray-400 text-sm mt-1">Manage Play Store Privacy Policies & Terms</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="px-6 py-2.5 bg-[#f5c842] text-black font-semibold rounded-xl hover:bg-[#fce599] transition-all"
        >
          + Add New App
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : policies.length === 0 ? (
        <div className="bg-[#111116] rounded-2xl p-10 text-center border border-white/5">
          <div className="text-4xl mb-4">📱</div>
          <h3 className="text-xl font-bold text-white mb-2">No App Policies Yet</h3>
          <p className="text-gray-400 mb-6">Create your first app policy to generate Play Store compliant URLs.</p>
          <button onClick={handleAddNew} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all">Create Policy</button>
        </div>
      ) : (
        <div className="bg-[#111116] rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1a1a24] text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-4 font-medium">App Name</th>
                  <th className="p-4 font-medium">Slug / ID</th>
                  <th className="p-4 font-medium">Contact Email</th>
                  <th className="p-4 font-medium">Links</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {policies.map(policy => (
                  <tr key={policy._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium text-white">{policy.appName}</td>
                    <td className="p-4 text-gray-400">{policy.slug}</td>
                    <td className="p-4 text-gray-400">{policy.contactEmail || '-'}</td>
                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => copyToClipboard(policy.slug, 'privacy')}
                          className="px-3 py-1.5 bg-[#2a2a36] hover:bg-[#3a3a46] text-[#f5c842] rounded text-xs font-medium border border-white/5 transition-colors flex items-center gap-1"
                        >
                          📋 Privacy URL
                        </button>
                        <button 
                          onClick={() => copyToClipboard(policy.slug, 'terms')}
                          className="px-3 py-1.5 bg-[#2a2a36] hover:bg-[#3a3a46] text-[#63b3ed] rounded text-xs font-medium border border-white/5 transition-colors flex items-center gap-1"
                        >
                          📋 Terms URL
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEdit(policy)} className="text-gray-400 hover:text-white mx-2">✏️ Edit</button>
                      <button onClick={() => handleDelete(policy._id)} className="text-red-500 hover:text-red-400">🗑️ Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-start overflow-y-auto p-4 custom-scrollbar">
          <div className="bg-[#111116] rounded-2xl w-full max-w-4xl my-8 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#111116] z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">{editingPolicy ? 'Edit App Policy' : 'Add New App'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              {message.text && (
                <div className={`p-4 rounded-xl mb-6 ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">App Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={formData.appName}
                    onChange={(e) => {
                      const appName = e.target.value;
                      const slug = editingPolicy ? formData.slug : appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                      setFormData({ ...formData, appName, slug });
                    }}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                    placeholder="e.g. Photo Editor Pro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">App Slug (URL) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                    placeholder="e.g. photo-editor-pro"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Contact/Support Email (Optional but recommended)</label>
                <input 
                  type="email" 
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                  placeholder="e.g. support@downloadkart.com"
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-[#f5c842] mb-2 font-syne">Privacy Policy</label>
                <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0f]">
                  <Toolbar fmt={fmtPrivacy} />
                  <div 
                    ref={privacyRef}
                    className="w-full min-h-[300px] p-4 text-white focus:outline-none prose prose-invert max-w-none"
                    contentEditable
                    suppressContentEditableWarning
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Paste or write your privacy policy here. This will be shown at /apps/{formData.slug || '[slug]'}/privacy</p>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-[#63b3ed] mb-2 font-syne">Terms & Conditions</label>
                <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0f]">
                  <Toolbar fmt={fmtTerms} />
                  <div 
                    ref={termsRef}
                    className="w-full min-h-[300px] p-4 text-white focus:outline-none prose prose-invert max-w-none"
                    contentEditable
                    suppressContentEditableWarning
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Paste or write your terms and conditions here. This will be shown at /apps/{formData.slug || '[slug]'}/terms</p>
              </div>

              <div className="flex justify-end gap-4 sticky bottom-0 bg-[#111116] pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={saving} className="px-8 py-3 bg-[#f5c842] text-black font-semibold rounded-xl hover:bg-[#fce599] disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save App Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
