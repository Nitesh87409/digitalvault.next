'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import Toast, { useToast } from '@/components/Toast';
import { useBundlePurchase } from '@/hooks/useBundlePurchase';
import { ArrowLeft, Search, Box } from 'lucide-react';

export default function CategoryClient({ initialProducts, categoryName }) {
  const [products] = useState(initialProducts || []);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast, showToast } = useToast();
  const { hasBundleAccess, bundleLoading, unlockBundle } = useBundlePurchase({ showToast });

  function addToCart(product) {
    const c = localStorage.getItem('dv_customer');
    if (!c) { window.location.href = '/login'; return; }
    const productId = product.id || product._id;
    const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
    if (cart.find(i => i.id === productId)) { showToast('Already in cart! 🛒', '#f5c842', '#0a0a0f'); return; }
    cart.push({ id: productId, slug: product.slug, name: product.name, price: product.sale_price, orig_price: product.original_price, image: product.images?.[0] || null, qty: 1 });
    localStorage.setItem('dv_cart', JSON.stringify(cart));
    showToast('Added to cart! 🎉', '#10b981', '#fff');
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }

  function buyNow(product) {
    const c = localStorage.getItem('dv_customer');
    if (!c) { window.location.href = '/login'; return; }

    const productId = product.id || product._id;
    const cart = JSON.parse(localStorage.getItem('dv_cart') || '[]');
    if (!cart.find(i => i.id === productId)) {
      cart.push({
        id: productId,
        slug: product.slug,
        name: product.name,
        price: product.sale_price,
        orig_price: product.original_price,
        image: product.images?.[0] || null,
        qty: 1
      });
      localStorage.setItem('dv_cart', JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('cart-updated'));
    }

    window.location.href = '/cart';
  }

  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <Navbar />
      <Toast toast={toast} />
      
      <main className="theme-page pt-20 pb-[100px]">
        <div className="max-w-[1152px] mx-auto py-10 px-6">
          
          <div className="mb-10">
            <Link href="/categories" className="theme-link no-underline inline-flex items-center gap-2 text-sm mb-6">
              <ArrowLeft size={16} /> Back to Categories
            </Link>
            
            <h1 className="text-4xl font-bold text-[var(--heading)] mb-4 font-['Syne',sans-serif]">
              {categoryName}
            </h1>
            
            <p className="text-[var(--muted)] text-lg mb-8">
              Explore products in {categoryName}
            </p>

            <div className="max-w-[500px] relative group">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#f5c842]" />
              <input 
                type="text" 
                placeholder={`Search in ${categoryName}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="theme-input rounded-full py-4 pr-6 pl-12 text-base font-['DM_Sans',sans-serif]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.length === 0 ? (
              <div className="col-span-full text-center py-16 px-5 bg-[var(--surface-muted)] rounded-2xl border border-dashed border-[var(--line)]">
                <div className="text-5xl mb-4 flex justify-center">
                  <Box size={48} className="text-gray-600" />
                </div>
                <h3 className="text-[var(--heading)] text-xl mb-2 font-['Syne',sans-serif] font-bold">No products found</h3>
                <p className="text-[var(--muted)]">There are no products in this category yet.</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-16 px-5 bg-[var(--surface-muted)] rounded-2xl border border-dashed border-[var(--line)]">
                <div className="text-5xl mb-4 flex justify-center">
                  <Search size={48} className="text-gray-600" />
                </div>
                <h3 className="text-[var(--heading)] text-xl mb-2 font-['Syne',sans-serif] font-bold">No results found</h3>
                <p className="text-[var(--muted)]">Try adjusting your search query to find what you're looking for.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-5 bg-transparent border border-[#f5c842] text-[#f5c842] py-2 px-5 rounded-full cursor-pointer font-['DM_Sans',sans-serif] hover:bg-[#f5c842]/10 transition-colors"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              filteredProducts.map((p, i) => (
                <ProductCard
                  key={p.id || p._id}
                  product={p}
                  index={i}
                  onAddToCart={addToCart}
                  onBuyNow={buyNow}
                  hasBundleAccess={hasBundleAccess}
                  onUnlockBundle={unlockBundle}
                  bundleLoading={bundleLoading}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
