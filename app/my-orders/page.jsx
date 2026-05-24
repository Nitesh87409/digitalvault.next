'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { optimizeCloudinary } from '@/lib/cloudinary-image';

export default function MyOrdersPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // email | orders
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supportEmail, setSupportEmail] = useState('support@digitalvault.in');
  const [settings, setSettings] = useState({ app_name: 'DigitalVault', app_logo: '' });
  const router = useRouter();

  useEffect(() => {
    fetch('/api/settings?t=' + Date.now(), { cache: 'no-store' }).then(res => res.json()).then(data => {
      if (data.flag && data.settings) {
        if (data.settings.support_email) setSupportEmail(data.settings.support_email);
        setSettings({
          app_name: data.settings.app_name || 'DigitalVault',
          app_logo: data.settings.app_logo || ''
        });
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
    <div className="font-['DM_Sans',sans-serif] bg-[#0a0a0f] min-h-screen text-[#e8e8f0]">
      <nav className="bg-[#0a0a0f]/90 border-b border-[#f5c842]/10 backdrop-blur-[20px] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-[768px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-['Syne',sans-serif] text-xl font-bold text-[#f5c842] no-underline flex items-center gap-2">
            {settings.app_logo && (
              <img src={settings.app_logo} alt={settings.app_name} className="h-6 w-auto object-contain" />
            )}
            <span>{settings.app_name}</span>
          </Link>
          <Link href="/" className="text-[#6b7280] text-sm no-underline">← Back to Store</Link>
        </div>
      </nav>

      <div className="max-w-[672px] mx-auto px-6 py-16">

        {step === 'email' && (
          <div>
            <div className="text-center mb-10">
              <div className="text-[3rem] mb-4">ðŸ“¦</div>
              <h1 className="font-['Syne',sans-serif] text-[2rem] font-bold text-white mb-3">My Downloads</h1>
              <p className="text-[#6b7280]">Enter your email to access all your purchased products</p>
            </div>
            <div className="bg-[#12121a] border border-[#f5c842]/15 rounded-2xl p-8">
              <label className="text-xs text-[#9ca3af] block mb-2 font-semibold">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && findOrders()}
                placeholder="your@email.com"
                className="bg-[#1a1a2a] border border-white/8 text-white outline-none w-full px-4 py-3 rounded-xl text-[0.9rem] mb-4 font-['DM_Sans',sans-serif]"
              />
              {error && <div className="text-[#ef4444] text-[0.8rem] mb-3 px-3.5 py-2.5 bg-[#ef4444]/8 rounded-lg">{error}</div>}
              <button onClick={findOrders} disabled={loading} className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none w-full p-3.5 rounded-xl text-base transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed enabled:hover:scale-[1.02]">
                {loading ? 'Searching...' : 'Find My Orders â†’'}
              </button>
              <p className="text-[#4b5563] text-xs text-center mt-3">Use the same email you used during purchase</p>
            </div>
          </div>
        )}

        {step === 'orders' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-['Syne',sans-serif] text-[1.5rem] font-bold text-white">Your Purchases</h2>
                <p className="text-[#6b7280] text-sm mt-1">{email}</p>
              </div>
              <button onClick={() => { setStep('email'); setOrders([]); }} className="bg-white/5 border border-white/8 text-[#9ca3af] px-4 py-2 rounded-xl cursor-pointer text-sm font-['DM_Sans',sans-serif]">
                â†  Change Email
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-[60px]">
                <div className="text-[3rem] mb-4">ðŸ” </div>
                <h3 className="font-['Syne',sans-serif] text-white mb-2 font-bold">No Orders Found</h3>
                <p className="text-[#6b7280] text-sm">No purchases found with this email address.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map((order, i) => {
                  const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                  const productName = order.product_id?.name || 'Digital Product';
                  const productId = order.product_id?._id || order.product_id;
                  const dlUrl = productId ? `/api/download?token=${order.download_token}&pid=${productId}` : `/download?token=${order.download_token}`;
                  return (
                    <div key={i} className="bg-[#12121a] border border-[#f5c842]/10 rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1a1a2a] shrink-0 flex items-center justify-center text-2xl">
                        {order.product_id?.images?.[0] ? <img src={optimizeCloudinary(order.product_id.images[0], 128)} className="w-full h-full object-cover" loading="lazy" alt="" /> : '📦'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-1">{productName}</h3>
                        <p className="text-[#6b7280] text-xs">{date} · ₹{order.amount?.toLocaleString()}</p>
                      </div>
                      <a href={dlUrl} target="_blank" rel="noopener noreferrer" className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-bold font-['Syne',sans-serif] no-underline px-[18px] py-2.5 rounded-xl text-sm shrink-0 transition-transform duration-200 hover:scale-[1.02]">
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
      <div className="text-center p-8 border-t border-[#f5c842]/10 text-[#6b7280] text-sm">
        Need help? <a href={`mailto:${supportEmail}`} className="text-[#f5c842] no-underline hover:underline">{supportEmail}</a>
      </div>
    </div>
  );
}
