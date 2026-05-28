'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settings, setSettings] = useState({ app_name: 'DigitalVault', app_logo: '' });
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const headers = { 'Content-Type': 'application/json' };

  useEffect(() => {
    // Load admin profile from localStorage
    const a = JSON.parse(localStorage.getItem('admin_data') || '{}');
    setAdmin(a);

    // Open sidebar by default on desktop
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSidebarOpen(true);
    }

    // Fetch settings dynamically
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings?t=' + Date.now(), { cache: 'no-store' });
        const data = await res.json();
        if (data.flag && data.settings) {
          setSettings({
            app_name: data.settings.app_name || 'DigitalVault',
            app_logo: data.settings.app_logo || ''
          });
        }
      } catch (e) {}
    }
    fetchSettings();
  }, []);

  useEffect(() => {
    // Extract query parameter tab on path or query change
    const t = searchParams.get('tab');
    if (t && ['dashboard', 'products', 'orders'].includes(t)) {
      setActiveTab(t);
    } else {
      setActiveTab('dashboard');
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // Only lock scroll on mobile screens (width < 768px) where sidebar is rendered as an overlay drawer
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (sidebarOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [sidebarOpen]);

  async function logout() {
    await fetch('/api/logout', { method: 'POST', headers, body: JSON.stringify({ role: 'admin' }) });
    localStorage.removeItem('admin_data');
    router.push('/admin/login');
  }

  const menuGroups = [
    {
      group: '',
      items: [
        { href: '/admin/dashboard', id: 'dashboard', icon: '📊', label: 'Dashboard' }
      ]
    },
    {
      group: 'STORE',
      items: [
        { href: '/admin/dashboard?tab=products', id: 'products', icon: '📦', label: 'Products' },
        { href: '/admin/categories', id: 'categories', icon: '📂', label: 'Categories' },
        { href: '/admin/bundle', id: 'bundle', icon: '🎁', label: 'Bundle' },
        { href: '/admin/coupons', id: 'coupons', icon: '🎟️', label: 'Coupons' }
      ]
    },
    {
      group: 'SALES',
      items: [
        { href: '/admin/dashboard?tab=orders', id: 'orders', icon: '🛒', label: 'Orders' },
        { href: '/admin/customers', id: 'customers', icon: '👥', label: 'Customers' }
      ]
    },
    {
      group: 'WEBSITE',
      items: [
        { href: '/admin/homepage-content', id: 'homepage-content', icon: '🏠', label: 'Homepage Content' },
        { href: '/admin/blogs', id: 'blogs', icon: '📝', label: 'Blogs' },
        { href: '/admin/reviews', id: 'reviews', icon: '⭐', label: 'Testimonials' }
      ]
    },
    {
      group: 'LEGAL',
      items: [
        { href: '/admin/terms-privacy', id: 'terms-privacy', icon: '📜', label: 'Terms & Privacy' },
        { href: '/admin/refund-policy', id: 'refund-policy', icon: '💸', label: 'Refund Policy' }
      ]
    },
    {
      group: 'SYSTEM',
      items: [
        { href: '/admin/support-bot', id: 'support-bot', icon: '🤖', label: 'AI Support Bot' },
        { href: '/admin/settings', id: 'settings', icon: '⚙️', label: 'Settings' },
        { href: '/admin/bin', id: 'bin', icon: '🗑️', label: 'Recycle Bin' }
      ]
    }
  ];

  return (
    <div className="flex min-h-screen font-sans bg-[#0a0a0f] text-[#e8e8f0] relative">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          onTouchMove={(e) => e.preventDefault()}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-[100dvh] w-[260px] shrink-0 bg-[#0e0e18] border-r border-[#f5c842]/10 p-6 flex flex-col z-50 transform transition-transform duration-300 overflow-y-auto overscroll-contain custom-scrollbar ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex justify-between items-center mb-8 px-2 shrink-0">
          <Link href="/admin/dashboard" className="font-syne text-xl font-bold text-[#f5c842] no-underline flex items-center gap-2">
            {settings.app_logo && (
              <img src={settings.app_logo} alt={settings.app_name} className="h-6 w-auto object-contain" />
            )}
            <span>{settings.app_name}</span>
          </Link>
          <button className="md:hidden text-gray-400 hover:text-white text-xl border-none bg-transparent cursor-pointer" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="flex-1 flex flex-col gap-4">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col gap-1">
              {group.group && (
                <div className="text-[11px] font-syne font-bold tracking-[0.25em] text-[#f5c842]/75 mb-2 mt-4 px-4 uppercase select-none">
                  {group.group}
                </div>
              )}
              {group.items.map(item => {
                let isItemActive = false;
                const currentTab = searchParams.get('tab');

                if (item.id === 'dashboard') {
                  isItemActive = pathname === '/admin/dashboard' && activeTab === 'dashboard';
                } else if (item.id === 'products') {
                  isItemActive = pathname === '/admin/dashboard' && activeTab === 'products';
                } else if (item.id === 'orders') {
                  isItemActive = pathname === '/admin/dashboard' && activeTab === 'orders';
                } else if (item.id === 'settings') {
                  isItemActive = pathname === '/admin/settings';
                } else {
                  isItemActive = pathname === item.href || (item.href !== '/admin/settings' && pathname.startsWith(item.href.split('?')[0]));
                }

                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-sans text-sm no-underline transition-all duration-200 ${isItemActive ? 'bg-[#f5c842]/10 text-[#f5c842] font-semibold' : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    <span className="text-lg">{item.icon}</span> {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/5 pt-3 mt-4 shrink-0 font-sans">
          <Link href="/" target="_blank" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm no-underline mb-1">
            <span className="text-lg">🌐</span> View Site
          </Link>
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer font-sans text-sm border-none bg-transparent text-red-500 hover:bg-red-500/10 transition-all w-full text-left">
            <span className="text-lg">🚪</span> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col w-full min-w-0 p-4 sm:p-6 lg:p-8 transition-all duration-300 ${sidebarOpen ? 'md:ml-[260px]' : 'ml-0'}`}>

        {/* Persistent Header: hamburger + welcome + theme toggle */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <button className="text-[#f5c842] text-2xl p-1 bg-white/5 rounded-lg border border-white/10 cursor-pointer flex items-center justify-center w-10 h-10 shrink-0 hover:bg-[#f5c842]/10 hover:border-[#f5c842]/30 transition-all" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <p className="text-gray-500 text-sm">Welcome back, {admin?.name || 'Admin'}!</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Page content rendered here — each page provides its own title/actions */}
        <div className="flex-1 w-full flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
