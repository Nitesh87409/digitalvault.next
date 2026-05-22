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
    <div 
      className="fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-xl text-sm font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.3)] font-sans animate-[slideIn_0.3s_ease]"
      style={{ background: toast.bg, color: toast.color }}
    >
      {toast.msg}
    </div>
  );
}
