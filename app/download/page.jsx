'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';

function DownloadContent() {
  const [state, setState] = useState('loading'); // loading | success | error
  const [files, setFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { settings } = useSettings();

  useEffect(() => {
    if (!token) { setState('error'); setErrorMsg('Invalid download link.'); return; }
    verifyDownload();
  }, [token]);

  async function verifyDownload() {
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-download', token })
      });
      const data = await res.json();
      if (data.flag) {
        setFiles(data.files || []);
        setState('success');
      } else {
        setErrorMsg(data.message || 'Invalid or expired link.');
        setState('error');
      }
    } catch(e) {
      setErrorMsg('Connection error.');
      setState('error');
    }
  }

  return (
    <div className="font-['DM_Sans',sans-serif] bg-[#0a0a0f] min-h-screen flex flex-col text-[#e8e8f0]">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <nav className="bg-[#0a0a0f]/90 border-b border-[#f5c842]/10 backdrop-blur-[20px] px-6 py-4">
        <div className="max-w-[1152px] mx-auto flex items-center justify-between">
          <Link href="/" className="font-['Syne',sans-serif] text-xl font-bold text-[#f5c842] no-underline flex items-center gap-2">
            {settings.app_logo ? (
              <img src={settings.app_logo} alt={settings.app_name} className="h-7 w-auto object-contain" />
            ) : null}
            {settings.app_name}
          </Link>
          <Link href="/account" className="text-sm text-[#6b7280] no-underline hover:text-white transition-colors duration-200">My Account →</Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-[#12121a] border border-[#f5c842]/15 rounded-3xl p-10 w-full max-w-[520px] text-center">

          {/* Loading */}
          {state === 'loading' && (
            <>
              <div className="w-16 h-16 border-4 border-[#f5c842] border-t-transparent rounded-full mx-auto mb-6 animate-[spin_0.8s_linear_infinite]"></div>
              <p className="text-[#6b7280]">Verifying your purchase...</p>
            </>
          )}

          {/* Success */}
          {state === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-[#f5c842]/10 flex items-center justify-center text-4xl mx-auto mb-6">🎉</div>
              <h1 className="font-['Syne',sans-serif] text-[2rem] font-bold text-white mb-2">Payment Successful!</h1>
              <p className="text-[#f5c842] font-semibold mb-6">Your order is confirmed</p>
              <p className="text-[#9ca3af] text-sm mb-8">
                Thank you for your purchase! Download your files below. You have <strong className="text-[#f5c842]">lifetime access</strong>.
              </p>

              <div className="flex flex-col gap-3 mb-8">
                {files.map(file => (
                  <a
                    key={file.id}
                    href={`/api/download?token=${token}&pid=${file.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-bold font-['Syne',sans-serif] no-underline px-5 py-4 rounded-xl flex items-center justify-center gap-2.5 text-base transition-transform duration-200 hover:scale-[1.02]"
                  >
                    ⬇️ Download {file.name}
                  </a>
                ))}
              </div>

              <Link href="/" className="block text-sm text-[#6b7280] no-underline mb-4">← Back to Store</Link>
              <Link href="/account" className="block text-sm text-[#9ca3af] no-underline">View My Account →</Link>

              <div className="mt-6 p-4 rounded-xl bg-white/3 border border-white/7 text-left">
                <p className="font-semibold text-white text-sm mb-1">📧 Check your email too!</p>
                <p className="text-[#6b7280] text-[0.8rem]">We've sent the download links to your registered email address.</p>
              </div>
            </>
          )}

          {/* Error */}
          {state === 'error' && (
            <>
              <div className="text-[4rem] mb-6">❌</div>
              <h1 className="font-['Syne',sans-serif] text-2xl font-bold text-white mb-3">Invalid or Expired Link</h1>
              <p className="text-[#9ca3af] text-sm mb-2">{errorMsg}</p>
              <p className="text-[#6b7280] text-sm mb-6">Please contact support or check My Account for downloads.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/account" className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] px-6 py-3 rounded-xl no-underline font-bold font-['Syne',sans-serif] text-sm transition-transform duration-200 hover:scale-[1.02]">My Account</Link>
                <a href={`mailto:${settings.support_email}`} className="bg-white/5 text-white px-6 py-3 rounded-xl no-underline font-['Syne',sans-serif] text-sm border border-white/10 transition-colors duration-200 hover:bg-white/10">Contact Support</a>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <Suspense fallback={<div className="bg-[#0a0a0f] min-h-screen flex items-center justify-center"><div className="text-[#f5c842]">Loading...</div></div>}>
      <DownloadContent />
    </Suspense>
  );
}
