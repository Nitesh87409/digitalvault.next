'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { useSettings } from '@/hooks/useSettings';

export default function Navbar({ onSearchClick }) {
  const [customer, setCustomer] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setSearchValue(q);

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

  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    window.dispatchEvent(new CustomEvent('search-updated', { detail: val }));

    if (window.location.pathname === '/') {
      const url = new URL(window.location);
      if (val) {
        url.searchParams.set('q', val);
      } else {
        url.searchParams.delete('q');
      }
      window.history.replaceState({}, '', url);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (window.location.pathname !== '/') {
        window.location.href = `/?q=${encodeURIComponent(searchValue)}`;
      } else {
        const productsSection = document.getElementById('products');
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
      return;
    }
    setIsMobileSearchOpen(true);
  };

  async function logout() {
    await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'customer' }) });
    localStorage.removeItem('dv_customer');
    window.location.href = '/login';
  }

  return (
    <nav className="fixed top-0 z-[100] w-full max-w-[100vw] overflow-x-clip border-b border-[#f5c842]/15 bg-[var(--nav-bg)] backdrop-blur-xl transition-colors duration-300">
      <div className="relative mx-auto flex h-[64px] md:h-[76px] w-full max-w-[1152px] items-center justify-between gap-3 px-4 py-3 md:px-[18px]">
        {isMobileSearchOpen ? (
          /* Mobile Search Overlay */
          <div className="absolute inset-0 z-50 flex items-center bg-[var(--bg)] px-4 py-2 gap-3 transition-all duration-200">
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchValue('');
                window.dispatchEvent(new CustomEvent('search-updated', { detail: '' }));
                if (window.location.pathname === '/') {
                  const url = new URL(window.location);
                  url.searchParams.delete('q');
                  window.history.replaceState({}, '', url);
                }
              }}
              className="theme-icon-btn h-10 w-10 rounded-xl"
              aria-label="Back"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                placeholder="Search digital products..."
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-[var(--surface-muted)] text-[var(--heading)] border border-[var(--line)] rounded-full py-2.5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-[var(--muted-2)] focus:border-[#f5c842]/50 focus:bg-[var(--surface)]"
              />
              <svg
                width="16" height="16" fill="none" stroke="#f5c842" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
        ) : (
          <>
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

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex shrink-0 items-center lg:gap-4 xl:gap-6">
              <Link href="/categories" className="theme-link whitespace-nowrap text-sm no-underline">Categories</Link>
              <Link href="/#products" className="theme-link whitespace-nowrap text-sm no-underline">Products</Link>
              <Link href="/#features" className="theme-link whitespace-nowrap text-sm no-underline">Features</Link>
              {settings.bundle_enabled !== false && (
                <Link href="/#pricing" className="theme-link whitespace-nowrap text-sm no-underline">Pricing</Link>
              )}
              <Link href="/#faq" className="theme-link whitespace-nowrap text-sm no-underline">FAQ</Link>
            </div>

            {/* Desktop / Tablet Search Input */}
            <div className="hidden md:relative md:flex items-center max-w-[200px] lg:max-w-[240px] w-full mx-2">
              <input
                type="text"
                placeholder="Search products..."
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-[var(--surface-muted)] text-[var(--heading)] border border-[var(--line)] rounded-full py-2 pl-9 pr-4 text-xs outline-none transition-all placeholder:text-[var(--muted-2)] focus:border-[#f5c842]/50 focus:bg-[var(--surface)]"
              />
              <svg
                width="14" height="14" fill="none" stroke="var(--muted-2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>

            {/* Right Side Actions */}
            <div className="flex shrink-0 items-center gap-2 md:gap-3">
              <ThemeToggle />

              {/* Search Toggle (mobile only) */}
              <button
                type="button"
                aria-label="Search"
                onClick={handleSearchClick}
                className="theme-icon-btn h-11 w-11 rounded-xl md:hidden"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>

              {/* Cart Button (hidden on mobile, visible on desktop/tablet) */}
              <Link href="/cart" className="hidden md:flex theme-icon-btn relative h-11 w-11 rounded-xl items-center justify-center" aria-label="Shopping Cart">
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

              {/* Auth (tablet/desktop only) */}
              <div className="hidden md:flex items-center gap-2 lg:gap-3">
                {customer ? (
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="max-w-[100px] truncate whitespace-nowrap text-[0.8rem] font-semibold text-[#f5c842]">
                      Hi, {customer.name?.split(' ')[0]}!
                    </span>
                    {customer.is_premium && (
                      <span className="bg-gradient-to-r from-[#f5c842] to-[#e0a800] text-[#0a0a0f] text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider shadow-[0_0_10px_rgba(245,200,66,0.3)] animate-pulse shrink-0">
                        ★ Premium
                      </span>
                    )}
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

              {/* Hamburger Button (tablet/mobile only) */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="theme-icon-btn h-11 w-11 rounded-xl hidden md:flex lg:hidden items-center justify-center text-[var(--heading)] focus:outline-none"
                aria-label="Toggle Menu"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile/Tablet Menu Drawer overlay and panel */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-[998] backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
            onTouchMove={(e) => e.preventDefault()}
          />

          {/* Side Drawer Panel */}
          <div 
            className="fixed top-0 right-0 h-[100dvh] w-[280px] bg-[#0e0e18]/95 backdrop-blur-2xl border-l border-[#f5c842]/15 z-[999] p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 ease-out animate-[slideIn_0.3s_ease-out] text-[#e8e8f0] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
          >
            <style jsx>{`
              @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
            `}</style>
            
            <div className="flex flex-col gap-6">
              {/* Header inside drawer */}
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div className="font-syne text-lg font-bold text-[#f5c842]">{settings.app_name}</div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-transparent border-none text-gray-400 hover:text-white cursor-pointer p-1"
                >
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Navigation Links list */}
              <nav className="flex flex-col gap-3">
                {[
                  { label: 'Categories', href: '/categories', icon: '📂' },
                  { label: 'Products', href: '/#products', icon: '📦' },
                  { label: 'Features', href: '/#features', icon: '✨' },
                  { label: 'Pricing', href: '/#pricing', icon: '🎟️' },
                  { label: 'FAQ', href: '/#faq', icon: '❓' },
                ].filter(item => item.label !== 'Pricing' || settings.bundle_enabled !== false).map(item => (
                  <Link 
                    key={item.label} 
                    href={item.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-gray-300 hover:text-[#f5c842] hover:bg-[#f5c842]/5 transition-all text-[0.95rem] no-underline"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="text-xs opacity-50">→</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Bottom Actions section */}
            <div className="flex flex-col gap-5 border-t border-white/5 pt-6">
              {customer ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 p-3 rounded-xl relative overflow-hidden">
                    {customer.is_premium && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-[#f5c842]/10 to-transparent w-full h-full pointer-events-none" />
                    )}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-black flex items-center justify-center font-bold text-sm font-syne shadow-[0_0_15px_rgba(245,200,66,0.15)]">
                      {customer.name ? customer.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white truncate">Hi, {customer.name}!</p>
                        {customer.is_premium && (
                          <span className="bg-[#f5c842]/10 border border-[#f5c842]/30 text-[#f5c842] text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-widest shrink-0">
                            PRO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{customer.email}</p>
                    </div>
                  </div>
                  <Link 
                    href="/account" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 bg-[#f5c842]/10 border border-[#f5c842]/20 text-[#f5c842] py-2.5 rounded-xl text-sm font-bold no-underline hover:bg-[#f5c842]/20 transition-all"
                  >
                    👤 My Account
                  </Link>
                  <button 
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="cursor-pointer bg-red-500/10 border border-red-500/20 text-red-500 py-2.5 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    🚪 Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <Link 
                    href="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center bg-white/5 border border-white/10 text-white py-3 rounded-xl text-sm font-bold no-underline hover:bg-white/10 transition-all"
                  >
                    🔑 Login
                  </Link>
                  <Link 
                    href="/register" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] py-3 rounded-xl text-sm font-extrabold no-underline shadow-lg shadow-[#f5c842]/10 hover:scale-[1.01] transition-all"
                  >
                    📝 Register
                  </Link>
                </div>
              )}
              
              {/* Optional Admin Link if role is admin */}
              {customer && customer.role === 'admin' && (
                <Link 
                  href="/admin/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 bg-[#8b5cf6]/15 border border-[#8b5cf6]/20 text-[#c4b5fd] py-2.5 rounded-xl text-xs font-semibold no-underline hover:bg-[#8b5cf6]/25 transition-all"
                >
                  🛠️ Admin Panel
                </Link>
              )}

              <p className="text-[10px] text-gray-600 text-center uppercase tracking-widest mt-2">
                DigitalVault Security Verified 🔒
              </p>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
