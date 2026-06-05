'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import Toast from '@/components/Toast';
import Navbar from '@/components/Navbar';
import { useBundlePurchase } from '@/hooks/useBundlePurchase';
import { useSettings } from '@/hooks/useSettings';
import { optimizeCloudinary } from '@/lib/cloudinary-image';
import { extractYoutubeVideoId, getYoutubeEmbedUrls, getYoutubeWatchUrl } from '@/lib/youtube';

let razorpayScriptPromise = null;

function loadRazorpayScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export default function ProductPage({ id, initialProduct }) {
  const [product, setProduct] = useState(initialProduct || null);
  const [mainImg, setMainImg] = useState(initialProduct?.images?.[0] || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [toast, setToast] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [youtubeEmbedHostIndex, setYoutubeEmbedHostIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [productCoupon, setProductCoupon] = useState(null);
  const [guestCheckoutOpen, setGuestCheckoutOpen] = useState(false);
  const [guestForm, setGuestForm] = useState({ email: '', phone: '' });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [currentCustomerId, setCurrentCustomerId] = useState('');
  const { hasBundleAccess } = useBundlePurchase({ showToast });
  const { settings } = useSettings();

  const youtubeVideoUrl = product?.youtube_video_url || '';
  const youtubeVideoId = extractYoutubeVideoId(youtubeVideoUrl);
  const youtubeEmbedUrls = getYoutubeEmbedUrls(youtubeVideoUrl);
  const youtubeEmbedUrl = youtubeEmbedUrls[youtubeEmbedHostIndex] || '';

  useEffect(() => {
    setYoutubeEmbedHostIndex(0);
  }, [youtubeVideoId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsZoomed(false);
      }
    };
    if (isZoomed) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isZoomed]);

  useEffect(() => {
    const storageKey = `dv_timer_${id}`;
    let expiry = localStorage.getItem(storageKey);
    let now = Date.now();
    let expiryTime;

    if (!expiry) {
      expiryTime = now + 10 * 60 * 1000;
      localStorage.setItem(storageKey, expiryTime.toString());
    } else {
      expiryTime = parseInt(expiry, 10);
      if (isNaN(expiryTime) || expiryTime <= now) {
        expiryTime = now + 10 * 60 * 1000;
        localStorage.setItem(storageKey, expiryTime.toString());
      }
    }

    const computeTimeLeft = () => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        const newExpiry = Date.now() + 10 * 60 * 1000;
        localStorage.setItem(storageKey, newExpiry.toString());
      }
    };

    computeTimeLeft();
    const interval = setInterval(computeTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [id]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  function copyLink() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Link copied to clipboard! 📋', '#10b981', '#fff'))
      .catch(() => showToast('Failed to copy link ❌', '#ef4444', '#fff'));
    setShowShareMenu(false);
  }

  function shareWhatsApp() {
    if (typeof window === 'undefined') return;
    const text = encodeURIComponent(`Check out ${product?.name || 'this product'} on DigitalVault! ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    setShowShareMenu(false);
  }

  function shareTelegram() {
    if (typeof window === 'undefined') return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out ${product?.name || 'this product'} on DigitalVault!`);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    setShowShareMenu(false);
  }

  const router = useRouter();

  useEffect(() => {
    // Preload Razorpay script in background to save ~0.8s during checkout
    loadRazorpayScript().catch(() => {});

    // If we have server-provided data, load secondary data immediately in parallel
    if (initialProduct) {
      const productId = initialProduct.id || initialProduct._id;
      if (productId) {
        Promise.all([
          loadReviews(productId),
          fetchProductCoupon(productId),
        ]);
      }
    } else {
      // Fallback: client-side fetch if no server data available
      loadProduct();
    }

    const loadCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
      setCartCount(cart.reduce((s, i) => s + i.qty, 0));
    };
    const loadCurrentCustomer = () => {
      const customer = getStoredCustomer();
      setCurrentCustomerId(customer?.id || customer?._id || '');
    };
    loadCartCount();
    loadCurrentCustomer();
    window.addEventListener('cart-updated', loadCartCount);
    window.addEventListener('auth-updated', loadCurrentCustomer);
    window.addEventListener('storage', loadCartCount);
    window.addEventListener('storage', loadCurrentCustomer);
    return () => {
      window.removeEventListener('cart-updated', loadCartCount);
      window.removeEventListener('auth-updated', loadCurrentCustomer);
      window.removeEventListener('storage', loadCartCount);
      window.removeEventListener('storage', loadCurrentCustomer);
    };
  }, []);

  async function loadProduct() {
    try {
      const res = await fetch(`/api/product?id=${id}`);
      const data = await res.json();
      if (!data.flag) { router.push('/'); return; }
      setProduct(data.product);
      setMainImg(data.product.images?.[0] || null);
      setShowVideoPreview(false);
      setLoading(false);

      const productId = data.product?._id || data.product?.id;
      if (productId) {
        Promise.all([
          loadReviews(productId),
          fetchProductCoupon(productId),
        ]);
      }
    } catch(e) {
      router.push('/');
    }
  }

  async function loadReviews(prodId) {
    const targetId = prodId || product?.id || product?._id;
    if (!targetId) return;
    try {
      const res = await fetch(`/api/reviews?productId=${targetId}`);
      const data = await res.json();
      if (data.flag) {
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchProductCoupon(productId) {
    const targetId = productId || product?.id || product?._id;
    if (!targetId) return;
    try {
      let email = '';
      if (typeof window !== 'undefined') {
        const c = localStorage.getItem('dv_customer');
        if (c) {
          email = JSON.parse(c).email || '';
        }
      }
      const url = email ? `/api/coupon?action=public-coupons&email=${encodeURIComponent(email)}` : '/api/coupon?action=public-coupons';
      const res = await fetch(url);
      const data = await res.json();
      if (data.flag && data.coupons) {
        // Find best matching coupon for this product
        const match = data.coupons.find(c => {
          const pids = (c.product_ids || []).map(pid => pid.toString());
          return pids.length === 0 || pids.includes(targetId); // all products or specific match
        });
        if (match) setProductCoupon(match);
      }
    } catch (e) { /* silently fail */ }
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
    const duration = msg.toLowerCase().includes('cart') ? 4000 : 2500;
    setTimeout(() => setToast(null), duration);
  }

  function getStoredCustomer() {
    try {
      return JSON.parse(localStorage.getItem('dv_customer') || 'null');
    } catch {
      localStorage.removeItem('dv_customer');
      return null;
    }
  }

  function addToCart() {
    const productId = product.id || product._id;
    const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
    if (cart.find(i => i.id === productId)) { showToast('Already in cart! 🛒', '#f5c842', '#0a0a0f'); return; }
    cart.push({ id: productId, slug: product.slug, name: product.name, price: product.sale_price, orig_price: product.original_price, image: product.images?.[0] || null, qty: 1 });
    localStorage.setItem('dv_cart', JSON.stringify(cart));
    showToast('Added to cart! 🎉', '#10b981', '#fff');
    // Realtime cart update
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }

  async function startProductCheckout(contact = null) {
    if (!product || checkoutLoading) return;
    setCheckoutError('');
    setCheckoutLoading(true);

    let customer = getStoredCustomer();
    let email = customer?.email || contact?.email || '';
    let phone = customer?.phone || contact?.phone || '';
    let name = customer?.name || 'Guest';

    if (contact) {
      try {
        const loginRes = await fetch('/api/customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'silent-guest-login', email: contact.email, phone: contact.phone })
        });
        const loginData = await loginRes.json();
        if (loginData.flag && loginData.customer) {
          localStorage.setItem('dv_customer', JSON.stringify(loginData.customer));
          window.dispatchEvent(new CustomEvent('auth-updated'));
          customer = loginData.customer;
          email = customer.email;
          phone = customer.phone;
          name = customer.name;
        } else {
          setCheckoutError(loginData.message || 'Error processing guest details.');
          setCheckoutLoading(false);
          return;
        }
      } catch (e) {
        setCheckoutError('Network error. Try again.');
        setCheckoutLoading(false);
        return;
      }
    }

    const productId = product.id || product._id;

    try {
      const orderRes = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          product_id: productId,
          email,
          phone,
        })
      });
      const orderData = await orderRes.json();
      if (!orderData.flag) {
        setCheckoutError(orderData.message || 'Error creating order.');
        setCheckoutLoading(false);
        return;
      }

      const razorpayReady = await loadRazorpayScript();
      if (!razorpayReady || !window.Razorpay) {
        setCheckoutError('Payment gateway failed to load. Try again.');
        setCheckoutLoading(false);
        return;
      }

      setCheckoutLoading(false);
      setGuestCheckoutOpen(false);

      const rzp = new window.Razorpay({
        key: orderData.razorpay_key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault',
        description: product.name,
        order_id: orderData.razorpay_order_id,
        prefill: { name, email, contact: phone },
        theme: { color: '#f5c842' },
        handler: async function(response) {
          const verifyRes = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'payment-success',
              razorpay_response: response,
              order_id: orderData.order_id,
              email,
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.flag && verifyData.download_token) {
            router.push(`/download?token=${verifyData.download_token}`);
          } else {
            setCheckoutError(verifyData.message || 'Payment error. Please check My Account.');
          }
        },
        modal: { ondismiss: () => setCheckoutError('Payment cancelled.') }
      });
      rzp.open();
    } catch {
      setCheckoutError('Network error. Try again.');
      setCheckoutLoading(false);
    }
  }

  function submitGuestCheckout() {
    const email = guestForm.email.trim().toLowerCase();
    const phone = guestForm.phone.replace(/\D/g, '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCheckoutError('Please enter a valid email address.');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setCheckoutError('Please enter a valid 10-digit phone number.');
      return;
    }
    startProductCheckout({ email, phone });
  }

  function buyNow() {
    const customer = getStoredCustomer();
    if (!customer || !customer.email || !customer.phone) {
      setGuestForm({
        email: customer?.email || '',
        phone: customer?.phone || '',
      });
      setCheckoutError('');
      setGuestCheckoutOpen(true);
      return;
    }
    startProductCheckout();
  }

  if (loading) return (
    <div className="theme-page font-dm min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Nav Skeleton */}
      <nav className="sticky top-0 z-[100] border-b border-[#f5c842]/10 bg-[var(--nav-bg)] px-6 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1152px] items-center justify-between gap-4">
          <div className="w-32 h-6 rounded-lg skeleton-shimmer" />
          <div className="flex gap-4 items-center">
            <div className="w-12 h-4 rounded skeleton-shimmer" />
            <div className="w-20 h-4 rounded skeleton-shimmer sm:inline hidden" />
            <div className="w-8 h-8 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1152px] px-4 py-6 md:px-6 md:py-10">
        {/* Breadcrumb Skeleton */}
        <div className="mb-5 md:mb-8 flex items-center gap-1.5">
          <div className="w-12 h-4 rounded skeleton-shimmer" />
          <span className="text-white/10">›</span>
          <div className="w-16 h-4 rounded skeleton-shimmer" />
          <span className="text-white/10">›</span>
          <div className="w-24 h-4 rounded skeleton-shimmer" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* LEFT — Images Skeleton */}
          <div className="w-full max-w-[80%] mx-auto lg:max-w-none lg:w-[40%] min-w-0">
            <div className="mb-4 aspect-square w-full rounded-2xl skeleton-shimmer" />
            <div className="flex gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-[70px] h-[70px] sm:w-[80px] sm:h-[80px] rounded-xl skeleton-shimmer" />
              ))}
            </div>
          </div>

          {/* RIGHT — Info Skeleton */}
          <div className="w-full lg:w-[60%] flex flex-col min-w-0 space-y-5">
            <div className="w-24 h-5 rounded-full skeleton-shimmer" />
            <div className="w-3/4 h-10 rounded-xl skeleton-shimmer" />
            <div className="w-1/2 h-5 rounded skeleton-shimmer" />
            
            {/* Price block */}
            <div className="py-2 flex items-center gap-4">
              <div className="w-32 h-10 rounded-xl skeleton-shimmer" />
              <div className="w-20 h-6 rounded-lg skeleton-shimmer" />
            </div>

            {/* Coupon badge skeleton */}
            <div className="w-72 h-12 rounded-xl skeleton-shimmer" />

            {/* Highlights skeleton */}
            <div className="grid grid-cols-2 gap-3 py-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full skeleton-shimmer" />
                  <div className="w-24 h-4 rounded skeleton-shimmer" />
                </div>
              ))}
            </div>

            {/* Buttons skeleton */}
            <div className="flex gap-4 pt-2">
              <div className="flex-1 h-12 rounded-xl skeleton-shimmer" />
              <div className="flex-1 h-12 rounded-xl skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const sale = product.sale_price || 0;
  const orig = product.original_price || 0;
  const discount = orig && sale ? Math.round((orig - sale) / orig * 100) : 0;

  return (
    <>
      <div className="theme-page font-dm">
        <Navbar />
        {/* Spacer to prevent fixed navbar from covering content */}
        <div className="h-[52px] md:h-[62px]" />

        <div className="mx-auto max-w-[1152px] px-4 pt-3 pb-6 md:px-6 md:pt-4 md:pb-10">
          {/* Fake Countdown Urgency Timer Banner */}
          <div className="mb-4 sm:mb-5 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-[#f5c842]/20 bg-gradient-to-r from-[#f5c842]/10 to-[#e0a800]/5 backdrop-blur-md shadow-md animate-[pulse_3s_ease-in-out_infinite]">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-white font-medium">
              <span className="text-base sm:text-lg">⏳</span>
              <span>
                Flash Sale: Special discount ends in{' '}
                <span className="font-mono font-bold text-[#f5c842] bg-black/30 px-2 py-0.5 rounded border border-[#f5c842]/10 ml-1">
                  {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </span>
              </span>
            </div>
            {discount > 0 && (
              <span className="text-[10px] sm:text-xs font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full shrink-0">
                {discount}% OFF
              </span>
            )}
          </div>
          {/* Breadcrumb */}
          <div className="mb-3 md:mb-5 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-[var(--muted-2)] leading-relaxed">
            <Link href="/" className="theme-link no-underline">Home</Link>
            <span className="opacity-40">›</span>
            <Link href="/#products" className="theme-link no-underline">Products</Link>
            <span className="opacity-40">›</span>
            <span className="text-[var(--heading)] truncate max-w-[160px] xs:max-w-[220px] sm:max-w-none">{product.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            {/* LEFT — Images */}
            <div className="w-full max-w-[80%] mx-auto lg:max-w-none lg:w-[40%] min-w-0">
              {/* Main Image */}
              <div className="mb-3">
                {mainImg ? (
                  <div className="relative cursor-zoom-in" onClick={() => setIsZoomed(true)}>
                    <Image src={optimizeCloudinary(mainImg, 800)} alt={product.name} width={800} height={800} priority className="w-full aspect-square object-cover rounded-2xl border border-[#f5c842]/15" sizes="(max-width: 1024px) 100vw, 50vw" />
                    {youtubeVideoUrl && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowVideoPreview(true); }}
                        className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full border border-[#f5c842]/40 bg-black/65 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-md shadow-[0_0_0_0_rgba(245,200,66,0.42)] transition-transform hover:scale-[1.02] hover:bg-black/75 hover:shadow-[0_0_22px_rgba(245,200,66,0.55)] animate-[pulse_2.4s_ease-in-out_infinite] sm:bottom-3 sm:right-3 sm:px-3 sm:text-[11px]"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f5c842] text-[10px] text-[#0a0a0f]">▶</span>
                        Preview
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative flex aspect-square w-full items-center justify-center rounded-2xl border border-[#f5c842]/15 bg-[var(--surface)] text-8xl">
                    📦
                    {youtubeVideoUrl && (
                      <button
                        type="button"
                        onClick={() => setShowVideoPreview(true)}
                        className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full border border-[#f5c842]/40 bg-black/65 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-md shadow-[0_0_0_0_rgba(245,200,66,0.42)] transition-transform hover:scale-[1.02] hover:bg-black/75 hover:shadow-[0_0_22px_rgba(245,200,66,0.55)] animate-[pulse_2.4s_ease-in-out_infinite] sm:bottom-3 sm:right-3 sm:px-3 sm:text-[11px]"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f5c842] text-[10px] text-[#0a0a0f]">▶</span>
                        Preview
                      </button>
                    )}
                  </div>
                )}
              </div>
              {/* Thumbnails */}
              {product.images?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
                  {product.images.map((img, i) => (
                    <img
                      key={i}
                      src={optimizeCloudinary(img, 100)}
                      alt={`${product.name} ${i + 1}`}
                      onClick={() => setMainImg(img)}
                      loading="lazy"
                      className={`w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] object-cover rounded-xl cursor-pointer shrink-0 transition-colors border-2 ${mainImg === img ? 'border-[#f5c842]' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Info */}
            <div className="w-full lg:w-[60%] flex flex-col min-w-0">
              <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4 relative">
                <div className="inline-block bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full font-['Syne',sans-serif] tracking-wide uppercase w-fit">
                  Digital Product
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-['Syne',sans-serif] border border-[#f5c842]/30 text-[#f5c842] bg-[#f5c842]/5 hover:bg-[#f5c842]/10 transition-all cursor-pointer"
                    title="Share this product"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <circle cx="18" cy="5" r="3"/>
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    <span>Share</span>
                  </button>

                  {showShareMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
                      <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-[#12121a]/95 backdrop-blur-xl p-2 shadow-xl z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                          onClick={copyLink}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-[#f5c842] hover:bg-white/5 rounded-xl transition-all text-left border-none cursor-pointer bg-transparent"
                        >
                          📋 Copy Link
                        </button>
                        <button
                          onClick={shareWhatsApp}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-[#25D366] hover:bg-white/5 rounded-xl transition-all text-left border-none cursor-pointer bg-transparent"
                        >
                          💬 WhatsApp
                        </button>
                        <button
                          onClick={shareTelegram}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-[#0088cc] hover:bg-white/5 rounded-xl transition-all text-left border-none cursor-pointer bg-transparent"
                        >
                          ✈️ Telegram
                        </button>
                      </div>
                    </>
                  )}
                </div>
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
                <span className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold text-[#f5c842]">₹{sale.toLocaleString()}</span>
                {orig > 0 && <span className="text-lg text-[var(--muted-2)] line-through sm:text-xl">₹{orig.toLocaleString()}</span>}
                {discount > 0 && <span className="text-xs sm:text-sm font-bold text-[#10b981] bg-[#10b981]/10 px-2 sm:px-3 py-1 rounded-lg shrink-0">{discount}% OFF</span>}
              </div>
              <p className="text-[#10b981] text-xs sm:text-sm mb-2 sm:mb-3">✓ Inclusive of all taxes</p>

              {/* Coupon Badge */}
              {productCoupon && (
                <button
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(productCoupon.code);
                      showToast(`Code "${productCoupon.code}" copied! 🎟️`, '#7c3aed', '#fff');
                    }
                  }}
                  className="mb-4 sm:mb-5 flex items-center gap-2 w-fit px-3 py-2 rounded-xl border border-dashed border-[#7c3aed]/40 bg-[#7c3aed]/[0.06] hover:bg-[#7c3aed]/[0.12] transition-all cursor-pointer group"
                  title="Click to copy coupon code"
                >
                  <span className="text-base">🎟️</span>
                  <span className="text-xs sm:text-sm text-[var(--text)]">
                    Use code <span className="font-mono font-bold text-[#7c3aed] group-hover:text-[#9f67ff] transition-colors">{productCoupon.code}</span> for{' '}
                    <span className="font-bold text-[#10b981]">
                      {productCoupon.discount_type === 'percentage' ? `${productCoupon.discount_value}% off` : `₹${productCoupon.discount_value} off`}
                    </span>
                  </span>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="opacity-40 group-hover:opacity-70 transition-opacity shrink-0">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </button>
              )}

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 sm:mb-7">
                {[['⚡', 'Instant Download'], ['♾️', 'Lifetime Access'], ['💰', '7-Day Refund'], ['🔒', 'Secure Payment']].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-[var(--text)] sm:text-sm">
                    <span className="text-[#f5c842]">{icon}</span> {text}
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="hidden md:flex flex-row gap-3 mb-6 sm:mb-8">
                {hasBundleAccess && product.included_in_bundle ? (
                  <a
                    href={`/api/bundle/download/${product.id || product._id}`}
                    className="flex-1 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold font-['Syne',sans-serif] bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] text-center no-underline flex items-center justify-center shadow-lg transform transition-all duration-100 ease-out hover:scale-[1.01] hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,200,66,0.3)] active:scale-[0.96] active:brightness-95 select-none"
                  >
                    📥 Access Now (Download)
                  </a>
                ) : (
                  <>
                    <button 
                      onClick={addToCart} 
                      className="flex-[0.4] sm:flex-[0.3] py-2.5 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold font-['Syne',sans-serif] bg-[#f5c842]/5 border border-[#f5c842]/25 text-[#f5c842] opacity-80 hover:opacity-100 transform transition-all duration-100 ease-out hover:bg-[#f5c842]/10 hover:scale-[1.01] active:scale-[0.96] active:bg-[#f5c842]/20 select-none cursor-pointer"
                    >
                      🛒 Add<span className="hidden sm:inline"> to Cart</span>
                    </button>
                    <button 
                      onClick={buyNow} 
                      disabled={checkoutLoading}
                      className="flex-1 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold font-['Syne',sans-serif] bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] transform transition-all duration-100 ease-out enabled:hover:scale-[1.02] enabled:hover:brightness-110 enabled:hover:shadow-[0_0_25px_rgba(245,200,66,0.35)] enabled:active:scale-[0.96] enabled:active:brightness-95 disabled:opacity-75 disabled:cursor-not-allowed select-none cursor-pointer"
                    >
                      {checkoutLoading ? '⏳ Opening Payment...' : `⚡ Buy Now - ₹${sale.toLocaleString()}`}
                    </button>
                  </>
                )}
              </div>
              {checkoutError && (
                <div className="mb-6 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/8 px-3.5 py-2.5 text-[0.8rem] text-[#ef4444]">
                  {checkoutError}
                </div>
              )}

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
                  const isMine = currentCustomerId && review.customer_id && review.customer_id._id === currentCustomerId;

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

      {guestCheckoutOpen && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
          onClick={() => !checkoutLoading && setGuestCheckoutOpen(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-2xl border border-[#f5c842]/20 bg-[#12121a] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-['Syne',sans-serif] text-xl font-bold text-white">Checkout Details</h2>
                <p className="mt-1 text-sm text-[#9ca3af]">Enter your details to continue payment.</p>
              </div>
              <button
                type="button"
                onClick={() => !checkoutLoading && setGuestCheckoutOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
                aria-label="Close checkout"
              >
                x
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#9ca3af]">Email Address</label>
                <input
                  type="email"
                  value={guestForm.email}
                  onChange={event => setGuestForm(prev => ({ ...prev, email: event.target.value }))}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a2a] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#f5c842]/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#9ca3af]">Phone Number</label>
                <input
                  type="tel"
                  value={guestForm.phone}
                  onChange={event => setGuestForm(prev => ({ ...prev, phone: event.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a2a] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#f5c842]/50"
                  maxLength={10}
                />
              </div>
            </div>

            {checkoutError && (
              <div className="mt-4 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/8 px-3.5 py-2.5 text-[0.8rem] text-[#ef4444]">
                {checkoutError}
              </div>
            )}

            <button
              type="button"
              onClick={submitGuestCheckout}
              disabled={checkoutLoading}
              className="mt-5 w-full rounded-xl border-none bg-gradient-to-br from-[#f5c842] to-[#e0a800] px-4 py-3.5 font-['Syne',sans-serif] text-base font-bold text-[#0a0a0f] transform transition-all duration-100 ease-out enabled:hover:scale-[1.01] enabled:hover:shadow-[0_0_20px_rgba(245,200,66,0.3)] enabled:active:scale-[0.96] enabled:active:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 select-none cursor-pointer"
            >
              {checkoutLoading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      )}

      {isZoomed && mainImg && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md transition-all duration-300"
          onClick={() => setIsZoomed(false)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 z-[1010] flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white border border-white/20 transition-all hover:bg-black/80 hover:scale-105 cursor-pointer text-xl"
              aria-label="Close zoom"
            >
              ✕
            </button>
            <img 
              src={optimizeCloudinary(mainImg, 1600)} 
              alt={product?.name || 'Zoomed Image'} 
              className="max-w-full max-h-[90vh] object-contain rounded-xl select-none shadow-2xl"
            />
          </div>
        </div>
      )}

      {showVideoPreview && youtubeVideoUrl && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
          onClick={() => setShowVideoPreview(false)}
        >
          <div
            className="relative flex h-[calc(100dvh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f1018] shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-3 border-b border-white/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#f5c842] sm:text-[11px]">Product Preview</p>
                <p className="truncate text-sm font-semibold text-white sm:text-base">{product?.name}</p>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
                {youtubeVideoId && (
                  <a
                    href={getYoutubeWatchUrl(youtubeVideoUrl) || youtubeVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-full border border-[#f5c842]/30 px-3 py-2 text-center text-[11px] font-bold text-[#f5c842] no-underline transition-colors hover:bg-[#f5c842]/10 sm:w-auto sm:py-1.5"
                  >
                    Open in YouTube
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setShowVideoPreview(false)}
                  className="flex h-9 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 sm:w-9"
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 bg-black">
              {youtubeEmbedUrl ? (
                <iframe
                  src={youtubeEmbedUrl}
                  title={`${product?.name || 'Product'} preview video`}
                  className="h-full w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={() => {
                    setYoutubeEmbedHostIndex((current) => Math.min(current + 1, Math.max(youtubeEmbedUrls.length - 1, 0)));
                  }}
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center px-6 text-center text-sm text-gray-300">
                  <a
                    href={youtubeVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-[#f5c842]/30 px-4 py-2 font-bold text-[#f5c842] no-underline hover:bg-[#f5c842]/10"
                  >
                    Open preview in YouTube
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast toast={toast} />

      {/* Mobile Sticky CTA Panel */}
      {!loading && product && (
        <>
          {/* Spacer at the bottom of the page content to prevent overlap */}
          <div className="md:hidden h-[calc(60px+58px+env(safe-area-inset-bottom))]" aria-hidden="true" />
          
          <div className="md:hidden fixed bottom-[calc(58px+env(safe-area-inset-bottom))] left-0 right-0 z-[999] bg-[var(--nav-bg)] border-t border-[#f5c842]/10 backdrop-blur-xl px-4 py-2 flex flex-row gap-3 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
            {hasBundleAccess && product.included_in_bundle ? (
              <a
                href={`/api/bundle/download/${product.id || product._id}`}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold font-['Syne',sans-serif] bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] text-center no-underline flex items-center justify-center shadow-lg transform transition-all duration-100 ease-out hover:scale-[1.01] hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,200,66,0.3)] active:scale-[0.96] active:brightness-95 select-none"
              >
                📥 Access Now (Download)
              </a>
            ) : (
              <>
                <button 
                  onClick={addToCart} 
                  className="flex-[0.4] py-2 rounded-xl text-xs font-semibold font-['Syne',sans-serif] bg-[#f5c842]/5 border border-[#f5c842]/25 text-[#f5c842] opacity-80 hover:opacity-100 transform transition-all duration-100 ease-out hover:bg-[#f5c842]/10 hover:scale-[1.01] active:scale-[0.96] active:bg-[#f5c842]/20 select-none cursor-pointer"
                >
                  🛒 Add
                </button>
                <button 
                  onClick={buyNow} 
                  disabled={checkoutLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold font-['Syne',sans-serif] bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] transform transition-all duration-100 ease-out enabled:hover:scale-[1.02] enabled:hover:brightness-110 enabled:hover:shadow-[0_0_25px_rgba(245,200,66,0.35)] enabled:active:scale-[0.96] enabled:active:brightness-95 disabled:opacity-75 disabled:cursor-not-allowed select-none cursor-pointer"
                >
                  {checkoutLoading ? '⏳ Opening Payment...' : `⚡ Buy Now - ₹${sale.toLocaleString()}`}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
