'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import Toast, { useToast } from '@/components/Toast';

const API = process.env.NEXT_PUBLIC_APP_URL || '';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [totalSales, setTotalSales] = useState(1247);
  const [countdown, setCountdown] = useState({ h: '00', m: '00', s: '00' });
  const [payModal, setPayModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast, showToast } = useToast();

  useEffect(() => {
    loadProducts();
    loadStats();
    startCountdown();
  }, []);

  async function loadProducts() {
    try {
      const res = await fetch('/api/product');
      const data = await res.json();
      if (data.flag) setProducts(data.products);
    } catch(e) {}
  }

  async function loadStats() {
    try {
      const res = await fetch('/api/order?type=stats');
      const data = await res.json();
      if (data.flag) setTotalSales(data.totalSales || 1247);
    } catch(e) {}
  }

  function startCountdown() {
    const key = 'dv_deadline';
    let deadline = localStorage.getItem(key);
    if (!deadline) {
      deadline = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(key, deadline);
    }
    const timer = setInterval(() => {
      const diff = Number(deadline) - Date.now();
      if (diff <= 0) { setCountdown({ h: '00', m: '00', s: '00' }); clearInterval(timer); return; }
      setCountdown({
        h: Math.floor(diff / 3600000).toString().padStart(2, '0'),
        m: Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0'),
        s: Math.floor((diff % 60000) / 1000).toString().padStart(2, '0'),
      });
    }, 1000);
    return () => clearInterval(timer);
  }

  function addToCart(product) {
    const c = localStorage.getItem('dv_customer');
    if (!c) { window.location.href = '/login'; return; }
    const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
    if (cart.find(i => i.id === product._id)) { showToast('Already in cart! 🛒', '#f5c842', '#0a0a0f'); return; }
    cart.push({ id: product._id, name: product.name, price: product.sale_price, orig_price: product.original_price, image: product.images?.[0] || null, qty: 1 });
    localStorage.setItem('dv_cart', JSON.stringify(cart));
    showToast('Added to cart! 🎉', '#10b981', '#fff');
    // Realtime update — Navbar ko batao
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }

  function buyNow(product) {
    const c = localStorage.getItem('dv_customer');
    if (!c) { window.location.href = '/login'; return; }

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

    // Cart page pe redirect karo
    window.location.href = '/cart';
  }

  const firstProduct = products[0];
  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <Navbar />
      <Toast toast={toast} />

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
            <p className="mb-8 text-lg text-[var(--muted)]">Premium digital products crafted for modern entrepreneurs</p>
            
            <div className="relative mx-auto max-w-[500px]">
              <input 
                type="text" 
                placeholder="Search products by name or description..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="theme-input rounded-full py-4 pl-12 pr-6 text-base"
              />
              <svg 
                width="20" height="20" fill="none" stroke="#f5c842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }}
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
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
                <ProductCard key={p._id} product={p} index={i} onAddToCart={addToCart} onBuyNow={buyNow} />
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

      {/* PRICING */}
      <section id="pricing" className="bg-[var(--bg)] px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <h2 className="mb-4 font-syne text-4xl font-bold text-[var(--heading)]">Get Everything. Pay Once.</h2>
            <p className="mb-6 text-[var(--muted)]">Offer ends in:</p>
            <div className="flex justify-center gap-4">
              {[{ val: countdown.h, label: 'Hours' }, { val: countdown.m, label: 'Minutes' }, { val: countdown.s, label: 'Seconds' }].map(c => (
                <div key={c.label} className="countdown-box">
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f5c842', fontFamily: 'Syne,sans-serif' }}>{c.val}</div>
                  <div className="mt-1 text-xs text-[var(--muted-2)]">{c.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="theme-card relative overflow-hidden rounded-2xl border-[#f5c842]/40 p-8 text-center sm:p-12">
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg,#f5c842,#e0a800)' }}></div>
            <div className="badge" style={{ marginBottom: '16px' }}>Most Popular</div>
            <h3 className="mb-2 text-2xl font-bold text-[var(--heading)]">Complete Bundle</h3>
            <p className="mb-8 text-[var(--muted)]">All products + future updates included</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '8px' }}>
              <span className="text-2xl text-[var(--muted-2)] line-through">₹{firstProduct ? (firstProduct.original_price || 8497).toLocaleString() : '8,497'}</span>
              <span style={{ fontSize: '3.5rem', fontWeight: 700, color: '#f5c842', fontFamily: 'Syne,sans-serif' }}>₹{firstProduct ? (firstProduct.sale_price || 1999).toLocaleString() : '1,999'}</span>
            </div>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto 40px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Instant download access', 'Lifetime access', 'Free future updates', '7-day money-back guarantee', 'Email support'].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-[var(--text)]">
                  <span style={{ color: '#f5c842' }}>✓</span> {item}
                </li>
              ))}
            </ul>
            {firstProduct && (
              <button onClick={() => buyNow(firstProduct)} className="gold-btn pulse-glow" style={{ width: '100%', maxWidth: '400px', padding: '20px', borderRadius: '999px', fontSize: '1.1rem' }}>
                Buy Now — ₹{firstProduct.sale_price?.toLocaleString()}
              </button>
            )}
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
            {[
              { name: 'Rahul Kumar', role: 'Freelance Designer', review: 'Best investment I made this year. The templates saved me 40+ hours of work. Highly recommended!', initials: 'RK', color: 'linear-gradient(135deg,#f5c842,#e0a800)', textColor: '#0a0a0f' },
              { name: 'Priya Sharma', role: 'Startup Founder', review: 'The growth playbook alone is worth 10x the price. My startup grew from 0 to 5k users in 3 months!', initials: 'PS', color: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', textColor: '#fff' },
              { name: 'Arjun Mehta', role: 'Digital Marketer', review: 'Instant download worked perfectly. Quality is exceptional. Will definitely buy again!', initials: 'AM', color: 'linear-gradient(135deg,#10b981,#065f46)', textColor: '#fff' },
            ].map(t => (
              <div key={t.name} className="theme-card rounded-2xl p-6">
                <div className="stars" style={{ marginBottom: '12px', fontSize: '1.1rem' }}>★★★★★</div>
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
            {[
              { q: 'How do I get my download after payment?', a: 'After successful payment, you\'ll receive an email with a secure download link. You also have lifetime access via My Account.' },
              { q: 'Can I use these products for clients?', a: 'Yes! You get a commercial license to use all products for personal and client projects.' },
              { q: 'What payment methods are accepted?', a: 'We accept all major credit/debit cards, UPI, net banking, and wallets via Razorpay.' },
              { q: 'Is there a refund policy?', a: 'Yes! We offer a 7-day no-questions-asked refund policy.' },
              { q: 'Do I get future updates?', a: 'Yes! All future updates are free for existing customers forever.' },
            ].map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#f5c842]/15 bg-[var(--bg)] px-6 py-12">
        <div className="mx-auto max-w-[1152px]">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f5c842', fontFamily: 'Syne,sans-serif', marginBottom: '12px' }}>DigitalVault</div>
              <p className="text-sm text-[var(--muted-2)]">Premium digital products for modern entrepreneurs.</p>
            </div>
            <div>
              <div className="mb-3 font-semibold text-[var(--heading)]">Quick Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[['/#products', 'Products'], ['/#pricing', 'Pricing'], ['/#faq', 'FAQ'], ['/account', 'My Account']].map(([href, label]) => (
                  <Link key={href} href={href} className="theme-link text-sm no-underline">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 font-semibold text-[var(--heading)]">Contact</div>
              <div className="flex flex-col gap-2 text-sm text-[var(--muted-2)]">
                <p>📧 support@digitalvault.in</p>
                <p>📱 +91 98765 43210</p>
                <p>🕐 Mon–Sat, 10am–6pm IST</p>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ color: '#4b5563', fontSize: '0.75rem' }}>© 2025 DigitalVault. All rights reserved.</p>
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
