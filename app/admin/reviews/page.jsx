'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const [filterProduct, setFilterProduct] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editReview, setEditReview] = useState(null);
  
  const [form, setForm] = useState({
    product_id: '',
    customer_name: '',
    rating: '5',
    review_text: '',
    verified_purchase: true,
    is_featured: false,
    is_approved: true
  });

  const [saving, setSaving] = useState(false);
  const headers = { 'Content-Type': 'application/json' };

  useEffect(() => {
    loadProducts();
    loadReviews();
  }, [filterProduct, filterRating, filterStatus]);

  async function loadProducts() {
    try {
      const res = await fetch('/api/product', { headers });
      const data = await res.json();
      if (data.flag) setProducts(data.products || []);
    } catch(e) {}
  }

  async function loadReviews() {
    setLoading(true);
    try {
      let url = '/api/admin/reviews?';
      if (filterProduct) url += `productId=${filterProduct}&`;
      if (filterRating) url += `rating=${filterRating}&`;
      if (filterStatus) url += `status=${filterStatus}&`;
      
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.flag) setReviews(data.reviews || []);
    } catch(e) {}
    setLoading(false);
  }

  function openModal(review = null) {
    setEditReview(review);
    if (review) {
      setForm({
        product_id: review.product_id?._id || '',
        customer_name: review.customer_name || '',
        rating: review.rating || '5',
        review_text: review.review_text || '',
        verified_purchase: review.verified_purchase,
        is_featured: review.is_featured,
        is_approved: review.is_approved
      });
    } else {
      setForm({
        product_id: '',
        customer_name: '',
        rating: '5',
        review_text: '',
        verified_purchase: true,
        is_featured: false,
        is_approved: true
      });
    }
    setError('');
    setModalOpen(true);
  }

  async function saveReview(e) {
    e.preventDefault();
    setError('');
    
    if (!form.product_id || !form.customer_name || !form.rating) {
      setError('Product, customer name, and rating are required.');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/admin/reviews';
      const method = editReview ? 'PUT' : 'POST';
      const payload = { ...form };
      if (editReview) payload.id = editReview._id;

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.flag) {
        setModalOpen(false);
        loadReviews();
      } else {
        setError(data.message || 'Error saving review.');
      }
    } catch (e) {
      setError('Server error.');
    }
    setSaving(false);
  }

  async function softDeleteReview(id) {
    try {
      const res = await fetch('/api/admin/bin', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'soft-delete', type: 'review', id })
      });
      const data = await res.json();
      if (data.flag) {
        loadReviews();
      } else {
        setError(data.message || 'Error moving to bin');
      }
    } catch (e) {
      setError('Server error.');
    }
  }

  async function toggleStatus(id, field, currentValue) {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, [field]: !currentValue })
      });
      const data = await res.json();
      if (data.flag) loadReviews();
    } catch (e) {}
  }

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const headerActions = (
    <button onClick={() => openModal()} className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none cursor-pointer px-5 py-2.5 rounded-xl text-sm w-full sm:w-auto shadow-lg shadow-[#f5c842]/20 hover:scale-[1.02] transition-transform">
      + Add Fake Review
    </button>
  );

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
        <h1 className="font-syne text-2xl md:text-3xl font-bold text-white tracking-tight">⭐ Manage Reviews</h1>
        {headerActions && <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">{headerActions}</div>}
      </div>

      <div className="w-full max-w-7xl mx-auto my-2 px-2 flex-1 flex flex-col">

        {/* Filters */}
        <div className="bg-[#0e0e18] p-4 rounded-xl border border-[#f5c842]/10 mb-6 flex flex-wrap gap-4">
          <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className="bg-[#1a1a2a] border border-white/10 text-white outline-none px-4 py-2 rounded-lg text-sm flex-1 min-w-[200px]">
            <option value="">All Products</option>
            {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select value={filterRating} onChange={e => setFilterRating(e.target.value)} className="bg-[#1a1a2a] border border-white/10 text-white outline-none px-4 py-2 rounded-lg text-sm flex-1 min-w-[120px]">
            <option value="">All Ratings</option>
            {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#1a1a2a] border border-white/10 text-white outline-none px-4 py-2 rounded-lg text-sm flex-1 min-w-[150px]">
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Reviews List */}
        <div className="bg-[#0e0e18] rounded-2xl border border-white/5 overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full min-w-[800px] text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#12121a] border-b border-white/5 text-gray-400 uppercase tracking-wider text-xs">
                  <th className="p-4 font-medium">Review</th>
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium">Rating</th>
                  <th className="p-4 font-medium text-center">Status</th>
                  <th className="p-4 font-medium text-center">Featured</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading reviews...</td></tr>
                ) : reviews.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500 text-sm">No reviews found.</td></tr>
                ) : (
                  reviews.map(review => (
                    <tr key={review._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          {review.customer_name} 
                          {review.is_admin_review && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/20">Manual</span>}
                          {review.verified_purchase && <span className="text-[#10b981] text-[10px]" title="Verified Purchase">✓ Verified</span>}
                        </div>
                        <div className="text-gray-400 text-xs mt-1 max-w-xs truncate" title={review.review_text}>{review.review_text || <i>No text</i>}</div>
                        <div className="text-gray-500 text-[10px] mt-1">{new Date(review.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 text-gray-300 max-w-[150px] truncate" title={review.product_id?.name}>{review.product_id?.name || 'Unknown Product'}</td>
                      <td className="p-4 text-[#f5c842] text-lg">{renderStars(review.rating)}</td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => toggleStatus(review._id, 'is_approved', review.is_approved)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer border-none ${review.is_approved ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-[#f5c842]/15 text-[#f5c842]'}`}
                        >
                          {review.is_approved ? 'Approved' : 'Pending'}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => toggleStatus(review._id, 'is_featured', review.is_featured)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-white/5 ${review.is_featured ? 'bg-[#f5c842]/20 text-[#f5c842]' : 'bg-transparent text-gray-500'}`}
                        >
                          {review.is_featured ? '⭐ Featured' : 'Feature'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openModal(review)} className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 cursor-pointer text-xs transition-colors">Edit</button>
                          <button onClick={() => setDeleteTarget(review)} className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 cursor-pointer text-xs transition-colors">Delete</button>
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0e0e18] border border-[#f5c842]/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#12121a]">
              <h3 className="font-syne font-bold text-white text-lg">{editReview ? 'Edit Review' : 'Create Manual Review'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white bg-transparent border-none cursor-pointer text-xl">✕</button>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar">
              {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-sm border border-red-500/20">{error}</div>}
              
              <form onSubmit={saveReview} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-1.5 uppercase tracking-wider">Product *</label>
                  <select 
                    value={form.product_id} 
                    onChange={e => setForm({...form, product_id: e.target.value})} 
                    className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors"
                    disabled={editReview && !editReview.is_admin_review} // Can't change product of real user review
                  >
                    <option value="">Select a Product</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-[#f5c842] block mb-1.5 uppercase tracking-wider">Customer Name *</label>
                    <input 
                      type="text" 
                      value={form.customer_name} 
                      onChange={e => setForm({...form, customer_name: e.target.value})} 
                      className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-2.5 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-xs font-semibold text-[#f5c842] block mb-1.5 uppercase tracking-wider">Rating *</label>
                    <select 
                      value={form.rating} 
                      onChange={e => setForm({...form, rating: e.target.value})} 
                      className="bg-[#1a1a2a] border border-white/10 text-[#f5c842] outline-none w-full px-4 py-2.5 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors"
                    >
                      {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-1.5 uppercase tracking-wider">Review Text</label>
                  <textarea 
                    value={form.review_text} 
                    onChange={e => setForm({...form, review_text: e.target.value})} 
                    className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors min-h-[100px] resize-y"
                    placeholder="Write the review content..."
                  />
                </div>

                <div className="flex flex-wrap gap-4 mt-2 bg-white/5 p-4 rounded-xl border border-white/10">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.verified_purchase} onChange={e => setForm({...form, verified_purchase: e.target.checked})} className="accent-[#f5c842]" />
                    Verified Purchase
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.is_approved} onChange={e => setForm({...form, is_approved: e.target.checked})} className="accent-[#10b981]" />
                    Approved
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} className="accent-[#f5c842]" />
                    ⭐ Featured
                  </label>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-[#12121a]">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-transparent border border-white/10 text-white cursor-pointer hover:bg-white/5 text-sm font-semibold transition-colors">Cancel</button>
              <button onClick={saveReview} disabled={saving} className={`px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] cursor-pointer text-sm font-syne font-bold border-none shadow-lg shadow-[#f5c842]/20 ${saving ? 'opacity-70' : 'hover:scale-[1.02]'} transition-transform`}>
                {saving ? 'Saving...' : '💾 Save Review'}
              </button>
            </div>
          </div>
        </div>
      )}
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => softDeleteReview(deleteTarget?._id)}
        itemName={deleteTarget ? `${deleteTarget.customer_name}'s review` : ''}
      />
    </>
  );
}
