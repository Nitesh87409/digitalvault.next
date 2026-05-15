import './globals.css';
import MobileBottomNav from '@/components/MobileBottomNav';

export const metadata = {
  title: 'DigitalVault – Premium Digital Products',
  description: 'Everything you need to launch, grow, and scale your online business.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}
