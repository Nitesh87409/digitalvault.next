'use client';
import { useState, useEffect, useRef } from 'react';

// Live SEO Auditor core calculation helper for App Blog & Landing Page
function analyzeAppSeo(title = '', excerpt = '', content = '', focusKeyword = '') {
  const titleClean = title ? title.trim() : '';
  const excerptClean = excerpt ? excerpt.trim() : '';
  const contentClean = content ? content.trim() : '';
  const keywordClean = focusKeyword ? focusKeyword.trim().toLowerCase() : '';

  const checks = [];
  let points = 0;

  const getWordCount = (htmlText) => {
    const text = htmlText.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  };

  const wordsCount = getWordCount(contentClean);

  // 1. App Title Check (Weight: 15)
  const titleLength = titleClean.length;
  if (titleLength === 0) {
    checks.push({
      id: 'title_length',
      type: 'error',
      message: 'Article Title is missing',
      points: 0,
      maxPoints: 15,
      detail: 'Add a descriptive title to start live SEO auditing.'
    });
  } else if (titleLength < 20) {
    checks.push({
      id: 'title_length',
      type: 'warning',
      message: `Title is short (${titleLength} chars)`,
      points: 8,
      maxPoints: 15,
      detail: 'Aim for 20-60 characters for best Google Play & Google search click-through rate.'
    });
    points += 8;
  } else if (titleLength > 65) {
    checks.push({
      id: 'title_length',
      type: 'warning',
      message: `Title is too long (${titleLength} chars)`,
      points: 10,
      maxPoints: 15,
      detail: 'Keep it below 60 characters so it fits on Google search result cards without truncation.'
    });
    points += 10;
  } else {
    checks.push({
      id: 'title_length',
      type: 'success',
      message: `Title length is perfect (${titleLength} chars)`,
      points: 15,
      maxPoints: 15,
      detail: 'Great title length! Optimized for Google Search snippet display.'
    });
    points += 15;
  }

  // 2. Short Description / Meta Summary Check (Weight: 15)
  const excerptLength = excerptClean.length;
  if (excerptLength === 0) {
    checks.push({
      id: 'excerpt_length',
      type: 'error',
      message: 'Excerpt / Summary is missing',
      points: 0,
      maxPoints: 15,
      detail: 'The excerpt serves as your meta description on search result snippets.'
    });
  } else if (excerptLength < 50) {
    checks.push({
      id: 'excerpt_length',
      type: 'warning',
      message: `Summary is brief (${excerptLength} chars)`,
      points: 8,
      maxPoints: 15,
      detail: 'Write 50-160 characters to summarize your app features and hook search readers.'
    });
    points += 8;
  } else if (excerptLength > 165) {
    checks.push({
      id: 'excerpt_length',
      type: 'warning',
      message: `Summary is too long (${excerptLength} chars)`,
      points: 10,
      maxPoints: 15,
      detail: 'Keep it under 160 characters so Google does not cut it off in search snippets.'
    });
    points += 10;
  } else {
    checks.push({
      id: 'excerpt_length',
      type: 'success',
      message: `Summary length is perfect (${excerptLength} chars)`,
      points: 15,
      maxPoints: 15,
      detail: 'Fits beautifully into the meta-description preview snippet on Google search!'
    });
    points += 15;
  }

  // 3. Word Count Check (Weight: 25)
  if (wordsCount === 0) {
    checks.push({
      id: 'word_count',
      type: 'error',
      message: 'Article content body is empty',
      points: 0,
      maxPoints: 25,
      detail: 'Write rich paragraphs. Detailed content performs significantly better in indexing.'
    });
  } else if (wordsCount < 200) {
    checks.push({
      id: 'word_count',
      type: 'warning',
      message: `Content has only ${wordsCount} words`,
      points: 10,
      maxPoints: 25,
      detail: 'Google flags pages with under 200 words as thin content. Aim to add more guide details.'
    });
    points += 10;
  } else if (wordsCount < 500) {
    checks.push({
      id: 'word_count',
      type: 'success',
      message: `Good content depth (${wordsCount} words)`,
      points: 20,
      maxPoints: 25,
      detail: 'Awesome depth! Over 200 words is crawlable, but 500+ words yields maximum authority.'
    });
    points += 20;
  } else {
    checks.push({
      id: 'word_count',
      type: 'success',
      message: `Excellent content depth (${wordsCount} words)`,
      points: 25,
      maxPoints: 25,
      detail: 'Highly detailed context! Search engine indexing spiders favor deep, authoritative resources.'
    });
    points += 25;
  }

  // 4. H1 Heading Restriction Check (Weight: 15)
  const h1Matches = (contentClean.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || []).length;
  if (h1Matches > 0) {
    checks.push({
      id: 'h1_count',
      type: 'error',
      message: `Found ${h1Matches} <h1> tag(s) in content body`,
      points: 0,
      maxPoints: 15,
      detail: 'Critical penalty! The page template already renders the title inside <h1>. Change these to <h2>.'
    });
  } else {
    checks.push({
      id: 'h1_count',
      type: 'success',
      message: 'No <h1> tags in body content',
      points: 15,
      maxPoints: 15,
      detail: 'Perfect. Your article complies with the single H1-per-page hierarchy standard.'
    });
    points += 15;
  }

  // 5. Subheadings (H2 / H3) (Weight: 15)
  const h2Matches = (contentClean.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || []).length;
  const h3Matches = (contentClean.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || []).length;
  const totalSubheadings = h2Matches + h3Matches;

  if (totalSubheadings === 0) {
    checks.push({
      id: 'subheading_count',
      type: 'error',
      message: 'No subheadings (<h2> or <h3>) found',
      points: 0,
      maxPoints: 15,
      detail: 'Break up your text! Add at least 2 subheadings (e.g. <h2>Features</h2>) to improve scanning.'
    });
  } else if (totalSubheadings === 1) {
    checks.push({
      id: 'subheading_count',
      type: 'warning',
      message: 'Only 1 subheading (<h2> or <h3>) found',
      points: 8,
      maxPoints: 15,
      detail: 'Structure your topics deeper. Add at least one more subheading to segment paragraphs logically.'
    });
    points += 8;
  } else {
    checks.push({
      id: 'subheading_count',
      type: 'success',
      message: `Structured with ${totalSubheadings} subheadings (H2: ${h2Matches}, H3: ${h3Matches})`,
      points: 15,
      maxPoints: 15,
      detail: 'Outstanding subheading structure! Perfect for human navigation and Google outline indexing.'
    });
    points += 15;
  }

  // 6. Hyperlinks (Weight: 10)
  const linkMatches = (contentClean.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi) || []).length;
  if (linkMatches === 0) {
    checks.push({
      id: 'link_count',
      type: 'error',
      message: 'No hyperlinks found in content',
      points: 0,
      maxPoints: 10,
      detail: 'Add a hyperlink (e.g. to related features or downloads) to direct traffic and boost authority.'
    });
  } else {
    checks.push({
      id: 'link_count',
      type: 'success',
      message: `Found ${linkMatches} hyperlink(s) in content`,
      points: 10,
      maxPoints: 10,
      detail: 'Awesome. Inbound/Outbound links spread link equity and guide customer conversion.'
    });
    points += 10;
  }

  // 7. Bold / Strong formatting (Weight: 5)
  const boldMatches = (contentClean.match(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi) || []).length;
  if (boldMatches === 0) {
    checks.push({
      id: 'bold_emphasis',
      type: 'warning',
      message: 'No bold elements used',
      points: 0,
      maxPoints: 5,
      detail: 'Use <strong> or <b> tags at least once to emphasize critical terms for indexing spiders.'
    });
  } else {
    checks.push({
      id: 'bold_emphasis',
      type: 'success',
      message: `Used bold formatting ${boldMatches} times`,
      points: 5,
      maxPoints: 5,
      detail: 'Great job! Highlighting important ideas assists fast customer scanning.'
    });
    points += 5;
  }

  // Keyword Checks
  const keywordChecks = [];
  if (keywordClean) {
    const inTitle = titleClean.toLowerCase().includes(keywordClean);
    keywordChecks.push({
      id: 'kw_title',
      success: inTitle,
      message: inTitle ? 'Keyword present in App Title' : 'Keyword not found in App Title',
      detail: 'Placing your targeted keyword in the title is the absolute strongest ranking factor.'
    });

    const inExcerpt = excerptClean.toLowerCase().includes(keywordClean);
    keywordChecks.push({
      id: 'kw_excerpt',
      success: inExcerpt,
      message: inExcerpt ? 'Keyword present in Short Description' : 'Keyword not found in Short Description',
      detail: 'Including keyword matches in summary improves click-through snippet rates on Google.'
    });

    const safeRegexStr = keywordClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const bodyMatches = (contentClean.toLowerCase().match(new RegExp(safeRegexStr, 'g')) || []).length;
    keywordChecks.push({
      id: 'kw_body',
      success: bodyMatches > 0,
      message: bodyMatches > 0 ? `Keyword in body content: YES (${bodyMatches} times)` : 'Keyword not found in body content',
      detail: 'Integrate the focus keyword naturally inside your guide paragraphs.'
    });

    if (bodyMatches > 0 && wordsCount > 0) {
      const density = ((bodyMatches / wordsCount) * 100).toFixed(2);
      const densityNum = parseFloat(density);
      if (densityNum >= 0.5 && densityNum <= 2.5) {
        keywordChecks.push({
          id: 'kw_density',
          success: true,
          message: `Keyword density is ideal (${density}%)`,
          detail: '0.5% - 2.5% keyword density signals relevance without search engine keyword-stuffing penalties.'
        });
      } else if (densityNum < 0.5) {
        keywordChecks.push({
          id: 'kw_density',
          success: false,
          message: `Keyword density is low (${density}%)`,
          detail: 'Consider mentioning your focus keyword a few more times in relevant paragraphs.'
        });
      } else {
        keywordChecks.push({
          id: 'kw_density',
          success: false,
          message: `Keyword density is high (${density}%)`,
          detail: 'Over 2.5% density risks spam penalties. Replace redundant occurrences with synonyms.'
        });
      }
    }
  }

  const score = Math.min(100, Math.max(0, points));

  return {
    score,
    checks,
    keywordChecks,
    wordsCount,
  };
}

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
  
  // Real-Time SEO Auditor State
  const [focusKeyword, setFocusKeyword] = useState('');
  const [blogContentHtml, setBlogContentHtml] = useState('');
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

  // Compute live SEO Analysis
  const seoAnalysis = analyzeAppSeo(
    landingForm.appName,
    landingForm.shortDescription,
    blogContentHtml,
    focusKeyword
  );

  // --- Helpers for Rich Text Editors ---
  const loadPolicyEditors = (privacy, terms) => {
    setTimeout(() => {
      if (privacyRef.current) privacyRef.current.innerHTML = privacy || '';
      if (termsRef.current) termsRef.current.innerHTML = terms || '';
    }, 50);
  };

  const loadLandingBlogEditor = (content) => {
    setBlogContentHtml(content || '');
    setTimeout(() => {
      if (landingBlogRef.current) landingBlogRef.current.innerHTML = content || '';
    }, 50);
  };

  const fmtDoc = (ref, cmd, val = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    if (ref === landingBlogRef) {
      setBlogContentHtml(ref.current?.innerHTML || '');
    }
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
    setFocusKeyword('');
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
    <div className="flex flex-wrap gap-2 p-2 bg-[#1a1a24] border-b border-white/10">
      <button type="button" onClick={() => onFmt('bold')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] font-bold text-xs">B</button>
      <button type="button" onClick={() => onFmt('italic')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] italic text-xs">I</button>
      <button type="button" onClick={() => onFmt('underline')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] underline text-xs">U</button>
      <div className="w-px h-6 bg-[#3a3a46] mx-1"></div>
      <button type="button" onClick={() => onFmt('formatBlock', 'H2')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] font-bold text-xs">H2</button>
      <button type="button" onClick={() => onFmt('formatBlock', 'H3')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] font-bold text-xs">H3</button>
      <button type="button" onClick={() => onFmt('formatBlock', 'P')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] text-xs">P</button>
      <div className="w-px h-6 bg-[#3a3a46] mx-1"></div>
      <button type="button" onClick={() => onFmt('insertUnorderedList')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] text-xs">• List</button>
      <button type="button" onClick={() => onFmt('insertOrderedList')} className="px-3 py-1 rounded bg-[#2a2a36] text-white hover:bg-[#3a3a46] text-xs">1. List</button>
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
      {/* MODAL 2: SETUP LANDING PAGE & LIVE SEO BLOG AUDITOR       */}
      {/* ========================================================= */}
      {showLandingModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex justify-center items-start overflow-y-auto p-4 custom-scrollbar">
          <div className="bg-[#111116] rounded-2xl w-full max-w-6xl my-6 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#111116] z-10 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Setup Landing Page & SEO App Guide
                </h2>
                <p className="text-xs text-gray-400 mt-1">Connect Play Store metadata and use Live SEO Auditor to rank your app in Google search.</p>
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
                <label className="block text-sm font-medium text-gray-400 mb-2">Short Description / Tagline (Serves as Meta Description)</label>
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

              {/* ===================================================== */}
              {/* LIVE SEO AUDITOR + APP BLOG EDITOR 2-COLUMN SECTION   */}
              {/* ===================================================== */}
              <div className="mb-8 p-5 sm:p-6 bg-[#1a1a24] rounded-2xl border border-white/10">
                <div className="border-b border-white/10 pb-4 mb-6">
                  <h3 className="text-base font-bold text-[#f5c842] font-syne flex items-center gap-2">
                    <span>⚡</span> Live SEO Auditor & App Guide Editor
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Write in-depth tutorials, feature breakdowns, and FAQs. The Live SEO Auditor tracks your keyword ranking potential in real-time!
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Rich Text Blog / Guide Editor (7 Cols) */}
                  <div className="lg:col-span-7 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span className="font-semibold text-white">App Article & Content Body</span>
                      <span>Word Count: <strong className="text-[#f5c842] font-mono">{seoAnalysis.wordsCount}</strong> words</span>
                    </div>

                    <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0f]">
                      <Toolbar onFmt={(cmd, val) => fmtDoc(landingBlogRef, cmd, val)} />
                      <div 
                        ref={landingBlogRef}
                        onInput={(e) => setBlogContentHtml(e.currentTarget.innerHTML)}
                        onKeyUp={(e) => setBlogContentHtml(e.currentTarget.innerHTML)}
                        className="w-full min-h-[380px] p-4 text-white focus:outline-none prose prose-invert max-w-none text-sm"
                        contentEditable
                        suppressContentEditableWarning
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Renders directly on <strong>/apps/{landingForm.slug || '[slug]'}</strong> under the screenshot gallery.
                    </p>
                  </div>

                  {/* Right Column: Live SEO Auditor Widget (5 Cols) */}
                  <div className="lg:col-span-5 bg-[#0e0e18] border border-white/10 rounded-2xl p-4 flex flex-col gap-4 sticky top-4">
                    
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="font-syne text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        ⚡ Live SEO Auditor
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">Live Sync</span>
                    </div>

                    {/* Radial Score Gauge */}
                    <div className="flex flex-col items-center justify-center bg-white/[0.02] border border-white/5 rounded-2xl p-4 relative overflow-hidden">
                      <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-[35px] opacity-20 transition-all duration-500 ${
                        seoAnalysis.score >= 80 ? 'bg-emerald-500' : seoAnalysis.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`} />

                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="32"
                            className="stroke-white/10"
                            strokeWidth="5"
                            fill="transparent"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="32"
                            className={`transition-all duration-500 ease-out ${
                              seoAnalysis.score >= 80 ? 'stroke-emerald-500' : seoAnalysis.score >= 50 ? 'stroke-amber-500' : 'stroke-red-500'
                            }`}
                            strokeWidth="5"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 32}
                            strokeDashoffset={2 * Math.PI * 32 - (seoAnalysis.score / 100) * (2 * Math.PI * 32)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-xl font-bold font-syne text-white">{seoAnalysis.score}%</span>
                          <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">SEO Score</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`mt-2.5 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        seoAnalysis.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        seoAnalysis.score >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {seoAnalysis.score >= 80 ? 'Excellent 🟢' : seoAnalysis.score >= 50 ? 'Needs Tweaks 🟡' : 'Critical 🔴'}
                      </div>
                    </div>

                    {/* Target Focus Keyword */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-[#f5c842] uppercase tracking-wider">Target Focus Keyword</label>
                        {focusKeyword && (
                          <button 
                            type="button"
                            onClick={() => setFocusKeyword('')}
                            className="text-[9px] text-gray-500 hover:text-white"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={focusKeyword}
                        onChange={e => setFocusKeyword(e.target.value)}
                        placeholder="e.g. 4K Video Player"
                        className="bg-[#0a0a0f] border border-white/10 text-white outline-none px-3 py-2 rounded-xl text-xs focus:border-[#f5c842]"
                      />
                      <p className="text-[9px] text-gray-500">
                        Input the targeted search term to evaluate keyword placement.
                      </p>
                    </div>

                    {/* Keyword Analytics Panel */}
                    {focusKeyword && (
                      <div className="border border-white/5 bg-white/[0.01] rounded-xl p-3 flex flex-col gap-1.5">
                        <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          🎯 Keyword Placement
                        </h4>
                        <div className="flex flex-col gap-1.5">
                          {seoAnalysis.keywordChecks.map((kwCheck, idx) => (
                            <div key={idx} className="flex gap-2 items-start text-[10px] leading-tight">
                              <span className="shrink-0 text-xs">{kwCheck.success ? '✅' : '❌'}</span>
                              <div>
                                <span className={`font-semibold ${kwCheck.success ? 'text-gray-300' : 'text-gray-500'}`}>
                                  {kwCheck.message}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SEO Recommendations Checklist */}
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                      <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        📋 SEO Checklist
                      </h4>
                      <div className="flex flex-col gap-1.5">
                        {[...seoAnalysis.checks]
                          .sort((a, b) => {
                            const severity = { error: 0, warning: 1, success: 2 };
                            return severity[a.type] - severity[b.type];
                          })
                          .map(check => {
                            let statusIcon = '✅';
                            let borderTheme = 'border-emerald-500/10';
                            let textTheme = 'text-gray-400 font-medium';
                            if (check.type === 'error') {
                              statusIcon = '❌';
                              borderTheme = 'border-red-500/20 bg-red-500/5';
                              textTheme = 'text-white font-semibold';
                            } else if (check.type === 'warning') {
                              statusIcon = '⚠️';
                              borderTheme = 'border-amber-500/20 bg-amber-500/5';
                              textTheme = 'text-gray-200 font-medium';
                            }
                            
                            return (
                              <div 
                                key={check.id} 
                                className={`flex gap-2 items-start border p-2 rounded-xl text-[11px] ${borderTheme}`}
                              >
                                <span className="select-none shrink-0 mt-0.5">{statusIcon}</span>
                                <div className="flex flex-col gap-0.5 w-full">
                                  <div className="flex justify-between items-start gap-1 w-full">
                                    <span className={`leading-snug ${textTheme}`}>
                                      {check.message}
                                    </span>
                                    <span className="text-[9px] text-gray-500 font-mono shrink-0">
                                      +{check.points}/{check.maxPoints}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-gray-500 leading-tight">
                                    {check.detail}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                  </div>
                </div>
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
