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
  const router = useRouter();

  useEffect(() => {
    loadProduct();

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>
            {/* LEFT — Images */}
            <div>
              {/* Main Image */}
              <div style={{ marginBottom: '16px' }}>
                {mainImg ? (
                  <img src={mainImg} alt={product.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '16px', border: '1px solid rgba(245,200,66,0.15)' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1', background: '#12121a', borderRadius: '16px', border: '1px solid rgba(245,200,66,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem' }}>📦</div>
                )}
              </div>
              {/* Thumbnails */}
              {product.images?.length > 1 && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {product.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      onClick={() => setMainImg(img)}
                      style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px', cursor: 'pointer', border: `2px solid ${mainImg === img ? '#f5c842' : 'transparent'}`, transition: 'border-color 0.2s' }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Info */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'inline-block', background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', fontFamily: 'Syne, sans-serif', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px', width: 'fit-content' }}>
                Digital Product
              </div>

              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '16px', lineHeight: 1.2 }}>{product.name}</h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <span style={{ color: '#f5c842' }}>★★★★★</span>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>(4.9) · Instant Download</span>
              </div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f5c842', fontFamily: 'Syne, sans-serif' }}>₹{sale.toLocaleString()}</span>
                {orig > 0 && <span style={{ fontSize: '1.25rem', color: '#6b7280', textDecoration: 'line-through' }}>₹{orig.toLocaleString()}</span>}
                {discount > 0 && <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '8px' }}>{discount}% OFF</span>}
              </div>
              <p style={{ color: '#10b981', fontSize: '0.875rem', marginBottom: '24px' }}>✓ Inclusive of all taxes</p>

              {/* Highlights */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
                {[['⚡', 'Instant Download'], ['♾️', 'Lifetime Access'], ['💰', '7-Day Refund'], ['🔒', 'Secure Payment']].map(([icon, text]) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#d1d5db' }}>
                    <span style={{ color: '#f5c842' }}>{icon}</span> {text}
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                <button onClick={addToCart} style={{ flex: 1, padding: '16px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif', background: 'rgba(245,200,66,0.1)', border: '2px solid rgba(245,200,66,0.4)', color: '#f5c842', transition: 'all 0.2s' }}>
                  🛒 Add to Cart
                </button>
                <button onClick={buyNow} style={{ flex: 1, padding: '16px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif', background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', border: 'none', transition: 'all 0.2s' }}>
                  ⚡ Buy Now
                </button>
              </div>

              <div style={{ borderTop: '1px solid rgba(245,200,66,0.1)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
                {[['Format', 'Digital Download'], ['Delivery', 'Instant (Email + Download Page)'], ['Access', 'Lifetime'], ['Support', 'Email Support']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>{k}</span>
                    <span style={{ color: '#fff' }}>{v}</span>
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
              <div dangerouslySetInnerHTML={{ __html: product.description }} style={{ color: '#d1d5db', lineHeight: '1.8', maxWidth: '768px' }} />
            </div>
          )}
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
