'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, User, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
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

  useEffect(() => {
    if (pathname === '/') {
      setActiveTab('home');
    } else if (pathname?.startsWith('/categories')) {
      setActiveTab('categories');
    } else if (pathname?.startsWith('/product')) {
      setActiveTab('home');
    } else if (pathname === '/account') {
      setActiveTab('account');
    } else if (pathname === '/cart') {
      setActiveTab('cart');
    } else {
      setActiveTab('');
    }
  }, [pathname]);

  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the fixed nav */}
      <div className="md:hidden w-full shrink-0" style={{ height: 'calc(65px + env(safe-area-inset-bottom))' }} aria-hidden="true" />
      
      {/* Fixed Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-[9999] bg-[#0a0a0f]/95 backdrop-blur-md border-t border-[#f5c842]/15 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-between items-center h-[65px] px-2 select-none">
          <Link href="/" className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-95 ${activeTab === 'home' ? 'text-[#f5c842]' : 'text-gray-400 hover:text-gray-200'}`}>
            <Home size={22} className="mb-1" />
            <span className="text-[10px] font-medium leading-none">Home</span>
          </Link>
          
          <Link href="/categories" className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-95 ${activeTab === 'categories' ? 'text-[#f5c842]' : 'text-gray-400 hover:text-gray-200'}`}>
            <LayoutGrid size={22} className="mb-1" />
            <span className="text-[10px] font-medium leading-none">Categories</span>
          </Link>
          
          <Link href="/account" className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-95 ${activeTab === 'account' ? 'text-[#f5c842]' : 'text-gray-400 hover:text-gray-200'}`}>
            <User size={22} className="mb-1" />
            <span className="text-[10px] font-medium leading-none">Account</span>
          </Link>
          
          <Link href="/cart" className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-95 relative ${activeTab === 'cart' ? 'text-[#f5c842]' : 'text-gray-400 hover:text-gray-200'}`}>
            <div className="relative mb-1">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#f5c842] text-[#0a0a0f] text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">Cart</span>
          </Link>
        </div>
      </div>
    </>
  );
}
