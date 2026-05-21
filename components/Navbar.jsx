'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { useSettings } from '@/hooks/useSettings';

export default function Navbar({ onSearchClick }) {
  const [customer, setCustomer] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const { settings } = useSettings();

  useEffect(() => {
    const loadCustomer = () => {
      const c = localStorage.getItem('dv_customer');
      setCustomer(c ? JSON.parse(c) : null);
    };
    loadCustomer();

    const loadCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
      setCartCount(cart.reduce((s, i) => s + i.qty, 0));
    };

    loadCartCount();

    const handleStorage = (e) => {
      if (e.key === 'dv_cart' || !e.key) loadCartCount();
      if (e.key === 'dv_customer' || !e.key) loadCustomer();
    };

    window.addEventListener('cart-updated', loadCartCount);
    window.addEventListener('auth-updated', loadCustomer);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('cart-updated', loadCartCount);
      window.removeEventListener('auth-updated', loadCustomer);
      window.removeEventListener('storage', handleStorage);
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

  async function logout() {
    await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'customer' }) });
    localStorage.removeItem('dv_customer');
    window.location.href = '/login';
  }

  return (
    <nav className="fixed top-0 z-[100] w-full max-w-[100vw] overflow-x-clip border-b border-[#f5c842]/15 bg-[var(--nav-bg)] backdrop-blur-xl transition-colors duration-300">
      <div
        className="mx-auto flex w-full max-w-[1152px] items-center justify-between gap-3 px-4 py-3 md:px-[18px] md:py-4"
      >
        {/* Logo */}
        <Link
          href="/"
          className="shrink truncate whitespace-nowrap font-syne text-xl font-bold text-[#f5c842] no-underline flex items-center gap-2"
        >
          {settings.app_logo ? (
            <img src={settings.app_logo} alt={settings.app_name} className="h-8 w-auto object-contain" />
          ) : null}
          {settings.app_name}
        </Link>

        {/* Desktop Nav */}
        <div className="hidden shrink-0 items-center md:flex md:gap-4 lg:gap-8">
          <Link href="/categories" className="theme-link whitespace-nowrap text-sm no-underline">Categories</Link>
          <Link href="/#products" className="theme-link whitespace-nowrap text-sm no-underline">Products</Link>
          <Link href="/#features" className="theme-link whitespace-nowrap text-sm no-underline">Features</Link>
          <Link href="/#pricing" className="theme-link whitespace-nowrap text-sm no-underline">Pricing</Link>
          <Link href="/#faq" className="theme-link whitespace-nowrap text-sm no-underline">FAQ</Link>
        </div>

        {/* Mobile Right Side (Search) */}
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Search"
            onClick={handleSearchClick}
            className="theme-icon-btn h-11 w-11 rounded-xl"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        {/* Right Side (desktop/tablet only) */}
        <div
          className="hidden shrink-0 items-center md:flex md:gap-2 lg:gap-3"
        >
          {/* keep these compact on mobile */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '12px' }}>
          </div>

          {/* Cart */}
          <ThemeToggle />

          <Link href="/cart" className="theme-icon-btn relative h-11 w-11 rounded-xl">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f5c842] text-[10px] font-bold text-[#0a0a0f]">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {/* Auth */}
          <div className="hidden md:flex">
            {customer ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="max-w-24 truncate whitespace-nowrap text-[0.8rem] font-semibold text-[#f5c842]">
                  Hi, {customer.name?.split(' ')[0]}!
                </span>
                <Link href="/account" className="theme-card-soft whitespace-nowrap rounded-lg px-2.5 py-1 text-xs no-underline">
                  My Account
                </Link>
                <button onClick={logout} className="theme-muted-2 cursor-pointer whitespace-nowrap border-none bg-transparent text-xs">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="theme-link whitespace-nowrap text-sm no-underline">Login</Link>
                <span className="text-[var(--line)]">|</span>
                <Link href="/register" className="whitespace-nowrap text-sm font-semibold text-[#f5c842] no-underline">Register</Link>
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
