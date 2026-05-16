'use client';
import { useRouter } from 'next/navigation';
import { optimizeCloudinary } from '@/lib/cloudinary-image';

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
  const style = cardStyles[index % cardStyles.length];
  const badge = badges[index % badges.length];
  const sale = product.sale_price || 0;
  const orig = product.original_price || 0;
  const rawDesc = product.description ? product.description.replace(/<[^>]*>/g, '') : '';
  const desc = rawDesc.length > 100 ? rawDesc.substring(0, 100) + '...' : rawDesc || 'Premium digital product — instant download after purchase.';

  return (
    <div
      className="card p-6"
      style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
      onClick={() => window.open(`/product/${product._id}`, '_blank')}
    >
      {/* Image */}
      {product.images?.length > 0 ? (
        <img
          src={optimizeCloudinary(product.images[0])}
          alt={product.name}
          style={{ width: '100%', height: 'clamp(140px, 32vw, 176px)', objectFit: 'cover', borderRadius: '12px', marginBottom: 'clamp(12px, 4vw, 20px)' }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div style={{
        width: '100%', height: 'clamp(140px, 32vw, 176px)', borderRadius: '12px', marginBottom: 'clamp(12px, 4vw, 20px)',
        background: style.bg, display: product.images?.length > 0 ? 'none' : 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(2rem, 7vw, 3rem)'
      }}>
        {style.emoji}
      </div>

      <div className="badge mb-3">{badge}</div>
      <h3 style={{ fontSize: 'clamp(1rem, 2.8vw, 1.1rem)', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{product.name}</h3>
      <p style={{ color: '#9ca3af', fontSize: 'clamp(0.8rem, 2.2vw, 0.875rem)', marginBottom: 'clamp(12px, 4vw, 16px)', flex: 1 }}>{desc}</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#f5c842', fontWeight: 700, fontSize: '1.1rem' }}>₹{sale.toLocaleString()}</span>
          {orig > 0 && <span style={{ color: '#6b7280', textDecoration: 'line-through', fontSize: '0.875rem' }}>₹{orig.toLocaleString()}</span>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            style={{
              background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.3)',
              color: '#f5c842', padding: 'clamp(6px, 1.6vw, 8px) clamp(10px, 3vw, 12px)', borderRadius: '999px',
              fontSize: 'clamp(0.7rem, 2vw, 0.75rem)', fontWeight: 700, cursor: 'pointer', lineHeight: 1
            }}
            title="Add to Cart"
          >
            🛒
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onBuyNow(product); }}
            className="gold-btn"
            style={{ padding: '8px 16px', borderRadius: '999px', fontSize: '0.875rem' }}
          >
            Buy Now →
          </button>
        </div>
      </div>
    </div>
  );
}
