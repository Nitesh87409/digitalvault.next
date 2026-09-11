'use client';
import { useState, useEffect, useRef } from 'react';

export default function AppPoliciesAdminPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal 1: Policy Only Modal (Pre-Launch)
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [policyForm, setPolicyForm] = useState({
    appName: '',
    slug: '',
    contactEmail: '',
  });
  const privacyRef = useRef(null);
  const termsRef = useRef(null);

  // Modal 2: Landing Page & SEO Blog Modal (Post-Launch)
  const [showLandingModal, setShowLandingModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('new');
  const [landingForm, setLandingForm] = useState({
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
  });
  const [playStoreInput, setPlayStoreInput] = useState('');
  const [scraping, setScraping] = useState(false);
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');
  const landingBlogRef = useRef(null);

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

  // --- Helpers for Rich Text Editors ---
  const loadPolicyEditors = (privacy, terms) => {
    setTimeout(() => {
      if (privacyRef.current) privacyRef.current.innerHTML = privacy || '';
      if (termsRef.current) termsRef.current.innerHTML = terms || '';
    }, 50);
  };

  const loadLandingBlogEditor = (content) => {
    setTimeout(() => {
      if (landingBlogRef.current) landingBlogRef.current.innerHTML = content || '';
    }, 50);
  };

  const fmtDoc = (ref, cmd, val = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
  };

  // --- Open Modal 1: Policy Modal ---
  function openAddPolicyModal() {
    setEditingPolicy(null);
    setPolicyForm({ appName: '', slug: '', contactEmail: '' });
    setShowPolicyModal(true);
    loadPolicyEditors('', '');
    setMessage({ type: '', text: '' });
  }

  function openEditPolicyModal(policy) {
    setEditingPolicy(policy);
    setPolicyForm({
      appName: policy.appName || '',
      slug: policy.slug || '',
      contactEmail: policy.contactEmail || '',
    });
    setShowPolicyModal(true);
    loadPolicyEditors(policy.privacyPolicy, policy.termsConditions);
    setMessage({ type: '', text: '' });
  }

  // --- Open Modal 2: Landing Page & SEO Blog Modal ---
  function openLandingModal(preSelectedPolicy = null) {
    if (preSelectedPolicy) {
      setSelectedAppId(preSelectedPolicy._id);
      populateLandingForm(preSelectedPolicy);
    } else if (policies.length > 0) {
      setSelectedAppId(policies[0]._id);
      populateLandingForm(policies[0]);
    } else {
      setSelectedAppId('new');
      resetLandingForm();
    }
    setShowLandingModal(true);
    setMessage({ type: '', text: '' });
  }

  function populateLandingForm(policy) {
    setLandingForm({
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
    loadLandingBlogEditor(policy.landingPageContent || '');
  }

  function resetLandingForm() {
    setLandingForm({
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
    });
    setPlayStoreInput('');
    loadLandingBlogEditor('');
  }

  function handleAppSelectionChange(e) {
    const val = e.target.value;
    setSelectedAppId(val);
    if (val === 'new') {
      resetLandingForm();
    } else {
      const found = policies.find(p => p._id === val);
      if (found) populateLandingForm(found);
    }
  }

  // --- 1-Click Play Store Scraper ---
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
        const s = result.data;
        setLandingForm(prev => ({
          ...prev,
          appName: s.appName || prev.appName,
          slug: prev.slug || s.slug,
          playStoreUrl: s.playStoreUrl || prev.playStoreUrl,
          appIcon: s.appIcon || prev.appIcon,
          shortDescription: s.shortDescription || prev.shortDescription,
          developerName: s.developerName || prev.developerName,
          contactEmail: s.contactEmail || prev.contactEmail,
          rating: s.rating || prev.rating,
          installs: s.installs || prev.installs,
          screenshots: s.screenshots?.length ? s.screenshots : prev.screenshots,
        }));
        setMessage({ type: 'success', text: '⚡ Play Store details fetched successfully!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to fetch from Play Store' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error while fetching Play Store metadata' });
    }
    setScraping(false);
  }

  // --- Save Policy Form (Modal 1) ---
  async function handleSavePolicy(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const payload = {
      ...policyForm,
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
        setTimeout(() => setShowPolicyModal(false), 1200);
      } else {
        setMessage({ type: 'error', text: data.message || 'Error saving policy' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Connection error' });
    }
    setSaving(false);
  }

  // --- Save Landing Page Form (Modal 2) ---
  async function handleSaveLanding(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const payload = {
      ...landingForm,
      landingPageContent: landingBlogRef.current?.innerHTML || '',
    };

    const isNew = selectedAppId === 'new';
    const url = isNew ? '/api/admin/app-policies' : `/api/admin/app-policies/${selectedAppId}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.flag) {
        setMessage({ type: 'success', text: '🚀 Landing Page & SEO Guide saved successfully!' });
        fetchPolicies();
        setTimeout(() => setShowLandingModal(false), 1200);
      } else {
        setMessage({ type: 'error', text: data.message || 'Error saving Landing Page' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Connection error' });
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this app? This will remove its landing page, privacy policy and terms!')) return;
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

  function copyToClipboard(slug, type = null) {
    const path = type ? `/apps/${slug}/${type}` : `/apps/${slug}`;
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    alert(`Copied: ${url}`);
  }

  const Toolbar = ({ onFmt }) => (
    <div className="flex flex-wrap gap-2 p-2 bg-[#1a1a24] border-b border-[#2a2a36]">
      <button type="button" onClick={() => onFmt('bold')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] font-bold">B</button>
      <button type="button" onClick={() => onFmt('italic')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] italic">I</button>
      <button type="button" onClick={() => onFmt('underline')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] underline">U</button>
      <div className="w-px h-6 bg-[#3a3a46] mx-1"></div>
      <button type="button" onClick={() => onFmt('formatBlock', 'H2')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] font-bold">H2</button>
      <button type="button" onClick={() => onFmt('formatBlock', 'H3')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] font-bold">H3</button>
      <button type="button" onClick={() => onFmt('formatBlock', 'P')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46]">P</button>
      <div className="w-px h-6 bg-[#3a3a46] mx-1"></div>
      <button type="button" onClick={() => onFmt('insertUnorderedList')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46]">• List</button>
      <button type="button" onClick={() => onFmt('insertOrderedList')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46]">1. List</button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto w-full">
      {/* Top Header with 2 Distinct Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-syne text-white">App Management & Policies</h1>
          <p className="text-gray-400 text-sm mt-1">Manage Play Store Policies, Landing Pages & SEO Guides</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Button 1: Pre-launch policy creation */}
          <button 
            onClick={openAddPolicyModal}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all flex items-center gap-2 border border-white/10"
          >
            📄 + Add Policy
          </button>

          {/* Button 2: Post-launch landing page & SEO guide */}
          <button 
            onClick={() => openLandingModal(null)}
            className="px-6 py-2.5 bg-[#f5c842] hover:bg-[#fce599] text-black font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-[#f5c842]/10"
          >
            ⚡ Setup Landing Page
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : policies.length === 0 ? (
        <div className="bg-[#111116] rounded-2xl p-10 text-center border border-white/5">
          <div className="text-4xl mb-4">📱</div>
          <h3 className="text-xl font-bold text-white mb-2">No Apps Added Yet</h3>
          <p className="text-gray-400 mb-6">Create your first app policy for Play Store approval or setup a landing page.</p>
          <div className="flex justify-center gap-4">
            <button onClick={openAddPolicyModal} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all">📄 Create Policy</button>
            <button onClick={() => openLandingModal(null)} className="px-6 py-2 bg-[#f5c842] hover:bg-[#fce599] text-black font-semibold rounded-lg transition-all">⚡ Setup Landing Page</button>
          </div>
        </div>
      ) : (
        <div className="bg-[#111116] rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1a1a24] text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-4 font-medium">App</th>
                  <th className="p-4 font-medium">Slug</th>
                  <th className="p-4 font-medium">Policy URLs</th>
                  <th className="p-4 font-medium">Landing & SEO</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {policies.map(policy => {
                  const hasLanding = !!(policy.playStoreUrl || policy.appIcon || policy.landingPageContent);
                  return (
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
                      <td className="p-4 text-gray-400 font-mono text-xs">{policy.slug}</td>
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
                      <td className="p-4">
                        {hasLanding ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <button 
                              onClick={() => copyToClipboard(policy.slug)}
                              className="px-3 py-1.5 bg-[#f5c842]/10 hover:bg-[#f5c842]/20 text-[#f5c842] rounded text-xs font-semibold border border-[#f5c842]/20 transition-colors flex items-center gap-1"
                            >
                              🚀 Landing Page
                            </button>
                            {policy.landingPageContent && (
                              <span className="text-[11px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">
                                SEO Blog Active
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => openLandingModal(policy)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded text-xs border border-white/10 transition-colors"
                          >
                            + Setup Landing Page
                          </button>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button onClick={() => openEditPolicyModal(policy)} className="text-gray-400 hover:text-white mx-1 text-xs">✏️ Policy</button>
                        <button onClick={() => openLandingModal(policy)} className="text-[#f5c842] hover:underline mx-1 text-xs">⚡ Landing</button>
                        <button onClick={() => handleDelete(policy._id)} className="text-red-500 hover:text-red-400 mx-1 text-xs">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT POLICY ONLY (Pre-Launch Friendly)     */}
      {/* ========================================================= */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-start overflow-y-auto p-4 custom-scrollbar">
          <div className="bg-[#111116] rounded-2xl w-full max-w-4xl my-8 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#111116] z-10 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingPolicy ? 'Edit App Policy' : '📄 Add App Policy (Pre-Launch)'}
                </h2>
                <p className="text-xs text-gray-400 mt-1">Generate Google Play compliant Privacy Policy and Terms URLs.</p>
              </div>
              <button onClick={() => setShowPolicyModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            
            <form onSubmit={handleSavePolicy} className="p-6">
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
                    value={policyForm.appName}
                    onChange={(e) => {
                      const appName = e.target.value;
                      const slug = editingPolicy ? policyForm.slug : appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                      setPolicyForm({ ...policyForm, appName, slug });
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
                    value={policyForm.slug}
                    onChange={(e) => setPolicyForm({ ...policyForm, slug: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                    placeholder="e.g. olo-player"
                  />
                  <span className="text-xs text-gray-500 mt-1 block">URL: /apps/{policyForm.slug || '[slug]'}/privacy</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Contact / Support Email (For users & Play Console)</label>
                <input 
                  type="email" 
                  value={policyForm.contactEmail}
                  onChange={(e) => setPolicyForm({ ...policyForm, contactEmail: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                  placeholder="e.g. support@downloadkart.com"
                />
              </div>

              {/* Privacy Policy */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-[#f5c842] mb-2 font-syne">Privacy Policy</label>
                <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0f]">
                  <Toolbar onFmt={(cmd, val) => fmtDoc(privacyRef, cmd, val)} />
                  <div 
                    ref={privacyRef}
                    className="w-full min-h-[220px] p-4 text-white focus:outline-none prose prose-invert max-w-none"
                    contentEditable
                    suppressContentEditableWarning
                  />
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-[#63b3ed] mb-2 font-syne">Terms & Conditions</label>
                <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0f]">
                  <Toolbar onFmt={(cmd, val) => fmtDoc(termsRef, cmd, val)} />
                  <div 
                    ref={termsRef}
                    className="w-full min-h-[220px] p-4 text-white focus:outline-none prose prose-invert max-w-none"
                    contentEditable
                    suppressContentEditableWarning
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 sticky bottom-0 bg-[#111116] pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowPolicyModal(false)} className="px-6 py-3 rounded-xl text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={saving} className="px-8 py-3 bg-[#f5c842] text-black font-semibold rounded-xl hover:bg-[#fce599] disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SETUP LANDING PAGE & SEO BLOG (Post-Launch)     */}
      {/* ========================================================= */}
      {showLandingModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-start overflow-y-auto p-4 custom-scrollbar">
          <div className="bg-[#111116] rounded-2xl w-full max-w-4xl my-8 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#111116] z-10 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-white">⚡ Setup Landing Page & SEO App Guide</h2>
                <p className="text-xs text-gray-400 mt-1">Connect Play Store metadata and write an SEO blog for Google search ranking.</p>
              </div>
              <button onClick={() => setShowLandingModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={handleSaveLanding} className="p-6">
              {message.text && (
                <div className={`p-4 rounded-xl mb-6 ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                  {message.text}
                </div>
              )}

              {/* App Selection Dropdown */}
              <div className="mb-6 bg-[#1a1a24] p-4 rounded-xl border border-white/10">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Select App to Configure:
                </label>
                <select
                  value={selectedAppId}
                  onChange={handleAppSelectionChange}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]"
                >
                  <option value="new">+ Create New App from Play Store</option>
                  {policies.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.appName} ({p.slug})
                    </option>
                  ))}
                </select>
              </div>

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
                    placeholder="Paste Google Play URL (https://play.google.com/store/apps/details?id=...)"
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
                  Fetches App Name, Icon, Screenshots, Downloads count, Rating, and Developer info in 1-click!
                </p>
              </div>

              {/* App Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">App Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={landingForm.appName}
                    onChange={(e) => setLandingForm({ ...landingForm, appName: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">App Slug (URL) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={landingForm.slug}
                    onChange={(e) => setLandingForm({ ...landingForm, slug: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Public URL: /apps/{landingForm.slug || '[slug]'}</span>
                </div>
              </div>

              {/* Play Store Link & Icon */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Google Play Store Download URL</label>
                  <input 
                    type="url" 
                    value={landingForm.playStoreUrl}
                    onChange={(e) => setLandingForm({ ...landingForm, playStoreUrl: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                    placeholder="https://play.google.com/store/apps/details?id=..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">App Icon URL</label>
                  <div className="flex gap-3 items-center">
                    {landingForm.appIcon && (
                      <img src={landingForm.appIcon} alt="Preview" className="w-11 h-11 rounded-xl object-cover border border-white/10" />
                    )}
                    <input 
                      type="url" 
                      value={landingForm.appIcon}
                      onChange={(e) => setLandingForm({ ...landingForm, appIcon: e.target.value })}
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
                  value={landingForm.shortDescription}
                  onChange={(e) => setLandingForm({ ...landingForm, shortDescription: e.target.value })}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                  placeholder="e.g. Ultra HD 4K Video Player with subtitle support and smooth playback."
                />
              </div>

              {/* Rating, Installs, Developer Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Rating</label>
                  <input 
                    type="text" 
                    value={landingForm.rating}
                    onChange={(e) => setLandingForm({ ...landingForm, rating: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                    placeholder="4.8 ★"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Downloads</label>
                  <input 
                    type="text" 
                    value={landingForm.installs}
                    onChange={(e) => setLandingForm({ ...landingForm, installs: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                    placeholder="50K+ downloads"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Developer Name</label>
                  <input 
                    type="text" 
                    value={landingForm.developerName}
                    onChange={(e) => setLandingForm({ ...landingForm, developerName: e.target.value })}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]" 
                    placeholder="NITESH CODES"
                  />
                </div>
              </div>

              {/* Screenshots Gallery Preview */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Screenshots Gallery ({landingForm.screenshots.length})
                </label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="url"
                    value={newScreenshotUrl}
                    onChange={(e) => setNewScreenshotUrl(e.target.value)}
                    placeholder="Paste image link to manually add screenshot"
                    className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#f5c842]"
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if (newScreenshotUrl.trim()) {
                        setLandingForm(prev => ({ ...prev, screenshots: [...prev.screenshots, newScreenshotUrl.trim()] }));
                        setNewScreenshotUrl('');
                      }
                    }}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm"
                  >
                    + Add
                  </button>
                </div>
                {landingForm.screenshots.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto p-2 bg-[#0a0a0f] rounded-xl border border-white/10">
                    {landingForm.screenshots.map((shot, idx) => (
                      <div key={idx} className="relative flex-shrink-0 group">
                        <img src={shot} alt={`Screenshot ${idx + 1}`} className="w-24 h-44 object-cover rounded-lg border border-white/10" />
                        <button 
                          type="button" 
                          onClick={() => setLandingForm(prev => ({ ...prev, screenshots: prev.screenshots.filter((_, i) => i !== idx) }))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SEO Blog & In-Depth Guide Section */}
              <div className="mb-8 p-5 bg-[#1a1a24] rounded-2xl border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <label className="block text-sm font-bold text-[#f5c842] font-syne">
                      📝 SEO App Blog & Detailed Guide (For Google Search Ranking)
                    </label>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Write an in-depth article, FAQs, and features breakdown. Google will index this text to rank your page for app searches!
                    </p>
                  </div>
                </div>
                <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0f]">
                  <Toolbar onFmt={(cmd, val) => fmtDoc(landingBlogRef, cmd, val)} />
                  <div 
                    ref={landingBlogRef}
                    className="w-full min-h-[300px] p-4 text-white focus:outline-none prose prose-invert max-w-none"
                    contentEditable
                    suppressContentEditableWarning
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Shown automatically on <strong>/apps/{landingForm.slug || '[slug]'}</strong> under the screenshots section.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 sticky bottom-0 bg-[#111116] pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowLandingModal(false)} className="px-6 py-3 rounded-xl text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={saving} className="px-8 py-3 bg-[#f5c842] text-black font-semibold rounded-xl hover:bg-[#fce599] disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save & Publish Landing Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
