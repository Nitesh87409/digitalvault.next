'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar({ onSearchClick }) {
  const [customer, setCustomer] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const c = localStorage.getItem('dv_customer');
    if (c) setCustomer(JSON.parse(c));

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

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
      return;
    }
    if (window.location.pathname !== '/') {
      window.location.href = '/#products';
    } else {
      const productsSection = document.getElementById('products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
        const searchInput = productsSection.querySelector('input[type="text"]');
        if (searchInput) {
          setTimeout(() => {
            searchInput.focus();
          }, 600);
        }
      }
    }
  };

  function logout() {
    localStorage.removeItem('dv_token');
    localStorage.removeItem('dv_customer');
    window.location.href = '/login';
  }

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        maxWidth: '100vw',
        zIndex: 100,
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(245,200,66,0.15)',
        overflowX: 'clip',
      }}
    >
      <div
        className="px-4 py-3 md:px-[18px] md:py-4"
        style={{
          maxWidth: '1152px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          width: '100%',
          minWidth: 0,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontFamily: 'Syne,sans-serif',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#f5c842',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flexShrink: 1,
          }}
        >
          DigitalVault
        </Link>

        {/* Desktop Nav */}
        <div style={{ alignItems: 'center' }} className="hidden md:flex md:gap-4 lg:gap-8 flex-shrink-0">
          <Link href="/categories" className="text-[#d1d5db] text-[0.875rem] no-underline whitespace-nowrap">Categories</Link>
          <Link href="/#products" style={{ color: '#d1d5db', fontSize: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>Products</Link>
          <Link href="/#features" style={{ color: '#d1d5db', fontSize: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>Features</Link>
          <Link href="/#pricing" style={{ color: '#d1d5db', fontSize: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>Pricing</Link>
          <Link href="/#faq" style={{ color: '#d1d5db', fontSize: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>FAQ</Link>
        </div>

        {/* Mobile Right Side (Search) */}
        <div className="flex md:hidden items-center flex-shrink-0">
          <button
            type="button"
            aria-label="Search"
            onClick={handleSearchClick}
            className="inline-flex items-center justify-center transition-transform active:scale-95"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: '#e8e8f0',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        {/* Right Side (desktop/tablet only) */}
        <div
          className="hidden md:flex items-center md:gap-2 lg:gap-3 flex-shrink-0"
          style={{
            alignItems: 'center',
            minWidth: 0,
          }}
        >
          {/* keep these compact on mobile */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '12px' }}>
          </div>

          {/* Cart */}
          <Link href="/cart" style={{ position: 'relative', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, flexShrink: 0 }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#f5c842',
                  color: '#0a0a0f',
                  fontSize: '10px',
                  fontWeight: 700,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {/* Auth */}
          <div className="hidden md:flex">
            {customer ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ fontSize: '0.8rem', color: '#f5c842', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 96 }}>
                  Hi, {customer.name?.split(' ')[0]}!
                </span>
                <Link href="/account" style={{
                  fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'none',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap'
                }}>
                  My Account
                </Link>
                <button onClick={logout} style={{ fontSize: '0.75rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link href="/login" style={{ fontSize: '0.875rem', color: '#9ca3af', textDecoration: 'none', whiteSpace: 'nowrap' }}>Login</Link>
                <span style={{ color: '#374151' }}>|</span>
                <Link href="/register" style={{ fontSize: '0.875rem', color: '#f5c842', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>Register</Link>
              </div>
            )}
          </div>

          <Link
            href="/#pricing"
            className="gold-btn"
            style={{
              padding: '8px 18px',
              borderRadius: '999px',
              fontSize: '0.875rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              display: 'none',
            }}
          >
            Buy Now
          </Link>
        </div>
      </div>
    </nav>
  );
}
