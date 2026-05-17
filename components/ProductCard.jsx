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

export default function ProductCard({ product, index, onAddToCart, onBuyNow }) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const style = cardStyles[index % cardStyles.length];
  const badge = badges[index % badges.length];
  const sale = product.sale_price || 0;
  const orig = product.original_price || 0;
  const rawDesc = product.description ? product.description.replace(/<[^>]*>/g, '') : '';
  const desc = rawDesc || 'Premium digital product — instant download after purchase.';
  // Use real average rating if available, else generate consistent pseudo-rating for UI
  const rating = product.average_rating > 0 ? product.average_rating : (4.5 + (index % 5) * 0.1).toFixed(1);

  return (
    <div
      className="flex flex-row items-center p-3 sm:p-4 gap-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(245,200,66,0.15)] bg-white/5 border border-white/10 rounded-2xl w-full"
      onClick={() => window.open(`/product/${product._id}`, '_blank')}
    >
      {/* LEFT SIDE: Image */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden relative flex items-center justify-center shadow-inner" style={{ background: style.bg }}>
        {product.images?.length > 0 && !imgError ? (
          <img
            src={optimizeCloudinary(product.images[0])}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : null}
        <div 
          className="absolute inset-0 items-center justify-center text-4xl"
          style={{ display: (!product.images?.length || imgError) ? 'flex' : 'none' }}
        >
          {style.emoji}
        </div>
      </div>

      {/* RIGHT SIDE: Content */}
      <div className="flex flex-col flex-1 min-w-0 justify-center h-full py-0.5">
        {/* Top Content */}
        <div className="mb-2">
          <div className="text-[10px] sm:text-xs font-bold text-[#f5c842] uppercase tracking-wider mb-1">{badge}</div>
          <h3 className="text-sm sm:text-base font-bold text-white mb-0.5 truncate">{product.name}</h3>
          <p className="text-[11px] sm:text-xs text-gray-400 truncate">{desc}</p>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-row items-center justify-between mt-auto">
          {/* Prices */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2 shrink-0">
            <span className="text-sm sm:text-base font-bold text-white">₹{sale.toLocaleString()}</span>
            {orig > 0 && <span className="text-[10px] sm:text-xs text-gray-500 line-through">₹{orig.toLocaleString()}</span>}
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Circular rating/count badge */}
            <div className="flex items-center justify-center gap-1 bg-white/10 px-2 py-1 rounded-full border border-white/5">
              <span className="text-[#f5c842] text-[10px]">★</span>
              <span className="text-white text-[10px] font-medium leading-none">{rating}</span>
            </div>
            
            {/* Cart Icon Button */}
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 shrink-0"
              title="Add to Cart"
            >
              <ShoppingCart size={14} className="sm:w-[16px] sm:h-[16px]" />
            </button>

            {/* Rounded Buy Button */}
            <button
              onClick={(e) => { e.stopPropagation(); onBuyNow(product); }}
              className="bg-gradient-to-r from-[#f5c842] to-[#e0a800] text-[#0a0a0f] px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-xs font-bold transition-transform active:scale-95 whitespace-nowrap flex items-center justify-center"
            >
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
