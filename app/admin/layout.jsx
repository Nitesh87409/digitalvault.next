'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function AdminRootLayout({ children }) {
  const pathname = usePathname();

  // Admin login page should NOT have the sidebar layout
  if (pathname === '/admin/login') {
    return children;
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0f] text-white">Loading...</div>}>
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  );
}
