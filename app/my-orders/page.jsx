'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MyOrdersPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // email | orders
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supportEmail, setSupportEmail] = useState('support@digitalvault.in');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/settings?t=' + Date.now(), { cache: 'no-store' }).then(res => res.json()).then(data => {
      if (data.flag && data.settings?.support_email) {
        setSupportEmail(data.settings.support_email);
      }
    }).catch(() => {});
    
    const customer = JSON.parse(localStorage.getItem('dv_customer') || 'null');
    if (!customer?.email) {
      router.push('/login?redirect=/my-orders');
      return;
    }
    setEmail(customer.email);
  }, []);

  async function findOrders() {
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'my-orders', email })
      });
      const data = await res.json();
      setOrders(data.orders || []);
      setStep('orders');
    } catch(e) {
      setError('Connection error. Try again.');
    }
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0f', minHeight: '100vh', color: '#e8e8f0' }}>
      <nav style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid rgba(245,200,66,0.1)', backdropFilter: 'blur(20px)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#f5c842', textDecoration: 'none' }}>DigitalVault</Link>
          <Link href="/" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>â† Back to Store</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '672px', margin: '0 auto', padding: '64px 24px' }}>

        {step === 'email' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>ðŸ“¦</div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>My Downloads</h1>
              <p style={{ color: '#6b7280' }}>Enter your email to access all your purchased products</p>
            </div>
            <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.15)', borderRadius: '16px', padding: '32px' }}>
              <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && findOrders()}
                placeholder="your@email.com"
                style={{ background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', outline: 'none', width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '16px', fontFamily: 'DM Sans, sans-serif' }}
              />
              {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px' }}>{error}</div>}
              <button onClick={findOrders} disabled={loading} style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontFamily: 'Syne, sans-serif', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Searching...' : 'Find My Orders â†’'}
              </button>
              <p style={{ color: '#4b5563', fontSize: '0.75rem', textAlign: 'center', marginTop: '12px' }}>Use the same email you used during purchase</p>
            </div>
          </div>
        )}

        {step === 'orders' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Your Purchases</h2>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '4px' }}>{email}</p>
              </div>
              <button onClick={() => { setStep('email'); setOrders([]); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' }}>
                â† Change Email
              </button>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>ðŸ”</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', color: '#fff', marginBottom: '8px' }}>No Orders Found</h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No purchases found with this email address.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map((order, i) => {
                  const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                  const productName = order.product_id?.name || 'Digital Product';
                  const productId = order.product_id?._id || order.product_id;
                  const dlUrl = productId ? `/api/download?token=${order.download_token}&pid=${productId}` : `/download?token=${order.download_token}`;
                  return (
                    <div key={i} style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.1)', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', background: '#1a1a2a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        {order.product_id?.images?.[0] ? <img src={order.product_id.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '📦'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{productName}</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>{date} · ₹{order.amount?.toLocaleString()}</p>
                      </div>
                      <a href={dlUrl} target="_blank" rel="noopener noreferrer" style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontWeight: 700, fontFamily: 'Syne, sans-serif', textDecoration: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '0.875rem', flexShrink: 0 }}>
                        ⬇️ Download
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '32px', borderTop: '1px solid rgba(245,200,66,0.1)', color: '#6b7280', fontSize: '0.875rem' }}>
        Need help? <a href={`mailto:${supportEmail}`} style={{ color: '#f5c842', textDecoration: 'none' }}>{supportEmail}</a>
      </div>
    </div>
  );
}
