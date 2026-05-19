'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  Cpu, BookOpen, LayoutTemplate, Book, SlidersHorizontal, 
  Terminal, Image as ImageIcon, Box, Search, ArrowRight, X, Clock, TrendingUp 
} from 'lucide-react';

const ICONS = {
  'AI Tools': <Cpu size={24} color="#f5c842" />,
  'Courses': <BookOpen size={24} color="#f5c842" />,
  'Templates': <LayoutTemplate size={24} color="#f5c842" />,
  'E-books': <Book size={24} color="#f5c842" />,
  'Presets': <SlidersHorizontal size={24} color="#f5c842" />,
  'Software': <Terminal size={24} color="#f5c842" />,
  'Graphics': <ImageIcon size={24} color="#f5c842" />,
  'Uncategorized': <Box size={24} color="#f5c842" />
};

const LARGE_ICONS = {
  'AI Tools': <Cpu size={32} color="#f5c842" />,
  'Courses': <BookOpen size={32} color="#f5c842" />,
  'Templates': <LayoutTemplate size={32} color="#f5c842" />,
  'E-books': <Book size={32} color="#f5c842" />,
  'Presets': <SlidersHorizontal size={32} color="#f5c842" />,
  'Software': <Terminal size={32} color="#f5c842" />,
  'Graphics': <ImageIcon size={32} color="#f5c842" />,
  'Uncategorized': <Box size={32} color="#f5c842" />
};

const CATEGORY_META = {
  'AI Tools': { desc: 'Discover powerful AI tools to improve productivity', popular: true },
  'Courses': { desc: 'Learn new skills with premium expert courses', popular: true },
  'Templates': { desc: 'Professional templates for creators and businesses', popular: true },
  'E-books': { desc: 'In-depth digital knowledge and guides', popular: true },
  'Presets': { desc: 'One-click presets for photos and videos', popular: false },
  'Software': { desc: 'Ready-to-use software and scripts', popular: false },
  'Graphics': { desc: 'High-quality design assets and graphics', popular: false },
  'Uncategorized': { desc: 'Explore more premium digital products', popular: false },
};

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('All');
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const trendingSearches = ['AI Tools', 'Notion Templates', 'SEO Guide', 'ChatGPT Prompts'];

  useEffect(() => {
    loadCategories();
    const savedSearches = JSON.parse(localStorage.getItem('dv_recent_searches') || '[]');
    if (savedSearches.length > 0) {
      setRecentSearches(savedSearches);
    } else {
      setRecentSearches(['Courses', 'E-books']);
    }
  }, []);

  async function loadCategories() {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/product'),
        fetch('/api/categories')
      ]);
      const [prodData, catData] = await Promise.all([
        prodRes.json(),
        catRes.json()
      ]);
      
      if (prodData.flag) {
        setAllProducts(prodData.products || []);
        const categoryMap = {};
        (prodData.products || []).forEach(p => {
          const cat = p.category || 'Uncategorized';
          if (!categoryMap[cat]) categoryMap[cat] = 0;
          categoryMap[cat]++;
        });

        // Initialize with dynamic categories from DB
        let dbCategories = [];
        if (catData.flag && catData.categories) {
          dbCategories = catData.categories.map(c => c.name);
        }

        // Merge DB categories with those found in products
        const allCategoryNames = new Set([...dbCategories, ...Object.keys(categoryMap)]);

        const catArray = Array.from(allCategoryNames).map(cat => ({
          name: cat,
          count: categoryMap[cat] || 0,
          icon: ICONS[cat] || ICONS['Uncategorized'] || <Box size={24} color="#f5c842" />,
          largeIcon: LARGE_ICONS[cat] || LARGE_ICONS['Uncategorized'] || <Box size={32} color="#f5c842" />,
          desc: CATEGORY_META[cat]?.desc || 'Premium digital products for your business',
          popular: CATEGORY_META[cat]?.popular || false
        }));
        
        catArray.sort((a, b) => {
          if (a.name === 'Uncategorized') return 1;
          if (b.name === 'Uncategorized') return -1;
          return b.count - a.count; // Sort by product count
        });

        setCategories(catArray);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = (query) => {
    if (!query.trim()) return;
    const updatedRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('dv_recent_searches', JSON.stringify(updatedRecent));
    
    // Check if it matches a category exactly
    const matchedCategory = categories.find(c => c.name.toLowerCase() === query.toLowerCase());
    if (matchedCategory) {
      router.push(`/categories/${encodeURIComponent(matchedCategory.name)}`);
    } else {
      // For general search, redirect to home with products anchor or custom search page (since we only have home)
      router.push(`/#products`);
    }
    setIsSearchOpen(false);
  };

  const handleSearchProduct = (product) => {
    router.push(`/product/${product.id || product._id}`);
    setIsSearchOpen(false);
  };

  const handleSearchCategory = (categoryName) => {
    router.push(`/categories/${encodeURIComponent(categoryName)}`);
    setIsSearchOpen(false);
  };

  // derived data
  const popularCategories = categories.filter(c => c.popular).slice(0, 4);
  const remainingCategories = categories.filter(c => !popularCategories.includes(c));
  
  // if no popular explicitly set, just take top 4
  const displayPopular = popularCategories.length > 0 ? popularCategories : categories.slice(0, 4);
  const displayAll = categories;

  // Search Results
  const searchLower = searchQuery.toLowerCase();
  const matchedCategories = categories.filter(c => c.name.toLowerCase().includes(searchLower));
  const matchedProducts = allProducts.filter(p => 
    p.name?.toLowerCase().includes(searchLower) || p.description?.toLowerCase().includes(searchLower)
  ).slice(0, 5);

  return (
    <>
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />
      
      <main className="theme-page pt-20 pb-[100px]">
        
        {/* TOP SECTION */}
        <div className="pt-8 md:pt-12 pb-6 md:pb-8 px-6 md:px-8 max-w-[1152px] mx-auto">
          <h1 className="text-3xl md:text-[2.5rem] font-extrabold text-[var(--heading)] mb-2 md:mb-4 font-['Syne',sans-serif]">
            Categories
          </h1>
          <p className="text-[var(--muted)] text-[0.95rem] md:text-base">
            Browse our premium digital products by category
          </p>
        </div>

        {/* HORIZONTAL CATEGORY SECTION */}
        <div className="pb-8 md:pb-12 w-full">
          <div className="max-w-[1152px] mx-auto md:px-8">
            <div className="flex flex-nowrap md:flex-wrap gap-4 md:gap-5 px-6 md:px-0 overflow-x-auto hide-scrollbar scroll-smooth md:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
              <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              `}</style>
              
              <button
                onClick={() => setActiveTab('All')}
                className={`flex flex-col items-center justify-center gap-2.5 py-4 px-3 md:py-5 md:px-6 md:flex-1 min-w-[88px] shrink-0 rounded-[20px] md:rounded-2xl whitespace-nowrap transition-all duration-300 cursor-pointer border ${activeTab === 'All' ? 'border-[#f5c842]/40 bg-[#f5c842]/10 shadow-[0_0_20px_rgba(245,200,66,0.15)] md:shadow-[0_0_30px_rgba(245,200,66,0.15)] hover:-translate-y-1' : 'border-[var(--line)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] hover:-translate-y-1'}`}
              >
                <LayoutGridIcon active={activeTab === 'All'} />
                <span className={`text-[0.8rem] md:text-[0.9rem] font-semibold ${activeTab === 'All' ? 'text-[#f5c842]' : 'text-[var(--muted)]'}`}>All</span>
              </button>

              {categories.map(cat => {
                const isActive = activeTab === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => router.push(`/categories/${encodeURIComponent(cat.name)}`)}
                    className={`flex flex-col items-center justify-center gap-2.5 py-4 px-3 md:py-5 md:px-6 md:flex-1 min-w-[88px] shrink-0 rounded-[20px] md:rounded-2xl whitespace-nowrap transition-all duration-300 cursor-pointer border group ${isActive ? 'border-[#f5c842]/40 bg-[#f5c842]/10 shadow-[0_0_20px_rgba(245,200,66,0.15)] md:shadow-[0_0_30px_rgba(245,200,66,0.15)] hover:-translate-y-1' : 'border-[var(--line)] bg-[var(--surface-muted)] hover:bg-[var(--surface)] hover:-translate-y-1'}`}
                  >
                    <div className={`flex items-center justify-center scale-100 md:scale-110 transition-transform ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>{cat.icon}</div>
                    <span className={`text-[0.8rem] md:text-[0.9rem] font-semibold ${isActive ? 'text-[#f5c842]' : 'text-[var(--muted)]'}`}>{cat.name}</span>
                  </button>
                )
              })}
              
              {/* Spacer for proper right-edge padding on mobile browsers */}
              <div className="w-2 shrink-0 md:hidden" aria-hidden="true" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-[var(--muted-2)]">Loading premium categories...</div>
        ) : (
          <div className="max-w-[1152px] mx-auto px-6 md:px-8">
            
            {/* POPULAR CATEGORIES SECTION */}
            <div className="mb-12 md:mb-16">
              <h2 className="text-xl md:text-2xl font-bold text-[var(--heading)] mb-5 md:mb-8 font-['Syne',sans-serif]">
                Popular Categories
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                {displayPopular.map(cat => (
                  <Link 
                    key={cat.name} 
                    href={`/categories/${encodeURIComponent(cat.name)}`}
                    className="no-underline group"
                  >
                    <div className="theme-card p-5 md:p-6 lg:p-8 h-full flex flex-col relative rounded-3xl md:rounded-[2rem] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#f5c842]/30 hover:shadow-[0_15px_40px_rgba(245,200,66,0.15)]">
                      <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-2xl md:rounded-[1.25rem] bg-[#f5c842]/10 flex items-center justify-center mb-5 md:mb-6 lg:mb-8 border border-[#f5c842]/15 shadow-[inset_0_0_20px_rgba(245,200,66,0.05)]">
                        <div className="scale-100 md:scale-110 lg:scale-125 transition-transform duration-300 group-hover:scale-110 lg:group-hover:scale-[1.35]">{cat.largeIcon}</div>
                      </div>
                      
                      <h3 className="text-lg md:text-xl font-bold text-[var(--heading)] mb-1.5 md:mb-3">{cat.name}</h3>
                      <p className="text-[var(--muted)] text-xs md:text-sm leading-relaxed flex-1 mb-6 md:mb-8">
                        {cat.desc}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <span className="bg-[var(--surface-muted)] text-[var(--text)] text-[11px] md:text-xs py-1.5 px-3 rounded-full font-semibold border border-[var(--line)]">
                          {cat.count} {cat.count === 1 ? 'Product' : 'Products'}
                        </span>
                        
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#f5c842]/10 flex items-center justify-center text-[#f5c842] transition-transform duration-300 group-hover:translate-x-1">
                          <ArrowRight size={14} className="md:w-5 md:h-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* ALL CATEGORIES SECTION */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[var(--heading)] mb-5 md:mb-8 font-['Syne',sans-serif]">
                All Categories
              </h2>
              <div className="flex flex-col gap-3 md:gap-4 lg:grid lg:grid-cols-2 lg:gap-6">
                {displayAll.map(cat => (
                  <Link 
                    key={`all-${cat.name}`} 
                    href={`/categories/${encodeURIComponent(cat.name)}`}
                    className="no-underline group"
                  >
                    <div className="p-4 px-5 md:p-5 md:px-6 flex items-center gap-4 md:gap-6 bg-[var(--surface-muted)] border border-[var(--line)] rounded-2xl md:rounded-3xl transition-all duration-300 group-hover:bg-[var(--surface)] group-hover:border-[#f5c842]/30 group-hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-[#f5c842]/5 flex items-center justify-center shrink-0">
                        <div className="scale-[0.85] md:scale-100">{cat.largeIcon}</div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-semibold text-[var(--heading)] mb-1 md:mb-1.5">{cat.name}</h3>
                        <p className="text-[var(--muted)] text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                          {cat.desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[var(--muted-2)] text-xs md:text-sm font-semibold">
                          {cat.count} {cat.count === 1 ? 'Product' : 'Products'}
                        </span>
                        <ArrowRight size={18} className="text-gray-500 group-hover:text-gray-300 transition-colors md:w-6 md:h-6 group-hover:translate-x-1 duration-300" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* SEARCH OVERLAY */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[99999] bg-[#0a0a0f]/98 backdrop-blur-md flex flex-col animate-[fadeIn_0.2s_ease-out]">
          <style jsx>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
          
          <div className="p-4 px-6 border-b border-white/5 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                autoFocus
                placeholder="Search products, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchQuery)}
                className="w-full py-3 pr-4 pl-11 bg-white/5 border border-[#f5c842]/20 rounded-2xl text-white outline-none text-[0.95rem] focus:bg-white/10 transition-colors"
              />
            </div>
            <button onClick={() => setIsSearchOpen(false)} className="bg-transparent border-none text-gray-400 cursor-pointer p-2 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!searchQuery.trim() ? (
              <>
                {recentSearches.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-white text-sm font-semibold mb-4 flex items-center gap-2">
                      <Clock size={16} className="text-gray-500" /> Recent Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((s, i) => (
                        <button key={i} onClick={() => handleSearchSubmit(s)} className="bg-white/5 border border-white/10 text-gray-300 py-2 px-4 rounded-full text-xs cursor-pointer hover:bg-white/10 transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-white text-sm font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#f5c842]" /> Trending Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((s, i) => (
                      <button key={i} onClick={() => handleSearchSubmit(s)} className="bg-[#f5c842]/5 border border-[#f5c842]/15 text-[#f5c842] py-2 px-4 rounded-full text-xs cursor-pointer hover:bg-[#f5c842]/10 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-6">
                {matchedCategories.length > 0 && (
                  <div>
                    <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Categories</h3>
                    <div className="flex flex-col gap-2">
                      {matchedCategories.map(c => (
                        <button key={c.name} onClick={() => handleSearchCategory(c.name)} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 text-left cursor-pointer hover:bg-white/10 transition-colors">
                          <div className="text-[#f5c842] scale-90">{c.icon}</div>
                          <span className="text-white text-sm">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {matchedProducts.length > 0 && (
                  <div>
                    <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Products</h3>
                    <div className="flex flex-col gap-2">
                      {matchedProducts.map(p => (
                        <button key={p.id || p._id} onClick={() => handleSearchProduct(p)} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 text-left cursor-pointer hover:bg-white/10 transition-colors">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
                            {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" alt="" /> : <Box size={20} className="text-gray-500 m-2"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">{p.name}</div>
                            <div className="text-[#f5c842] text-xs mt-0.5">₹{p.sale_price?.toLocaleString()}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {matchedCategories.length === 0 && matchedProducts.length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    <Search size={32} className="opacity-20 mb-4 mx-auto" />
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function LayoutGridIcon({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#f5c842" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"></rect>
      <rect x="14" y="3" width="7" height="7" rx="1"></rect>
      <rect x="14" y="14" width="7" height="7" rx="1"></rect>
      <rect x="3" y="14" width="7" height="7" rx="1"></rect>
    </svg>
  );
}
