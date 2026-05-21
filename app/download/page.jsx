'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function DownloadContent() {
  const [state, setState] = useState('loading'); // loading | success | error
  const [files, setFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [supportEmail, setSupportEmail] = useState('support@digitalvault.in');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.flag && data.settings?.support_email) {
        setSupportEmail(data.settings.support_email);
      }
    }).catch(() => {});
    
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
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0f', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#e8e8f0' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <nav style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid rgba(245,200,66,0.1)', backdropFilter: 'blur(20px)', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#f5c842', textDecoration: 'none' }}>DigitalVault</Link>
          <Link href="/account" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>My Account →</Link>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ background: '#12121a', border: '1px solid rgba(245,200,66,0.15)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '520px', textAlign: 'center' }}>

          {/* Loading */}
          {state === 'loading' && (
            <>
              <div style={{ width: '64px', height: '64px', border: '4px solid #f5c842', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 24px', animation: 'spin 0.8s linear infinite' }}></div>
              <p style={{ color: '#6b7280' }}>Verifying your purchase...</p>
            </>
          )}

          {/* Success */}
          {state === 'success' && (
            <>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245,200,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 24px' }}>🎉</div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Payment Successful!</h1>
              <p style={{ color: '#f5c842', fontWeight: 600, marginBottom: '24px' }}>Your order is confirmed</p>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '32px' }}>
                Thank you for your purchase! Download your files below. You have <strong style={{ color: '#f5c842' }}>lifetime access</strong>.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {files.map(file => (
                  <a
                    key={file.id}
                    href={`/api/download?token=${token}&pid=${file.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', fontWeight: 700, fontFamily: 'Syne, sans-serif', textDecoration: 'none', padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', transition: 'all 0.2s' }}
                  >
                    ⬇️ Download {file.name}
                  </a>
                ))}
              </div>

              <Link href="/" style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none', marginBottom: '16px' }}>← Back to Store</Link>
              <Link href="/account" style={{ display: 'block', fontSize: '0.875rem', color: '#9ca3af', textDecoration: 'none' }}>View My Account →</Link>

              <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'left' }}>
                <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem', marginBottom: '4px' }}>📧 Check your email too!</p>
                <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>We've sent the download links to your registered email address.</p>
              </div>
            </>
          )}

          {/* Error */}
          {state === 'error' && (
            <>
              <div style={{ fontSize: '4rem', marginBottom: '24px' }}>❌</div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Invalid or Expired Link</h1>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '8px' }}>{errorMsg}</p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '24px' }}>Please contact support or check My Account for downloads.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link href="/account" style={{ background: 'linear-gradient(135deg,#f5c842,#e0a800)', color: '#0a0a0f', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontFamily: 'Syne, sans-serif', fontSize: '0.875rem' }}>My Account</Link>
                <a href={`mailto:${supportEmail}`} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontFamily: 'Syne, sans-serif', fontSize: '0.875rem', border: '1px solid rgba(255,255,255,0.1)' }}>Contact Support</a>
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
    <Suspense fallback={<div style={{ background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#f5c842' }}>Loading...</div></div>}>
      <DownloadContent />
    </Suspense>
  );
}
