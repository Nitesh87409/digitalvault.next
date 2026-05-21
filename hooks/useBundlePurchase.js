'use client';

import { useCallback, useEffect, useState } from 'react';

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

async function readErrorMessage(response, fallback) {
  try {
    const data = await response.json();
    return data.message || data.error || fallback;
  } catch {
    return fallback;
  }
}

export function useBundlePurchase({ showToast } = {}) {
  const [hasBundleAccess, setHasBundleAccess] = useState(false);
  const [bundleLoading, setBundleLoading] = useState(false);

  const refreshBundleAccess = useCallback(async () => {
    try {
      const res = await fetch('/api/bundle/access', { cache: 'no-store' });
      if (res.status === 401) {
        setHasBundleAccess(false);
        return false;
      }

      const data = await res.json();
      setHasBundleAccess(!!data.hasAccess);
      return !!data.hasAccess;
    } catch {
      setHasBundleAccess(false);
      return false;
    }
  }, []);

  useEffect(() => {
    refreshBundleAccess();
    loadRazorpayScript();
  }, [refreshBundleAccess]);

  const unlockBundle = useCallback(async (couponCode = '') => {
    const customer = JSON.parse(localStorage.getItem('dv_customer') || 'null');
    if (!customer) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return false;
    }

    setBundleLoading(true);

    try {
      const orderRes = await fetch('/api/bundle/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_code: couponCode || null }),
      });

      if (!orderRes.ok) {
        const message = await readErrorMessage(orderRes, 'Error creating bundle order');
        showToast?.(message, '#ef4444', '#fff');
        setBundleLoading(false);
        return false;
      }

      const order = await orderRes.json();
      const razorpayReady = await loadRazorpayScript();
      if (!razorpayReady || !window.Razorpay) {
        showToast?.('Payment gateway failed to load. Try again.', '#ef4444', '#fff');
        setBundleLoading(false);
        return false;
      }

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault',
        description: 'Complete Bundle Access',
        order_id: order.razorpay_order_id,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        theme: { color: '#f5c842' },
        handler: async function(response) {
          const verifyRes = await fetch('/api/bundle/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              coupon_code: couponCode || null,
            }),
          });

          if (!verifyRes.ok) {
            const message = await readErrorMessage(verifyRes, 'Payment verification failed');
            showToast?.(message, '#ef4444', '#fff');
            setBundleLoading(false);
            return;
          }

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            showToast?.('Bundle Activated! 🎁', '#10b981', '#fff');
            await refreshBundleAccess();
            window.dispatchEvent(new CustomEvent('bundle-access-updated'));
          } else {
            showToast?.(verifyData.message || 'Payment verification failed', '#ef4444', '#fff');
          }
          setBundleLoading(false);
        },
        modal: {
          ondismiss: () => {
            showToast?.('Payment cancelled.', '#f5c842', '#0a0a0f');
            setBundleLoading(false);
          },
        },
      });

      rzp.open();
      return true;
    } catch {
      showToast?.('Network error. Try again.', '#ef4444', '#fff');
      setBundleLoading(false);
      return false;
    }
  }, [refreshBundleAccess, showToast]);

  return {
    hasBundleAccess,
    bundleLoading,
    refreshBundleAccess,
    unlockBundle,
  };
}
