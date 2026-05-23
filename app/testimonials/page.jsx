'use client';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

export default function TestimonialsPage() {
  const [settings, setSettings] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Settings
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.flag && data.settings) setSettings(data.settings);
      })
      .catch(console.error);

    // Fetch Homepage Reviews (approved testimonials)
    fetch('/api/homepage-reviews')
      .then((res) => res.json())
      .then((data) => {
        if (data.flag && data.reviews) {
          setReviews(data.reviews);
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
          <p className="text-xs">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  const appName = settings?.app_name || 'DigitalVault';
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1) 
    : '5.0';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] font-sans flex flex-col selection:bg-[#f5c842]/30 selection:text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-[100] border-b border-[#f5c842]/10 bg-[#0a0a0f]/80 backdrop-blur-xl px-6 py-4">
        <div className="mx-auto flex max-w-[1152px] items-center justify-between gap-4">
          <a href="/" className="whitespace-nowrap font-syne text-xl font-bold text-[#f5c842] no-underline">
            {appName}
          </a>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-400 hover:text-[#f5c842] transition-colors no-underline">← Store</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 pt-12 pb-6 text-center relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-[#f5c842]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-[800px] mx-auto">
          <h1 className="font-syne text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Real Customer <span className="text-[#f5c842]">Testimonials</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-[600px] mx-auto mb-8">
            See what digital product buyers, developers, and entrepreneurs say about their experience using {appName}.
          </p>

          {/* Stats Bar */}
          <div className="inline-flex flex-wrap justify-center items-center gap-6 sm:gap-10 bg-[#0e0e18]/80 border border-[#f5c842]/10 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-xl">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[#f5c842] font-syne">⭐ {averageRating} / 5</div>
              <div className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Average Score</div>
            </div>
            <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white font-syne">{reviews.length}+</div>
              <div className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Approved Reviews</div>
            </div>
            <div className="w-[1px] h-8 bg-white/10 hidden sm:block" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-syne">100%</div>
              <div className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Verified Safe</div>
            </div>
          </div>
        </div>
      </header>

      {/* Grid List Area */}
      <main className="flex-1 w-full max-w-[1152px] mx-auto px-6 py-12">
        {reviews.length === 0 ? (
          <div className="bg-[#0e0e18] border border-white/5 rounded-[24px] py-16 text-center text-gray-400 max-w-[600px] mx-auto shadow-2xl">
            <div className="text-5xl mb-4 opacity-45">💬</div>
            <h3 className="font-syne font-bold text-white text-lg mb-2">No Reviews Posted</h3>
            <p className="text-sm px-6">We are currently collecting real user testimonials. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, i) => {
              const stars = '★'.repeat(review.rating || 5) + '☆'.repeat(5 - (review.rating || 5));
              
              return (
                <div 
                  key={review._id || i} 
                  className="bg-[#0e0e18] border border-white/5 hover:border-[#f5c842]/20 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Glowing background card element */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#f5c842]/5 to-transparent rounded-bl-full pointer-events-none" />

                  <div>
                    {/* Stars & verified */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[#f5c842] text-md tracking-wider">{stars}</span>
                      <span className="text-[#10b981] text-[9px] font-bold bg-[#10b981]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">✓ Verified Buyer</span>
                    </div>

                    {/* Review text */}
                    <blockquote className="text-gray-300 text-sm leading-relaxed mb-6 font-medium italic">
                      "{review.review}"
                    </blockquote>
                  </div>

                  {/* Profile block */}
                  <div className="flex items-center gap-3 border-t border-white/5 pt-4 mt-auto">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner shrink-0 text-white font-syne"
                      style={{ background: review.color || 'linear-gradient(135deg,#f5c842,#e0a800)', color: review.textColor || '#0a0a0f' }}
                    >
                      {review.initials || review.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-[13px] truncate">{review.name}</div>
                      <div className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mt-0.5 truncate">{review.role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer bar */}
      <footer className="border-t border-white/5 bg-[#0a0a0f] py-8 px-6 shrink-0">
        <div className="max-w-[1152px] mx-auto flex flex-wrap justify-between gap-6 items-center">
          <div>
            <div className="font-syne font-bold text-[#f5c842] text-md">{appName}</div>
            <p className="text-[11px] text-gray-600 mt-1">Instant digital items & secure transaction processing.</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <a href="/" className="hover:text-[#f5c842] transition-colors no-underline">Store</a>
            <span>·</span>
            <a href="/refund-policy" className="hover:text-[#f5c842] transition-colors no-underline">Refunds</a>
            <span>·</span>
            <a href="/terms-privacy" className="hover:text-[#f5c842] transition-colors no-underline">Terms & Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
