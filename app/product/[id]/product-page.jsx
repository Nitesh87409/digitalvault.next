'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { useBundlePurchase } from '@/hooks/useBundlePurchase';

export default function ProductPage({ id }) {
  const [product, setProduct] = useState(null);
  const [mainImg, setMainImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const { hasBundleAccess, bundleLoading, unlockBundle } = useBundlePurchase({ showToast });


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

  async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete your review?')) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
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
    const productId = product.id || product._id;
    const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
    if (cart.find(i => i.id === productId)) { showToast('Already in cart! 🛒', '#f5c842', '#0a0a0f'); return; }
    cart.push({ id: productId, name: product.name, price: product.sale_price, orig_price: product.original_price, image: product.images?.[0] || null, qty: 1 });
    localStorage.setItem('dv_cart', JSON.stringify(cart));
    showToast('Added to cart! 🎉', '#10b981', '#fff');
    // Realtime cart update
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }

  function buyNow() {
    const c = localStorage.getItem('dv_customer');
    if (!c) { router.push(`/login?redirect=/product/${id}`); return; }

    // Cart mein add karo
    const productId = product.id || product._id;
    const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
    if (!cart.find(i => i.id === productId)) {
      cart.push({
        id: productId,
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
    <div className="theme-page flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#f5c842] border-t-transparent"></div>
        <p className="font-dm text-[var(--muted-2)]">Loading product...</p>
      </div>
    </div>
  );

  const sale = product.sale_price || 0;
  const orig = product.original_price || 0;
  const discount = orig && sale ? Math.round((orig - sale) / orig * 100) : 0;

  return (
    <>
      <div className="theme-page font-dm">
        {/* Nav */}
        <nav className="sticky top-0 z-[100] border-b border-[#f5c842]/10 bg-[var(--nav-bg)] px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1152px] items-center justify-between gap-4">
            <Link href="/" className="whitespace-nowrap font-syne text-xl font-bold text-[#f5c842] no-underline">DigitalVault</Link>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/" className="theme-link whitespace-nowrap text-sm no-underline">← Store</Link>
              <Link href="/account" className="theme-link hidden whitespace-nowrap text-sm no-underline sm:inline">My Account</Link>
              <ThemeToggle />
              <Link href="/cart" className="theme-icon-btn relative h-11 w-11 rounded-xl">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f5c842] text-[10px] font-bold text-[#0a0a0f]">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </nav>

        <div className="mx-auto max-w-[1152px] px-6 py-10">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-2 text-sm text-[var(--muted-2)]">
            <Link href="/" className="theme-link no-underline">Home</Link>
            <span>›</span>
            <Link href="/#products" className="theme-link no-underline">Products</Link>
            <span>›</span>
            <span className="text-[var(--heading)]">{product.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            {/* LEFT — Images */}
            <div className="w-full lg:w-1/2 min-w-0">
              {/* Main Image */}
              <div className="mb-4">
                {mainImg ? (
                  <img src={mainImg} alt={product.name} className="w-full aspect-square object-cover rounded-2xl border border-[#f5c842]/15" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-[#f5c842]/15 bg-[var(--surface)] text-8xl">📦</div>
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

              <h1 className="mb-3 break-words font-['Syne',sans-serif] text-2xl font-bold leading-tight text-[var(--heading)] sm:mb-4 sm:text-3xl lg:text-[2rem]">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <span className="text-[#f5c842] text-sm sm:text-base">{renderStars(Math.round(product.average_rating || 5))}</span>
                <span className="text-xs text-[var(--muted-2)] sm:text-sm">({product.average_rating > 0 ? product.average_rating : 'No reviews'} {product.total_reviews > 0 ? `· ${product.total_reviews} Review${product.total_reviews !== 1 ? 's' : ''}` : ''}) · Instant Download</span>
              </div>

              {/* Price */}
              <div className="flex flex-row flex-wrap items-center gap-3 sm:gap-4 mb-2">
                <span className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold text-[#f5c842] font-['Syne',sans-serif]">₹{sale.toLocaleString()}</span>
                {orig > 0 && <span className="text-lg text-[var(--muted-2)] line-through sm:text-xl">₹{orig.toLocaleString()}</span>}
                {discount > 0 && <span className="text-xs sm:text-sm font-bold text-[#10b981] bg-[#10b981]/10 px-2 sm:px-3 py-1 rounded-lg shrink-0">{discount}% OFF</span>}
              </div>
              <p className="text-[#10b981] text-xs sm:text-sm mb-6">✓ Inclusive of all taxes</p>

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 sm:mb-7">
                {[['⚡', 'Instant Download'], ['♾️', 'Lifetime Access'], ['💰', '7-Day Refund'], ['🔒', 'Secure Payment']].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-[var(--text)] sm:text-sm">
                    <span className="text-[#f5c842]">{icon}</span> {text}
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                {product.included_in_bundle && hasBundleAccess ? (
                  <a href={`/api/bundle/download/${product.id || product._id}`} className="flex-1 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold font-['Syne',sans-serif] bg-gradient-to-br from-[#8b5cf6] to-[#f5c842] text-[#0a0a0f] hover:brightness-110 transition-all text-center no-underline">
                    Bundle Access
                  </a>
                ) : product.included_in_bundle ? (
                  <button onClick={() => unlockBundle()} disabled={bundleLoading} className="flex-1 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold font-['Syne',sans-serif] bg-gradient-to-br from-[#8b5cf6] to-[#f5c842] text-[#0a0a0f] hover:brightness-110 transition-all disabled:opacity-70">
                    {bundleLoading ? 'Opening...' : 'Unlock Full Bundle'}
                  </button>
                ) : null}
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
                    <span className="shrink-0 text-[var(--muted-2)]">{k}</span>
                    <span className="break-words text-right text-[var(--heading)]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-14">
              <div className="mb-8 border-b border-[#f5c842]/10 pb-4">
                <span className="border-b-2 border-[#f5c842] pb-4 font-syne text-base font-bold text-[var(--heading)]">Description</span>
              </div>
              <div className="relative">
                <div 
                  className="max-w-3xl leading-relaxed text-[var(--text)] overflow-hidden transition-all duration-500 ease-in-out"
                  style={{ maxHeight: isDescExpanded ? '5000px' : '250px' }}
                >
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                </div>
                
                {!isDescExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none" />
                )}
              </div>
              <button 
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="mt-4 text-[#f5c842] font-semibold text-sm hover:underline flex items-center gap-1 transition-colors"
              >
                {isDescExpanded ? 'Show Less' : 'Read More'}
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={`transition-transform duration-300 ${isDescExpanded ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          )}

          {/* Customer Reviews Section */}
          <div className="mt-14">
            <div className="mb-8 border-b border-[#f5c842]/10 pb-4">
              <span className="font-syne text-xl font-bold text-[var(--heading)]">Customer Reviews</span>
            </div>


            {/* Review List */}
            {reviews.length === 0 ? (
              <div className="theme-card rounded-2xl py-8 text-center text-[var(--muted-2)]">
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
                    <div key={review._id} className="theme-card group relative flex flex-col rounded-2xl p-5">
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
                            <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--heading)]">
                              {review.customer_name}
                              {review.verified_purchase && <span className="text-[#10b981] text-[10px] bg-[#10b981]/10 px-1.5 py-0.5 rounded-full" title="Verified Purchase">✓ Verified</span>}
                            </div>
                            <div className="mt-0.5 text-xs text-[var(--muted-2)]">{new Date(review.createdAt).toLocaleDateString()}</div>
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
                        <p className="mt-1 flex-1 text-sm leading-relaxed text-[var(--text)]">
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
