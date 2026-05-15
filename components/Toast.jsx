'use client';
import { useEffect, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  function showToast(msg, bg = '#10b981', color = '#fff') {
    setToast({ msg, bg, color });
    setTimeout(() => setToast(null), 2500);
  }

  return { toast, showToast };
}

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      padding: '12px 20px', borderRadius: '12px', fontSize: '0.875rem',
      fontWeight: 600, background: toast.bg, color: toast.color,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      fontFamily: 'DM Sans, sans-serif',
      animation: 'slideIn 0.3s ease',
    }}>
      {toast.msg}
    </div>
  );
}
