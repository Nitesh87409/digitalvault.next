'use client';
import { useState, useEffect, useCallback } from 'react';

export default function AnnouncementBanner() {
  const [coupons, setCoupons] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Don't show on admin pages
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      setIsAdmin(true);
      return;
    }

    // Check if dismissed this session
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('dv_banner_dismissed')) {
      setDismissed(true);
      return;
    }

    fetchBannerCoupons();
  }, []);

  // Auto-rotate coupons
  useEffect(() => {
    if (coupons.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % coupons.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [coupons.length]);

  async function fetchBannerCoupons() {
    try {
      const res = await fetch('/api/coupon?action=public-coupons');
      const data = await res.json();
      if (data.flag && data.coupons) {
        const bannerCoupons = data.coupons.filter(c => c.show_on_banner);
        setCoupons(bannerCoupons);
      }
    } catch (e) {
      // Silently fail
    }
  }

  const getBannerText = useCallback((coupon) => {
    if (coupon.banner_text) return coupon.banner_text;
    const discountText = coupon.discount_type === 'percentage'
      ? `${coupon.discount_value}% OFF`
      : `₹${coupon.discount_value} OFF`;
    return `Use code ${coupon.code} for ${discountText}!`;
  }, []);

  function copyCode(code) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function dismiss() {
    setDismissed(true);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('dv_banner_dismissed', '1');
    }
  }

  if (isAdmin || dismissed || coupons.length === 0) return null;

  const coupon = coupons[currentIndex];

  return (
    <>
      <style>{`
        @keyframes bannerShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes bannerSlideIn {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bannerFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .announcement-banner {
          background: linear-gradient(90deg, #7c3aed, #f5c842, #ec4899, #7c3aed);
          background-size: 300% 100%;
          animation: bannerShimmer 6s linear infinite, bannerSlideIn 0.4s ease-out;
        }
        .banner-code {
          cursor: pointer;
          transition: all 0.2s;
        }
        .banner-code:hover {
          transform: scale(1.05);
        }
        .banner-code:active {
          transform: scale(0.95);
        }
      `}</style>
      <div className="announcement-banner relative z-[200] flex items-center justify-center gap-2 px-4 py-2.5 text-white text-center select-none" role="banner">
        {/* Banner Text */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold flex-wrap justify-center">
          <span className="opacity-90">{getBannerText(coupon)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); copyCode(coupon.code); }}
            className="banner-code inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider"
            title="Click to copy code"
          >
            {coupon.code}
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="opacity-70">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>
          {copied && (
            <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full animate-pulse font-bold">
              Copied! ✓
            </span>
          )}
        </div>

        {/* Coupon count dots */}
        {coupons.length > 1 && (
          <div className="hidden sm:flex items-center gap-1 ml-2">
            {coupons.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-white/60 hover:text-white cursor-pointer text-base leading-none p-1 transition-colors"
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      </div>
    </>
  );
}
