import './globals.css';
import { Syne, DM_Sans } from 'next/font/google';
import dynamic from 'next/dynamic';

const MobileBottomNav = dynamic(() => import('@/components/MobileBottomNav'));

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
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head suppressHydrationWarning>
        <link rel="preconnect" href="https://checkout.razorpay.com" />
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
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
        <main className="min-h-screen">
          {children}
        </main>
        <MobileBottomNav />
      </body>
    </html>
  );
}
