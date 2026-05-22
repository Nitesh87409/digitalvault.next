'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { useSettings } from '@/hooks/useSettings';

const BUNDLE_CART_ID = '__bundle_subscription__';

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
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const router = useRouter();
  const { settings } = useSettings();

  useEffect(() => {
    // Pre-load Razorpay script for faster checkout
    loadRazorpayScript();
    
    const c = localStorage.getItem('dv_customer');
    if (!c) { router.push('/login?redirect=/cart'); return; }
    const parsedCustomer = JSON.parse(c);
    setCustomer(parsedCustomer);
    if (parsedCustomer.phone) setCheckoutPhone(parsedCustomer.phone);
    if (parsedCustomer.email) setCheckoutEmail(parsedCustomer.email);
    setCart(JSON.parse(localStorage.getItem('dv_cart') || '[]'));
  }, []);

  useEffect(() => {
    const bundlePrice = Number(settings.bundle_price);
    const originalPrice = Number(settings.bundle_original_price);
    if (!Number.isFinite(bundlePrice) || bundlePrice < 1) return;

    const safeOriginalPrice = Number.isFinite(originalPrice) && originalPrice > 0 ? originalPrice : bundlePrice;
    const currentBundlePrice = Math.min(bundlePrice, safeOriginalPrice);
    const currentOriginalPrice = Math.max(bundlePrice, safeOriginalPrice);

    setCart(prev => {
      if (!(prev.length === 1 && prev[0]?.type === 'bundle')) return prev;

      const currentItem = prev[0];
      const updatedItem = {
        ...currentItem,
        name: settings.bundle_title || currentItem.name || 'Complete Bundle',
        price: currentBundlePrice,
        orig_price: currentOriginalPrice,
      };

      if (
        currentItem.name === updatedItem.name &&
        currentItem.price === updatedItem.price &&
        currentItem.orig_price === updatedItem.orig_price
      ) {
        return prev;
      }

      const updatedCart = [updatedItem];
      localStorage.setItem('dv_cart', JSON.stringify(updatedCart));
      window.dispatchEvent(new CustomEvent('cart-updated'));
      return updatedCart;
    });
  }, [settings.bundle_price, settings.bundle_original_price, settings.bundle_title]);

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
  const isBundleCart = cart.length === 1 && cart[0]?.type === 'bundle';

  // Apply coupon
  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMsg('');
    setCouponData(null);
    try {
      const product_id = cart.length === 1 && cart[0]?.type !== 'bundle' ? cart[0].id : '';
      const res = await fetch(`/api/coupon?action=validate&code=${couponCode}&email=${customer?.email}&amount=${subtotal}&product_id=${product_id}&is_bundle=${isBundleCart}`);
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

    const isPhoneMissing = !customer.phone;
    const isEmailMissing = !customer.email;

    if (isPhoneMissing || isEmailMissing) {
      if (isPhoneMissing && (!checkoutPhone || !/^\d{10}$/.test(checkoutPhone))) {
        setError('Please enter a valid 10-digit phone number in the order summary.');
        return;
      }
      if (isEmailMissing && (!checkoutEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutEmail))) {
        setError('Please enter a valid email address in the order summary.');
        return;
      }

      setLoading(true);
      try {
        const updateRes = await fetch('/api/customer', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update', name: customer.name, phone: checkoutPhone, email: checkoutEmail })
        });
        const updateData = await updateRes.json();
        if (updateData.flag) {
          const updatedCustomer = { ...customer, phone: checkoutPhone, email: checkoutEmail };
          localStorage.setItem('dv_customer', JSON.stringify(updatedCustomer));
          setCustomer(updatedCustomer);
        } else {
          setError(updateData.message || 'Error updating details.');
          setLoading(false);
          return;
        }
      } catch (e) {
        setError('Error updating details.');
        setLoading(false);
        return;
      }
    } else {
      setLoading(true);
    }

    try {
      let data;
      const authHeaders = { 'Content-Type': 'application/json' };
      const payload = {
        name: customer.name,
        email: customer.email || checkoutEmail,
        phone: customer.phone || checkoutPhone,
        coupon_code: couponData?.code || null,
        discount_amount: couponDiscount || 0,
      };

      if (isBundleCart) {
        const res = await fetch('/api/bundle/create-order', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ coupon_code: couponData?.code || null })
        });
        data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Error creating bundle order.');
          setLoading(false);
          return;
        }
      } else if (cart.length === 1) {
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

      if (!isBundleCart && !data.flag) { setError(data.message || 'Error creating order.'); setLoading(false); return; }
      const razorpayReady = await loadRazorpayScript();
      if (!razorpayReady || !window.Razorpay) { setError('Payment gateway failed to load. Try again.'); setLoading(false); return; }
      setLoading(false);

      const rzp = new window.Razorpay({
        key: isBundleCart ? data.key_id : data.razorpay_key,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault',
        description: isBundleCart ? 'Complete Bundle' : cart.length === 1 ? cart[0].name : `${cart.length} Products`,
        order_id: data.razorpay_order_id,
        prefill: { name: customer.name, email: customer.email || checkoutEmail, contact: customer.phone || checkoutPhone },
        theme: { color: '#f5c842' },
        handler: async function(response) {
          const verRes = await fetch(isBundleCart ? '/api/bundle/verify-payment' : '/api/order', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(isBundleCart ? {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              coupon_code: couponData?.code || null,
            } : {
              action: 'payment-success',
              razorpay_response: response,
              order_id: data.order_id || null,
              order_ids: data.order_ids || null,
              email: customer.email || checkoutEmail,
              coupon_code: couponData?.code || null,
              discount_amount: couponDiscount || 0,
            })
          });
          const verData = await verRes.json();
          if (isBundleCart ? verData.success : verData.flag) {
            localStorage.removeItem('dv_cart');
            window.dispatchEvent(new CustomEvent('cart-updated'));
            if (isBundleCart) {
              router.push('/my-downloads');
            } else if (verData.download_token) {
              router.push(`/download?token=${verData.download_token}`);
            } else {
              router.push('/account?tab=downloads');
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

  const inp = { background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--heading)', outline: 'none', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' };

  return (
    <>
      <div style={{ fontFamily: 'DM Sans, sans-serif', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>

        {/* Nav */}
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--line-soft)', backdropFilter: 'blur(20px)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#f5c842', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {settings.app_logo ? (
                <img src={settings.app_logo} alt={settings.app_name} style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
              ) : null}
              {settings.app_name}
            </Link>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div className="hidden sm:flex items-center gap-4">
                <Link href="/" style={{ fontSize: '0.875rem', color: 'var(--muted-2)', textDecoration: 'none' }}>← Continue Shopping</Link>
                <Link href="/account" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>My Account</Link>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 700, color: 'var(--heading)', marginBottom: '32px' }}>🛒 Your Cart</h1>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🛒</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--heading)', marginBottom: '12px' }}>Your cart is empty!</h2>
              <p style={{ color: 'var(--muted-2)', marginBottom: '32px' }}>Add some products to get started.</p>
              <Link href="/" style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', padding: '16px 32px', borderRadius: '999px', textDecoration: 'none', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>Browse Products →</Link>
            </div>
          ) : (
            <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>

              {/* Cart Items */}
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <Link href={item.type === 'bundle' ? '/#pricing' : `/product/${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
                      <div style={{ width: '90px', height: '90px', borderRadius: '10px', overflow: 'hidden', background: 'var(--surface-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        {item.image ? <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '📦'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--heading)', marginBottom: '4px' }}>{item.name}</h3>
                        <p style={{ color: 'var(--muted-2)', fontSize: '0.75rem' }}>Digital Product · Instant Download</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                          <span style={{ color: '#f5c842', fontWeight: 700 }}>₹{item.price?.toLocaleString()}</span>
                          {item.orig_price > item.price && <span style={{ color: 'var(--muted-2)', textDecoration: 'line-through', fontSize: '0.875rem' }}>₹{item.orig_price?.toLocaleString()}</span>}
                        </div>
                      </div>
                      </Link>
                      <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-2)', padding: '8px' }} title="Remove">🗑</button>
                    </div>
                  ))}
                </div>

                {/* Coupon Apply */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', marginBottom: '16px' }}>🎟️ Apply Coupon</h3>

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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.2rem' }}>✅</span>
                          <div>
                            <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Syne, sans-serif' }}>{couponData.code}</div>
                            <div style={{ color: 'var(--muted-2)', fontSize: '0.75rem' }}>You save ₹{couponDiscount.toLocaleString()}</div>
                          </div>
                        </div>
                        <button onClick={removeCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem' }}>✕ Remove</button>
                      </div>
                      {isBundleCart && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted-2)', margin: '4px 0 0' }}>
                          ℹ️ Coupon discount will be securely verified and applied by the payment gateway.
                        </p>
                      )}
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
              <div className="cart-summary" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', position: 'sticky', top: '100px', alignSelf: 'start' }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)', marginBottom: '24px' }}>Order Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                    <span>{cart.length} item(s)</span>
                    <span style={{ color: 'var(--heading)' }}>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {savings > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
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
                  <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', color: 'var(--heading)', fontWeight: 700, fontSize: '1.1rem' }}>
                    <span>Total</span>
                    <span style={{ color: '#f5c842' }}>₹{finalAmount.toLocaleString()}</span>
                  </div>
                  {(savings + couponDiscount) > 0 && (
                    <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', padding: '8px 12px', textAlign: 'center', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
                      🎉 You save ₹{(savings + couponDiscount).toLocaleString()} total!
                    </div>
                  )}
                </div>

                {customer && (!customer.email || !customer.phone) && (
                  <div style={{ marginBottom: '16px', background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '12px' }}>Please complete your details to proceed.</p>
                    
                    {!customer.email && (
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Email Address</label>
                        <input
                          type="email"
                          value={checkoutEmail}
                          onChange={e => setCheckoutEmail(e.target.value)}
                          placeholder="your@email.com"
                          style={{ ...inp, width: '100%' }}
                        />
                      </div>
                    )}
                    
                    {!customer.phone && (
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Phone Number</label>
                        <input
                          type="tel"
                          value={checkoutPhone}
                          onChange={e => setCheckoutPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          style={{ ...inp, width: '100%' }}
                          maxLength={10}
                        />
                      </div>
                    )}
                  </div>
                )}

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

                <Link href="/" style={{ display: 'block', textAlign: 'center', fontSize: '0.875rem', color: 'var(--muted-2)', textDecoration: 'none' }}>← Continue Shopping</Link>

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['🔒 Secure Razorpay Payment', '⚡ Instant Download', '💰 7-Day Money Back'].map(t => (
                    <p key={t} style={{ color: 'var(--muted-2)', fontSize: '0.75rem' }}>{t}</p>
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
