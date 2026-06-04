'use client';

import Script from 'next/script';

// Microsoft Clarity Project ID
// Aap ise yahan se direct change kar sakte hain, ya .env file me NEXT_PUBLIC_CLARITY_ID set kar sakte hain.
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_ID || 'x1m6nhpycf';

export default function MicrosoftClarity() {
  if (!CLARITY_PROJECT_ID) {
    return null;
  }

  // Don't load on localhost (development)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return null;
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
        `,
      }}
    />
  );
}
