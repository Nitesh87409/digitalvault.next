'use client';

import Script from 'next/script';

// Google Analytics Measurement ID
// Aap ise yahan se direct change kar sakte hain, ya .env file me NEXT_PUBLIC_GA_ID set kar sakte hain.
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-SYWRGY90VM';

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  // Don't load on localhost (development)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return null;
  }

  return (
    <>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
