'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { optimizeCloudinary } from '@/lib/cloudinary-image';
import { ShoppingCart } from 'lucide-react';

const cardStyles = [
  { bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', emoji: '📦' },
  { bg: 'linear-gradient(135deg,#0f3460,#533483)', emoji: '🎨' },
  { bg: 'linear-gradient(135deg,#134e4a,#065f46)', emoji: '📈' },
  { bg: 'linear-gradient(135deg,#3b1f2b,#7b2d42)', emoji: '🚀' },
  { bg: 'linear-gradient(135deg,#1a2a1a,#2d5a27)', emoji: '💡' },
  { bg: 'linear-gradient(135deg,#1a1a3e,#2d2d7a)', emoji: '⚡' },
];
const badges = ['Bestseller', 'Hot', 'New', 'Popular', 'Trending', 'Must Have'];

export default function ProductCard({ product, index, onAddToCart, onBuyNow, hasBundleAccess = false, couponTag = '' }) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const style = cardStyles[index % cardStyles.length];
  const badge = badges[index % badges.length];
  const sale = product.sale_price || 0;
  const orig = product.original_price || 0;
  const productId = product.slug || product.id || product._id;
  const isBundleProduct = !!product.included_in_bundle;
  const rawDesc = product.description ? product.description.replace(/<[^>]*>/g, '') : '';
  const desc = rawDesc || 'Premium digital product — instant download after purchase.';
  // Use real average rating if available, else generate consistent pseudo-rating for UI
  const rating = product.average_rating > 0 ? product.average_rating : (4.5 + (index % 5) * 0.1).toFixed(1);

  return (
    <div
      className="theme-card flex w-full min-w-0 cursor-pointer flex-row items-center gap-4 rounded-2xl p-3 hover:-translate-y-1 hover:border-[#f5c842]/30 hover:shadow-[0_8px_30px_rgba(245,200,66,0.15)] sm:p-4"
      onClick={() => window.open(`/product/${productId}`, '_blank')}
    >
      {/* LEFT SIDE: Image */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden relative flex items-center justify-center shadow-inner" style={{ background: style.bg }}>
        {product.images?.length > 0 && !imgError ? (
          <img
            src={optimizeCloudinary(product.images[0], 160)}
            alt={product.name}
            width={112}
            height={112}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : null}
        <div 
          className={`absolute inset-0 items-center justify-center text-4xl ${(!product.images?.length || imgError) ? 'flex' : 'hidden'}`}
        >
          {style.emoji}
        </div>
      </div>

      {/* RIGHT SIDE: Content */}
      <div className="flex flex-col flex-1 min-w-0 justify-center h-full py-0.5">
        {/* Top Content */}
        <div className="mb-2">
          <div className="text-[10px] sm:text-xs font-bold text-[#f5c842] uppercase tracking-wider mb-1">{badge}</div>
          <h3 className="mb-0.5 truncate text-sm font-bold text-[var(--heading)] sm:text-base">{product.name}</h3>
          <p className="truncate text-[11px] text-[var(--muted)] sm:text-xs">{desc}</p>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col items-start gap-2 mt-auto">
          {couponTag && (
            <span className="text-[9px] sm:text-[10px] font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-1.5 py-0.5 rounded-full border border-[#7c3aed]/20 whitespace-nowrap">
              🏷️ {couponTag}
            </span>
          )}

          {/* Prices */}
          <div className="flex flex-row items-center gap-2 shrink-0 flex-wrap">
            <span className="text-sm font-bold text-[var(--heading)] sm:text-base">₹{sale.toLocaleString()}</span>
            {orig > 0 && <span className="text-[10px] text-[var(--muted-2)] line-through sm:text-xs">₹{orig.toLocaleString()}</span>}
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Circular rating/count badge */}
            <div className="flex items-center justify-center gap-1 rounded-full border border-[var(--line-soft)] bg-[var(--surface-muted)] px-2 py-1">
              <span className="text-[#f5c842] text-[10px]">★</span>
              <span className="text-[10px] font-medium leading-none text-[var(--heading)]">{rating}</span>
            </div>
            
            {hasBundleAccess && isBundleProduct ? (
              <a
                href={`/api/bundle/download/${productId}`}
                download
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-r from-[#f5c842] to-[#e0a800] text-[#0a0a0f] px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-xs font-bold transform transition-all duration-100 ease-out hover:scale-[1.03] active:scale-[0.93] active:brightness-95 whitespace-nowrap flex items-center justify-center no-underline select-none"
                title="Download from bundle"
                aria-label={`Download ${product.name} from bundle`}
              >
                Access Now
              </a>
            ) : (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                  className="theme-icon-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8 transform transition-all duration-100 ease-out hover:scale-[1.05] active:scale-[0.90] cursor-pointer"
                  title="Add to Cart"
                  aria-label={`Add ${product.name} to cart`}
                >
                  <ShoppingCart size={14} className="sm:w-[16px] sm:h-[16px]" />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); onBuyNow(product); }}
                  className="bg-gradient-to-r from-[#f5c842] to-[#e0a800] text-[#0a0a0f] px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-xs font-bold transform transition-all duration-100 ease-out hover:scale-[1.03] active:scale-[0.93] active:brightness-95 whitespace-nowrap flex items-center justify-center select-none cursor-pointer"
                  aria-label={`Buy ${product.name} now`}
                >
                  Buy
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

