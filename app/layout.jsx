import './globals.css';
import { Syne, DM_Sans } from 'next/font/google';
import dynamic from 'next/dynamic';

const MobileBottomNav = dynamic(() => import('@/components/MobileBottomNav'));
const AnnouncementBanner = dynamic(() => import('@/components/AnnouncementBanner'));
import FloatingContact from '@/components/FloatingContact';


const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export async function generateMetadata() {
  let appName = 'DigitalVault';
  try {
    const Setting = (await import('@/models/Setting')).default;
    const connectDB = (await import('@/lib/mongodb')).default;
    await connectDB();
    const settings = await Setting.findOne().lean();
    if (settings && settings.app_name) {
      appName = settings.app_name;
    } else if (process.env.NEXT_PUBLIC_APP_NAME) {
      appName = process.env.NEXT_PUBLIC_APP_NAME;
    }
  } catch (e) {
    console.error('Metadata generation error:', e);
  }
  return {
    title: `${appName} – Premium Digital Products`,
    description: 'Everything you need to launch, grow, and scale your online business.',
    openGraph: {
      title: `${appName} – Premium Digital Products`,
      description: 'Everything you need to launch, grow, and scale your online business.',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://downloadkart.in',
      siteName: appName,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${appName} – Premium Digital Products`,
      description: 'Everything you need to launch, grow, and scale your online business.',
    }
  };
}

export default async function RootLayout({ children }) {
  let initialSettings = null;
  try {
    const Setting = (await import('@/models/Setting')).default;
    const connectDB = (await import('@/lib/mongodb')).default;
    await connectDB();
    const settings = await Setting.findOne().lean();
    if (settings) {
      initialSettings = {
        app_name: settings.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault',
        app_logo: settings.app_logo || '',
        app_name_size: settings.app_name_size ?? 20,
        support_email: settings.support_email || 'support@digitalvault.in',
        support_phone: settings.support_phone || '+91 98765 43210',
        business_hours: settings.business_hours || 'Mon–Sat, 10am–6pm IST',
        bundle_enabled: settings.bundle_enabled !== false,
        bundle_title: settings.bundle_title || 'Complete Bundle',
        bundle_description: settings.bundle_description || 'All products + future updates included',
        bundle_price: settings.bundle_price ?? 207,
        bundle_original_price: settings.bundle_original_price ?? 8497,
        bundle_timer_enabled: settings.bundle_timer_enabled ?? true,
        bundle_timer_days: settings.bundle_timer_days ?? 0,
        bundle_timer_hours: settings.bundle_timer_hours ?? 24,
        bundle_timer_minutes: settings.bundle_timer_minutes ?? 0,
        bundle_timer_action: settings.bundle_timer_action || 'hide_timer',
        bundle_features: Array.isArray(settings.bundle_features) && settings.bundle_features.length > 0
          ? settings.bundle_features
          : ['Instant Download', 'Lifetime Access', 'Free Future Updates', '7-Day Guarantee'],
        bundle_badge_text: settings.bundle_badge_text || 'Limited Time Deal',
        bundle_badge_color: settings.bundle_badge_color || '#f5c842',
        bundle_cta_text: settings.bundle_cta_text || 'Unlock Bundle →',
        bundle_show_discount: settings.bundle_show_discount ?? true,
        bundle_banner_image: settings.bundle_banner_image || '',
        updatedAt: settings.updatedAt ? settings.updatedAt.toString() : '',
        social_instagram_enabled: settings.social_instagram_enabled ?? false,
        social_instagram_url: settings.social_instagram_url ?? '',
        social_whatsapp_enabled: settings.social_whatsapp_enabled ?? false,
        social_whatsapp_url: settings.social_whatsapp_url ?? '',
        social_twitter_enabled: settings.social_twitter_enabled ?? false,
        social_twitter_url: settings.social_twitter_url ?? '',
        social_facebook_enabled: settings.social_facebook_enabled ?? false,
        social_facebook_url: settings.social_facebook_url ?? '',
        social_telegram_enabled: settings.social_telegram_enabled ?? false,
        social_telegram_url: settings.social_telegram_url ?? '',
        floating_support_enabled: settings.floating_support_enabled !== false,
        floating_whatsapp_enabled: settings.floating_whatsapp_enabled !== false,
        floating_telegram_enabled: settings.floating_telegram_enabled !== false,
        floating_email_enabled: settings.floating_email_enabled !== false,
        support_bot_enabled: !!settings.support_bot_enabled,
        support_bot_model_mode: settings.support_bot_model_mode || 'auto',
        openrouter_model: settings.openrouter_model || 'openrouter/free',
        support_bot_prompt: settings.support_bot_prompt || '',
        custom_social_links: Array.isArray(settings.custom_social_links) ? settings.custom_social_links : []
      };
    }
  } catch (e) {
    console.error('Layout settings fetch error:', e);
  }

  if (!initialSettings) {
    initialSettings = {
      app_name: process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault',
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
      bundle_timer_enabled: true,
      bundle_timer_days: 0,
      bundle_timer_hours: 24,
      bundle_timer_minutes: 0,
      bundle_timer_action: 'hide_timer',
      bundle_features: ['Instant Download', 'Lifetime Access', 'Free Future Updates', '7-Day Guarantee'],
      bundle_badge_text: 'Limited Time Deal',
      bundle_badge_color: '#f5c842',
      bundle_cta_text: 'Unlock Bundle →',
      bundle_show_discount: true,
      bundle_banner_image: '',
      updatedAt: '',
      social_instagram_enabled: false,
      social_instagram_url: '',
      social_whatsapp_enabled: false,
      social_whatsapp_url: '',
      social_twitter_enabled: false,
      social_twitter_url: '',
      social_facebook_enabled: false,
      social_facebook_url: '',
      social_telegram_enabled: false,
      social_telegram_url: '',
      floating_support_enabled: true,
      floating_whatsapp_enabled: true,
      floating_telegram_enabled: true,
      floating_phone_enabled: true,
      floating_email_enabled: true,
      support_bot_enabled: false,
      support_bot_model_mode: 'auto',
      openrouter_model: 'openrouter/free',
      support_bot_prompt: '',
      custom_social_links: []
    };
  }

  global.__server_settings__ = initialSettings;

  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head suppressHydrationWarning>
        <link rel="preconnect" href="https://checkout.razorpay.com" />
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              window.__initial_settings__ = ${JSON.stringify(initialSettings)};
              (function () {
                try {
                  var saved = localStorage.getItem('dv_theme');
                  var theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
                  document.documentElement.dataset.theme = theme;
                } catch (e) {
                  document.documentElement.dataset.theme = 'dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <AnnouncementBanner />
        <main className="min-h-screen">
          {children}
        </main>
        <FloatingContact />
        <MobileBottomNav />
      </body>
    </html>
  );
}
