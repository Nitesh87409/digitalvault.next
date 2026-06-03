'use client';

import { useEffect } from 'react';

export default function SessionSync() {
  useEffect(() => {
    // Check if customer is present in local storage
    const hasLocalCustomer = typeof window !== 'undefined' && !!localStorage.getItem('dv_customer');

    if (!hasLocalCustomer) {
      // Fetch profile to restore session if active backend cookie is present
      fetch('/api/customer', { cache: 'no-store' })
        .then((res) => {
          if (!res.ok) throw new Error('Unauthorized or network error');
          return res.json();
        })
        .then((data) => {
          if (data.flag && data.customer) {
            localStorage.setItem('dv_customer', JSON.stringify(data.customer));
            // Trigger auth and cart changes across the frontend
            window.dispatchEvent(new Event('auth-updated'));
            window.dispatchEvent(new Event('cart-updated'));
          }
        })
        .catch(() => {
          // Quietly fail for guest users
        });
    }
  }, []);

  return null;
}
