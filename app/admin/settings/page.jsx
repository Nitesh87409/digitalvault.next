'use client';
import { useState, useEffect } from 'react';

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

  if (loading) return <div style={{ padding: '24px', color: '#fff' }}>Loading settings...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>Authentication Settings</h1>

      <div style={{ background: '#1a1a2a', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#fff' }}>Login Methods</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#fff' }}>Password Login</div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Allow users to login with email and password.</div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
            <input type="checkbox" checked={settings.password_login_enabled} onChange={(e) => handleChange('password_login_enabled', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: settings.password_login_enabled ? '#10b981' : '#4b5563', transition: '.4s', borderRadius: '24px' }}>
              <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: settings.password_login_enabled ? 'translateX(24px)' : 'translateX(0)' }}></span>
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#fff' }}>Email OTP Login</div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Allow users to login with a one-time password sent to their email.</div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
            <input type="checkbox" checked={settings.email_otp_enabled} onChange={(e) => handleChange('email_otp_enabled', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: settings.email_otp_enabled ? '#10b981' : '#4b5563', transition: '.4s', borderRadius: '24px' }}>
              <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: settings.email_otp_enabled ? 'translateX(24px)' : 'translateX(0)' }}></span>
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#fff' }}>Mobile OTP Login</div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Allow users to login with a one-time password sent via SMS.</div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
            <input type="checkbox" checked={settings.mobile_otp_enabled} onChange={(e) => handleChange('mobile_otp_enabled', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: settings.mobile_otp_enabled ? '#10b981' : '#4b5563', transition: '.4s', borderRadius: '24px' }}>
              <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: settings.mobile_otp_enabled ? 'translateX(24px)' : 'translateX(0)' }}></span>
            </span>
          </label>
        </div>
      </div>

      <div style={{ background: '#1a1a2a', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#fff' }}>OTP Configuration</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.875rem', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>OTP Expiry Time (Minutes)</label>
            <select
              value={settings.otp_expiry_minutes}
              onChange={(e) => handleChange('otp_expiry_minutes', parseInt(e.target.value))}
              style={{ background: '#2d2d3a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: '8px', width: '100%', outline: 'none' }}
            >
              <option value={1}>1 Minute</option>
              <option value={3}>3 Minutes</option>
              <option value={5}>5 Minutes</option>
              <option value={10}>10 Minutes</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>OTP Length</label>
            <select
              value={settings.otp_length}
              onChange={(e) => handleChange('otp_length', parseInt(e.target.value))}
              style={{ background: '#2d2d3a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: '8px', width: '100%', outline: 'none' }}
            >
              <option value={4}>4 Digits</option>
              <option value={6}>6 Digits</option>
              <option value={8}>8 Digits</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>Max OTP Attempts</label>
            <select
              value={settings.otp_max_attempts}
              onChange={(e) => handleChange('otp_max_attempts', parseInt(e.target.value))}
              style={{ background: '#2d2d3a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: '8px', width: '100%', outline: 'none' }}
            >
              <option value={3}>3 Attempts</option>
              <option value={5}>5 Attempts</option>
              <option value={10}>10 Attempts</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>OTP Resend Cooldown</label>
            <select
              value={settings.otp_resend_cooldown_seconds}
              onChange={(e) => handleChange('otp_resend_cooldown_seconds', parseInt(e.target.value))}
              style={{ background: '#2d2d3a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: '8px', width: '100%', outline: 'none' }}
            >
              <option value={30}>30 Seconds</option>
              <option value={60}>60 Seconds</option>
              <option value={120}>120 Seconds</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={saveSettings}
          disabled={saving}
          style={{
            background: '#f5c842', color: '#000', fontWeight: 600, border: 'none',
            padding: '12px 24px', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1, fontSize: '1rem'
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {message && <span style={{ color: message.includes('success') ? '#10b981' : '#ef4444', fontWeight: 500 }}>{message}</span>}
      </div>
    </div>
  );
}