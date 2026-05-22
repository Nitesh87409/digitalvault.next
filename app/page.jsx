'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import Toast, { useToast } from '@/components/Toast';
import { useBundlePurchase } from '@/hooks/useBundlePurchase';

const API = process.env.NEXT_PUBLIC_APP_URL || '';
const BUNDLE_CART_ID = '__bundle_subscription__';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [totalSales, setTotalSales] = useState(1247);
  const [countdown, setCountdown] = useState({ d: '00', h: '00', m: '00', s: '00' });
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState({
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
    updatedAt: ''
  });
  const { toast, showToast } = useToast();
  const { hasBundleAccess } = useBundlePurchase({ showToast });

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

  useEffect(() => {
    loadProducts();
    loadStats();
    loadSettings();
    loadFaqs();
    loadHomepageReviews();
  }, []);

  useEffect(() => {
    const cleanup = startCountdown();
    return () => {
      if (cleanup) cleanup();
    };
  }, [settings.bundle_timer_enabled, settings.bundle_timer_days, settings.bundle_timer_hours, settings.bundle_timer_minutes, settings.updatedAt, settings.bundle_timer_action]);

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
          updatedAt: data.settings.updatedAt || ''
        });
      }
    } catch(e) {}
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

  function startCountdown() {
    if (!settings.bundle_timer_enabled) return;

    const key = 'dv_deadline';
    const durationKey = 'dv_deadline_duration';
    const updatedKey = 'dv_settings_updated';

    const configDays = Math.max(0, Number(settings.bundle_timer_days) || 0);
    const configHours = Math.max(0, Number(settings.bundle_timer_hours) || 0);
    const configMinutes = Math.max(0, Number(settings.bundle_timer_minutes) || 0);
    const totalMs = (configDays * 86400000) + (configHours * 3600000) + (configMinutes * 60000);
    const durationFingerprint = `${configDays}d${configHours}h${configMinutes}m`;
    const configUpdated = settings.updatedAt || '';

    let deadline = localStorage.getItem(key);
    let savedDuration = localStorage.getItem(durationKey);
    let savedUpdated = localStorage.getItem(updatedKey);

    let parsedDeadline = parseInt(deadline, 10);
    const isDeadlineInvalid = isNaN(parsedDeadline) || parsedDeadline <= 0;

    if (isDeadlineInvalid || savedDuration !== durationFingerprint || (configUpdated && savedUpdated !== configUpdated)) {
      parsedDeadline = Date.now() + (totalMs > 0 ? totalMs : 86400000);
      localStorage.setItem(key, String(parsedDeadline));
      localStorage.setItem(durationKey, durationFingerprint);
      if (configUpdated) {
        localStorage.setItem(updatedKey, configUpdated);
      } else {
        localStorage.removeItem(updatedKey);
      }
      setIsTimerExpired(false);
    } else {
      if (parsedDeadline - Date.now() <= 0) {
        setIsTimerExpired(true);
      } else {
        setIsTimerExpired(false);
      }
    }

    const timer = setInterval(() => {
      const diff = parsedDeadline - Date.now();
      if (diff <= 0) {
        setCountdown({ d: '00', h: '00', m: '00', s: '00' });
        setIsTimerExpired(true);
        clearInterval(timer);
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown({
        d: days.toString().padStart(2, '0'),
        h: hours.toString().padStart(2, '0'),
        m: mins.toString().padStart(2, '0'),
        s: secs.toString().padStart(2, '0'),
      });
    }, 1000);
    return () => clearInterval(timer);
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
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-2)] to-[var(--surface)] p-3 sm:p-6 md:p-12 shadow-[var(--shadow-soft)]">
              {/* Glowing radial background effects */}
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#f5c842]/10 blur-[80px] pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#7c3aed]/5 blur-[80px] pointer-events-none" />
              
              <div className="relative z-10 grid grid-cols-12 gap-3 sm:gap-6 md:gap-8 items-center">
                {/* Left Column: Title & Highlights */}
                <div className="col-span-7 sm:col-span-7 space-y-2 sm:space-y-4 md:space-y-6">
                  <div className="inline-flex items-center gap-1 sm:gap-2 rounded-full border border-[#f5c842]/20 bg-[#f5c842]/10 px-1.5 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-xs font-bold uppercase tracking-wider text-[#f5c842]">
                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5c842] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#f5c842]"></span>
                    </span>
                    Limited Time Deal
                  </div>
                  
                  <div>
                    <h1 className="font-syne text-sm min-[380px]:text-base sm:text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--heading)] leading-tight">
                      {settings.bundle_title || 'Complete Bundle'}
                    </h1>
                    <p className="mt-1 sm:mt-2 md:mt-3 text-[9px] min-[380px]:text-[10px] sm:text-sm md:text-lg text-[var(--muted)] leading-relaxed max-w-xl">
                      {settings.bundle_description || 'All products + future updates included'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-x-2 gap-y-1 sm:gap-x-4 sm:gap-y-2 pt-0.5 sm:pt-1 text-[8px] min-[380px]:text-[9px] sm:text-xs md:text-sm text-[var(--muted)]">
                    {['Instant Download', 'Lifetime Access', 'Free Future Updates', '7-Day Guarantee'].map((feat) => (
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
                <div className="col-span-5 sm:col-span-5 rounded-xl sm:rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] backdrop-blur-md p-2 sm:p-4 md:p-8 flex flex-col gap-2 sm:gap-4 md:gap-6">
                  {/* Countdown */}
                  {settings.bundle_timer_enabled && (
                    isTimerExpired && (settings.bundle_timer_action === 'disable_checkout' || settings.bundle_timer_action === 'show_expired') ? (
                      <div className="flex flex-col items-center justify-center rounded-lg sm:rounded-xl border border-red-500/20 bg-red-500/10 py-2 sm:py-4 px-3 sm:px-6 text-center animate-pulse">
                        <span className="font-syne text-[10px] sm:text-lg font-bold text-red-500 tracking-wide uppercase">
                          ⚠️ Expired
                        </span>
                        <span className="mt-0.5 text-[7px] sm:text-xs text-red-400/80 font-medium hidden xs:inline">
                          Promotion ended
                        </span>
                      </div>
                    ) : !(isTimerExpired && settings.bundle_timer_action === 'hide_timer') ? (
                      <div>
                        <div className="mb-1 sm:mb-2 text-center text-[7px] sm:text-[10px] md:text-xs font-semibold uppercase tracking-wider text-[var(--muted-2)]">
                          Offer Ending Soon:
                        </div>
                        <div className="flex justify-center gap-1 sm:gap-1.5 md:gap-3">
                          {[{ val: countdown.d, label: 'Days' }, { val: countdown.h, label: 'Hours' }, { val: countdown.m, label: 'Mins' }, { val: countdown.s, label: 'Secs' }].map(c => (
                            <div key={c.label} className="flex flex-col items-center min-w-[28px] xs:min-w-[32px] sm:min-w-[50px] md:min-w-[60px] rounded-lg sm:rounded-xl border border-[var(--line)] bg-[var(--surface-2)] py-1 px-0.5 sm:py-1.5 sm:px-2 md:py-2 md:px-3">
                              <span className="font-syne text-[10px] xs:text-xs sm:text-base md:text-2xl font-bold text-[#f5c842] whitespace-nowrap">
                                {c.val}
                              </span>
                              <span className="text-[5px] xs:text-[6px] sm:text-[8px] md:text-[10px] text-[var(--muted-2)] uppercase font-semibold">
                                {c.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}

                  {/* Price Display */}
                  <div className="flex items-center justify-between border-t border-b border-[var(--line)] py-1.5 sm:py-3 md:py-4 px-0.5 sm:px-1 md:px-2">
                    <div className="flex flex-col">
                      <span className="text-[7px] sm:text-[10px] md:text-xs font-medium text-[var(--muted-2)] uppercase">Original Value</span>
                      <span className="text-[10px] sm:text-sm md:text-lg text-[var(--muted-2)] line-through">
                        ₹{(settings.bundle_original_price || 8497).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[7px] sm:text-[10px] md:text-xs font-semibold text-[#f5c842] uppercase tracking-wider">Special Price</span>
                      <span className="font-syne text-xs xs:text-sm sm:text-xl md:text-3xl font-extrabold text-[var(--heading)]">
                        ₹{(settings.bundle_price || 207).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={addBundleToCart}
                    disabled={hasBundleAccess || isOfferEnded}
                    className={`gold-btn flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl py-1.5 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 text-[9px] xs:text-[10px] sm:text-sm md:text-base font-bold transition-all duration-300 w-full hover:scale-[1.02] ${!(hasBundleAccess || isOfferEnded) ? 'pulse-glow' : ''}`}
                    style={{ opacity: hasBundleAccess || isOfferEnded ? 0.6 : 1 }}
                  >
                    {hasBundleAccess ? (
                      <>Bundle Active 🎉</>
                    ) : isOfferEnded ? (
                      <>Offer Ended 😢</>
                    ) : (
                      <>Unlock Bundle →</>
                    )}
                  </button>
                </div>
              </div>
            </div>
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
              <p className="col-span-full p-10 text-center text-[var(--muted-2)]">Loading products...</p>
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
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-[#f5c842]/[0.03] px-6 py-20">
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
      <section className="bg-[#f5c842]/[0.03] px-6 py-20">
        <div className="mx-auto max-w-[1152px]">
          <div className="mb-14 text-center">
            <h2 className="font-syne text-4xl font-bold text-[var(--heading)]">What Customers Say</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {homepageReviews.map(t => (
              <div key={t._id || t.name} className="theme-card rounded-2xl p-6">
                <div className="stars text-[#f5c842]" style={{ marginBottom: '12px', fontSize: '1.1rem' }}>
                  {'★'.repeat(t.rating || 5) + '☆'.repeat(5 - (t.rating || 5))}
                </div>
                <p className="mb-5 text-sm text-[var(--text)]">{t.review}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: t.color, color: t.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Syne,sans-serif' }}>{t.initials}</div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--heading)]">{t.name}</div>
                    <div className="text-xs text-[var(--muted-2)]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[var(--bg)] px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <h2 className="font-syne text-4xl font-bold text-[var(--heading)]">Frequently Asked Questions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, i) => (
              <FaqItem key={faq._id || i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

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
                {[['/#products', 'Products'], ['/#pricing', 'Pricing'], ['/#faq', 'FAQ'], ['/account', 'My Account']]
                  .filter(([_, label]) => label !== 'Pricing' || settings.bundle_enabled !== false)
                  .map(([href, label]) => (
                    <Link key={href} href={href} className="theme-link text-sm no-underline">{label}</Link>
                  ))}
              </div>
            </div>
            <div>
              <div className="mb-3 font-semibold text-[var(--heading)]">Contact</div>
              <div className="flex flex-col gap-2 text-sm text-[var(--muted-2)]">
                <p>📧 {settings.support_email}</p>
                <p>📱 {settings.support_phone}</p>
                <p>🕐 {settings.business_hours}</p>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ color: '#4b5563', fontSize: '0.75rem' }}>© {new Date().getFullYear()} {settings.app_name}. All rights reserved.</p>
            <p style={{ color: '#4b5563', fontSize: '0.75rem' }}>Payments secured by Razorpay 🔒</p>
          </div>
        </div>
      </footer>
    </>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="theme-card cursor-pointer rounded-2xl p-6" onClick={() => setOpen(!open)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="text-[0.95rem] font-semibold text-[var(--heading)]">{q}</span>
        <span style={{ color: '#f5c842', fontSize: '1.2rem', transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'none' }}>↓</span>
      </div>
      {open && <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{a}</p>}
    </div>
  );
}
