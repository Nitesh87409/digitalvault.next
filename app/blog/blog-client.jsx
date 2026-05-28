'use client';

import { useState } from 'react';
import Link from 'next/link';
import SmartImage from '@/components/SmartImage';
import ThemeToggle from '@/components/ThemeToggle';
import { Search, Calendar, Clock, ArrowRight } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

export default function BlogClient({ initialBlogs }) {
  const [blogs] = useState(initialBlogs || []);
  const [searchQuery, setSearchQuery] = useState('');
  const { settings } = useSettings();

  const filteredBlogs = blogs.filter(b =>
    b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="theme-page font-dm min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      <nav className="sticky top-0 z-[100] border-b border-[#f5c842]/10 bg-[var(--nav-bg)] px-6 py-4 backdrop-blur-xl shrink-0">
        <div className="mx-auto flex max-w-[1152px] items-center justify-between gap-4">
          <Link
            href="/"
            className="shrink truncate whitespace-nowrap font-syne text-xl font-bold text-[#f5c842] no-underline flex items-center gap-2"
            style={settings.app_name_size ? { fontSize: `${settings.app_name_size}px` } : {}}
          >
            {settings.app_logo ? (
              <img
                src={settings.app_logo}
                alt={settings.app_name}
                className="h-8 w-8 object-contain shrink-0"
                loading="eager"
                fetchPriority="high"
              />
            ) : null}
            {settings.app_name}
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="theme-link whitespace-nowrap text-sm no-underline">Store</Link>
            <Link href="/#products" className="theme-link hidden whitespace-nowrap text-sm no-underline sm:inline">Products</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full pb-20">
        <section className="bg-gradient-to-b from-[#f5c842]/[0.03] to-transparent py-16 sm:py-20 px-6 border-b border-[#f5c842]/5">
          <div className="max-w-[800px] mx-auto text-center">
            <div className="inline-block bg-[#f5c842]/10 border border-[#f5c842]/20 text-[#f5c842] text-[10px] sm:text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-5 font-syne">
              Learning & Resources Hub
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-white font-syne leading-tight mb-4 tracking-tight">
              Grow Your Business With Our Articles
            </h1>
            <p className="text-gray-400 text-base sm:text-lg mb-8 font-sans max-w-[600px] mx-auto">
              Get the latest strategy playbooks, creative tutorials, and business tips from digital creator experts.
            </p>

            <div className="max-w-[500px] mx-auto relative group">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#f5c842]" />
              <input
                type="text"
                placeholder="Search articles (e.g. Canva)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="theme-input rounded-full py-4 pr-6 pl-12 text-sm sm:text-base font-sans"
              />
            </div>
          </div>
        </section>

        <section className="max-w-[1152px] mx-auto px-6 py-12">
          {blogs.length === 0 ? (
            <div className="text-center text-gray-500 py-16 text-sm">
              <span className="text-5xl block mb-4">📝</span>
              <p className="font-syne font-bold text-white text-lg">No articles posted yet</p>
              <p className="text-sm mt-1">Check back soon for premium digital business insights!</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center text-gray-500 py-16 text-sm">
              <span className="text-5xl block mb-4">🔍</span>
              <p className="font-syne font-bold text-white text-lg">No matching articles found</p>
              <p className="text-sm mt-1 mb-6">Try searching for other keywords.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="bg-transparent border border-[#f5c842] text-[#f5c842] px-6 py-2.5 rounded-full font-bold font-sans cursor-pointer hover:bg-[#f5c842]/10 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredBlogs.map(blog => {
                const pubDate = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric'
                }) : 'Recently';

                return (
                  <article
                    key={blog._id}
                    className="theme-card rounded-2xl overflow-hidden flex flex-col h-full border border-white/5 bg-[#0e0e18]/40 hover:-translate-y-1 hover:border-[#f5c842]/30 hover:shadow-[0_8px_30px_rgba(245,200,66,0.1)] transition-all duration-300 group"
                  >
                    <div className="w-full aspect-[16/10] bg-[#12121e] border-b border-white/5 relative overflow-hidden flex items-center justify-center text-5xl">
                      <SmartImage
                        src={blog.image}
                        alt={blog.title}
                        width={640}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        fallback={<span>📝</span>}
                      />
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-4 text-[11px] text-[var(--muted-2)] font-semibold mb-3 font-sans">
                        <span className="flex items-center gap-1"><Calendar size={12} className="text-[#f5c842]" /> {pubDate}</span>
                        <span className="flex items-center gap-1"><Clock size={12} className="text-[#f5c842]" /> {blog.read_time} min read</span>
                      </div>

                      <h2 className="text-lg font-bold text-[var(--heading)] font-syne mb-2.5 line-clamp-2 leading-snug group-hover:text-[#f5c842] transition-colors">
                        <Link href={`/blog/${blog.slug}`} className="text-inherit no-underline">
                          {blog.title}
                        </Link>
                      </h2>

                      <p className="text-[var(--muted)] text-xs sm:text-sm line-clamp-3 leading-relaxed mb-6 font-sans">
                        {blog.excerpt}
                      </p>

                      <div className="mt-auto pt-3 border-t border-white/5">
                        <Link
                          href={`/blog/${blog.slug}`}
                          className="text-[#f5c842] hover:text-[#e0a800] text-xs font-bold no-underline font-syne inline-flex items-center gap-1.5 transition-colors group-hover:translate-x-1 transition-transform duration-200"
                        >
                          Read Full Article <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-[#f5c842]/15 bg-[var(--bg)] px-6 py-8 shrink-0">
        <div className="mx-auto max-w-[1152px] text-center text-xs text-[var(--muted-2)]">
          <p>© {new Date().getFullYear()} {settings.app_name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
