import { useState, useEffect } from 'react';

export function useSettings() {
  const [settings, setSettings] = useState({
    app_name: process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault',
    app_logo: '',
    support_email: 'support@digitalvault.in',
    support_phone: '+91 98765 43210',
    business_hours: 'Mon–Sat, 10am–6pm IST',
    bundle_enabled: true,
    bundle_title: 'Complete Bundle',
    bundle_description: 'All products + future updates included',
    bundle_price: 207,
    bundle_original_price: 8497,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.flag && data.settings) {
          setSettings({
            ...data.settings,
            app_name: data.settings.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault'
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { settings, loading };
}
