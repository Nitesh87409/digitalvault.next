'use client';
import { useState, useEffect, useRef } from 'react';

const initialFormState = {
  appName: '',
  slug: '',
  contactEmail: '',
  playStoreUrl: '',
  appIcon: '',
  shortDescription: '',
  rating: '',
  installs: '',
  developerName: '',
  screenshots: [],
};

export default function AppPoliciesAdminPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  
  const [formData, setFormData] = useState(initialFormState);
  const [playStoreInput, setPlayStoreInput] = useState('');
  const [scraping, setScraping] = useState(false);
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');

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
    setFormData(initialFormState);
    setPlayStoreInput('');
    setShowModal(true);
    loadRichEditors('', '');
    setMessage({ type: '', text: '' });
  }

  function handleEdit(policy) {
    setEditingPolicy(policy);
    setFormData({
      appName: policy.appName || '',
      slug: policy.slug || '',
      contactEmail: policy.contactEmail || '',
      playStoreUrl: policy.playStoreUrl || '',
      appIcon: policy.appIcon || '',
      shortDescription: policy.shortDescription || '',
      rating: policy.rating || '',
      installs: policy.installs || '',
      developerName: policy.developerName || '',
      screenshots: Array.isArray(policy.screenshots) ? policy.screenshots : [],
    });
    setPlayStoreInput(policy.playStoreUrl || '');
    setShowModal(true);
    loadRichEditors(policy.privacyPolicy, policy.termsConditions);
    setMessage({ type: '', text: '' });
  }

  async function handleScrapePlayStore() {
    if (!playStoreInput.trim()) return;
    setScraping(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/admin/app-policies/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: playStoreInput.trim() }),
      });
      const result = await res.json();

      if (result.flag && result.data) {
        const scraped = result.data;
        setFormData(prev => ({
          ...prev,
          appName: scraped.appName || prev.appName,
          slug: prev.slug || scraped.slug,
          playStoreUrl: scraped.playStoreUrl || prev.playStoreUrl,
          appIcon: scraped.appIcon || prev.appIcon,
          shortDescription: scraped.shortDescription || prev.shortDescription,
          developerName: scraped.developerName || prev.developerName,
          contactEmail: scraped.contactEmail || prev.contactEmail,
          rating: scraped.rating || prev.rating,
          installs: scraped.installs || prev.installs,
          screenshots: scraped.screenshots?.length ? scraped.screenshots : prev.screenshots,
        }));
        setMessage({ type: 'success', text: '⚡ App details fetched successfully from Google Play!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to fetch from Play Store' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error while fetching Play Store metadata' });
    }
    setScraping(false);
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
        setTimeout(() => setShowModal(false), 1200);
      } else {
        setMessage({ type: 'error', text: data.message || 'Error saving policy' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Connection error' });
    }
    setSaving(false);
  }

  function copyToClipboard(slug, type = null) {
    const path = type ? `/apps/${slug}/${type}` : `/apps/${slug}`;
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    alert(`Copied: ${url}`);
  }

  function addScreenshot() {
    if (!newScreenshotUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      screenshots: [...prev.screenshots, newScreenshotUrl.trim()]
    }));
    setNewScreenshotUrl('');
  }

  function removeScreenshot(index) {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }));
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
          <h1 className="text-2xl font-bold font-syne text-white">App Management & Policies</h1>
          <p className="text-gray-400 text-sm mt-1">Manage Play Store Landing Pages, Privacy Policies & Terms</p>
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
          <h3 className="text-xl font-bold text-white mb-2">No Apps Added Yet</h3>
          <p className="text-gray-400 mb-6">Add your first app to create a public landing page and Play Store compliant legal URLs.</p>
          <button onClick={handleAddNew} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all">Add App</button>
        </div>
      ) : (
        <div className="bg-[#111116] rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1a1a24] text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-4 font-medium">App</th>
                  <th className="p-4 font-medium">Slug / ID</th>
                  <th className="p-4 font-medium">Contact Email</th>
                  <th className="p-4 font-medium">Public URLs</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {policies.map(policy => (
                  <tr key={policy._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium text-white">
                      <div className="flex items-center gap-3">
                        {policy.appIcon ? (
                          <img src={policy.appIcon} alt={policy.appName} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">📱</div>
                        )}
                        <div>
                          <div className="font-semibold text-white">{policy.appName}</div>
                          {policy.developerName && <div className="text-xs text-gray-500">{policy.developerName}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">{policy.slug}</td>
                    <td className="p-4 text-gray-400">{policy.contactEmail || '-'}</td>
                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => copyToClipboard(policy.slug)}
                          className="px-3 py-1.5 bg-[#f5c842]/10 hover:bg-[#f5c842]/20 text-[#f5c842] rounded text-xs font-semibold border border-[#f5c842]/20 transition-colors flex items-center gap-1"
                        >
                          🚀 Landing Page
                        </button>
                        <button 
                          onClick={() => copyToClipboard(policy.slug, 'privacy')}
                          className="px-3 py-1.5 bg-[#2a2a36] hover:bg-[#3a3a46] text-gray-300 rounded text-xs font-medium border border-white/5 transition-colors flex items-center gap-1"
                        >
                          📋 Privacy URL
                        </button>
                        <button 
                          onClick={() => copyToClipboard(policy.slug, 'terms')}
                          className="px-3 py-1.5 bg-[#2a2a36] hover:bg-[#3a3a46] text-gray-300 rounded text-xs font-medium border border-white/5 transition-colors flex items-center gap-1"
                        >
                          📋 Terms URL
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
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
              <h2 className="text-xl font-bold text-white">{editingPolicy ? 'Edit App Details' : 'Add New App'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              {message.text && (
                <div className={`p-4 rounded-xl mb-6 ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                  {message.text}
                </div>
              )}

              {/* 1-Click Play Store Scraper Section */}
              <div className="bg-[#1a1a24] p-5 rounded-2xl border border-white/10 mb-8">
                <label className="block text-xs font-bold text-[#f5c842] uppercase tracking-wider mb-2 font-syne">
                  ⚡ 1-Click Auto-Fetch from Google Play Store
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="url"
                    value={playStoreInput}
                    onChange={(e) => setPlayStoreInput(e.target.value)}
                    placeholder="Paste Google Play Store URL (e.g. https://play.google.com/store/apps/details?id=...)"
                    className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c842]"
                  />
                  <button
                    type="button"
                    onClick={handleScrapePlayStore}
                    disabled={scraping || !playStoreInput.trim()}
                    className="px-6 py-3 bg-[#f5c842] text-black font-semibold rounded-xl hover:bg-[#fce599] disabled:opacity-50 text-sm whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    {scraping ? 'Fetching Data...' : '⚡ Fetch Details'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Automatically extracts App Name, Icon, Description, Screenshots, and Developer info from Google Play!
                </p>
              </div>

              {/* App Basic Info */}
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
                    placeholder="e.g. Olo Player"
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
                    placeholder="e.g. olo-player"
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Public URL: /apps/{formData.slug || '[slug]'}</span>
                </div>
              </div>

              {/* Play Store Link & Icon */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Google Play Store URL</label>
                  <input 
                    type="url" 
                    value={formData.playStoreUrl}
                    onChange={(e) => setFormData({ ...formData, playStoreUrl: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                    placeholder="https://play.google.com/store/apps/details?id=..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">App Icon URL</label>
                  <div className="flex gap-3 items-center">
                    {formData.appIcon && (
                      <img src={formData.appIcon} alt="Preview" className="w-11 h-11 rounded-xl object-cover border border-white/10" />
                    )}
                    <input 
                      type="url" 
                      value={formData.appIcon}
                      onChange={(e) => setFormData({ ...formData, appIcon: e.target.value })}
                      className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                      placeholder="https://.../icon.png"
                    />
                  </div>
                </div>
              </div>

              {/* Tagline / Short Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Short Description / Tagline</label>
                <textarea 
                  rows="2"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                  placeholder="e.g. Ultra HD 4K Video Player with subtitle support and smooth playback."
                />
              </div>

              {/* Rating, Installs, Contact Email */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Rating (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                    placeholder="e.g. 4.8 ★"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Downloads / Installs</label>
                  <input 
                    type="text" 
                    value={formData.installs}
                    onChange={(e) => setFormData({ ...formData, installs: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                    placeholder="e.g. 50K+ downloads"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Contact / Support Email</label>
                  <input 
                    type="email" 
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                    placeholder="support@downloadkart.com"
                  />
                </div>
              </div>

              {/* Screenshots Gallery Input */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-400 mb-2">Screenshots ({formData.screenshots.length})</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="url"
                    value={newScreenshotUrl}
                    onChange={(e) => setNewScreenshotUrl(e.target.value)}
                    placeholder="Paste image URL to add manual screenshot"
                    className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#f5c842]"
                  />
                  <button 
                    type="button" 
                    onClick={addScreenshot}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm"
                  >
                    + Add Image
                  </button>
                </div>
                {formData.screenshots.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto p-2 bg-[#0a0a0f] rounded-xl border border-white/10">
                    {formData.screenshots.map((shot, idx) => (
                      <div key={idx} className="relative flex-shrink-0 group">
                        <img src={shot} alt={`Screenshot ${idx + 1}`} className="w-24 h-44 object-cover rounded-lg border border-white/10" />
                        <button 
                          type="button" 
                          onClick={() => removeScreenshot(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md opacity-90 group-hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy Policy Editor */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-[#f5c842] mb-2 font-syne">Privacy Policy</label>
                <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0f]">
                  <Toolbar fmt={fmtPrivacy} />
                  <div 
                    ref={privacyRef}
                    className="w-full min-h-[250px] p-4 text-white focus:outline-none prose prose-invert max-w-none"
                    contentEditable
                    suppressContentEditableWarning
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Public URL: /apps/{formData.slug || '[slug]'}/privacy</p>
              </div>

              {/* Terms & Conditions Editor */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-[#63b3ed] mb-2 font-syne">Terms & Conditions</label>
                <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0f]">
                  <Toolbar fmt={fmtTerms} />
                  <div 
                    ref={termsRef}
                    className="w-full min-h-[250px] p-4 text-white focus:outline-none prose prose-invert max-w-none"
                    contentEditable
                    suppressContentEditableWarning
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Public URL: /apps/{formData.slug || '[slug]'}/terms</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 sticky bottom-0 bg-[#111116] pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={saving} className="px-8 py-3 bg-[#f5c842] text-black font-semibold rounded-xl hover:bg-[#fce599] disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save App'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
