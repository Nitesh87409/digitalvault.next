'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    password_login_enabled: true,
    email_otp_enabled: true,
    mobile_otp_enabled: false,
    otp_expiry_minutes: 5,
    otp_max_attempts: 5,
    otp_length: 6,
    otp_resend_cooldown_seconds: 60
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.flag && data.settings) {
        setSettings({
          password_login_enabled: data.settings.password_login_enabled ?? true,
          email_otp_enabled: data.settings.email_otp_enabled ?? true,
          mobile_otp_enabled: data.settings.mobile_otp_enabled ?? false,
          otp_expiry_minutes: data.settings.otp_expiry_minutes ?? 5,
          otp_max_attempts: data.settings.otp_max_attempts ?? 5,
          otp_length: data.settings.otp_length ?? 6,
          otp_resend_cooldown_seconds: data.settings.otp_resend_cooldown_seconds ?? 60
        });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.flag) {
        setMessage('Settings saved successfully!');
      } else {
        setMessage(data.message || 'Failed to save settings');
      }
    } catch (e) {
      setMessage('Connection error');
    }
    setSaving(false);
  }

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="font-sans bg-[#0a0a0f] min-h-screen text-[#e8e8f0] flex flex-col">
      {/* Nav */}
      <nav className="bg-[#0e0e18] border-b border-[#f5c842]/10 p-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/admin/dashboard" className="font-syne text-lg sm:text-xl font-bold text-[#f5c842] no-underline">DigitalVault</Link>
          <Link href="/admin/dashboard" className="text-sm text-gray-500 no-underline hover:text-white transition-colors">← Dashboard</Link>
        </div>
      </nav>

      <div className="w-full max-w-4xl mx-auto my-6 sm:my-10 px-4 sm:px-6 flex-1">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading settings...</div>
        ) : (
          <>
            <h1 className="font-syne text-2xl sm:text-3xl font-bold text-white mb-8 tracking-tight">⚙️ Authentication Settings</h1>

            <div className="bg-[#1a1a2a] rounded-2xl p-5 sm:p-8 border border-white/10 mb-6 sm:mb-8 shadow-lg">
              <h2 className="text-lg font-syne font-bold text-white mb-6">Login Methods</h2>
              
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                <div className="pr-4">
                  <div className="font-semibold text-white mb-1">Password Login</div>
                  <div className="text-sm text-gray-500">Allow users to login with email and password.</div>
                </div>
                <label className="relative inline-block w-12 h-6 shrink-0">
                  <input type="checkbox" checked={settings.password_login_enabled} onChange={(e) => handleChange('password_login_enabled', e.target.checked)} className="opacity-0 w-0 h-0" />
                  <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.password_login_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                    <span className={`absolute h-4 w-4 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.password_login_enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                <div className="pr-4">
                  <div className="font-semibold text-white mb-1">Email OTP Login</div>
                  <div className="text-sm text-gray-500">Allow users to login with a one-time password sent to their email.</div>
                </div>
                <label className="relative inline-block w-12 h-6 shrink-0">
                  <input type="checkbox" checked={settings.email_otp_enabled} onChange={(e) => handleChange('email_otp_enabled', e.target.checked)} className="opacity-0 w-0 h-0" />
                  <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.email_otp_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                    <span className={`absolute h-4 w-4 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.email_otp_enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <div className="font-semibold text-white mb-1">Mobile OTP Login</div>
                  <div className="text-sm text-gray-500">Allow users to login with a one-time password sent via SMS.</div>
                </div>
                <label className="relative inline-block w-12 h-6 shrink-0">
                  <input type="checkbox" checked={settings.mobile_otp_enabled} onChange={(e) => handleChange('mobile_otp_enabled', e.target.checked)} className="opacity-0 w-0 h-0" />
                  <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-300 rounded-full ${settings.mobile_otp_enabled ? 'bg-[#10b981]' : 'bg-gray-600'}`}>
                    <span className={`absolute h-4 w-4 left-1 bottom-1 bg-white transition-transform duration-300 rounded-full ${settings.mobile_otp_enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                  </span>
                </label>
              </div>
            </div>

            <div className="bg-[#1a1a2a] rounded-2xl p-5 sm:p-8 border border-white/10 shadow-lg mb-8">
              <h2 className="text-lg font-syne font-bold text-white mb-6">OTP Configuration</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-400 block mb-2 uppercase tracking-wider">OTP Expiry Time (Minutes)</label>
                  <select
                    value={settings.otp_expiry_minutes}
                    onChange={(e) => handleChange('otp_expiry_minutes', parseInt(e.target.value))}
                    className="bg-[#2d2d3a] border border-white/10 text-white px-4 py-3 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors cursor-pointer appearance-none"
                  >
                    <option value={1}>1 Minute</option>
                    <option value={3}>3 Minutes</option>
                    <option value={5}>5 Minutes</option>
                    <option value={10}>10 Minutes</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-400 block mb-2 uppercase tracking-wider">OTP Length</label>
                  <select
                    value={settings.otp_length}
                    onChange={(e) => handleChange('otp_length', parseInt(e.target.value))}
                    className="bg-[#2d2d3a] border border-white/10 text-white px-4 py-3 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors cursor-pointer appearance-none"
                  >
                    <option value={4}>4 Digits</option>
                    <option value={6}>6 Digits</option>
                    <option value={8}>8 Digits</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-400 block mb-2 uppercase tracking-wider">Max OTP Attempts</label>
                  <select
                    value={settings.otp_max_attempts}
                    onChange={(e) => handleChange('otp_max_attempts', parseInt(e.target.value))}
                    className="bg-[#2d2d3a] border border-white/10 text-white px-4 py-3 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors cursor-pointer appearance-none"
                  >
                    <option value={3}>3 Attempts</option>
                    <option value={5}>5 Attempts</option>
                    <option value={10}>10 Attempts</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-400 block mb-2 uppercase tracking-wider">OTP Resend Cooldown</label>
                  <select
                    value={settings.otp_resend_cooldown_seconds}
                    onChange={(e) => handleChange('otp_resend_cooldown_seconds', parseInt(e.target.value))}
                    className="bg-[#2d2d3a] border border-white/10 text-white px-4 py-3 rounded-xl w-full outline-none focus:border-[#f5c842]/50 transition-colors cursor-pointer appearance-none"
                  >
                    <option value={30}>30 Seconds</option>
                    <option value={60}>60 Seconds</option>
                    <option value={120}>120 Seconds</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={saveSettings}
                disabled={saving}
                className={`bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-8 py-3.5 rounded-xl text-base shadow-lg shadow-[#f5c842]/20 cursor-pointer w-full sm:w-auto transition-transform ${saving ? 'opacity-70' : 'hover:scale-[1.02]'}`}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              {message && <span className={`font-medium ${message.includes('success') ? 'text-[#10b981]' : 'text-red-500'}`}>{message}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
