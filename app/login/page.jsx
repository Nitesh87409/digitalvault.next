'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function LoginPage() {
  const router = useRouter();
  const googleInitializedRef = useRef(false);
  const googleRenderedRef = useRef(false);
  const [settings, setSettings] = useState({
    google_login_enabled: false,
    apple_login_enabled: false,
    app_name: 'DigitalVault',
    app_logo: '',
    app_name_size: null,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/settings?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.flag && data.settings) {
          setSettings({
            google_login_enabled: data.settings.google_login_enabled ?? false,
            apple_login_enabled: data.settings.apple_login_enabled ?? false,
            app_name: data.settings.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault',
            app_logo: data.settings.app_logo || '',
            app_name_size: data.settings.app_name_size || null,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleRedirect = params.get('google_redirect');

    if (googleRedirect === 'success') {
      const redirectTo = params.get('redirect') || '/';
      const finishRedirectLogin = (customerData) => {
        localStorage.setItem('dv_customer', JSON.stringify(customerData));
        window.dispatchEvent(new Event('auth-updated'));
        document.cookie = 'dv_google_customer=; path=/; max-age=0';
        router.replace(redirectTo);
      };
      const restoreFromSession = async () => {
        try {
          const res = await fetch('/api/customer', { cache: 'no-store' });
          const data = await res.json();
          if (data.flag && data.customer) {
            finishRedirectLogin(data.customer);
            return;
          }
        } catch {}
        setError('Login succeeded but failed to load profile. Please refresh.');
        window.history.replaceState({}, '', '/login');
      };

      const cookieMatch = document.cookie.match(/(?:^|;\s*)dv_google_customer=([^;]*)/);
      if (cookieMatch) {
        try {
          let cookieValue = cookieMatch[1];
          for (let i = 0; i < 2; i++) {
            const decoded = decodeURIComponent(cookieValue);
            if (decoded === cookieValue) break;
            cookieValue = decoded;
          }
          finishRedirectLogin(JSON.parse(cookieValue));
          return;
        } catch {
          restoreFromSession();
          return;
        }
      }
      restoreFromSession();
    } else if (googleRedirect === 'error') {
      setError(params.get('error_message') || 'Google login failed. Please try again.');
      window.history.replaceState({}, '', '/login');
    }
  }, [router]);

  const handleSuccess = (data) => {
    if (data?.customer) {
      localStorage.setItem('dv_customer', JSON.stringify(data.customer));
    } else {
      localStorage.removeItem('dv_customer');
    }
    window.dispatchEvent(new Event('auth-updated'));
    router.refresh();
    const params = new URLSearchParams(window.location.search);
    router.push(params.get('redirect') || '/');
  };

  async function continueWithEmailPhone() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\D/g, '');
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^\d{10}$/.test(normalizedPhone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'email-phone',
          email: normalizedEmail,
          phone: normalizedPhone,
        }),
      });
      const data = await res.json();
      if (data.flag && data.requires_otp) {
        const otpRes = await fetch('/api/auth/send-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
        });
        const otpData = await otpRes.json();
        if (otpData.flag) {
          setOtpRequired(true);
          setOtpCode('');
        } else {
          setError(otpData.message || 'Unable to send OTP. Please try again.');
        }
      } else if (data.flag) {
        handleSuccess(data);
      } else {
        setError(data.message || 'Unable to continue. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  }

  async function verifyEmailOtp() {
    const normalizedEmail = email.trim().toLowerCase();
    setError('');
    if (!otpCode.trim()) {
      setError('Please enter the OTP sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, otp: otpCode.trim() }),
      });
      const data = await res.json();
      if (data.flag) {
        handleSuccess(data);
      } else {
        setError(data.message || 'Invalid OTP.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  }

  async function handleSocialBackendAuth(provider, token, userData = {}) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, token, userData }),
      });
      const data = await res.json();
      if (data.flag) {
        handleSuccess(data);
      } else {
        setError(data.message || 'Social login failed.');
      }
    } catch {
      setError('Connection error during social login.');
    }
    setLoading(false);
  }

  const handleAppleLogin = async () => {
    if (!window.AppleID) {
      setError('Apple SDK not loaded yet.');
      return;
    }
    try {
      window.AppleID.auth.init({
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || 'dummy-client-id',
        scope: 'name email',
        redirectURI: window.location.origin + '/login',
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      handleSocialBackendAuth('apple', response.authorization.id_token, response.user);
    } catch {
      setError('Apple login cancelled or failed.');
    }
  };

  const initGoogle = () => {
    let attempts = 0;
    const tryRender = () => {
      const el = document.getElementById('googleSignInDiv');
      if (window.google && el) {
        try {
          const containerWidth = el.offsetWidth || 348;
          const safeWidth = Math.max(200, Math.min(400, containerWidth));

          if (!googleInitializedRef.current) {
            window.google.accounts.id.initialize({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id',
              login_uri: window.location.origin + '/api/auth/google-redirect',
              use_fedcm_for_prompt: false,
              ux_mode: 'redirect',
            });
            googleInitializedRef.current = true;
          }

          if (!googleRenderedRef.current) {
            window.google.accounts.id.renderButton(
              el,
              {
                theme: 'outline',
                size: 'large',
                type: 'standard',
                text: 'continue_with',
                shape: 'rectangular',
                width: safeWidth,
              }
            );
            googleRenderedRef.current = true;
          }
        } catch {
          setError('Google Sign-In failed to load. Please use email and phone.');
        }
      } else if (attempts < 30) {
        attempts++;
        setTimeout(tryRender, 100);
      }
    };
    tryRender();
  };

  useEffect(() => {
    if (settings.google_login_enabled && window.google) initGoogle();

    if (settings.apple_login_enabled && !window.AppleID) {
      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [settings.google_login_enabled, settings.apple_login_enabled]);

  const hasSocialLogins = settings.google_login_enabled || settings.apple_login_enabled;

  return (
    <div className="font-sans bg-[#0a0a0f] min-h-screen flex flex-col">
      <div className="fixed w-96 h-96 bg-[#f5c842] rounded-full blur-[100px] opacity-[0.08] -top-[100px] -left-[100px] pointer-events-none"></div>
      <div className="fixed w-80 h-80 bg-[#7c3aed] rounded-full blur-[100px] opacity-[0.08] -bottom-[80px] -right-[80px] pointer-events-none"></div>

      <nav className="bg-[#0a0a0f]/90 border-b border-[#f5c842]/10 backdrop-blur-[20px] py-4 px-6 sticky top-0 z-10">
        <div className="max-w-[1152px] mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-['Syne',sans-serif] text-xl font-bold text-[#f5c842] no-underline flex items-center gap-2"
            style={settings.app_name_size ? { fontSize: `${settings.app_name_size}px` } : {}}
          >
            {settings.app_logo ? (
              <img src={settings.app_logo} alt={settings.app_name} className="h-7 w-auto object-contain" />
            ) : null}
            {settings.app_name}
          </Link>
          <Link href="/" className="text-[#6b7280] text-sm no-underline">Back to Store</Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center py-4 md:py-8 px-4 relative z-[1]">
        <div className="bg-[#12121a] border border-[#f5c842]/15 rounded-[16px] md:rounded-[20px] p-5 sm:p-7 md:p-9 w-full max-w-[420px] shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          {loadingSettings ? (
            <div className="text-center text-[#9ca3af] py-8">Loading...</div>
          ) : (
            <>
              <div className="text-center mb-5 md:mb-7">
                <h2 className="font-['Syne',sans-serif] text-xl md:text-[1.6rem] font-bold text-white mb-1">Continue</h2>
                <p className="text-[#6b7280] text-xs md:text-sm">Login or create your {settings.app_name} account</p>
              </div>

              <div className="flex flex-col gap-3 md:gap-4">
                {!otpRequired ? (
                  <>
                <div>
                  <label className="text-xs text-[#9ca3af] block mb-1 font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    onKeyDown={event => event.key === 'Enter' && continueWithEmailPhone()}
                    placeholder="your@email.com"
                    className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl text-sm font-sans transition-colors duration-200 focus:border-[#f5c842]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9ca3af] block mb-1 font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={event => event.key === 'Enter' && continueWithEmailPhone()}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl text-sm font-sans transition-colors duration-200 focus:border-[#f5c842]/50"
                  />
                </div>

                {error && (
                  <div className="text-[#ef4444] text-[0.8rem] px-3 py-2 bg-[#ef4444]/5 rounded-lg border border-[#ef4444]/20">
                    {error}
                  </div>
                )}

                <button
                  onClick={continueWithEmailPhone}
                  disabled={loading}
                  className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none w-full py-2.5 md:py-3.5 rounded-xl text-base mt-0.5 transition-transform duration-200 disabled:opacity-70 disabled:cursor-not-allowed enabled:hover:scale-[1.02]"
                >
                  {loading ? 'Please wait...' : 'Continue'}
                </button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs text-[#9ca3af] block mb-1 font-semibold">Email OTP</label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={event => setOtpCode(event.target.value.replace(/\D/g, ''))}
                        onKeyDown={event => event.key === 'Enter' && verifyEmailOtp()}
                        placeholder="Enter OTP"
                        className="bg-[#1a1a2a] border border-white/10 text-white outline-none w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl text-sm text-center tracking-[4px] font-sans transition-colors duration-200 focus:border-[#f5c842]/50"
                      />
                    </div>

                    {error && (
                      <div className="text-[#ef4444] text-[0.8rem] px-3 py-2 bg-[#ef4444]/5 rounded-lg border border-[#ef4444]/20">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={verifyEmailOtp}
                      disabled={loading}
                      className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-['Syne',sans-serif] font-bold border-none w-full py-2.5 md:py-3.5 rounded-xl text-base mt-0.5 transition-transform duration-200 disabled:opacity-70 disabled:cursor-not-allowed enabled:hover:scale-[1.02]"
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpRequired(false);
                        setOtpCode('');
                        setError('');
                      }}
                      className="bg-transparent border-none text-[#9ca3af] text-sm cursor-pointer"
                    >
                      Change email or phone
                    </button>
                  </>
                )}
              </div>

              {hasSocialLogins && (
                <>
                  <div className="flex items-center my-4 md:my-6">
                    <div className="flex-1 border-t border-white/5"></div>
                    <span className="px-3 text-[#6b7280] text-[0.8rem] font-semibold uppercase">or continue with</span>
                    <div className="flex-1 border-t border-white/5"></div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {settings.google_login_enabled && (
                      <div className="w-full flex justify-center overflow-hidden rounded-xl bg-white hover:scale-[1.02] transition-transform duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                        <div
                          id="googleSignInDiv"
                          className="w-full flex justify-center overflow-hidden rounded-xl [&>iframe]:!rounded-xl [&>iframe]:!overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (!window.google) setError('Google Sign-In failed to load. Please use email and phone.');
                            }}
                            className="flex items-center justify-center gap-2.5 w-full p-3 bg-white text-black border-none text-[0.95rem] font-semibold cursor-pointer font-sans"
                          >
                            Continue with Google
                          </button>
                        </div>
                      </div>
                    )}
                    {settings.apple_login_enabled && (
                      <button onClick={handleAppleLogin} className="flex items-center justify-center gap-2.5 w-full p-3 bg-black text-white border border-white/20 rounded-xl text-[0.95rem] font-semibold cursor-pointer transition-transform duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:scale-[1.02]">
                        Apple
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {settings.google_login_enabled && (
            <Script
              src="https://accounts.google.com/gsi/client"
              onLoad={initGoogle}
              onError={() => setError('Google Sign-In failed to load. Please use email and phone.')}
              strategy="afterInteractive"
            />
          )}
        </div>
      </div>
    </div>
  );
}
