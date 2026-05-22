'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

export default function AdminHomepageContent() {
  const [activeTab, setActiveTab] = useState('reviews');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // FAQs State
  const [faqs, setFaqs] = useState([]);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editFaq, setEditFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({
    q: '',
    a: '',
    order: '0',
    is_active: true
  });

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editReview, setEditReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    role: '',
    review: '',
    rating: '5',
    initials: '',
    color: 'linear-gradient(135deg,#f5c842,#e0a800)',
    textColor: '#0a0a0f',
    order: '0',
    is_approved: true
  });

  const [saving, setSaving] = useState(false);
  const headers = { 'Content-Type': 'application/json' };

  // Preset gradients for testimonials
  const presetGradients = [
    { label: 'Gold', value: 'linear-gradient(135deg,#f5c842,#e0a800)', textColor: '#0a0a0f' },
    { label: 'Purple', value: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', textColor: '#ffffff' },
    { label: 'Emerald', value: 'linear-gradient(135deg,#10b981,#065f46)', textColor: '#ffffff' },
    { label: 'Ruby', value: 'linear-gradient(135deg,#ef4444,#b91c1c)', textColor: '#ffffff' },
    { label: 'Cyan', value: 'linear-gradient(135deg,#06b6d4,#0891b2)', textColor: '#ffffff' },
    { label: 'Orange', value: 'linear-gradient(135deg,#f97316,#c2410c)', textColor: '#ffffff' },
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'reviews') {
        const res = await fetch('/api/admin/homepage-reviews', { headers });
        const data = await res.json();
        if (data.flag) {
          setReviews(data.reviews || []);
        } else {
          setError(data.message || 'Failed to load reviews.');
        }
      } else {
        const res = await fetch('/api/admin/faqs', { headers });
        const data = await res.json();
        if (data.flag) {
          setFaqs(data.faqs || []);
        } else {
          setError(data.message || 'Failed to load FAQs.');
        }
      }
    } catch (e) {
      setError('Connection/Server error.');
    }
    setLoading(false);
  }

  // Auto-generate initials
  const generateInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleNameChange = (nameVal) => {
    setReviewForm(prev => {
      const generated = generateInitials(nameVal);
      return {
        ...prev,
        name: nameVal,
        initials: generated
      };
    });
  };

  // Toast / Status Message helper
  const showFeedback = (msg, isSuccess = true) => {
    if (isSuccess) {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    }
  };

  // FAQ handlers
  function openFaqModal(faq = null) {
    setEditFaq(faq);
    if (faq) {
      setFaqForm({
        q: faq.q || '',
        a: faq.a || '',
        order: faq.order?.toString() || '0',
        is_active: faq.is_active
      });
    } else {
      setFaqForm({
        q: '',
        a: '',
        order: (faqs.length + 1).toString(),
        is_active: true
      });
    }
    setFaqModalOpen(true);
  }

  async function saveFaq(e) {
    e.preventDefault();
    if (!faqForm.q || !faqForm.a) {
      showFeedback('Question and Answer are required.', false);
      return;
    }

    setSaving(true);
    try {
      const url = '/api/admin/faqs';
      const method = editFaq ? 'PUT' : 'POST';
      const payload = {
        ...faqForm,
        order: parseInt(faqForm.order, 10) || 0
      };
      if (editFaq) payload.id = editFaq._id;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.flag) {
        setFaqModalOpen(false);
        showFeedback(editFaq ? 'FAQ updated successfully! 📝' : 'FAQ created successfully! 🎉');
        loadData();
      } else {
        showFeedback(data.message || 'Error saving FAQ.', false);
      }
    } catch (e) {
      showFeedback('Server error saving FAQ.', false);
    }
    setSaving(false);
  }

  async function softDeleteFaq(id) {
    try {
      const res = await fetch('/api/admin/bin', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'soft-delete', type: 'faq', id })
      });
      const data = await res.json();
      if (data.flag) {
        showFeedback('FAQ moved to recycle bin! 🗑️');
        loadData();
      } else {
        showFeedback(data.message || 'Error moving FAQ to bin.', false);
      }
    } catch (e) {
      showFeedback('Server error moving FAQ to bin.', false);
    }
  }

  async function toggleFaqStatus(id, currentValue) {
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, is_active: !currentValue })
      });
      const data = await res.json();
      if (data.flag) {
        showFeedback('FAQ status updated! 🔄');
        loadData();
      }
    } catch (e) {}
  }

  // Review Handlers
  function openReviewModal(review = null) {
    setEditReview(review);
    if (review) {
      setReviewForm({
        name: review.name || '',
        role: review.role || '',
        review: review.review || '',
        rating: review.rating?.toString() || '5',
        initials: review.initials || '',
        color: review.color || 'linear-gradient(135deg,#f5c842,#e0a800)',
        textColor: review.textColor || '#0a0a0f',
        order: review.order?.toString() || '0',
        is_approved: review.is_approved
      });
    } else {
      setReviewForm({
        name: '',
        role: '',
        review: '',
        rating: '5',
        initials: '',
        color: 'linear-gradient(135deg,#f5c842,#e0a800)',
        textColor: '#0a0a0f',
        order: (reviews.length + 1).toString(),
        is_approved: true
      });
    }
    setReviewModalOpen(true);
  }

  async function saveReview(e) {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.role || !reviewForm.review || !reviewForm.initials) {
      showFeedback('Name, role, initials, and review text are required.', false);
      return;
    }

    setSaving(true);
    try {
      const url = '/api/admin/homepage-reviews';
      const method = editReview ? 'PUT' : 'POST';
      const payload = {
        ...reviewForm,
        rating: parseInt(reviewForm.rating, 10) || 5,
        order: parseInt(reviewForm.order, 10) || 0
      };
      if (editReview) payload.id = editReview._id;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.flag) {
        setReviewModalOpen(false);
        showFeedback(editReview ? 'Homepage review updated successfully! 📝' : 'Homepage review created successfully! 🎉');
        loadData();
      } else {
        showFeedback(data.message || 'Error saving review.', false);
      }
    } catch (e) {
      showFeedback('Server error saving review.', false);
    }
    setSaving(false);
  }

  async function softDeleteTestimonial(id) {
    try {
      const res = await fetch('/api/admin/bin', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'soft-delete', type: 'testimonial', id })
      });
      const data = await res.json();
      if (data.flag) {
        showFeedback('Testimonial moved to recycle bin! 🗑️');
        loadData();
      } else {
        showFeedback(data.message || 'Error moving testimonial to bin.', false);
      }
    } catch (e) {
      showFeedback('Server error moving testimonial to bin.', false);
    }
  }

  async function toggleReviewStatus(id, currentValue) {
    try {
      const res = await fetch('/api/admin/homepage-reviews', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, is_approved: !currentValue })
      });
      const data = await res.json();
      if (data.flag) {
        showFeedback('Testimonial approval status updated! 🔄');
        loadData();
      }
    } catch (e) {}
  }

  const headerActions = (
    <button
      onClick={() => activeTab === 'reviews' ? openReviewModal() : openFaqModal()}
      className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer px-5 py-2.5 rounded-xl text-sm w-full sm:w-auto shadow-lg shadow-[#f5c842]/20 hover:scale-[1.02] transition-transform"
    >
      {activeTab === 'reviews' ? '+ Add Testimonial' : '+ Add FAQ'}
    </button>
  );

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
        <h1 className="font-syne text-2xl md:text-3xl font-bold text-white tracking-tight">🏠 Homepage Content</h1>
        {headerActions && <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">{headerActions}</div>}
      </div>

      <div className="w-full max-w-7xl mx-auto my-2 px-2 flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-gray-500 text-sm mt-1">Control landing-page testimonials and Frequently Asked Questions dynamically.</p>
          </div>
          
          {/* Tab buttons */}
          <div className="flex bg-[#0e0e18] p-1 rounded-xl border border-white/5 self-start md:self-center">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold font-syne cursor-pointer border-none transition-all ${activeTab === 'reviews' ? 'bg-[#f5c842]/10 text-[#f5c842] shadow' : 'bg-transparent text-gray-400 hover:text-white'}`}
            >
              💬 Reviews & Testimonials ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('faqs')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold font-syne cursor-pointer border-none transition-all ${activeTab === 'faqs' ? 'bg-[#f5c842]/10 text-[#f5c842] shadow' : 'bg-transparent text-gray-400 hover:text-white'}`}
            >
              ❓ FAQs ({faqs.length})
            </button>
          </div>
        </div>

        {/* Dynamic Alerts */}
        {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm border border-red-500/20 shadow-md animate-pulse">{error}</div>}
        {success && <div className="bg-green-500/10 text-[#10b981] p-4 rounded-xl mb-6 text-sm border border-green-500/20 shadow-md">{success}</div>}

        {/* Content Table & Listing */}
        <div className="bg-[#0e0e18] rounded-2xl border border-white/5 overflow-hidden flex flex-col flex-1 shadow-xl">
          {loading ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-[#f5c842] border-white/5 animate-spin" style={{ animationDuration: '0.6s' }}></div>
              <span className="text-sm font-medium">Loading content...</span>
            </div>
          ) : activeTab === 'reviews' ? (
            /* REVIEWS PANEL */
            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full min-w-[900px] text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#12121a] border-b border-white/5 text-gray-400 uppercase tracking-wider text-xs">
                    <th className="p-4 font-medium w-[240px]">Reviewer</th>
                    <th className="p-4 font-medium">Review Message</th>
                    <th className="p-4 font-medium text-center w-[120px]">Rating</th>
                    <th className="p-4 font-medium text-center w-[100px]">Order</th>
                    <th className="p-4 font-medium text-center w-[120px]">Status</th>
                    <th className="p-4 font-medium text-right w-[160px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-gray-500 text-sm">No reviews found. Click '+ Add Testimonial' to seed/create one!</td></tr>
                  ) : (
                    reviews.map(review => (
                      <tr key={review._id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              style={{ background: review.color, color: review.textColor }}
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs font-syne shrink-0 shadow-inner"
                            >
                              {review.initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate max-w-[160px]">{review.name}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[160px]">{review.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-gray-300 text-xs sm:text-sm max-w-lg leading-relaxed line-clamp-2" title={review.review}>
                            "{review.review}"
                          </div>
                        </td>
                        <td className="p-4 text-center text-[#f5c842] text-sm tracking-wider font-bold">
                          {'★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)}
                        </td>
                        <td className="p-4 text-center font-bold text-gray-400 text-xs">
                          {review.order}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleReviewStatus(review._id, review.is_approved)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-transparent transition-all ${review.is_approved ? 'bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/25' : 'bg-[#f5c842]/15 text-[#f5c842] hover:bg-[#f5c842]/25'}`}
                          >
                            {review.is_approved ? 'Approved' : 'Pending'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openReviewModal(review)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 cursor-pointer text-xs transition-colors">Edit</button>
                            <button onClick={() => setDeleteTarget({ type: 'testimonial', item: review })} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 cursor-pointer text-xs transition-colors">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* FAQS PANEL */
            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full min-w-[900px] text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#12121a] border-b border-white/5 text-gray-400 uppercase tracking-wider text-xs">
                    <th className="p-4 font-medium w-[300px]">Question</th>
                    <th className="p-4 font-medium">Answer</th>
                    <th className="p-4 font-medium text-center w-[100px]">Order</th>
                    <th className="p-4 font-medium text-center w-[120px]">Status</th>
                    <th className="p-4 font-medium text-right w-[160px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.length === 0 ? (
                    <tr><td colSpan={5} className="p-12 text-center text-gray-500 text-sm">No FAQs found. Click '+ Add FAQ' to seed/create one!</td></tr>
                  ) : (
                    faqs.map(faq => (
                      <tr key={faq._id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 font-semibold text-white">
                          <div className="max-w-[280px] leading-relaxed line-clamp-2" title={faq.q}>
                            {faq.q}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-gray-400 text-xs sm:text-sm max-w-xl leading-relaxed line-clamp-2" title={faq.a}>
                            {faq.a}
                          </div>
                        </td>
                        <td className="p-4 text-center font-bold text-gray-400 text-xs">
                          {faq.order}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleFaqStatus(faq._id, faq.is_active)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-transparent transition-all ${faq.is_active ? 'bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/25' : 'bg-red-500/15 text-red-400 hover:bg-red-500/25'}`}
                          >
                            {faq.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openFaqModal(faq)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 cursor-pointer text-xs transition-colors">Edit</button>
                            <button onClick={() => setDeleteTarget({ type: 'faq', item: faq })} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 cursor-pointer text-xs transition-colors">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* FAQ MODAL */}
      {faqModalOpen && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0e0e18] border border-[#f5c842]/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#12121a]">
              <h3 className="font-syne font-bold text-white text-lg">{editFaq ? 'Edit FAQ Item' : 'Add New FAQ Item'}</h3>
              <button onClick={() => setFaqModalOpen(false)} className="text-gray-400 hover:text-white bg-transparent border-none cursor-pointer text-xl">✕</button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-5">
              <form onSubmit={saveFaq} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-1.5 uppercase tracking-wider">Question *</label>
                  <input
                    type="text"
                    value={faqForm.q}
                    onChange={e => setFaqForm({ ...faqForm, q: e.target.value })}
                    className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors font-semibold"
                    placeholder="e.g. Do I get future updates?"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-1.5 uppercase tracking-wider">Answer *</label>
                  <textarea
                    value={faqForm.a}
                    onChange={e => setFaqForm({ ...faqForm, a: e.target.value })}
                    className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors min-h-[140px] resize-y leading-relaxed"
                    placeholder="Provide a detailed, helpful answer..."
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-[#f5c842] block mb-1.5 uppercase tracking-wider">Sort Order (Numeric)</label>
                    <input
                      type="number"
                      value={faqForm.order}
                      onChange={e => setFaqForm({ ...faqForm, order: e.target.value })}
                      className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors font-bold"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold select-none">
                      <input
                        type="checkbox"
                        checked={faqForm.is_active}
                        onChange={e => setFaqForm({ ...faqForm, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 bg-[#1a1a2a] checked:bg-[#10b981] accent-[#10b981]"
                      />
                      Active on Homepage
                    </label>
                  </div>
                </div>
              </form>

              {/* LIVE FAQ PREVIEW */}
              <div className="border-t border-white/5 pt-4">
                <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-3">Live Accordion Preview</div>
                <div className="rounded-xl border border-white/5 bg-[#12121a] p-4">
                  <div className="flex items-center justify-between text-white font-bold text-sm">
                    <span>{faqForm.q || 'Your FAQ Question?'}</span>
                    <span className="text-[#f5c842]">↓</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-gray-400">
                    {faqForm.a || 'Your answer text will appear here immediately as you type.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-[#12121a]">
              <button onClick={() => setFaqModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-transparent border border-white/10 text-white cursor-pointer hover:bg-white/5 text-sm font-semibold transition-colors">Cancel</button>
              <button onClick={saveFaq} disabled={saving} className={`px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] cursor-pointer text-sm font-syne font-bold border-none shadow-lg shadow-[#f5c842]/20 ${saving ? 'opacity-70' : 'hover:scale-[1.02]'} transition-transform`}>
                {saving ? 'Saving...' : '💾 Save FAQ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW TESTIMONIAL MODAL */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0e0e18] border border-[#f5c842]/20 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#12121a]">
              <h3 className="font-syne font-bold text-white text-lg">{editReview ? 'Edit Homepage Testimonial' : 'Add Homepage Testimonial'}</h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-gray-400 hover:text-white bg-transparent border-none cursor-pointer text-xl">✕</button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <form onSubmit={saveReview} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-[#f5c842] block mb-1.5 uppercase tracking-wider">Reviewer Name *</label>
                    <input
                      type="text"
                      value={reviewForm.name}
                      onChange={e => handleNameChange(e.target.value)}
                      className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors font-semibold"
                      placeholder="e.g. Priya Sharma"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#f5c842] block mb-1.5 uppercase tracking-wider">Role / Title *</label>
                    <input
                      type="text"
                      value={reviewForm.role}
                      onChange={e => setReviewForm({ ...reviewForm, role: e.target.value })}
                      className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors"
                      placeholder="e.g. Freelance Designer"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#f5c842] block mb-1.5 uppercase tracking-wider">Initials *</label>
                    <input
                      type="text"
                      value={reviewForm.initials}
                      onChange={e => setReviewForm({ ...reviewForm, initials: e.target.value.toUpperCase() })}
                      className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors text-center font-bold"
                      placeholder="PS"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-1.5 uppercase tracking-wider">Rating & Testimonial Text *</label>
                  <div className="flex gap-4 mb-2">
                    <select
                      value={reviewForm.rating}
                      onChange={e => setReviewForm({ ...reviewForm, rating: e.target.value })}
                      className="bg-[#1a1a2a] border border-white/10 text-[#f5c842] outline-none px-4 py-2.5 rounded-xl text-sm font-bold focus:border-[#f5c842]/50"
                    >
                      {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                    </select>
                    <input
                      type="number"
                      value={reviewForm.order}
                      onChange={e => setReviewForm({ ...reviewForm, order: e.target.value })}
                      className="bg-[#1a1a2a] border border-white/10 text-white outline-none px-4 py-2.5 rounded-xl text-sm font-bold w-24 text-center focus:border-[#f5c842]/50"
                      placeholder="Order"
                    />
                  </div>
                  <textarea
                    value={reviewForm.review}
                    onChange={e => setReviewForm({ ...reviewForm, review: e.target.value })}
                    className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors min-h-[100px] resize-y leading-relaxed"
                    placeholder="Best investment I made this year..."
                  />
                </div>

                {/* Color and Styles */}
                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-1.5 uppercase tracking-wider">Avatar Gradient Preset</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {presetGradients.map((g, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, color: g.value, textColor: g.textColor })}
                        style={{ background: g.value }}
                        className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${reviewForm.color === g.value ? 'border-white scale-105 shadow-md shadow-[#f5c842]/20' : 'border-transparent opacity-70'}`}
                        title={g.label}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Custom Background / Gradient</label>
                      <input
                        type="text"
                        value={reviewForm.color}
                        onChange={e => setReviewForm({ ...reviewForm, color: e.target.value })}
                        className="bg-[#1a1a2a] border border-[#f5c842]/10 text-white outline-none w-full px-3 py-2 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Text Color</label>
                      <input
                        type="text"
                        value={reviewForm.textColor}
                        onChange={e => setReviewForm({ ...reviewForm, textColor: e.target.value })}
                        className="bg-[#1a1a2a] border border-[#f5c842]/10 text-white outline-none w-full px-3 py-2 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold select-none bg-white/5 p-3 rounded-xl border border-white/5">
                    <input
                      type="checkbox"
                      checked={reviewForm.is_approved}
                      onChange={e => setReviewForm({ ...reviewForm, is_approved: e.target.checked })}
                      className="w-4 h-4 rounded border-white/10 bg-[#1a1a2a] checked:bg-[#10b981] accent-[#10b981]"
                    />
                    Approve and Show on Homepage
                  </label>
                </div>
              </form>

              {/* LIVE TESTIMONIAL PREVIEW */}
              <div className="flex flex-col justify-center bg-[#12121a] rounded-2xl p-6 border border-white/5 relative">
                <div className="absolute top-4 right-4 text-[10px] uppercase font-bold text-gray-600 tracking-wider">Live Preview</div>
                
                <div className="text-left">
                  <div className="stars text-[#f5c842] mb-3 text-lg leading-none">
                    {'★'.repeat(parseInt(reviewForm.rating, 10) || 5)}
                  </div>
                  <p className="mb-6 text-sm text-gray-300 italic min-h-[60px] leading-relaxed">
                    "{reviewForm.review || 'Best investment I made this year. The templates saved me 40+ hours of work. Highly recommended!'}"
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <div
                      style={{ background: reviewForm.color, color: reviewForm.textColor }}
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs font-syne shrink-0 shadow-lg shadow-black/30"
                    >
                      {reviewForm.initials || 'PS'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{reviewForm.name || 'Priya Sharma'}</div>
                      <div className="text-xs text-gray-500 font-medium">{reviewForm.role || 'Startup Founder'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-[#12121a]">
              <button onClick={() => setReviewModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-transparent border border-white/10 text-white cursor-pointer hover:bg-white/5 text-sm font-semibold transition-colors">Cancel</button>
              <button onClick={saveReview} disabled={saving} className={`px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] cursor-pointer text-sm font-syne font-bold border-none shadow-lg shadow-[#f5c842]/20 ${saving ? 'opacity-70' : 'hover:scale-[1.02]'} transition-transform`}>
                {saving ? 'Saving...' : '💾 Save Testimonial'}
              </button>
            </div>
          </div>
        </div>
      )}
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget.type === 'faq') {
            return softDeleteFaq(deleteTarget.item._id);
          } else {
            return softDeleteTestimonial(deleteTarget.item._id);
          }
        }}
        itemName={deleteTarget?.type === 'faq' ? deleteTarget.item.q : deleteTarget?.item.name}
      />
    </>
  );
}
