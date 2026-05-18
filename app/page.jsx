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
      <section id="products" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>What You'll Get</h2>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem', marginBottom: '32px' }}>Premium digital products crafted for modern entrepreneurs</p>
            
            <div style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search products by name or description..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  paddingLeft: '48px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(245,200,66,0.2)',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.background = 'rgba(255,255,255,0.06)'}
                onBlur={(e) => e.target.style.background = 'rgba(255,255,255,0.03)'}
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
              <p style={{ color: '#6b7280', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Loading products...</p>
            ) : filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '8px', fontFamily: 'Syne, sans-serif' }}>No products found</h3>
                <p style={{ color: '#9ca3af' }}>Try adjusting your search query to find what you're looking for.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ marginTop: '20px', background: 'none', border: '1px solid #f5c842', color: '#f5c842', padding: '8px 20px', borderRadius: '999px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
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
      <section id="features" style={{ padding: '80px 24px', background: 'rgba(245,200,66,0.02)' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Why Choose Us?</h2>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>Built for creators who mean business</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { icon: '⚡', title: 'Instant Download', desc: 'Get access immediately after payment. No waiting, no delays.' },
              { icon: '🔒', title: 'Secure Payment', desc: 'Powered by Razorpay. 100% safe and encrypted transactions.' },
              { icon: '♾️', title: 'Lifetime Access', desc: 'Buy once, use forever. Free updates included.' },
              { icon: '💰', title: 'Money-Back Guarantee', desc: 'Not happy? Get a full refund within 7 days.' },
              { icon: '📧', title: 'Email Support', desc: 'Dedicated support team ready to help you succeed.' },
              { icon: '🔄', title: 'Regular Updates', desc: 'New products and updates added every month — free.' },
            ].map(f => (
              <div key={f.title} className="card" style={{ padding: '32px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245,200,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '20px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Get Everything. Pay Once.</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Offer ends in:</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              {[{ val: countdown.h, label: 'Hours' }, { val: countdown.m, label: 'Minutes' }, { val: countdown.s, label: 'Seconds' }].map(c => (
                <div key={c.label} className="countdown-box">
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f5c842', fontFamily: 'Syne,sans-serif' }}>{c.val}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '48px', textAlign: 'center', borderColor: 'rgba(245,200,66,0.4)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg,#f5c842,#e0a800)' }}></div>
            <div className="badge" style={{ marginBottom: '16px' }}>Most Popular</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Complete Bundle</h3>
            <p style={{ color: '#9ca3af', marginBottom: '32px' }}>All products + future updates included</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '8px' }}>
              <span style={{ color: '#6b7280', textDecoration: 'line-through', fontSize: '1.5rem' }}>₹{firstProduct ? (firstProduct.original_price || 8497).toLocaleString() : '8,497'}</span>
              <span style={{ fontSize: '3.5rem', fontWeight: 700, color: '#f5c842', fontFamily: 'Syne,sans-serif' }}>₹{firstProduct ? (firstProduct.sale_price || 1999).toLocaleString() : '1,999'}</span>
            </div>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto 40px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Instant download access', 'Lifetime access', 'Free future updates', '7-day money-back guarantee', 'Email support'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#d1d5db', fontSize: '0.875rem' }}>
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
      <section style={{ padding: '80px 24px', background: 'rgba(245,200,66,0.02)' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>What Customers Say</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { name: 'Rahul Kumar', role: 'Freelance Designer', review: 'Best investment I made this year. The templates saved me 40+ hours of work. Highly recommended!', initials: 'RK', color: 'linear-gradient(135deg,#f5c842,#e0a800)', textColor: '#0a0a0f' },
              { name: 'Priya Sharma', role: 'Startup Founder', review: 'The growth playbook alone is worth 10x the price. My startup grew from 0 to 5k users in 3 months!', initials: 'PS', color: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', textColor: '#fff' },
              { name: 'Arjun Mehta', role: 'Digital Marketer', review: 'Instant download worked perfectly. Quality is exceptional. Will definitely buy again!', initials: 'AM', color: 'linear-gradient(135deg,#10b981,#065f46)', textColor: '#fff' },
            ].map(t => (
              <div key={t.name} className="card" style={{ padding: '24px' }}>
                <div className="stars" style={{ marginBottom: '12px', fontSize: '1.1rem' }}>★★★★★</div>
                <p style={{ color: '#d1d5db', fontSize: '0.875rem', marginBottom: '20px' }}>{t.review}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: t.color, color: t.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Syne,sans-serif' }}>{t.initials}</div>
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}>{t.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>Frequently Asked Questions</h2>
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
      <footer style={{ padding: '48px 24px', borderTop: '1px solid rgba(245,200,66,0.15)' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f5c842', fontFamily: 'Syne,sans-serif', marginBottom: '12px' }}>DigitalVault</div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Premium digital products for modern entrepreneurs.</p>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#fff', marginBottom: '12px' }}>Quick Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[['/#products', 'Products'], ['/#pricing', 'Pricing'], ['/#faq', 'FAQ'], ['/account', 'My Account']].map(([href, label]) => (
                  <Link key={href} href={href} style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#fff', marginBottom: '12px' }}>Contact</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#6b7280', fontSize: '0.875rem' }}>
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
    <div className="card" style={{ padding: '24px', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{q}</span>
        <span style={{ color: '#f5c842', fontSize: '1.2rem', transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'none' }}>↓</span>
      </div>
      {open && <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '16px', lineHeight: '1.7' }}>{a}</p>}
    </div>
  );
}
