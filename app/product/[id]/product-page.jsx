'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProductPage({ id }) {
  const [product, setProduct] = useState(null);
  const [mainImg, setMainImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myReviewText, setMyReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const router = useRouter();

  useEffect(() => {
    loadProduct();
    loadReviews();

    const loadCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
      setCartCount(cart.reduce((s, i) => s + i.qty, 0));
    };
    loadCartCount();
    window.addEventListener('cart-updated', loadCartCount);
    window.addEventListener('storage', loadCartCount);
    return () => {
      window.removeEventListener('cart-updated', loadCartCount);
      window.removeEventListener('storage', loadCartCount);
    };
  }, []);

  async function loadProduct() {
    try {
      const res = await fetch(`/api/product?id=${id}`);
      const data = await res.json();
      if (!data.flag) { router.push('/'); return; }
      setProduct(data.product);
      setMainImg(data.product.images?.[0] || null);
      setLoading(false);
    } catch(e) {
      router.push('/');
    }
  }

  async function loadReviews() {
    try {
      const res = await fetch(`/api/reviews?productId=${id}`);
      const data = await res.json();
      if (data.flag) {
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    setReviewError('');
    const customer = localStorage.getItem('dv_customer');
    if (!customer) {
      setReviewError('Please login to submit a review.');
      return;
    }
    
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: product._id,
          rating: myRating,
          review_text: myReviewText
        })
      });
      const data = await res.json();
      if (data.flag) {
        setReviewFormOpen(false);
        setMyReviewText('');
        setMyRating(5);
        showToast('Review submitted successfully!', '#10b981', '#fff');
        loadReviews();
        loadProduct(); // Reload to update average rating
      } else {
        setReviewError(data.message || 'Error submitting review.');
      }
    } catch (e) {
      setReviewError('Server error.');
    }
    setSubmittingReview(false);
  }

  async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete your review?')) return;
    const customer = localStorage.getItem('dv_customer');
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.flag) {
        showToast('Review deleted', '#f5c842', '#0a0a0f');
        loadReviews();
        loadProduct();
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function renderStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  function showToast(msg, bg = '#10b981', color = '#fff') {
    setToast({ msg, bg, color });
    setTimeout(() => setToast(null), 2500);
  }

  function addToCart() {
    const c = localStorage.getItem('dv_customer');
    if (!c) { router.push(`/login?redirect=/product/${id}`); return; }
    const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
    if (cart.find(i => i.id === product._id)) { showToast('Already in cart! 🛒', '#f5c842', '#0a0a0f'); return; }
    cart.push({ id: product._id, name: product.name, price: product.sale_price, orig_price: product.original_price, image: product.images?.[0] || null, qty: 1 });
    localStorage.setItem('dv_cart', JSON.stringify(cart));
    showToast('Added to cart! 🎉', '#10b981', '#fff');
    // Realtime cart update
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }

  function buyNow() {
    const c = localStorage.getItem('dv_customer');
    if (!c) { router.push(`/login?redirect=/product/${id}`); return; }

    // Cart mein add karo
    const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
    if (!cart.find(i => i.id === product._id)) {
      cart.push({
        id: product._id,
        name: product.name,
        price: product.sale_price,
        orig_price: product.original_price,
        image: product.images?.[0] || null,
        qty: 1
      });
      localStorage.setItem('dv_cart', JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('cart-updated'));
    }

    // Cart page pe redirect
    router.push('/cart');
  }

  if (loading) return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #f5c842', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }}></div>
        <p style={{ color: '#6b7280', fontFamily: 'DM Sans, sans-serif' }}>Loading product...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const sale = product.sale_price || 0;
  const orig = product.original_price || 0;
  const discount = orig && sale ? Math.round((orig - sale) / orig * 100) : 0;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0f', minHeight: '100vh', color: '#e8e8f0' }}>
        {/* Nav */}
        <nav style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid rgba(245,200,66,0.1)', backdropFilter: 'blur(20px)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#f5c842', textDecoration: 'none' }}>DigitalVault</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>← Store</Link>
              <Link href="/account" style={{ fontSize: '0.875rem', color: '#9ca3af', textDecoration: 'none' }}>My Account</Link>
              <Link href="/cart" style={{ position: 'relative', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, flexShrink: 0 }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#f5c842', color: '#0a0a0f', fontSize: '10px', fontWeight: 700, width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </nav>

        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '40px 24px' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#6b7280', marginBottom: '32px' }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href="/#products" style={{ color: '#6b7280', textDecoration: 'none' }}>Products</Link>
            <span>›</span>
            <span style={{ color: '#fff' }}>{product.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            {/* LEFT — Images */}
            <div className="w-full lg:w-1/2 min-w-0">
              {/* Main Image */}
              <div className="mb-4">
                {mainImg ? (
                  <img src={mainImg} alt={product.name} className="w-full aspect-square object-cover rounded-2xl border border-[#f5c842]/15" />
                ) : (
                  <div className="w-full aspect-square bg-[#12121a] rounded-2xl border border-[#f5c842]/15 flex items-center justify-center text-8xl">📦</div>
                )}
              </div>
              {/* Thumbnails */}
              {product.images?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {product.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      onClick={() => setMainImg(img)}
                      className={`w-[70px] h-[70px] sm:w-[80px] sm:h-[80px] object-cover rounded-xl cursor-pointer shrink-0 transition-colors border-2 ${mainImg === img ? 'border-[#f5c842]' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Info */}
            <div className="w-full lg:w-1/2 flex flex-col min-w-0">
              <div className="inline-block bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full font-['Syne',sans-serif] tracking-wide uppercase mb-3 sm:mb-4 w-fit">
                Digital Product
              </div>

              <h1 className="font-['Syne',sans-serif] text-2xl sm:text-3xl lg:text-[2rem] font-bold text-white mb-3 sm:mb-4 leading-tight break-words">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <span className="text-[#f5c842] text-sm sm:text-base">{renderStars(Math.round(product.average_rating || 5))}</span>
                <span className="text-xs sm:text-sm text-gray-500">({product.average_rating > 0 ? product.average_rating : 'No reviews'} {product.total_reviews > 0 ? `· ${product.total_reviews} Review${product.total_reviews !== 1 ? 's' : ''}` : ''}) · Instant Download</span>
              </div>

              {/* Price */}
              <div className="flex flex-row flex-wrap items-center gap-3 sm:gap-4 mb-2">
                <span className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold text-[#f5c842] font-['Syne',sans-serif]">₹{sale.toLocaleString()}</span>
                {orig > 0 && <span className="text-lg sm:text-xl text-gray-500 line-through">₹{orig.toLocaleString()}</span>}
                {discount > 0 && <span className="text-xs sm:text-sm font-bold text-[#10b981] bg-[#10b981]/10 px-2 sm:px-3 py-1 rounded-lg shrink-0">{discount}% OFF</span>}
              </div>
              <p className="text-[#10b981] text-xs sm:text-sm mb-6">✓ Inclusive of all taxes</p>

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 sm:mb-7">
                {[['⚡', 'Instant Download'], ['♾️', 'Lifetime Access'], ['💰', '7-Day Refund'], ['🔒', 'Secure Payment']].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                    <span className="text-[#f5c842]">{icon}</span> {text}
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button onClick={addToCart} className="flex-1 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold font-['Syne',sans-serif] bg-[#f5c842]/10 border-2 border-[#f5c842]/40 text-[#f5c842] hover:bg-[#f5c842]/20 transition-all">
                  🛒 Add to Cart
                </button>
                <button onClick={buyNow} className="flex-1 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold font-['Syne',sans-serif] bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] hover:brightness-110 transition-all">
                  ⚡ Buy Now
                </button>
              </div>

              <div className="border-t border-[#f5c842]/10 pt-6 flex flex-col gap-3 text-xs sm:text-sm">
                {[['Format', 'Digital Download'], ['Delivery', 'Instant (Email + Download Page)'], ['Access', 'Lifetime'], ['Support', 'Email Support']].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-start gap-4">
                    <span className="text-gray-500 shrink-0">{k}</span>
                    <span className="text-white text-right break-words">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div style={{ marginTop: '56px' }}>
              <div style={{ borderBottom: '1px solid rgba(245,200,66,0.1)', marginBottom: '32px', paddingBottom: '16px' }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#fff', fontSize: '1rem', borderBottom: '2px solid #f5c842', paddingBottom: '16px' }}>Description</span>
              </div>
              <div dangerouslySetInnerHTML={{ __html: product.description }} className="text-gray-300 leading-relaxed max-w-3xl" />
            </div>
          )}

          {/* Customer Reviews Section */}
          <div style={{ marginTop: '56px' }}>
            <div style={{ borderBottom: '1px solid rgba(245,200,66,0.1)', marginBottom: '32px', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#fff', fontSize: '1.25rem' }}>Customer Reviews</span>
              <button 
                onClick={() => setReviewFormOpen(!reviewFormOpen)}
                className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-bold font-syne px-4 py-2 rounded-lg text-sm shadow-lg shadow-[#f5c842]/20 hover:scale-[1.02] transition-transform border-none cursor-pointer"
              >
                {reviewFormOpen ? 'Cancel Review' : 'Write a Review'}
              </button>
            </div>

            {reviewFormOpen && (
              <form onSubmit={submitReview} className="bg-[#12121a] p-6 rounded-2xl border border-white/5 mb-8 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-white mb-2">Write a Review</h3>
                
                {reviewError && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm border border-red-500/20">{reviewError}</div>}
                
                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-2 uppercase tracking-wider">Rating</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button 
                        key={star} 
                        type="button"
                        onClick={() => setMyRating(star)}
                        className={`text-2xl bg-transparent border-none cursor-pointer transition-transform hover:scale-110 ${star <= myRating ? 'text-[#f5c842]' : 'text-gray-600'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#f5c842] block mb-2 uppercase tracking-wider">Review</label>
                  <textarea 
                    value={myReviewText} 
                    onChange={e => setMyReviewText(e.target.value)} 
                    className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-4 py-3 rounded-xl text-sm focus:border-[#f5c842]/50 transition-colors min-h-[100px] resize-y"
                    placeholder="What did you like or dislike?"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submittingReview} 
                  className={`self-start px-6 py-2.5 rounded-xl bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] cursor-pointer text-sm font-syne font-bold border-none ${submittingReview ? 'opacity-70' : 'hover:scale-[1.02]'} transition-transform`}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}

            {/* Review List */}
            {reviews.length === 0 ? (
              <div className="text-gray-500 text-center py-8 bg-[#12121a] rounded-2xl border border-white/5">
                <div className="text-4xl mb-3 opacity-50">⭐</div>
                <p>No reviews yet. Be the first to review this product!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map(review => {
                  // Determine if the current logged-in user owns this review
                  const currentUserId = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('dv_customer') || '{}')._id : null;
                  const isMine = currentUserId && review.customer_id && review.customer_id._id === currentUserId;

                  return (
                    <div key={review._id} className="bg-[#12121a] p-5 rounded-2xl border border-white/5 flex flex-col relative group">
                      {review.is_featured && (
                        <div className="absolute top-0 right-0 bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] text-[10px] font-bold px-2 py-1 rounded-bl-xl rounded-tr-2xl shadow-lg">
                          ⭐ Featured
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                            {review.customer_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              {review.customer_name}
                              {review.verified_purchase && <span className="text-[#10b981] text-[10px] bg-[#10b981]/10 px-1.5 py-0.5 rounded-full" title="Verified Purchase">✓ Verified</span>}
                            </div>
                            <div className="text-gray-500 text-xs mt-0.5">{new Date(review.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        {isMine && (
                          <button onClick={() => deleteReview(review._id)} className="text-red-500/70 hover:text-red-500 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded text-xs transition-colors border border-red-500/20 cursor-pointer">
                            Delete
                          </button>
                        )}
                      </div>
                      
                      <div className="text-[#f5c842] text-lg mb-2">
                        {renderStars(review.rating)}
                      </div>
                      
                      {review.review_text && (
                        <p className="text-gray-300 text-sm leading-relaxed mt-1 flex-1">
                          {review.review_text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, padding: '12px 20px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 600, background: toast.bg, color: toast.color, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', fontFamily: 'DM Sans, sans-serif' }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
