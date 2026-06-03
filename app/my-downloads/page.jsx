'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Toast, { useToast } from '@/components/Toast';
import { useBundlePurchase } from '@/hooks/useBundlePurchase';

export default function MyDownloadsPage() {
  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supportEmail, setSupportEmail] = useState('support@digitalvault.in');
  const { toast, showToast } = useToast();
  const { hasBundleAccess, bundleStatus, bundleLoading, unlockBundle } = useBundlePurchase({ showToast });
  const router = useRouter();

  useEffect(() => {
    fetch('/api/settings?t=' + Date.now(), { cache: 'no-store' }).then(res => res.json()).then(data => {
      if (data.flag && data.settings?.support_email) setSupportEmail(data.settings.support_email);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const c = localStorage.getItem('dv_customer');
    let hasLocal = false;
    if (c) {
      try {
        const parsed = JSON.parse(c);
        if (parsed && parsed.email) {
          setCustomer(parsed);
          hasLocal = true;
        }
      } catch {
        localStorage.removeItem('dv_customer');
      }
    }

    fetch('/api/customer', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.flag && data.customer) {
          localStorage.setItem('dv_customer', JSON.stringify(data.customer));
          setCustomer(data.customer);
        } else if (!hasLocal) {
          router.push('/login?redirect=/my-downloads');
        }
      })
      .catch(() => {
        if (!hasLocal) {
          router.push('/login?redirect=/my-downloads');
        }
      });
  }, []);

  useEffect(() => {
    if (customer?.email) {
      loadDownloads();
    }
  }, [hasBundleAccess, customer]);

  async function loadDownloads() {
    if (!customer?.email) {
      return;
    }

    setLoading(true);
    try {
      const normalRes = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'my-orders', email: customer.email }),
      });
      const normalData = await normalRes.json();
      const purchased = (normalData.orders || []).map(order => {
        const product = order.product_id || {};
        const productId = product._id || order.product_id;
        return {
          key: `purchased-${order._id || productId}`,
          label: 'Purchased',
          name: product.name || order.product_name || 'Digital Product',
          image: product.images?.[0] || '',
          date: order.createdAt,
          amount: order.amount,
          href: productId ? `/api/download?token=${order.download_token}&pid=${productId}` : `/download?token=${order.download_token}`,
        };
      });

      let bundled = [];
      if (hasBundleAccess) {
        const bundleRes = await fetch('/api/bundle/my-products', { cache: 'no-store' });
        if (bundleRes.ok) {
          const bundleData = await bundleRes.json();
          bundled = (bundleData.products || []).map(product => ({
            key: `bundle-${product.id || product._id}`,
            label: 'Bundle',
            name: product.name,
            image: product.images?.[0] || '',
            date: null,
            amount: null,
            href: `/api/bundle/download/${product.id || product._id}`,
          }));
        }
      }

      setItems([...purchased, ...bundled]);
    } catch {
      showToast('Could not load downloads.', '#ef4444', '#fff');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <Toast toast={toast} />
      <main className="theme-page min-h-screen pt-24 pb-20 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-syne text-3xl font-bold text-[var(--heading)]">My Downloads</h1>
              <p className="mt-2 text-sm text-[var(--muted)]">Your normal purchases and bundle products in one place.</p>
            </div>
            {!hasBundleAccess && (
              <button 
                onClick={() => {
                  if (bundleStatus === 'inactive') {
                    showToast('Your bundle is inactive. Please contact the support team.', '#ef4444', '#fff');
                    return;
                  }
                  unlockBundle();
                }} 
                disabled={bundleLoading || bundleStatus === 'inactive'}
                className="rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#f5c842] px-5 py-3 font-syne text-sm font-bold text-[#0a0a0f] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bundleLoading ? 'Processing...' : bundleStatus === 'inactive' ? 'Bundle Inactive' : 'Unlock Full Bundle'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="theme-card rounded-2xl p-10 text-center text-[var(--muted)]">Loading downloads...</div>
          ) : items.length === 0 ? (
            <div className="theme-card rounded-2xl p-10 text-center">
              <h2 className="mb-2 font-syne text-xl font-bold text-[var(--heading)]">No downloads yet</h2>
              <p className="mb-6 text-sm text-[var(--muted)]">Buy a product or unlock the bundle to see downloads here.</p>
              <Link href="/#products" className="inline-block rounded-xl bg-[#f5c842] px-5 py-3 font-syne text-sm font-bold text-[#0a0a0f] no-underline">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map(item => (
                <div key={item.key} className="theme-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-muted)] flex items-center justify-center">
                    {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" /> : <span className="text-2xl">📦</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${item.label === 'Bundle' ? 'bg-[#8b5cf6]/15 text-[#c4b5fd]' : 'bg-[#10b981]/15 text-[#10b981]'}`}>
                        {item.label === 'Bundle' ? 'Bundle' : 'Purchased'}
                      </span>
                      {item.date && <span className="text-xs text-[var(--muted-2)]">{new Date(item.date).toLocaleDateString('en-IN')}</span>}
                    </div>
                    <h2 className="truncate font-syne text-base font-bold text-[var(--heading)]">{item.name}</h2>
                    {item.amount ? <p className="mt-1 text-xs text-[var(--muted)]">Paid ₹{item.amount?.toLocaleString()}</p> : null}
                  </div>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-xl bg-gradient-to-br from-[#f5c842] to-[#e0a800] px-5 py-3 text-center font-syne text-sm font-bold text-[#0a0a0f] no-underline">
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center text-sm text-[var(--muted-2)]">
            Need help? <a href={`mailto:${supportEmail}`} className="text-[#f5c842] no-underline">{supportEmail}</a>
          </div>
        </div>
      </main>
    </>
  );
}
