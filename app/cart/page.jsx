'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponData, setCouponData] = useState(null);
  const [couponMsg, setCouponMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    const c = localStorage.getItem('dv_customer');
    if (!c) { router.push('/login?redirect=/cart'); return; }
    setCustomer(JSON.parse(c));
    setCart(JSON.parse(localStorage.getItem('dv_cart') || '[]'));
  }, []);

  function removeItem(id) {
    const updated = cart.filter(i => i.id !== id);
    setCart(updated);
    localStorage.setItem('dv_cart', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cart-updated'));
    // Reset coupon if cart changes
    setCouponData(null);
    setCouponCode('');
    setCouponMsg('');
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const origTotal = cart.reduce((s, i) => s + (i.orig_price || i.price) * i.qty, 0);
  const savings = origTotal - subtotal;
  const couponDiscount = couponData?.discount || 0;
  const finalAmount = subtotal - couponDiscount;

  // Apply coupon
  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMsg('');
    setCouponData(null);
    try {
      const product_id = cart.length === 1 ? cart[0].id : '';
      const res = await fetch(`/api/coupon?action=validate&code=${couponCode}&email=${customer?.email}&amount=${subtotal}&product_id=${product_id}`);
      const data = await res.json();
      if (data.flag) {
        setCouponData(data.coupon);
        setCouponMsg(data.message);
      } else {
        setCouponMsg(data.message);
      }
    } catch(e) {
      setCouponMsg('Error applying coupon.');
    }
    setCouponLoading(false);
  }

  function removeCoupon() {
    setCouponData(null);
    setCouponCode('');
    setCouponMsg('');
  }

  async function proceedToCheckout() {
    if (!customer || cart.length === 0) return;
    setError('');
    setLoading(true);

    try {
      let data;
      const authHeaders = { 'Content-Type': 'application/json' };
      const payload = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        coupon_code: couponData?.code || null,
        discount_amount: couponDiscount || 0,
      };

      if (cart.length === 1) {
        const res = await fetch('/api/order', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ action: 'create', ...payload, product_id: cart[0].id })
        });
        data = await res.json();
      } else {
        const res = await fetch('/api/order', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ action: 'cart-checkout', ...payload, items: cart.map(i => ({ product_id: i.id })) })
        });
        data = await res.json();
      }

      if (!data.flag) { setError(data.message || 'Error creating order.'); setLoading(false); return; }
      const razorpayReady = await loadRazorpayScript();
      if (!razorpayReady || !window.Razorpay) { setError('Payment gateway failed to load. Try again.'); setLoading(false); return; }
      setLoading(false);

      const rzp = new window.Razorpay({
        key: data.razorpay_key,
        amount: data.amount,
        currency: 'INR',
        name: 'DigitalVault',
        description: cart.length === 1 ? cart[0].name : `${cart.length} Products`,
        order_id: data.razorpay_order_id,
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
        theme: { color: '#f5c842' },
        handler: async function(response) {
          const verRes = await fetch('/api/order', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              action: 'payment-success',
              razorpay_response: response,
              order_id: data.order_id || null,
              order_ids: data.order_ids || null,
              email: customer.email,
              coupon_code: couponData?.code || null,
              discount_amount: couponDiscount || 0,
            })
          });
          const verData = await verRes.json();
          if (verData.flag) {
            localStorage.removeItem('dv_cart');
            window.dispatchEvent(new CustomEvent('cart-updated'));
            if (verData.download_token) {
              router.push(`/download?token=${verData.download_token}`);
            } else {
              router.push('/account');
            }
          } else {
            setError('Payment error. Check My Account.');
          }
        },
        modal: { ondismiss: () => setError('Payment cancelled.') }
      });
      rzp.open();

    } catch(e) {
      setError('Network error. Try again.');
      setLoading(false);
    }
  }

  const inp = { background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' };

  return (
    <>
      <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0f', minHeight: '100vh', color: '#e8e8f0' }}>

        {/* Nav */}
        <nav style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid rgba(245,200,66,0.1)', backdropFilter: 'blur(20px)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#f5c842', textDecoration: 'none' }}>DigitalVault</Link>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Link href="/" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>← Continue Shopping</Link>
              <Link href="/account" style={{ fontSize: '0.875rem', color: '#9ca3af', textDecoration: 'none' }}>My Account</Link>
            </div>
          </div>
        </nav>

        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '32px' }}>🛒 Your Cart</h1>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🛒</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Your cart is empty!</h2>
              <p style={{ color: '#6b7280', marginBottom: '32px' }}>Add some products to get started.</p>
              <Link href="/" style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', padding: '16px 32px', borderRadius: '999px', textDecoration: 'none', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>Browse Products →</Link>
            </div>
          ) : (
            <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>

              {/* Cart Items */}
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '90px', height: '90px', borderRadius: '10px', overflow: 'hidden', background: '#1a1a2a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        {item.image ? <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '📦'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{item.name}</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>Digital Product · Instant Download</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                          <span style={{ color: '#f5c842', fontWeight: 700 }}>₹{item.price?.toLocaleString()}</span>
                          {item.orig_price > item.price && <span style={{ color: '#6b7280', textDecoration: 'line-through', fontSize: '0.875rem' }}>₹{item.orig_price?.toLocaleString()}</span>}
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '8px' }} title="Remove">🗑</button>
                    </div>
                  ))}
                </div>

                {/* Coupon Apply */}
                <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '14px', padding: '20px' }}>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>🎟️ Apply Coupon</h3>

                  {!couponData ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                        placeholder="Enter coupon code"
                        style={{ ...inp, flex: 1, textTransform: 'uppercase', letterSpacing: '1px' }}
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading}
                        style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: 'pointer', padding: '12px 20px', borderRadius: '12px', fontSize: '0.875rem', opacity: couponLoading ? 0.7 : 1, whiteSpace: 'nowrap' }}
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem' }}>✅</span>
                        <div>
                          <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Syne, sans-serif' }}>{couponData.code}</div>
                          <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>You save ₹{couponDiscount.toLocaleString()}</div>
                        </div>
                      </div>
                      <button onClick={removeCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem' }}>✕ Remove</button>
                    </div>
                  )}

                  {couponMsg && !couponData && (
                    <p style={{ marginTop: '10px', fontSize: '0.8rem', color: couponData ? '#10b981' : '#ef4444' }}>
                      {couponMsg}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="cart-summary" style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.15)', borderRadius: '16px', padding: '24px', position: 'sticky', top: '100px', alignSelf: 'start' }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>Order Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
                    <span>{cart.length} item(s)</span>
                    <span style={{ color: '#fff' }}>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {savings > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
                      <span>Product Discount</span>
                      <span style={{ color: '#10b981' }}>-₹{savings.toLocaleString()}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f5c842', fontWeight: 600 }}>
                      <span>🎟️ Coupon ({couponData?.code})</span>
                      <span>-₹{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                    <span>Total</span>
                    <span style={{ color: '#f5c842' }}>₹{finalAmount.toLocaleString()}</span>
                  </div>
                  {(savings + couponDiscount) > 0 && (
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', padding: '8px 12px', textAlign: 'center', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
                      🎉 You save ₹{(savings + couponDiscount).toLocaleString()} total!
                    </div>
                  )}
                </div>

                {error && (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={proceedToCheckout}
                  disabled={loading}
                  style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', width: '100%', padding: '16px', borderRadius: '12px', fontSize: '1rem', marginBottom: '12px', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? '⏳ Processing...' : `Pay ₹${finalAmount.toLocaleString()} →`}
                </button>

                <Link href="/" style={{ display: 'block', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>← Continue Shopping</Link>

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['🔒 Secure Razorpay Payment', '⚡ Instant Download', '💰 7-Day Money Back'].map(t => (
                    <p key={t} style={{ color: '#6b7280', fontSize: '0.75rem' }}>{t}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
