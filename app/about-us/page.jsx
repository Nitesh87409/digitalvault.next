import connectDB from '@/lib/mongodb';
import Setting from '@/models/Setting';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export const revalidate = 60; // Revalidate page cache every 60 seconds

export async function generateMetadata() {
  let appName = 'DigitalVault';
  let appAltName = '';

  try {
    await connectDB();
    const settings = await Setting.findOne().lean();
    if (settings) {
      appName = settings.app_name || appName;
      appAltName = settings.app_alt_name ? settings.app_alt_name.split(',')[0].trim() : '';
    }
  } catch (e) {
    console.error('[About Us Metadata] Error:', e);
  }

  const altSuffix = appAltName ? ` (${appAltName})` : '';
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.downloadkart.com').replace(/\/+$/, '');

  return {
    title: `About Us | ${appName}${altSuffix}`,
    description: `Discover the story behind ${appName}${altSuffix}. We curate and deliver premium digital products, scripts, courses, and guides for modern creators and entrepreneurs.`,
    alternates: {
      canonical: `${baseUrl}/about-us`,
    },
    openGraph: {
      title: `About Us | ${appName}${altSuffix}`,
      description: `Discover the story behind ${appName}${altSuffix}. We curate and deliver premium digital products, scripts, courses, and guides for modern creators and entrepreneurs.`,
      url: `${baseUrl}/about-us`,
      siteName: appName,
      type: 'website',
    }
  };
}

export default async function AboutUsPage() {
  let settings = null;
  
  try {
    await connectDB();
    settings = await Setting.findOne().lean();
  } catch (e) {
    console.error('[About Us Page] Database fetch error:', e);
  }

  const appName = settings?.app_name || 'DigitalVault';
  const aboutUsContent = settings?.about_us_content || `
    <h1>About Us</h1>
    <p>Welcome to <strong>${appName}</strong>! We are dedicated to providing the highest quality premium digital products, templates, and resources to help creators, developers, and modern entrepreneurs launch, grow, and scale their online presence.</p>
    <h2>Our Mission</h2>
    <p>Our goal is to make professional digital assets affordable, accessible, and extremely simple to implement. We select, refine, and bundle top-tier tools and assets so that you can bypass hours of design/development work and get straight to building your dreams.</p>
    <h2>Why Choose Our Platform?</h2>
    <ul>
      <li><strong>Premium Quality:</strong> Every digital product is carefully curated, tested, and optimized for performance and design.</li>
      <li><strong>Instant Digital Delivery:</strong> Get immediate access to your purchase right in your inbox and download dashboard.</li>
      <li><strong>Money-Back Guarantee:</strong> We stand behind our quality with a 7-day guarantee for functional defects.</li>
      <li><strong>Lifetime Free Updates:</strong> Once purchased, you receive all future updates for that product without paying extra.</li>
    </ul>
    <p>Thank you for trusting us to support your digital journey!</p>
  `;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] font-sans flex flex-col selection:bg-[#f5c842]/30 selection:text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-[100] border-b border-[#f5c842]/10 bg-[#0a0a0f]/80 backdrop-blur-xl px-6 py-4">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4">
          <Link href="/" className="whitespace-nowrap font-syne text-xl font-bold text-[#f5c842] no-underline">
            {appName}
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-[#f5c842] transition-colors no-underline">← Store</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[900px] mx-auto px-6 py-12 sm:py-16">
        <div className="bg-[#0e0e18] border border-[#f5c842]/10 rounded-[24px] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle gold glow behind content */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f5c842]/5 rounded-full blur-[120px] pointer-events-none" />
          
          {/* Dynamic policy rich HTML */}
          <article 
            className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-[0.95rem]
              prose-headings:font-syne prose-headings:font-bold prose-headings:text-white
              prose-h1:text-2xl prose-h1:sm:text-3xl prose-h1:mb-6 prose-h1:text-[#f5c842]
              prose-h2:text-lg prose-h2:sm:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-2
              prose-p:mb-4
              prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
              prose-li:mb-2
              prose-strong:text-[#f5c842] prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: aboutUsContent }}
          />
        </div>
      </main>

      {/* Footer bar */}
      <footer className="border-t border-white/5 bg-[#0a0a0f] py-6 px-6 shrink-0">
        <div className="max-w-[900px] mx-auto flex flex-wrap justify-between gap-4 items-center">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} {appName}. All rights reserved.</p>
          <Link href="/" className="text-xs text-gray-500 hover:text-[#f5c842] transition-colors no-underline">Back to Store</Link>
        </div>
      </footer>
    </div>
  );
}
