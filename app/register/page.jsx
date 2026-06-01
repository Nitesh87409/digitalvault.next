'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirect = searchParams.get('redirect');
    router.replace(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 text-[#f5c842]">
      Redirecting...
    </div>
  );
}
