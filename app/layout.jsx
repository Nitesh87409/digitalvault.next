import './globals.css';
import MobileBottomNav from '@/components/MobileBottomNav';
import { SpeedInsights } from '@vercel/speed-insights/next';

export async function generateMetadata() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'DigitalVault';
  return {
    title: `${appName} – Premium Digital Products`,
    description: 'Everything you need to launch, grow, and scale your online business.',
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <MobileBottomNav />
        <SpeedInsights />
      </body>
    </html>
  );
}
