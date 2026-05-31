'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function RefundPolicyPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.flag && data.settings) {
          setSettings(data.settings);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-gray-400 font-sans">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-3 border-[#f5c842] border-t-transparent"></div>
          <p className="text-xs">Loading page content...</p>
        </div>
      </div>
    );
  }

  const appName = settings?.app_name || 'DigitalVault';
  const refundContent = settings?.refund_policy_content || '<h1>Refund Policy</h1><p>Our refund policy is currently being updated. Please check back later or contact support.</p>';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] font-sans flex flex-col selection:bg-[#f5c842]/30 selection:text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-[100] border-b border-[#f5c842]/10 bg-[#0a0a0f]/80 backdrop-blur-xl px-6 py-4">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4">
          <Link href="/" className="whitespace-nowrap font-syne text-xl font-bold text-[#f5c842] no-underline">
            {appName}
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-[#f5c842] transition-colors no-underline">← Store</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[900px] mx-auto px-6 py-12 sm:py-16">
        <div className="bg-[#0e0e18] border border-[#f5c842]/10 rounded-[24px] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle gold glow behind content */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f5c842]/5 rounded-full blur-[120px] pointer-events-none" />
          
          {/* Dynamic policy rich HTML */}
          <article 
            className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-[0.95rem]
              prose-headings:font-syne prose-headings:font-bold prose-headings:text-white
              prose-h1:text-2xl prose-h1:sm:text-3xl prose-h1:mb-6 prose-h1:text-[#f5c842]
              prose-h2:text-lg prose-h2:sm:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-2
              prose-p:mb-4
              prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
              prose-li:mb-2
              prose-strong:text-[#f5c842] prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: refundContent }}
          />
        </div>
      </main>

      {/* Footer bar */}
      <footer className="border-t border-white/5 bg-[#0a0a0f] py-6 px-6 shrink-0">
        <div className="max-w-[900px] mx-auto flex flex-wrap justify-between gap-4 items-center">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} {appName}. All rights reserved.</p>
          <Link href="/" className="text-xs text-gray-500 hover:text-[#f5c842] transition-colors no-underline">Back to Store</Link>
        </div>
      </footer>
    </div>
  );
}
