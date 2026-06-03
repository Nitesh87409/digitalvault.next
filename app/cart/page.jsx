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
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [guestCheckoutOpen, setGuestCheckoutOpen] = useState(false);
  const router = useRouter();
  const { settings } = useSettings();

  useEffect(() => {
    // Pre-load Razorpay script for faster checkout
    loadRazorpayScript();
    
    const c = localStorage.getItem('dv_customer');
    let parsedCustomer = null;
    try {
      parsedCustomer = c ? JSON.parse(c) : null;
    } catch {
      localStorage.removeItem('dv_customer');
    }
    if (parsedCustomer) {
      setCustomer(parsedCustomer);
      if (parsedCustomer.phone) setCheckoutPhone(parsedCustomer.phone);
      if (parsedCustomer.email) setCheckoutEmail(parsedCustomer.email);
    }
    setCart(JSON.parse(localStorage.getItem('dv_cart') || '[]'));
    fetchAvailableCoupons(parsedCustomer?.email || '');
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

  async function fetchAvailableCoupons(email = '') {
    try {
      const url = email ? `/api/coupon?action=public-coupons&email=${encodeURIComponent(email)}` : '/api/coupon?action=public-coupons';
      const res = await fetch(url);
      const data = await res.json();
      if (data.flag && data.coupons) {
        setAvailableCoupons(data.coupons);
      }
    } catch (e) { /* silently fail */ }
  }

  function quickApplyCoupon(code) {
    setCouponCode(code);
    setCouponData(null);
    setCouponMsg('');
    // Trigger apply after state update
    setTimeout(() => {
      const applyBtn = document.getElementById('cart-apply-coupon-btn');
      if (applyBtn) applyBtn.click();
    }, 100);
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
      const res = await fetch(`/api/coupon?action=validate&code=${couponCode}&amount=${subtotal}&product_id=${product_id}&is_bundle=${isBundleCart}`);
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

  async function proceedToCheckout(guestContact = null) {
    if (cart.length === 0) return;
    setError('');

    if (!customer && isBundleCart) {
      router.push('/login?redirect=/cart');
      return;
    }

    if (!customer && !guestContact) {
      setGuestCheckoutOpen(true);
      return;
    }

    let activeCustomer = customer;

    if (!customer && guestContact) {
      setLoading(true);
      try {
        const loginRes = await fetch('/api/customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'silent-guest-login', email: guestContact.email, phone: guestContact.phone })
        });
        const loginData = await loginRes.json();
        if (loginData.flag && loginData.customer) {
          localStorage.setItem('dv_customer', JSON.stringify(loginData.customer));
          window.dispatchEvent(new CustomEvent('auth-updated'));
          setCustomer(loginData.customer);
          activeCustomer = loginData.customer;
        } else {
          setError(loginData.message || 'Error processing guest details.');
          setLoading(false);
          return;
        }
      } catch (e) {
        setError('Network error. Try again.');
        setLoading(false);
        return;
      }
    }

    const isPhoneMissing = !activeCustomer.phone;
    const isEmailMissing = !activeCustomer.email;

    if (customer && (isPhoneMissing || isEmailMissing)) {
      if (isPhoneMissing && (!checkoutPhone || !/^\d{10}$/.test(checkoutPhone))) {
        setError('Please enter a valid 10-digit phone number in the order summary.');
        setLoading(false);
        return;
      }
      if (isEmailMissing && (!checkoutEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutEmail))) {
        setError('Please enter a valid email address in the order summary.');
        setLoading(false);
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
        name: activeCustomer.name || 'Guest',
        email: activeCustomer.email || checkoutEmail,
        phone: activeCustomer.phone || checkoutPhone,
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
      setGuestCheckoutOpen(false);

      const rzp = new window.Razorpay({
        key: isBundleCart ? data.key_id : data.razorpay_key,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault',
        description: isBundleCart ? 'Complete Bundle' : cart.length === 1 ? cart[0].name : `${cart.length} Products`,
        order_id: data.razorpay_order_id,
        prefill: { name: activeCustomer.name || 'Guest', email: activeCustomer.email || checkoutEmail, contact: activeCustomer.phone || checkoutPhone },
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
              email: activeCustomer.email || checkoutEmail,
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

  function submitGuestCheckout() {
    const email = checkoutEmail.trim().toLowerCase();
    const phone = checkoutPhone.replace(/\D/g, '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    proceedToCheckout({ email, phone });
  }

  const inputClass = "bg-[var(--surface-2)] border border-[var(--line)] text-[var(--heading)] outline-none px-4 py-3 rounded-xl text-sm font-['DM_Sans',sans-serif] focus:border-[#f5c842]/50 transition-colors duration-200";

  return (
    <>
      <div className="font-['DM_Sans',sans-serif] bg-[var(--bg)] min-h-screen text-[var(--text)]">

        {/* Nav */}
        <nav className="bg-[var(--nav-bg)] border-b border-[var(--line-soft)] backdrop-blur-[20px] px-6 py-3 sticky top-0 z-10">
          <div className="max-w-[1152px] mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="font-['Syne',sans-serif] text-xl font-bold text-[#f5c842] no-underline flex items-center gap-2"
              style={settings.app_name_size ? { fontSize: `${settings.app_name_size}px` } : {}}
            >
              {settings.app_logo ? (
                <img src={settings.app_logo} alt={settings.app_name} className="h-7 w-auto object-contain" />
              ) : null}
              {settings.app_name}
            </Link>
            <div className="flex gap-4 items-center">
              <div className="hidden sm:flex items-center gap-4">
                <Link href="/" className="text-sm text-[var(--muted-2)] no-underline hover:text-[#f5c842] transition-colors duration-200">← Continue Shopping</Link>
                <Link href="/account" className="text-sm text-[var(--muted)] no-underline hover:text-white transition-colors duration-200">My Account</Link>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <div className="max-w-[1152px] mx-auto px-4 md:px-6 py-6 md:py-10">
          <h1 className="font-['Syne',sans-serif] text-xl md:text-[2rem] font-bold text-[var(--heading)] mb-4 md:mb-8">🛒 Your Cart</h1>

          {cart.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-[4rem] mb-6">🛒</div>
              <h2 className="font-['Syne',sans-serif] text-[1.5rem] font-bold text-[var(--heading)] mb-3">Your cart is empty!</h2>
              <p className="text-[var(--muted-2)] mb-8">Add some products to get started.</p>
              <Link href="/" className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] px-8 py-4 rounded-full no-underline font-bold font-['Syne',sans-serif] transition-transform duration-200 hover:scale-[1.02] inline-block">Browse Products →</Link>
            </div>
          ) : (
            <div className="cart-layout grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

              {/* Cart Items */}
              <div>
                <div className="flex flex-col gap-4 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-4">
                      <Link href={item.type === 'bundle' ? '/#pricing' : `/product/${item.slug || item.id}`} className="flex items-center gap-4 flex-1 min-w-0 text-inherit no-underline">
                        <div className="w-[90px] h-[90px] rounded-xl overflow-hidden bg-[var(--surface-2)] shrink-0 flex items-center justify-center text-[2rem]">
                          {item.image ? <img src={item.image} className="w-full h-full object-cover" alt="" /> : '📦'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[var(--heading)] mb-1">{item.name}</h3>
                          <p className="text-[var(--muted-2)] text-xs">Digital Product · Instant Download</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[#f5c842] font-bold">₹{item.price?.toLocaleString()}</span>
                            {item.orig_price > item.price && <span className="text-[var(--muted-2)] line-through text-sm">₹{item.orig_price?.toLocaleString()}</span>}
                          </div>
                        </div>
                      </Link>
                      <button onClick={() => removeItem(item.id)} className="bg-transparent border-none cursor-pointer text-[var(--muted-2)] p-2 hover:text-[#ef4444] transition-colors duration-200" title="Remove">🗑</button>
                    </div>
                  ))}
                </div>

                {/* Coupon Apply */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
                  <h3 className="font-['Syne',sans-serif] text-base font-bold text-[var(--heading)] mb-4">🎟️ Apply Coupon</h3>

                  {!couponData ? (
                    <div className="flex gap-2.5">
                      <input
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                        placeholder="Enter coupon code"
                        className={`${inputClass} flex-1 uppercase tracking-[1px]`}
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading}
                        id="cart-apply-coupon-btn"
                        className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none cursor-pointer px-5 py-3 rounded-xl text-sm disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap transform transition-all duration-100 ease-out enabled:hover:scale-[1.02] enabled:active:scale-[0.96] enabled:active:brightness-95 select-none"
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between bg-[#10b981]/8 border border-[#10b981]/20 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[1.2rem]">✅</span>
                          <div>
                            <div className="text-[#10b981] font-bold text-[0.9rem] font-['Syne',sans-serif]">{couponData.code}</div>
                            <div className="text-[var(--muted-2)] text-xs">You save ₹{couponDiscount.toLocaleString()}</div>
                          </div>
                        </div>
                        <button onClick={removeCoupon} className="bg-transparent border-none cursor-pointer text-[#ef4444] text-[0.8rem] hover:underline">✕ Remove</button>
                      </div>
                      {isBundleCart && (
                        <p className="text-xs text-[var(--muted-2)] mt-1">
                          ℹ️ Coupon discount will be securely verified and applied by the payment gateway.
                        </p>
                      )}
                    </div>
                  )}

                  {couponMsg && !couponData && (
                    <p className={`mt-2.5 text-[0.8rem] ${couponData ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                      {couponMsg}
                    </p>
                  )}
                </div>

                {/* Available Coupons */}
                {availableCoupons.length > 0 && !couponData && (
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mt-6">
                    <h3 className="font-['Syne',sans-serif] text-base font-bold text-[var(--heading)] mb-4">🏷️ Available Coupons</h3>
                    <div className="flex flex-col gap-2.5">
                      {availableCoupons
                        .filter(c => {
                          // Filter by relevance: if coupon has product_ids, check if cart items match
                          const pids = (c.product_ids || []).map(id => id.toString());
                          if (pids.length === 0) return true; // all products
                          if (isBundleCart) return false; // product-specific coupons not for bundle
                          return cart.some(item => pids.includes(item.id));
                        })
                        .slice(0, 5)
                        .map(c => (
                          <div key={c._id} className="flex items-center justify-between gap-3 border border-dashed border-[#f5c842]/30 bg-[#f5c842]/[0.03] rounded-xl px-4 py-3 hover:border-[#f5c842]/50 transition-colors">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-sm text-[#f5c842] bg-[#f5c842]/10 px-2 py-0.5 rounded tracking-wider">{c.code}</span>
                                <span className="text-xs font-bold text-[#10b981]">
                                  {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                                </span>
                              </div>
                              <div className="text-[10px] text-[var(--muted-2)] mt-1 flex items-center gap-2 flex-wrap">
                                {c.min_order > 0 && <span>Min ₹{c.min_order}</span>}
                                {c.end_date && <span>Expires {new Date(c.end_date).toLocaleDateString('en-IN')}</span>}
                                {c.user_type === 'new' && <span className="text-[#7c3aed] font-semibold">New Users</span>}
                              </div>
                            </div>
                            <button
                              onClick={() => quickApplyCoupon(c.code)}
                              className="shrink-0 bg-[#f5c842]/10 border border-[#f5c842]/30 text-[#f5c842] font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#f5c842]/20 transition-colors font-['Syne',sans-serif]"
                            >
                              Apply
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="cart-summary bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sticky top-[100px] self-start">
                <h3 className="font-['Syne',sans-serif] text-[1.1rem] font-bold text-[var(--heading)] mb-6">Order Summary</h3>
                <div className="flex flex-col gap-3 mb-6 text-sm">
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>{cart.length} item(s)</span>
                    <span className="text-[var(--heading)]">₹{subtotal.toLocaleString()}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-[var(--muted)]">
                      <span>Product Discount</span>
                      <span className="text-[#10b981]">-₹{savings.toLocaleString()}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-[#f5c842] font-semibold">
                      <span>🎟️ Coupon ({couponData?.code})</span>
                      <span>-₹{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-[var(--line-soft)] pt-3 flex justify-between text-[var(--heading)] font-bold text-[1.1rem]">
                    <span>Total</span>
                    <span className="text-[#f5c842]">₹{finalAmount.toLocaleString()}</span>
                  </div>
                  {(savings + couponDiscount) > 0 && (
                    <div className="bg-[#10b981]/8 border border-[#10b981]/15 rounded-lg py-2 px-3 text-center text-[#10b981] text-[0.8rem] font-semibold">
                      🎉 You save ₹{(savings + couponDiscount).toLocaleString()} total!
                    </div>
                  )}
                </div>

                {customer && (!customer.email || !customer.phone) && (
                  <div className="mb-4 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--line)]">
                    <p className="text-[0.8rem] text-[var(--muted)] mb-3">Please complete your details to proceed.</p>
                    
                    {!customer.email && (
                      <div className="mb-3">
                        <label className="text-xs text-[var(--muted)] block mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={checkoutEmail}
                          onChange={e => setCheckoutEmail(e.target.value)}
                          placeholder="your@email.com"
                          className={`${inputClass} w-full`}
                        />
                      </div>
                    )}
                    
                    {!customer.phone && (
                      <div>
                        <label className="text-xs text-[var(--muted)] block mb-1.5">Phone Number</label>
                        <input
                          type="tel"
                          value={checkoutPhone}
                          onChange={e => setCheckoutPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          className={`${inputClass} w-full`}
                          maxLength={10}
                        />
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="text-[#ef4444] text-[0.8rem] px-3.5 py-2.5 bg-[#ef4444]/8 rounded-lg mb-4 border border-[#ef4444]/20">
                    {error}
                  </div>
                )}

                <button
                  onClick={() => proceedToCheckout()}
                  disabled={loading}
                  className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none w-full p-4 rounded-xl text-base mb-3 transform transition-all duration-100 ease-out disabled:opacity-70 disabled:cursor-not-allowed enabled:hover:scale-[1.01] enabled:hover:shadow-[0_0_20px_rgba(245,200,66,0.3)] enabled:active:scale-[0.96] enabled:active:brightness-95 cursor-pointer select-none"
                >
                  {loading ? '⏳ Processing...' : `Pay ₹${finalAmount.toLocaleString()} →`}
                </button>

                <Link href="/" className="block text-center text-sm text-[var(--muted-2)] no-underline hover:text-white transition-colors duration-200">← Continue Shopping</Link>

                <div className="mt-6 pt-6 border-t border-[var(--line-soft)] flex flex-col gap-2">
                  {['🔒 Secure Razorpay Payment', '⚡ Instant Download', '💰 7-Day Money Back'].map(t => (
                    <p key={t} className="text-[var(--muted-2)] text-xs">{t}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {guestCheckoutOpen && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
          onClick={() => !loading && setGuestCheckoutOpen(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-2xl border border-[#f5c842]/20 bg-[#12121a] p-5 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-['Syne',sans-serif] text-xl font-bold text-white">Checkout Details</h2>
                <p className="mt-1 text-sm text-[#9ca3af]">Enter your details to continue payment.</p>
              </div>
              <button
                type="button"
                onClick={() => !loading && setGuestCheckoutOpen(false)}
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
                  value={checkoutEmail}
                  onChange={event => setCheckoutEmail(event.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a2a] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#f5c842]/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#9ca3af]">Phone Number</label>
                <input
                  type="tel"
                  value={checkoutPhone}
                  onChange={event => setCheckoutPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a2a] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#f5c842]/50"
                  maxLength={10}
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/8 px-3.5 py-2.5 text-[0.8rem] text-[#ef4444]">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={submitGuestCheckout}
              disabled={loading}
              className="mt-5 w-full rounded-xl border-none bg-gradient-to-br from-[#f5c842] to-[#e0a800] px-4 py-3.5 font-['Syne',sans-serif] text-base font-bold text-[#0a0a0f] transform transition-all duration-100 ease-out enabled:hover:scale-[1.01] enabled:hover:shadow-[0_0_20px_rgba(245,200,66,0.3)] enabled:active:scale-[0.96] enabled:active:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 select-none cursor-pointer"
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
