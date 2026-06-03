'use client';
import { useEffect, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  function showToast(msg, bg = '#10b981', color = '#fff') {
    setToast({ msg, bg, color });
    // Increase duration slightly for cart toast to give time to click the CTA
    const duration = msg.toLowerCase().includes('cart') ? 4000 : 2500;
    setTimeout(() => setToast(null), duration);
  }

  return { toast, showToast };
}

export default function Toast({ toast }) {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (toast) {
      setIsRendered(true);
    } else {
      setIsRendered(false);
    }
  }, [toast]);

  if (!toast || !isRendered) return null;

  const isCartToast = toast.msg.toLowerCase().includes('cart');

  return (
    <>
      <style>{`
        @keyframes toastSlideDown {
          0% { transform: translateY(-30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes toastSlideUp {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .toast-mobile-anim {
          animation: toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (min-width: 768px) {
          .toast-desktop-anim {
            animation: toastSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
      `}</style>
      <div 
        className="fixed top-4 left-4 right-4 md:top-auto md:bottom-6 md:right-6 md:left-auto md:w-auto md:max-w-md z-[100000] px-5 py-3 rounded-xl text-sm font-semibold shadow-[0_12px_40px_rgba(0,0,0,0.35)] font-sans flex items-center justify-between gap-4 border border-white/10 select-none toast-mobile-anim md:toast-desktop-anim"
        style={{ background: toast.bg, color: toast.color }}
      >
        <span className="flex-1 truncate">{toast.msg}</span>
        {isCartToast && (
          <a 
            href="/cart"
            className="shrink-0 bg-black/20 hover:bg-black/35 active:scale-[0.93] text-current border border-current/25 hover:border-current/40 transition-all text-xs font-bold px-3 py-1.5 rounded-lg no-underline shadow-sm flex items-center gap-1 cursor-pointer"
          >
            Go to Cart →
          </a>
        )}
      </div>
    </>
  );
}
