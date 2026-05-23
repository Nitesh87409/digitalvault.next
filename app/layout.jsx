import './globals.css';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Syne, DM_Sans } from 'next/font/google';

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
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault';
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
