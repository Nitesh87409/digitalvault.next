import { useState, useEffect } from 'react';

const defaultSettings = {
  app_name: 'DigitalVault',
  app_logo: '',
  app_name_size: 20,
  support_email: 'support@digitalvault.in',
  support_phone: '+91 98765 43210',
  business_hours: 'Mon–Sat, 10am–6pm IST',
  bundle_enabled: true,
  bundle_title: 'Complete Bundle',
  bundle_description: 'All products + future updates included',
  bundle_price: 207,
  bundle_original_price: 8497,
};

function getSynchronousSettings() {
  // 1. Highest priority: server-injected settings via the inline script tag in layout.jsx
  //    This is guaranteed to be the latest DB value and is available synchronously.
  if (typeof window !== 'undefined' && window.__initial_settings__) {
    return window.__initial_settings__;
  }
  // 2. Server-side global (for SSR during rendering)
  if (typeof global !== 'undefined' && global.__server_settings__) {
    return global.__server_settings__;
  }
  // 3. Fallback to defaults (NOT localStorage — stale localStorage caused logo flicker)
  return defaultSettings;
}

export function useSettings() {
  const [settings, setSettings] = useState(getSynchronousSettings);
  const [loading, setLoading] = useState(() => {
    // If we already have the initial settings loaded from the global/window context, we are not loading.
    const isLoaded = (typeof window !== 'undefined' && !!window.__initial_settings__) || 
                     (typeof global !== 'undefined' && !!global.__server_settings__);
    return !isLoaded;
  });

  useEffect(() => {
    // Run a background silent refresh to fetch the latest settings from the server
    fetch('/api/settings?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.flag && data.settings) {
          const updatedSettings = {
            ...data.settings,
            app_name: data.settings.app_name || 'DigitalVault'
          };
          setSettings(updatedSettings);
          
          if (typeof window !== 'undefined') {
            window.__initial_settings__ = updatedSettings;
            try {
              localStorage.setItem('dv_settings', JSON.stringify(updatedSettings));
            } catch (e) {}
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { settings, loading };
}
