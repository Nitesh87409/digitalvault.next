'use client';

import { useState, useEffect, useRef } from 'react';

// Live SEO Auditor core calculation helper
function analyzeSeo(title = '', excerpt = '', content = '', focusKeyword = '', faqs = []) {
  const titleClean = title ? title.trim() : '';
  const excerptClean = excerpt ? excerpt.trim() : '';
  const contentClean = content ? content.trim() : '';
  const keywordClean = focusKeyword ? focusKeyword.trim().toLowerCase() : '';

  const checks = [];
  let points = 0;

  // Helper to count words inside content HTML safely
  const getWordCount = (htmlText) => {
    const text = htmlText.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  };

  const wordsCount = getWordCount(contentClean);

  // 1. Title Length Check (Weight: 15)
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
  } else if (titleLength < 30) {
    checks.push({
      id: 'title_length',
      type: 'warning',
      message: `Title is too short (${titleLength} chars)`,
      points: 8,
      maxPoints: 15,
      detail: 'Aim for 30-60 characters to optimize your organic click-through rate (CTR).'
    });
    points += 8;
  } else if (titleLength > 60) {
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
      detail: 'Excellent title length! Great for visibility on both desktop and mobile layouts.'
    });
    points += 15;
  }

  // 2. Excerpt Length Check (Weight: 15)
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
  } else if (excerptLength < 80) {
    checks.push({
      id: 'excerpt_length',
      type: 'warning',
      message: `Excerpt is too short (${excerptLength} chars)`,
      points: 8,
      maxPoints: 15,
      detail: 'Write 80-160 characters to summarize your article and hook search readers.'
    });
    points += 8;
  } else if (excerptLength > 160) {
    checks.push({
      id: 'excerpt_length',
      type: 'warning',
      message: `Excerpt is too long (${excerptLength} chars)`,
      points: 10,
      maxPoints: 15,
      detail: 'Keep it under 160 characters so Google does not cut it off in search snippets.'
    });
    points += 10;
  } else {
    checks.push({
      id: 'excerpt_length',
      type: 'success',
      message: `Excerpt length is perfect (${excerptLength} chars)`,
      points: 15,
      maxPoints: 15,
      detail: 'Fits beautifully into the meta-description preview snippet on Google search!'
    });
    points += 15;
  }

  // 3. Word Count Check (Weight: 20)
  if (wordsCount === 0) {
    checks.push({
      id: 'word_count',
      type: 'error',
      message: 'Article content body is empty',
      points: 0,
      maxPoints: 20,
      detail: 'Write rich paragraphs. Detailed content performs significantly better in indexing.'
    });
  } else if (wordsCount < 300) {
    checks.push({
      id: 'word_count',
      type: 'warning',
      message: `Content has only ${wordsCount} words`,
      points: 10,
      maxPoints: 20,
      detail: 'Google flags articles with under 300 words as thin content. Aim to add more context.'
    });
    points += 10;
  } else if (wordsCount < 600) {
    checks.push({
      id: 'word_count',
      type: 'success',
      message: `Good content depth (${wordsCount} words)`,
      points: 17,
      maxPoints: 20,
      detail: 'Awesome depth! Over 300 words is crawlable, but 600+ words yields maximum authority.'
    });
    points += 17;
  } else {
    checks.push({
      id: 'word_count',
      type: 'success',
      message: `Excellent content depth (${wordsCount} words)`,
      points: 20,
      maxPoints: 20,
      detail: 'Highly detailed context! Search engine indexing spiders favor deep, authoritative resources.'
    });
    points += 20;
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
      detail: 'Critical penalty! The blog template already renders the title inside a single <h1>. Multiple H1 tags confuse Google. Change these to <h2>.'
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

  // 5. H2 & H3 Subheading Structure (Weight: 15)
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
      detail: 'Break up your text! Add at least 2 subheadings (e.g. <h2>Benefits</h2>) to improve scanning readability.'
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

  // 6. Internal / External Hyperlinks (Weight: 10)
  const linkMatches = (contentClean.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi) || []).length;
  if (linkMatches === 0) {
    checks.push({
      id: 'link_count',
      type: 'error',
      message: 'No hyperlinks found in content',
      points: 0,
      maxPoints: 10,
      detail: 'Add a hyperlink (e.g. to product checkouts or related articles) to direct traffic and boost authority.'
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

  // 7. Image ALT tags (Weight: 10)
  const imgTags = contentClean.match(/<img[^>]+>/gi) || [];
  const imageCount = imgTags.length;
  if (imageCount === 0) {
    checks.push({
      id: 'image_alt',
      type: 'warning',
      message: 'No images found in content',
      points: 0,
      maxPoints: 10,
      detail: 'Add at least one relevant image with a descriptive alt tag (<img src="..." alt="..." />) to capture Google Image search traffic and engage readers.'
    });
  } else {
    let imagesWithAlt = 0;
    imgTags.forEach(tag => {
      if (/\balt\s*=\s*["']([^"']*)["']/i.test(tag)) {
        imagesWithAlt++;
      }
    });

    if (imagesWithAlt === imageCount) {
      checks.push({
        id: 'image_alt',
        type: 'success',
        message: `All ${imageCount} image(s) have alt tags`,
        points: 10,
        maxPoints: 10,
        detail: 'Perfect accessibility structure! Every image has a descriptive alt tag defined.'
      });
      points += 10;
    } else {
      const missing = imageCount - imagesWithAlt;
      const calculatedPoints = Math.max(0, 10 - missing * 3);
      checks.push({
        id: 'image_alt',
        type: 'error',
        message: `${missing} image(s) missing alt tags`,
        points: calculatedPoints,
        maxPoints: 10,
        detail: 'Make sure every <img> tag contains an alt="..." attribute to improve keyword visibility in Google Images.'
      });
      points += calculatedPoints;
    }
  }

  // 8. Bold / Strong formatting (Weight: 5)
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

  // 9. Structured FAQ SGE Optimization depth check (Weight: 15)
  const validFaqsCount = (faqs || []).filter(f => f.question?.trim() && f.answer?.trim()).length;
  if (validFaqsCount === 0) {
    checks.push({
      id: 'faq_count',
      type: 'error',
      message: 'No FAQ Q&A section found',
      points: 0,
      maxPoints: 15,
      detail: 'Google Generative AI/SGE search prioritizes conversational structured Q&As. Click "Add FAQ Item" under the editor to start!'
    });
  } else if (validFaqsCount < 3) {
    checks.push({
      id: 'faq_count',
      type: 'warning',
      message: `FAQ has only ${validFaqsCount} item(s)`,
      points: 8,
      maxPoints: 15,
      detail: 'Add at least 3 FAQ items to satisfy Google structured FAQPage SGE citations.'
    });
    points += 8;
  } else {
    checks.push({
      id: 'faq_count',
      type: 'success',
      message: `Excellent FAQ structured depth (${validFaqsCount} items)`,
      points: 15,
      maxPoints: 15,
      detail: 'Perfect structured Q&As! High SGE citation potential for conversational Gemini queries.'
    });
    points += 15;
  }

  // 10. Focus Keyword Checks (Display metrics, not direct points to prevent score math issues)
  const keywordChecks = [];
  if (keywordClean) {
    const inTitle = titleClean.toLowerCase().includes(keywordClean);
    keywordChecks.push({
      id: 'kw_title',
      success: inTitle,
      message: inTitle ? 'Keyword present in Blog Title' : 'Keyword not found in Blog Title',
      detail: 'Placing your targeted keyword in the title is the absolute strongest ranking factor.'
    });

    const inExcerpt = excerptClean.toLowerCase().includes(keywordClean);
    keywordChecks.push({
      id: 'kw_excerpt',
      success: inExcerpt,
      message: inExcerpt ? 'Keyword present in Excerpt' : 'Keyword not found in Excerpt',
      detail: 'Including keyword matches in the excerpt improves click-through snippet rates on Google.'
    });

    const safeRegexStr = keywordClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const bodyMatches = (contentClean.toLowerCase().match(new RegExp(safeRegexStr, 'g')) || []).length;
    keywordChecks.push({
      id: 'kw_body',
      success: bodyMatches > 0,
      message: bodyMatches > 0 ? `Keyword in body content: YES (${bodyMatches} times)` : 'Keyword not found in body content',
      detail: 'Integrate the focus keyword naturally inside your paragraphs.'
    });

    if (bodyMatches > 0 && wordsCount > 0) {
      const density = ((bodyMatches / wordsCount) * 100).toFixed(2);
      const densityNum = parseFloat(density);
      if (densityNum >= 0.5 && densityNum <= 2.5) {
        keywordChecks.push({
          id: 'kw_density',
          success: true,
          message: `Keyword Density: ${density}% (Optimal)`,
          detail: 'Perfect density (0.5% - 2.5%) for organic search context matching.'
        });
      } else if (densityNum > 2.5) {
        keywordChecks.push({
          id: 'kw_density',
          success: false,
          message: `Keyword Density: ${density}% (Keyword Stuffing!)`,
          detail: 'Warning: Exceeds 2.5%. Reduce keyword frequency to avoid Google spam flags.'
        });
      } else {
        keywordChecks.push({
          id: 'kw_density',
          success: false,
          message: `Keyword Density: ${density}% (Low)`,
          detail: 'Try to repeat your target keyword a few more times inside body paragraphs.'
        });
      }
    }
  }

  const finalPercentage = Math.round((points / 120) * 100);

  return {
    score: Math.min(100, Math.max(0, finalPercentage)),
    checks,
    keywordChecks
  };
}

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBlog, setEditBlog] = useState(null);
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' or 'html'
  const richEditorRef = useRef(null);
  
  // Form states
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    image: '',
    author: 'Admin',
    status: true,
    read_time: 5,
    faqs: []
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');

  // Synchronize visual rich editor content editable safely to prevent cursor jumps
  useEffect(() => {
    if (editorMode === 'visual' && richEditorRef.current && modalOpen) {
      if (richEditorRef.current.innerHTML !== form.content) {
        richEditorRef.current.innerHTML = form.content;
      }
    }
  }, [editorMode, modalOpen]);

  // Command executor for WYSIWYG rich text actions
  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (richEditorRef.current) {
      setForm(prev => ({ ...prev, content: richEditorRef.current.innerHTML }));
    }
  };

  const headers = { 'Content-Type': 'application/json' };

  useEffect(() => {
    loadBlogs();
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const res = await fetch('/api/product');
      const data = await res.json();
      if (data.flag && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error('Failed to load products:', e);
    }
  }

  async function loadBlogs() {
    try {
      const res = await fetch('/api/admin/blogs', { headers });
      const data = await res.json();
      if (data.flag) {
        setBlogs(data.blogs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openModal(blog = null) {
    setError('');
    setSuccessMsg('');
    setFocusKeyword('');
    setEditorMode('visual');
    if (blog) {
      setEditBlog(blog);
      setForm({
        title: blog.title || '',
        excerpt: blog.excerpt || '',
        content: blog.content || '',
        image: blog.image || '',
        author: blog.author || 'Admin',
        status: blog.status !== false,
        read_time: blog.read_time || 5,
        faqs: Array.isArray(blog.faqs) ? blog.faqs : []
      });
    } else {
      setEditBlog(null);
      setForm({
        title: '',
        excerpt: '',
        content: '',
        image: '',
        author: 'Admin',
        status: true,
        read_time: 5,
        faqs: []
      });
    }
    setModalOpen(true);
  }

  async function saveBlog(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      setError('Title, excerpt, and content are required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    // Filter out blank/empty FAQ questions or answers before stringifying
    const cleanedFaqs = (form.faqs || []).filter(item => item.question?.trim() && item.answer?.trim());
    const finalForm = { ...form, faqs: cleanedFaqs };

    try {
      const url = editBlog ? `/api/admin/blogs/${editBlog._id}` : '/api/admin/blogs';
      const method = editBlog ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(finalForm)
      });
      const data = await res.json();
      if (data.flag) {
        setSuccessMsg(editBlog ? 'Blog updated successfully! 🎉' : 'Blog created successfully! 🎉');
        setTimeout(() => {
          setModalOpen(false);
          loadBlogs();
        }, 1200);
      } else {
        setError(data.message || 'Failed to save blog');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function softDeleteBlog(id) {
    if (!confirm('Are you sure you want to move this article to the Recycle Bin?')) return;
    try {
      const res = await fetch('/api/admin/bin', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'soft-delete', type: 'blog', id })
      });
      const data = await res.json();
      if (data.flag) {
        loadBlogs();
      }
    } catch (e) {
      console.error(e);
    }
  }

  const seoAnalysis = analyzeSeo(form.title, form.excerpt, form.content, focusKeyword, form.faqs);

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-syne text-2xl md:text-3xl font-bold text-white tracking-tight mb-1 flex items-center gap-2">📝 Blogs</h1>
          <p className="text-gray-500 text-sm font-sans">Write, manage, and optimize articles for Search Engine Marketing.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer px-5 py-3 rounded-xl text-sm whitespace-nowrap shadow-lg shadow-[#f5c842]/20 hover:scale-[1.02] active:scale-95 transition-transform"
        >
          ＋ Write Article
        </button>
      </div>

      {/* Blogs List */}
      <div className="bg-[#0e0e18] rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-500 text-sm font-sans">Loading articles...</div>
        ) : blogs.length === 0 ? (
          <div className="p-16 text-center text-gray-500 text-sm font-sans flex flex-col items-center gap-3">
            <span className="text-4xl">📝</span>
            <p>No blog articles yet. Click "Write Article" above to create your first content marketing post!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm font-sans">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-gray-400 font-semibold">
                  <th className="px-6 py-4">Featured Image & Title</th>
                  <th className="px-6 py-4">Slug & URL</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Read Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {blogs.map(blog => (
                  <tr key={blog._id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center text-xl">
                          {blog.image ? <img src={blog.image} className="w-full h-full object-cover" alt="" /> : '📝'}
                        </div>
                        <div>
                          <p className="text-white font-bold mb-0.5 line-clamp-1">{blog.title}</p>
                          <p className="text-gray-500 text-xs line-clamp-1 font-normal">{blog.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 max-w-[150px] truncate" title={`/blog/${blog.slug}`}>
                      /blog/{blog.slug}
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-medium">{blog.author}</td>
                    <td className="px-6 py-4 text-gray-300">{blog.read_time} min</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${blog.status ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {blog.status ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(blog)}
                          className="bg-[#f5c842]/10 border border-[#f5c842]/20 text-[#f5c842] px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#f5c842]/20 transition-all"
                          title="Edit Article"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => softDeleteBlog(blog._id)}
                          className="bg-red-500/10 text-red-500 border-none px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-red-500/20 transition-all"
                          title="Move to Trash"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0f] border border-white/10 w-full max-w-[1240px] rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 shrink-0 bg-[#0e0e18]">
              <h2 className="font-syne text-lg font-bold text-white flex items-center gap-2">
                {editBlog ? '✏️ Edit Blog Article' : '＋ Write Blog Article'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-white border-none bg-transparent cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={saveBlog} className="p-6 flex-1 flex flex-col gap-5 overflow-y-auto">
              {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 text-sm font-sans">{error}</div>}
              {successMsg && <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl border border-emerald-500/20 text-sm font-sans">{successMsg}</div>}

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                
                {/* Left Column: Form Fields */}
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
                    {/* Title */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#f5c842] uppercase tracking-wide">Article Title *</label>
                      <input
                        type="text"
                        required
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. How to use Canva templates to grow your Instagram"
                        className="bg-[#12121e] border border-white/10 text-white outline-none px-4 py-3 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors"
                      />
                    </div>

                    {/* Author */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#f5c842] uppercase tracking-wide">Author Name</label>
                      <input
                        type="text"
                        value={form.author}
                        onChange={e => setForm({ ...form, author: e.target.value })}
                        placeholder="Admin"
                        className="bg-[#12121e] border border-white/10 text-white outline-none px-4 py-3 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors"
                      />
                    </div>

                    {/* Excerpt / Summary */}
                    <div className="col-span-full flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#f5c842] uppercase tracking-wide">Short Excerpt / Summary *</label>
                      <textarea
                        required
                        rows={2}
                        value={form.excerpt}
                        onChange={e => setForm({ ...form, excerpt: e.target.value })}
                        placeholder="Provide a compelling 1-2 sentence preview summary of the article for blog cards..."
                        className="bg-[#12121e] border border-white/10 text-white outline-none px-4 py-3 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors resize-none"
                      />
                    </div>

                    {/* Image URL */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#f5c842] uppercase tracking-wide">Featured Image URL (Cloudinary or Direct Link)</label>
                      <input
                        type="text"
                        value={form.image}
                        onChange={e => setForm({ ...form, image: e.target.value })}
                        placeholder="https://res.cloudinary.com/..."
                        className="bg-[#12121e] border border-white/10 text-white outline-none px-4 py-3 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors"
                      />
                    </div>

                    {/* Read Time */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#f5c842] uppercase tracking-wide">Read Time (minutes)</label>
                      <input
                        type="number"
                        min={1}
                        value={form.read_time}
                        onChange={e => setForm({ ...form, read_time: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="bg-[#12121e] border border-white/10 text-white outline-none px-4 py-3 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* HTML Content Body */}
                  <div className="flex flex-col gap-1.5 font-sans">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-1">
                      <label className="text-xs font-bold text-[#f5c842] uppercase tracking-wide">Article Content Body *</label>
                      
                      {/* Premium Toggle Switch */}
                      <div className="flex bg-[#0e0e18] border border-white/10 rounded-xl p-0.5 select-none shrink-0 self-end">
                        <button
                          type="button"
                          onClick={() => setEditorMode('visual')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-syne cursor-pointer transition-all ${
                            editorMode === 'visual'
                              ? 'bg-[#f5c842] text-[#0a0a0f] shadow-md'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          👁️ Visual Mode
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorMode('html')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-syne cursor-pointer transition-all ${
                            editorMode === 'html'
                              ? 'bg-[#f5c842] text-[#0a0a0f] shadow-md'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          💻 HTML Code Mode
                        </button>
                      </div>
                    </div>

                    {editorMode === 'visual' ? (
                      <div className="flex flex-col border border-white/10 rounded-xl overflow-hidden bg-[#12121e]">
                        {/* WYSIWYG Toolbar */}
                        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#0e0e18] border-b border-white/10 shrink-0">
                          <button
                            type="button"
                            onClick={() => executeCommand('bold')}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors text-xs cursor-pointer"
                            title="Bold"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand('italic')}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white italic hover:bg-white/10 transition-colors text-xs font-serif cursor-pointer"
                            title="Italic"
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand('formatBlock', 'h2')}
                            className="px-2 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors text-[10px] cursor-pointer"
                            title="Heading 2 (H2)"
                          >
                            H2
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand('formatBlock', 'h3')}
                            className="px-2 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors text-[10px] cursor-pointer"
                            title="Heading 3 (H3)"
                          >
                            H3
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand('insertUnorderedList')}
                            className="px-2.5 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-xs cursor-pointer"
                            title="Bullet List"
                          >
                            • List
                          </button>
                          <button
                            type="button"
                            onClick={() => executeCommand('insertOrderedList')}
                            className="px-2.5 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-xs cursor-pointer"
                            title="Numbered List"
                          >
                            1. List
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const url = prompt('Enter the link URL (e.g. https://example.com):');
                              if (url) executeCommand('createLink', url);
                            }}
                            className="px-2.5 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-xs cursor-pointer"
                            title="Insert Link"
                          >
                            🔗 Link
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const url = prompt('Enter the image URL:');
                              const alt = prompt('Enter the image alt description (Important for SEO!):');
                              if (url) {
                                const imgHTML = `<img src="${url}" alt="${alt || ''}" class="max-w-full rounded-xl my-4" />`;
                                executeCommand('insertHTML', imgHTML);
                              }
                            }}
                            className="px-2.5 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-xs cursor-pointer"
                            title="Insert Image"
                          >
                            🖼️ Image
                          </button>
                          
                          {/* Premium Link Product Image Dropdown */}
                          {products.length > 0 && (
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  const prod = products.find(p => p.slug === val || p.id === val || p._id === val);
                                  if (prod && prod.images && prod.images.length > 0) {
                                    const productUrl = `/product/${prod.slug || prod.id || prod._id}`;
                                    const imgHTML = `<a href="${productUrl}" target="_blank" class="block my-5 group/prod-link"><img src="${prod.images[0]}" alt="${prod.name} Digital Download" class="max-w-full rounded-xl shadow-lg border border-white/10 hover:scale-[1.01] transition-transform duration-300" /><p class="text-xs text-center text-gray-500 mt-2 font-sans italic">Click to view/download: ${prod.name}</p></a>`;
                                    executeCommand('insertHTML', imgHTML);
                                  }
                                  e.target.value = ''; // reset selection
                                }
                              }}
                              className="bg-[#12121e] border border-white/10 text-gray-400 outline-none h-8 px-2 rounded-lg text-xs font-semibold focus:border-[#f5c842]/50 transition-colors cursor-pointer max-w-[160px]"
                            >
                              <option value="">🛍️ Link Product Image</option>
                              {products.map(p => (
                                <option key={p.id || p._id} value={p.slug || p.id || p._id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          )}
                          <button
                            type="button"
                            onClick={() => executeCommand('removeFormat')}
                            className="px-2.5 h-8 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-xs ml-auto cursor-pointer"
                            title="Clear Formatting"
                          >
                            🧹 Clear Style
                          </button>
                        </div>
                        {/* Rich Contenteditable Editor */}
                        <div
                          ref={richEditorRef}
                          contentEditable
                          onInput={(e) => {
                            setForm(prev => ({ ...prev, content: e.target.innerHTML }));
                          }}
                          className="bg-transparent text-white outline-none px-4 py-4 rounded-b-xl text-sm min-h-[380px] max-h-[500px] overflow-y-auto focus:bg-[#141423] transition-colors leading-relaxed"
                          placeholder="Type or paste formatted manual text here. Select text to format it using the toolbar above..."
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <textarea
                          required
                          rows={17}
                          value={form.content}
                          onChange={e => setForm({ ...form, content: e.target.value })}
                          placeholder="Paste or write your raw HTML blog content code here directly. Ideal for copy-pasting SEO HTML blocks generated by Google Gemini or other AI models!"
                          className="bg-[#12121e] border border-white/10 text-white outline-none px-4 py-4 rounded-xl text-sm font-mono focus:border-[#f5c842]/50 transition-colors resize-y leading-relaxed focus:bg-[#141423]"
                        />
                        <span className="text-[10px] text-gray-500 font-mono leading-normal">
                          💡 Tip: You can switch back to **Visual Mode** at any time to preview and manually edit it like a normal document!
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Structured FAQ SGE Optimization Section */}
                  <div className="bg-[#0e0e18] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 font-sans">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                      <div>
                        <h4 className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5 uppercase">
                          ❓ Generative AI FAQ Section
                        </h4>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">
                          Add conversational Q&As. These will render as Google FAQPage schema for Gemini/SGE search.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const currentFaqs = form.faqs || [];
                          setForm({ ...form, faqs: [...currentFaqs, { question: '', answer: '' }] });
                        }}
                        className="bg-[#f5c842]/10 border border-[#f5c842]/20 hover:bg-[#f5c842]/20 text-[#f5c842] text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        ＋ Add FAQ Item
                      </button>
                    </div>

                    {(!form.faqs || form.faqs.length === 0) ? (
                      <div className="text-center py-6 text-xs text-gray-500 border border-dashed border-white/5 rounded-xl">
                        No FAQ items added yet. Click "Add FAQ Item" to boost your Google AI Search indexing.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                        {form.faqs.map((faq, index) => (
                          <div key={index} className="border border-white/5 bg-white/[0.01] rounded-xl p-4 flex flex-col gap-3 relative group/faq">
                            
                            {/* FAQ Header with Remove button */}
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-[#f5c842] uppercase tracking-wider">FAQ Item #{index + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const filtered = form.faqs.filter((_, i) => i !== index);
                                  setForm({ ...form, faqs: filtered });
                                }}
                                className="text-[10px] text-red-500 hover:text-red-400 bg-transparent border-none cursor-pointer font-bold transition-colors"
                              >
                                🗑️ Remove
                              </button>
                            </div>

                            {/* Question field */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-semibold text-gray-400">Question Topic *</label>
                              <input
                                type="text"
                                required
                                value={faq.question}
                                onChange={e => {
                                  const updated = form.faqs.map((item, i) => 
                                    i === index ? { ...item, question: e.target.value } : item
                                  );
                                  setForm({ ...form, faqs: updated });
                                }}
                                placeholder="e.g. Do I need Canva Pro to use these templates?"
                                className="bg-[#12121e] border border-white/10 text-white outline-none px-3.5 py-2.5 rounded-xl text-xs focus:border-[#f5c842]/50 transition-colors"
                              />
                            </div>

                            {/* Answer field */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-semibold text-gray-400">Answer *</label>
                              <textarea
                                required
                                rows={2}
                                value={faq.answer}
                                onChange={e => {
                                  const updated = form.faqs.map((item, i) => 
                                    i === index ? { ...item, answer: e.target.value } : item
                                  );
                                  setForm({ ...form, faqs: updated });
                                }}
                                placeholder="Provide a direct, conversational, and informative answer..."
                                className="bg-[#12121e] border border-white/10 text-white outline-none px-3.5 py-2.5 rounded-xl text-xs focus:border-[#f5c842]/50 transition-colors resize-none leading-relaxed"
                              />
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Publish/Draft Switch */}
                  <div className="flex items-center gap-3 font-sans mt-2 shrink-0 select-none">
                    <input
                      type="checkbox"
                      id="status"
                      checked={form.status}
                      onChange={e => setForm({ ...form, status: e.target.checked })}
                      className="w-5 h-5 accent-[#f5c842] cursor-pointer"
                    />
                    <label htmlFor="status" className="text-sm font-bold text-white cursor-pointer">Publish Immediately</label>
                  </div>
                </div>

                {/* Right Column: Real-time SEO Auditor Panel */}
                <div className="bg-[#0e0e18] border border-white/5 rounded-2xl p-5 flex flex-col gap-5 self-start lg:sticky lg:top-0 h-fit max-h-[80vh] overflow-y-auto custom-scrollbar">
                  
                  {/* Title Header */}
                  <div className="border-b border-white/5 pb-3 shrink-0">
                    <h3 className="font-syne text-xs font-bold text-white tracking-wider flex items-center gap-1.5 uppercase">
                      ⚡ Live SEO Auditor
                    </h3>
                  </div>

                  {/* Dynamic Radial Score Widget */}
                  <div className="flex flex-col items-center justify-center bg-white/[0.01] border border-white/5 rounded-2xl p-5 select-none relative overflow-hidden group shrink-0">
                    {/* Glowing background status blob */}
                    <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-[40px] opacity-10 transition-all duration-500 ${
                      seoAnalysis.score >= 80 ? 'bg-emerald-500' : seoAnalysis.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Background Ring */}
                        <circle
                          cx="48"
                          cy="48"
                          r="36"
                          className="stroke-white/5"
                          strokeWidth="6"
                          fill="transparent"
                        />
                        {/* Foreground Active Ring */}
                        <circle
                          cx="48"
                          cy="48"
                          r="36"
                          className={`transition-all duration-500 ease-out ${
                            seoAnalysis.score >= 80 ? 'stroke-emerald-500' : seoAnalysis.score >= 50 ? 'stroke-amber-500' : 'stroke-red-500'
                          }`}
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 36}
                          strokeDashoffset={2 * Math.PI * 36 - (seoAnalysis.score / 100) * (2 * Math.PI * 36)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold font-syne text-white">{seoAnalysis.score}%</span>
                        <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">SEO Score</span>
                      </div>
                    </div>

                    {/* Score Rating Badge */}
                    <div className={`mt-3 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all duration-300 shrink-0 ${
                      seoAnalysis.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 
                      seoAnalysis.score >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-lg shadow-amber-500/5' : 
                      'bg-red-500/10 text-red-400 border-red-500/20 shadow-lg shadow-red-500/5'
                    }`}>
                      {seoAnalysis.score >= 80 ? 'Excellent 🟢' : seoAnalysis.score >= 50 ? 'Needs Tweaks 🟡' : 'Critical 🔴'}
                    </div>
                  </div>

                  {/* Focus Keyword Target Field */}
                  <div className="flex flex-col gap-1.5 font-sans shrink-0">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-[#f5c842] uppercase tracking-wider">Target Focus Keyword</label>
                      {focusKeyword && (
                        <button 
                          type="button"
                          onClick={() => setFocusKeyword('')}
                          className="text-[9px] text-gray-500 hover:text-white bg-transparent border-none cursor-pointer font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={focusKeyword}
                      onChange={e => setFocusKeyword(e.target.value)}
                      placeholder="e.g. Canva Templates"
                      className="bg-[#12121e] border border-white/10 text-white outline-none px-3 py-2 rounded-xl text-xs focus:border-[#f5c842]/50 transition-colors placeholder:text-gray-600"
                    />
                    <p className="text-[9px] text-gray-500 leading-normal">
                      Input the targeted search topic to evaluate keyword placement and density.
                    </p>
                  </div>

                  {/* Checklist Audit Results */}
                  <div className="flex flex-col gap-3 font-sans pr-1">
                    
                    {/* Keyword Analytics Panel */}
                    {focusKeyword && (
                      <div className="border border-white/5 bg-white/[0.01] rounded-xl p-3 flex flex-col gap-2">
                        <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          🎯 Keyword Placement
                        </h4>
                        <div className="flex flex-col gap-2">
                          {seoAnalysis.keywordChecks.map((kwCheck, idx) => (
                            <div key={idx} className="flex gap-2 items-start text-[11px] leading-tight">
                              <span className="shrink-0 text-xs">{kwCheck.success ? '✅' : '❌'}</span>
                              <div className="flex flex-col">
                                <span className={`font-bold ${kwCheck.success ? 'text-gray-300' : 'text-gray-500'}`}>
                                  {kwCheck.message}
                                </span>
                                <span className="text-[9px] text-gray-500 leading-normal mt-0.5">
                                  {kwCheck.detail}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SEO Recommendations Checklist */}
                    <div className="flex flex-col gap-2.5">
                      <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        📋 SEO Checklist
                      </h4>
                      <div className="flex flex-col gap-2">
                        {[...seoAnalysis.checks]
                          .sort((a, b) => {
                            const severity = { error: 0, warning: 1, success: 2 };
                            return severity[a.type] - severity[b.type];
                          })
                          .map(check => {
                            let statusIcon = '✅';
                            let borderTheme = 'border-emerald-500/10 hover:border-emerald-500/20';
                            let textTheme = 'text-gray-400 font-medium';
                            if (check.type === 'error') {
                              statusIcon = '❌';
                              borderTheme = 'border-red-500/10 hover:border-red-500/20';
                              textTheme = 'text-white font-bold';
                            } else if (check.type === 'warning') {
                              statusIcon = '⚠️';
                              borderTheme = 'border-amber-500/10 hover:border-amber-500/20';
                              textTheme = 'text-gray-200 font-semibold';
                            }
                            
                            return (
                              <div 
                                key={check.id} 
                                className={`flex gap-2.5 items-start border p-3 rounded-xl transition-all duration-300 bg-white/[0.01] ${borderTheme}`}
                              >
                                <span className="text-xs select-none shrink-0 mt-0.5">{statusIcon}</span>
                                <div className="flex flex-col gap-0.5 w-full">
                                  <div className="flex justify-between items-start gap-1 w-full">
                                    <span className={`text-[11px] leading-snug ${textTheme}`}>
                                      {check.message}
                                    </span>
                                    <span className="text-[9px] text-gray-500 font-mono shrink-0">
                                      +{check.points}/{check.maxPoints}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-gray-500 leading-normal">
                                    {check.detail}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 border-t border-white/5 pt-5 mt-4 shrink-0 font-syne">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white px-5 py-3 rounded-xl text-sm cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-bold border-none cursor-pointer px-6 py-3 rounded-xl text-sm shadow-lg shadow-[#f5c842]/10 ${saving ? 'opacity-70' : 'hover:scale-[1.02]'} transition-transform`}
                >
                  {saving ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
