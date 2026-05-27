'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { useToast } from '@/components/Toast';
import { useBundlePurchase } from '@/hooks/useBundlePurchase';
import dynamic from 'next/dynamic';

const Toast = dynamic(() => import('@/components/Toast'), { ssr: false });
const CountdownTimer = dynamic(() => import('@/components/CountdownTimer'), { ssr: false });
const FaqSection = dynamic(() => import('@/components/FaqSection'), { ssr: false });
const TestimonialsSection = dynamic(() => import('@/components/TestimonialsSection'), { ssr: false });

const API = process.env.NEXT_PUBLIC_APP_URL || '';
const BUNDLE_CART_ID = '__bundle_subscription__';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [totalSales, setTotalSales] = useState(1247);
  const [settingsLoaded, setSettingsLoaded] = useState(() => {
    if (typeof window !== 'undefined' && window.__initial_settings__) return true;
    if (typeof global !== 'undefined' && global.__server_settings__) return true;
    return false;
  });
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState(() => {
    if (typeof window !== 'undefined' && window.__initial_settings__) {
      return window.__initial_settings__;
    }
    if (typeof global !== 'undefined' && global.__server_settings__) {
      return global.__server_settings__;
    }
    return {
      support_email: 'support@digitalvault.in',
      support_phone: '+91 98765 43210',
      bundle_enabled: true,
      bundle_title: 'Complete Bundle',
      bundle_description: 'All products + future updates included',
      bundle_price: 207,
      bundle_original_price: 8497,
      business_hours: 'Mon–Sat, 10am–6pm IST',
      bundle_timer_enabled: true,
      bundle_timer_days: 0,
      bundle_timer_hours: 24,
      bundle_timer_minutes: 0,
      bundle_timer_action: 'hide_timer',
      bundle_features: ['Instant Download', 'Lifetime Access', 'Free Future Updates', '7-Day Guarantee'],
      bundle_badge_text: 'Limited Time Deal',
      bundle_badge_color: '#f5c842',
      bundle_cta_text: 'Unlock Bundle →',
      bundle_show_discount: true,
      bundle_banner_image: '',
      updatedAt: '',
      social_instagram_enabled: false,
      social_instagram_url: '',
      social_whatsapp_enabled: false,
      social_whatsapp_url: '',
      social_twitter_enabled: false,
      social_twitter_url: '',
      social_facebook_enabled: false,
      social_facebook_url: '',
      social_telegram_enabled: false,
      social_telegram_url: '',
      custom_social_links: []
    };
  });
  const { toast, showToast } = useToast();
  const { hasBundleAccess, bundleStatus } = useBundlePurchase({ showToast });

  const [faqs, setFaqs] = useState([
    { q: 'How do I get my download after payment?', a: "After successful payment, you'll receive an email with a secure download link. You also have lifetime access via My Account." },
    { q: 'Can I use these products for clients?', a: 'Yes! You get a commercial license to use all products for personal and client projects.' },
    { q: 'What payment methods are accepted?', a: 'We accept all major credit/debit cards, UPI, net banking, and wallets via Razorpay.' },
    { q: 'Is there a refund policy?', a: 'Yes! We offer a 7-day no-questions-asked refund policy.' },
    { q: 'Do I get future updates?', a: 'Yes! All future updates are free for existing customers forever.' },
  ]);
  const [homepageReviews, setHomepageReviews] = useState([
    { name: 'Rahul Kumar', role: 'Freelance Designer', review: 'Best investment I made this year. The templates saved me 40+ hours of work. Highly recommended!', initials: 'RK', color: 'linear-gradient(135deg,#f5c842,#e0a800)', textColor: '#0a0a0f', rating: 5 },
    { name: 'Priya Sharma', role: 'Startup Founder', review: 'The growth playbook alone is worth 10x the price. My startup grew from 0 to 5k users in 3 months!', initials: 'PS', color: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', textColor: '#fff', rating: 5 },
    { name: 'Arjun Mehta', role: 'Digital Marketer', review: 'Instant download worked perfectly. Quality is exceptional. Will definitely buy again!', initials: 'AM', color: 'linear-gradient(135deg,#10b981,#065f46)', textColor: '#fff', rating: 5 },
  ]);
  const [publicCoupons, setPublicCoupons] = useState([]);

  useEffect(() => {
    loadProducts();
    loadStats();
    loadSettings();
    loadFaqs();
    loadHomepageReviews();
    loadPublicCoupons();
  }, []);

  useEffect(() => {
    const handleSearchUpdate = (e) => {
      setSearchQuery(e.detail || '');
    };
    window.addEventListener('search-updated', handleSearchUpdate);

    // Sync search from URL query parameter on mount and scroll to products
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      setTimeout(() => {
        const productsSection = document.getElementById('products');
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 600);
    }

    return () => {
      window.removeEventListener('search-updated', handleSearchUpdate);
    };
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data.flag && data.settings) {
        setSettings({
          support_email: data.settings.support_email || 'support@digitalvault.in',
          support_phone: data.settings.support_phone || '+91 98765 43210',
          bundle_enabled: data.settings.bundle_enabled ?? true,
          bundle_title: data.settings.bundle_title || 'Complete Bundle',
          bundle_description: data.settings.bundle_description || 'All products + future updates included',
          bundle_price: data.settings.bundle_price ?? 207,
          bundle_original_price: data.settings.bundle_original_price ?? 8497,
          business_hours: data.settings.business_hours || 'Mon–Sat, 10am–6pm IST',
          bundle_timer_enabled: data.settings.bundle_timer_enabled ?? true,
          bundle_timer_days: data.settings.bundle_timer_days ?? 0,
          bundle_timer_hours: data.settings.bundle_timer_hours ?? 24,
          bundle_timer_minutes: data.settings.bundle_timer_minutes ?? 0,
          bundle_timer_action: data.settings.bundle_timer_action || 'hide_timer',
          bundle_features: Array.isArray(data.settings.bundle_features) && data.settings.bundle_features.length > 0
            ? data.settings.bundle_features
            : ['Instant Download', 'Lifetime Access', 'Free Future Updates', '7-Day Guarantee'],
          bundle_badge_text: data.settings.bundle_badge_text || 'Limited Time Deal',
          bundle_badge_color: data.settings.bundle_badge_color || '#f5c842',
          bundle_cta_text: data.settings.bundle_cta_text || 'Unlock Bundle →',
          bundle_show_discount: data.settings.bundle_show_discount ?? true,
          bundle_banner_image: data.settings.bundle_banner_image || '',
          app_name: data.settings.app_name || '',
          updatedAt: data.settings.updatedAt || '',
          social_instagram_enabled: data.settings.social_instagram_enabled ?? false,
          social_instagram_url: data.settings.social_instagram_url ?? '',
          social_whatsapp_enabled: data.settings.social_whatsapp_enabled ?? false,
          social_whatsapp_url: data.settings.social_whatsapp_url ?? '',
          social_twitter_enabled: data.settings.social_twitter_enabled ?? false,
          social_twitter_url: data.settings.social_twitter_url ?? '',
          social_facebook_enabled: data.settings.social_facebook_enabled ?? false,
          social_facebook_url: data.settings.social_facebook_url ?? '',
          social_telegram_enabled: data.settings.social_telegram_enabled ?? false,
          social_telegram_url: data.settings.social_telegram_url ?? '',
          custom_social_links: Array.isArray(data.settings.custom_social_links) ? data.settings.custom_social_links : []
        });
      }
    } catch(e) {
    } finally {
      setSettingsLoaded(true);
    }
  }

  async function loadProducts() {
    try {
      const res = await fetch('/api/product?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data.flag) setProducts(data.products);
    } catch(e) {}
  }

  async function loadFaqs() {
    try {
      const res = await fetch('/api/faqs?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data.flag) setFaqs(data.faqs || []);
    } catch(e) {}
  }

  async function loadHomepageReviews() {
    try {
      const res = await fetch('/api/homepage-reviews?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data.flag) setHomepageReviews(data.reviews || []);
    } catch(e) {}
  }

  async function loadStats() {
    try {
      const res = await fetch('/api/order?type=stats&t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data.flag) setTotalSales(data.totalSales || 1247);
    } catch(e) {}
  }

  async function loadPublicCoupons() {
    try {
      let email = '';
      if (typeof window !== 'undefined') {
        const c = localStorage.getItem('dv_customer');
        if (c) {
          email = JSON.parse(c).email || '';
        }
      }
      const url = email ? `/api/coupon?action=public-coupons&email=${encodeURIComponent(email)}&t=` + Date.now() : '/api/coupon?action=public-coupons&t=' + Date.now();
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data.flag && data.coupons) {
        setPublicCoupons(data.coupons);
      }
    } catch (e) {}
  }

  function getCouponTag(product) {
    if (!publicCoupons || publicCoupons.length === 0) return '';
    const productId = product.id || product._id;
    const coupons = publicCoupons.filter(c => {
      const pids = (c.product_ids || []).map(id => id.toString());
      return pids.length === 0 || pids.includes(productId);
    });
    if (coupons.length === 0) return '';
    const specificCoupon = coupons.find(c => (c.product_ids || []).length > 0);
    const bestCoupon = specificCoupon || coupons[0];
    const discountText = bestCoupon.discount_type === 'percentage'
      ? `${bestCoupon.discount_value}% OFF`
      : `₹${bestCoupon.discount_value} OFF`;
    return `${bestCoupon.code}: ${discountText}`;
  }

  function addToCart(product) {
    const c = localStorage.getItem('dv_customer');
    if (!c) { window.location.href = '/login'; return; }
    const productId = product.id || product._id;
    const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
    if (cart.find(i => i.id === productId)) { showToast('Already in cart! 🛒', '#f5c842', '#0a0a0f'); return; }
    cart.push({ id: productId, name: product.name, price: product.sale_price, orig_price: product.original_price, image: product.images?.[0] || null, qty: 1 });
    localStorage.setItem('dv_cart', JSON.stringify(cart));
    showToast('Added to cart! 🎉', '#10b981', '#fff');
    // Realtime update — Navbar ko batao
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }

  function buyNow(product) {
    const c = localStorage.getItem('dv_customer');
    if (!c) { window.location.href = '/login'; return; }

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

    // Cart page pe redirect karo
    window.location.href = '/cart';
  }

  function addBundleToCart() {
    if (bundleStatus === 'inactive') {
      showToast('Your bundle is inactive. Please contact the support team.', '#ef4444', '#fff');
      return;
    }
    const c = localStorage.getItem('dv_customer');
    if (!c) { window.location.href = '/login?redirect=/#pricing'; return; }

    const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
    if (cart.length > 0 && !cart.find(i => i.id === BUNDLE_CART_ID)) {
      const confirmClear = window.confirm(
        'Purchasing the bundle unlocks all products! Your current cart items will be cleared. Do you want to proceed?'
      );
      if (!confirmClear) return;
    }

    const bundleItem = {
      id: BUNDLE_CART_ID,
      type: 'bundle',
      name: settings.bundle_title || 'Complete Bundle',
      price: settings.bundle_price || 207,
      orig_price: settings.bundle_original_price || 8497,
      image: null,
      qty: 1,
    };

    localStorage.setItem('dv_cart', JSON.stringify([bundleItem]));
    window.dispatchEvent(new CustomEvent('cart-updated'));
    window.location.href = '/cart';
  }

  const firstProduct = products[0];
  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase()));
  const isOfferEnded = settings.bundle_timer_enabled && isTimerExpired && (settings.bundle_timer_action === 'disable_checkout' || settings.bundle_timer_action === 'show_expired');

  return (
    <>
      <Navbar />
      <Toast toast={toast} />

      {/* COMPLETE BUNDLE PROMOTIONAL HERO BANNER */}
      {settings.bundle_enabled && (
        <section id="pricing" className="bg-[var(--bg)] px-3 sm:px-4 md:px-6 pt-20 sm:pt-24 md:pt-28 pb-4 sm:pb-6 md:pb-10 transition-colors duration-300">
          <div className="mx-auto max-w-[1152px]">
            {!settingsLoaded ? (
              /* High-fidelity shimmering skeleton with exact same grid and padding dimensions */
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-6 md:p-12 shadow-[var(--shadow-soft)]">
                {/* Shimmer background */}
                <div className="skeleton-shimmer absolute inset-0 opacity-40 pointer-events-none" />
                <div className="relative z-10 grid grid-cols-12 gap-2 sm:gap-6 md:gap-8 items-center">
                  
                  {/* Left Column: Title & Highlights Skeleton */}
                  <div className="col-span-6 md:col-span-7 space-y-2 sm:space-y-5 lg:space-y-7">
                    {/* Limited Time Badge Skeleton */}
                    <div className="w-16 sm:w-28 h-3.5 sm:h-6 rounded-full bg-white/5 border border-white/5 skeleton-shimmer" />
                    
                    {/* Title & Description Skeleton */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="w-3/4 h-3.5 sm:h-9 md:h-12 skeleton-bar skeleton-shimmer" />
                      <div className="w-5/6 h-2.5 sm:h-4 md:h-5 skeleton-bar skeleton-shimmer mt-1.5 sm:mt-2" />
                    </div>

                    {/* Features Skeleton */}
                    <div className="flex flex-wrap gap-x-2 gap-y-1 sm:gap-x-4 sm:gap-y-2 pt-0.5 sm:pt-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-1 sm:gap-1.5">
                          <div className="h-2.5 w-2.5 sm:h-4 sm:w-4 rounded-full bg-white/5 skeleton-shimmer" />
                          <div className="w-12 sm:w-24 h-2 sm:h-4 skeleton-bar skeleton-shimmer" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Countdown, Price & CTA Skeleton */}
                  <div className="col-span-6 md:col-span-5 rounded-xl sm:rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] backdrop-blur-md p-2 sm:p-5 lg:p-8 flex flex-col gap-2 sm:gap-5 lg:gap-6">
                    {/* Countdown Timer Skeleton */}
                    <div>
                      <div className="mx-auto w-12 sm:w-24 h-2 sm:h-3 rounded bg-white/5 skeleton-shimmer mb-1.5 sm:mb-2" />
                      <div className="flex justify-center gap-0.5 xs:gap-1 sm:gap-1.5 lg:gap-3">
                        {[1, 2, 3, 4].map(idx => (
                          <div key={idx} className="flex flex-col items-center min-w-[24px] xs:min-w-[28px] sm:min-w-[38px] md:min-w-[42px] lg:min-w-[60px] rounded-md sm:rounded-xl border border-[var(--line)] bg-[var(--surface-2)] py-0.5 px-0.5 sm:py-1 sm:px-1.5 md:py-1.5 md:px-2 lg:py-2 lg:px-3">
                            <div className="w-3 xs:w-4 sm:w-6 md:w-8 lg:w-10 h-2 sm:h-3 md:h-4 lg:h-6 skeleton-bar skeleton-shimmer" />
                            <div className="w-2 xs:w-2.5 sm:w-4 md:w-5 lg:w-8 h-1 sm:h-1.5 md:h-2 lg:h-3 skeleton-bar skeleton-shimmer mt-0.5 sm:mt-1" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Skeleton */}
                    <div className="flex items-center justify-between gap-2 border-t border-b border-[var(--line)] py-1 sm:py-3 lg:py-4 px-0.5 sm:px-1 lg:px-2">
                      <div className="space-y-0.5 sm:space-y-1">
                        <div className="w-8 sm:w-16 h-1.5 lg:h-3 rounded bg-white/5 skeleton-shimmer" />
                        <div className="w-6 sm:w-14 h-2.5 lg:h-4 rounded bg-white/5 skeleton-shimmer" />
                      </div>
                      <div className="space-y-0.5 sm:space-y-1 flex flex-col items-end">
                        <div className="w-10 sm:w-20 h-1.5 lg:h-3 rounded bg-white/5 skeleton-shimmer" />
                        <div className="w-12 sm:w-24 h-3.5 lg:h-6 rounded bg-white/5 skeleton-shimmer" />
                      </div>
                    </div>

                    {/* CTA Button Skeleton */}
                    <div className="h-6 sm:h-12 lg:h-14 rounded-md sm:rounded-xl bg-white/5 skeleton-shimmer w-full" />
                  </div>

                </div>
              </div>
            ) : (
              /* Loaded real complete bundle banner with custom fade-in */
              <div className="fade-in-banner relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-2)] to-[var(--surface)] p-3 sm:p-6 md:p-12 shadow-[var(--shadow-soft)]">
                {/* Glowing radial background effects */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#f5c842]/10 blur-[80px] pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#7c3aed]/5 blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 grid grid-cols-12 gap-2 sm:gap-6 lg:gap-8 items-center">
                  {/* Left Column: Title & Highlights */}
                  <div className="col-span-6 md:col-span-7 space-y-2 sm:space-y-4 lg:space-y-6">
                    <div className="inline-flex items-center gap-1 sm:gap-2 rounded-full border px-1.5 py-0.5 sm:px-3 sm:py-1 text-[8px] min-[360px]:text-[9px] sm:text-xs font-bold uppercase tracking-wider" style={{ borderColor: `${settings.bundle_badge_color || '#f5c842'}33`, background: `${settings.bundle_badge_color || '#f5c842'}1a`, color: settings.bundle_badge_color || '#f5c842' }}>
                      <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: settings.bundle_badge_color || '#f5c842' }}></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2" style={{ background: settings.bundle_badge_color || '#f5c842' }}></span>
                      </span>
                      {settings.bundle_badge_text || 'Limited Time Deal'}
                      {settings.bundle_show_discount && settings.bundle_original_price > settings.bundle_price && (
                        <span className="ml-1 font-extrabold">
                          — {Math.round(((settings.bundle_original_price - settings.bundle_price) / settings.bundle_original_price) * 100)}% OFF
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h1 className="font-syne text-[11px] min-[360px]:text-[12px] min-[400px]:text-[14px] sm:text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--heading)] leading-tight">
                        {settings.bundle_title || 'Complete Bundle'}
                      </h1>
                      <p className="mt-1 sm:mt-2 md:mt-3 text-[8px] min-[360px]:text-[9px] min-[400px]:text-[10px] sm:text-sm md:text-lg text-[var(--muted)] leading-relaxed max-w-xl">
                        {settings.bundle_description || 'All products + future updates included'}
                      </p>
                    </div>

                    {settings.bundle_banner_image && (
                      <div className="rounded-xl overflow-hidden border border-[var(--line)] max-h-40 sm:max-h-52">
                        <img src={settings.bundle_banner_image} alt="Bundle Banner" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-2 gap-y-1 sm:gap-x-4 sm:gap-y-2 pt-0.5 sm:pt-1 text-[8px] min-[360px]:text-[9px] sm:text-xs md:text-sm text-[var(--muted)]">
                      {(settings.bundle_features || ['Instant Download', 'Lifetime Access', 'Free Future Updates', '7-Day Guarantee']).map((feat) => (
                        <div key={feat} className="flex items-center gap-1 sm:gap-1.5">
                          <span className="flex h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-[#f5c842]/10 text-[7px] sm:text-[10px] md:text-xs font-bold text-[#f5c842]">
                            ✓
                          </span>
                          {feat}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Countdown, Price & CTA */}
                  <div className="col-span-6 md:col-span-5 rounded-xl sm:rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] backdrop-blur-md p-2 sm:p-5 lg:p-8 flex flex-col gap-2 sm:gap-4 lg:gap-6">
                    {/* Isolated Countdown Component to encapsulate ticks */}
                    <CountdownTimer settings={settings} onExpired={setIsTimerExpired} />

                    {/* Price Display */}
                    <div className="flex items-center justify-between gap-2 border-t border-b border-[var(--line)] py-1 sm:py-3 lg:py-4 px-0.5 sm:px-1 lg:px-2">
                      <div className="flex flex-col">
                        <span className="text-[7px] sm:text-[10px] lg:text-xs font-medium text-[var(--muted-2)] uppercase">Original Value</span>
                        <span className="text-[9px] sm:text-sm lg:text-lg text-[var(--muted-2)] line-through whitespace-nowrap">
                          ₹{(settings.bundle_original_price || 8497).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[7px] sm:text-[10px] lg:text-xs font-semibold text-[#f5c842] uppercase tracking-wider">Special Price</span>
                        <span className="font-syne text-[10px] min-[360px]:text-[11px] min-[400px]:text-xs sm:text-xl lg:text-3xl font-extrabold text-[var(--heading)] whitespace-nowrap">
                          ₹{(settings.bundle_price || 207).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={addBundleToCart}
                      disabled={hasBundleAccess || isOfferEnded || bundleStatus === 'inactive'}
                      className={`gold-btn flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl py-1.5 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 text-[8px] min-[360px]:text-[9px] xs:text-[10px] sm:text-sm md:text-base font-bold transition-all duration-300 w-full hover:scale-[1.02] ${!(hasBundleAccess || isOfferEnded || bundleStatus === 'inactive') ? 'pulse-glow' : ''}`}
                      style={{ opacity: hasBundleAccess || isOfferEnded || bundleStatus === 'inactive' ? 0.6 : 1 }}
                    >
                      {hasBundleAccess ? (
                        <>Bundle Active 🎉</>
                      ) : bundleStatus === 'inactive' ? (
                        <>Bundle Inactive. Contact Support</>
                      ) : isOfferEnded ? (
                        <>Offer Ended 😢</>
                      ) : (
                        <>{settings.bundle_cta_text || 'Unlock Bundle →'}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* HERO */}
      {/* <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', paddingBottom: '80px', position: 'relative', overflow: 'hidden' }}>
        <div
          className="blob"
          style={{
            width: 'clamp(220px, 52vw, 384px)',
            height: 'clamp(220px, 52vw, 384px)',
            background: '#f5c842',
            top: 'clamp(56px, 8vh, 80px)',
            left: 'clamp(-120px, -18vw, -160px)',
          }}
        ></div>
        <div
          className="blob"
          style={{
            width: 'clamp(200px, 45vw, 320px)',
            height: 'clamp(200px, 45vw, 320px)',
            background: '#7c3aed',
            bottom: 'clamp(56px, 8vh, 80px)',
            right: 'clamp(-60px, -14vw, -80px)',
          }}
        ></div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '999px', marginBottom: '32px', background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f5c842' }}></span>
            <span style={{ fontSize: '0.875rem', color: '#f5c842', fontWeight: 500 }}>Limited Time Offer — 70% OFF</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800, lineHeight: 1.05, color: '#fff', marginBottom: '24px' }}>
            The Ultimate<br/><span style={{ color: '#f5c842' }}>Digital Product</span><br/>Bundle
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#9ca3af', maxWidth: '560px', margin: '0 auto 40px' }}>
            Everything you need to launch, grow, and scale your online business — templates, tools, and guides — all in one place.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '64px' }}>
            <Link href="/#pricing" className="gold-btn pulse-glow" style={{ padding: '16px 32px', borderRadius: '999px', fontSize: '1.1rem', textDecoration: 'none' }}>
              Get Instant Access →
            </Link>
            <Link href="/#products" style={{ padding: '16px 32px', borderRadius: '999px', fontSize: '0.875rem', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none' }}>
              See What's Inside
            </Link>
          </div>

          Stats
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '32px' }}>
            {[
              { val: `${totalSales.toLocaleString()}+`, label: 'Products Sold' },
              { val: '4.9★', label: 'Average Rating' },
              { val: '24/7', label: 'Instant Download' },
              { val: '100%', label: 'Money Back' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f5c842', fontFamily: 'Syne, sans-serif' }}>{s.val}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* PRODUCTS */}
      <section id="products" className="bg-[var(--bg)] px-6 py-20 transition-colors duration-300">
        <div className="mx-auto max-w-[1152px]">
          <div className="mb-14 text-center">
            <h2 className="mb-4 font-syne text-4xl font-bold text-[var(--heading)]">What You'll Get</h2>
            <p className="text-lg text-[var(--muted)]">Premium digital products crafted for modern entrepreneurs</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.length === 0 ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="theme-card flex w-full min-w-0 flex-row items-center gap-4 rounded-2xl p-3 sm:p-4 relative overflow-hidden"
                >
                  <div className="skeleton-shimmer absolute inset-0 opacity-40 pointer-events-none" />
                  
                  {/* Left image placeholder */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl bg-white/5 flex items-center justify-center relative overflow-hidden">
                    <div className="skeleton-shimmer absolute inset-0 opacity-40" />
                  </div>

                  {/* Right side content skeleton */}
                  <div className="flex flex-col flex-1 min-w-0 justify-center h-full py-0.5 gap-2">
                    <div className="w-16 h-3 rounded bg-white/5 skeleton-shimmer" />
                    <div className="w-3/4 h-5 rounded bg-white/5 skeleton-shimmer" />
                    <div className="w-5/6 h-3.5 rounded bg-white/5 skeleton-shimmer" />
                    
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="w-12 h-4 rounded bg-white/5 skeleton-shimmer" />
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-5 rounded-full bg-white/5 skeleton-shimmer" />
                        <div className="w-8 h-8 rounded-full bg-white/5 skeleton-shimmer" />
                        <div className="w-14 h-6 rounded-full bg-white/5 skeleton-shimmer" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-muted)] px-5 py-16 text-center">
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                <h3 className="mb-2 font-syne text-xl text-[var(--heading)]">No products found</h3>
                <p className="text-[var(--muted)]">Try adjusting your search query to find what you're looking for.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-5 cursor-pointer rounded-full border border-[#f5c842] bg-transparent px-5 py-2 font-dm text-[#f5c842] transition-colors hover:bg-[#f5c842]/10"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              filteredProducts.map((p, i) => (
                <ProductCard
                  key={p.id || p._id}
                  product={p}
                  index={i}
                  onAddToCart={addToCart}
                  onBuyNow={buyNow}
                  hasBundleAccess={hasBundleAccess}
                  couponTag={getCouponTag(p)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="content-lazy bg-[#f5c842]/[0.03] px-6 py-20">
        <div className="mx-auto max-w-[1152px]">
          <div className="mb-14 text-center">
            <h2 className="mb-4 font-syne text-4xl font-bold text-[var(--heading)]">Why Choose Us?</h2>
            <p className="text-lg text-[var(--muted)]">Built for creators who mean business</p>
          </div>
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {[
              { icon: '⚡', title: 'Instant Download', desc: 'Get access immediately after payment. No waiting, no delays.' },
              { icon: '🔒', title: 'Secure Payment', desc: 'Powered by Razorpay. 100% safe and encrypted transactions.' },
              { icon: '♾️', title: 'Lifetime Access', desc: 'Buy once, use forever. Free updates included.' },
              { icon: '💰', title: 'Money-Back Guarantee', desc: 'Not happy? Get a full refund within 7 days.' },
              { icon: '📧', title: 'Email Support', desc: 'Dedicated support team ready to help you succeed.' },
              { icon: '🔄', title: 'Regular Updates', desc: 'New products and updates added every month — free.' },
            ].map(f => (
              <div key={f.title} className="theme-card rounded-2xl p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#f5c842]/15 bg-[#f5c842]/10 text-2xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-bold text-[var(--heading)]">{f.title}</h3>
                <p className="text-sm text-[var(--muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <TestimonialsSection homepageReviews={homepageReviews} />

      {/* FAQ */}
      <FaqSection faqs={faqs} />

      {/* FOOTER */}
      <footer className="border-t border-[#f5c842]/15 bg-[var(--bg)] px-6 py-12">
        <div className="mx-auto max-w-[1152px]">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f5c842', fontFamily: 'Syne,sans-serif', marginBottom: '12px' }}>{settings.app_name}</div>
              <p className="text-sm text-[var(--muted-2)]">Premium digital products for modern entrepreneurs.</p>
            </div>
            <div>
              <div className="mb-3 font-semibold text-[var(--heading)]">Quick Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  ['/#products', 'Products'],
                  ['/#pricing', 'Pricing'],
                  ['/#faq', 'FAQ'],
                  ['/testimonials', 'Real Testimonials'],
                  ['/refund-policy', 'Refund Policy'],
                  ['/terms-privacy', 'Terms & Privacy'],
                  ['/account', 'My Account']
                ]
                  .filter(([_, label]) => label !== 'Pricing' || settings.bundle_enabled !== false)
                  .map(([href, label]) => (
                    <Link key={href} href={href} className="theme-link text-sm no-underline">{label}</Link>
                  ))}
              </div>
            </div>
            <div>
              <div className="mb-3 font-semibold text-[var(--heading)]">Contact</div>
              <div className="flex flex-col gap-2 text-sm text-[var(--muted-2)] font-syne">
                <p>📧 {settings.support_email}</p>
                <p>📱 {settings.support_phone}</p>
                <p>🕐 {settings.business_hours}</p>
              </div>
              {(settings.social_instagram_enabled || settings.social_whatsapp_enabled || settings.social_twitter_enabled || settings.social_facebook_enabled || settings.social_telegram_enabled || (settings.custom_social_links && settings.custom_social_links.some(item => item.enabled && item.url))) && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="mb-2.5 text-xs font-semibold text-[var(--heading)] uppercase tracking-wider font-syne">Social Channels</div>
                  <div className="flex flex-wrap gap-2.5">
                    {settings.social_instagram_enabled && settings.social_instagram_url && (
                      <a
                        href={settings.social_instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-[#e1306c] hover:border-[#e1306c] hover:scale-105 no-underline"
                        title="Instagram"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                      </a>
                    )}
                    {settings.social_whatsapp_enabled && settings.social_whatsapp_url && (
                      <a
                        href={settings.social_whatsapp_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-[#25d366] hover:border-[#25d366] hover:scale-105 no-underline"
                        title="WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.83.496 3.614 1.442 5.176L2 22l4.986-1.307c1.517.82 3.21 1.25 4.966 1.25.04 0 .08 0 .12-.002C17.59 21.94 22 17.48 22 12.004 22 6.48 17.522 2 12.004 2zm5.097 13.52c-.22.613-1.277 1.173-1.826 1.236-.49.056-.975.253-3.13-.6-2.756-1.093-4.532-3.9-4.67-4.084-.136-.184-1.108-1.472-1.108-2.81 0-1.337.702-1.996.95-2.257.25-.262.548-.328.73-.328.18 0 .363.002.52.01.164.007.387-.062.603.46.223.538.762 1.86.828 1.994.066.13.11.285.02.46-.088.175-.132.285-.263.438-.13.15-.276.338-.394.453-.13.13-.267.273-.114.537.153.264.68 1.12 1.46 1.812.996.886 1.834 1.16 2.097 1.293.263.13.417.11.57-.066.154-.175.657-.766.833-1.028.175-.263.35-.22.592-.13.24.088 1.524.72 1.787.852.264.13.439.197.505.306.066.11.066.634-.153 1.246z"/>
                        </svg>
                      </a>
                    )}
                    {settings.social_twitter_enabled && settings.social_twitter_url && (
                      <a
                        href={settings.social_twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white hover:border-white hover:scale-105 no-underline"
                        title="Twitter / X"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                    {settings.social_facebook_enabled && settings.social_facebook_url && (
                      <a
                        href={settings.social_facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-[#1877f2] hover:border-[#1877f2] hover:scale-105 no-underline"
                        title="Facebook"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z"/>
                        </svg>
                      </a>
                    )}
                    {settings.social_telegram_enabled && settings.social_telegram_url && (
                      <a
                        href={settings.social_telegram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-[#229ed9] hover:border-[#229ed9] hover:scale-105 no-underline"
                        title="Telegram"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.02-.75 4-1.74 6.67-2.88 8-3.42 3.81-1.56 4.6-1.83 5.12-1.84.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.15-.02.22z"/>
                        </svg>
                      </a>
                    )}
                    {settings.custom_social_links && settings.custom_social_links.map((item, index) => {
                      if (!item.enabled || !item.url) return null;
                      return (
                        <a
                          key={index}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-[#f5c842] hover:border-[#f5c842] hover:scale-105 no-underline"
                          title={item.name}
                        >
                          {item.logo ? (
                            <img src={item.logo} alt={item.name} className="w-4 h-4 object-contain rounded-sm" />
                          ) : (
                            <span className="text-xs">🔗</span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ color: 'var(--muted-2)', fontSize: '0.75rem' }}>© {new Date().getFullYear()} {settings.app_name}. All rights reserved.</p>
            <p style={{ color: 'var(--muted-2)', fontSize: '0.75rem' }}>Payments secured by Razorpay 🔒</p>
          </div>
        </div>
      </footer>
    </>
  );
}


