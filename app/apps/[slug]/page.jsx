import connectDB from '@/lib/mongodb';
import AppPolicy from '@/models/AppPolicy';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  await connectDB();
  const appData = await AppPolicy.findOne({ slug }).lean();

  if (!appData) return { title: 'App Not Found' };

  const title = `${appData.appName} - Download on Google Play`;
  const description = appData.shortDescription || `Download ${appData.appName} official app from Google Play Store.`;
  const image = appData.appIcon || (appData.screenshots?.[0] || '');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function AppLandingPage({ params }) {
  const { slug } = await params;

  await connectDB();
  const appData = await AppPolicy.findOne({ slug }).lean();

  if (!appData) {
    notFound();
  }

  const playStoreLink = appData.playStoreUrl || '#';
  const hasScreenshots = Array.isArray(appData.screenshots) && appData.screenshots.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 selection:bg-[#f5c842] selection:text-black font-sans">
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-[#111116]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {appData.appIcon ? (
              <img src={appData.appIcon} alt={appData.appName} className="w-9 h-9 rounded-xl object-cover shadow-sm" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#f5c842]/10 border border-[#f5c842]/30 flex items-center justify-center text-base">📱</div>
            )}
            <span className="font-bold text-white text-base tracking-tight">{appData.appName}</span>
          </div>

          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <Link href={`/apps/${slug}/privacy`} className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href={`/apps/${slug}/terms`} className="text-gray-400 hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 pt-12 pb-20">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 text-center md:text-left">
          {/* App Icon */}
          <div className="relative group">
            {appData.appIcon ? (
              <img 
                src={appData.appIcon} 
                alt={appData.appName} 
                className="w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover shadow-2xl border border-white/10 ring-1 ring-white/10"
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-gradient-to-br from-[#1a1a24] to-[#111116] border border-white/10 flex items-center justify-center text-5xl shadow-2xl">
                📱
              </div>
            )}
          </div>

          {/* Details & CTA */}
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-2">
              {appData.appName}
            </h1>

            {appData.developerName && (
              <p className="text-sm font-medium text-[#f5c842] mb-3">
                {appData.developerName}
              </p>
            )}

            {/* Badges / Stats */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-5 text-xs font-semibold">
              {appData.rating && (
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-yellow-400 flex items-center gap-1">
                  <span>★</span> {appData.rating} Rating
                </div>
              )}
              {appData.installs && (
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-blue-400 flex items-center gap-1">
                  <span>📥</span> {appData.installs}
                </div>
              )}
              <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center gap-1">
                <span>✓</span> Verified Safe
              </div>
            </div>

            {/* Short Tagline / Description */}
            {appData.shortDescription && (
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-2xl mb-6">
                {appData.shortDescription}
              </p>
            )}

            {/* Google Play Download Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <a
                href={playStoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-black hover:bg-[#1a1a24] border border-white/20 text-white px-6 py-3 rounded-2xl transition-all transform hover:-translate-y-0.5 shadow-xl"
              >
                {/* Official Google Play SVG Icon */}
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l9.1-9.7L3.6 2.3z" />
                  <path fill="#FBBC04" d="M16.4 15.6l-3.7-4-9.1 9.7c.3.3.8.4 1.4.1l11.4-5.8z" />
                  <path fill="#EA4335" d="M12.7 11.6l3.7-4-11.4-5.8c-.6-.3-1.1-.2-1.4.1l9.1 9.7z" />
                  <path fill="#34A853" d="M20.6 10.5l-4.2-2.1-3.7 3.2 3.7 4 4.2-2.1c.9-.5.9-2.5 0-3z" />
                </svg>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-medium text-gray-400 tracking-wider">Get it on</div>
                  <div className="text-base font-bold text-white leading-none">Google Play</div>
                </div>
              </a>

              <Link
                href={`/apps/${slug}/privacy`}
                className="text-xs text-gray-400 hover:text-[#f5c842] underline underline-offset-4 py-2"
              >
                View App Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Screenshots Gallery */}
        {hasScreenshots && (
          <div className="mt-16 pt-12 border-t border-white/5">
            <h2 className="text-xl font-bold text-white mb-6 text-center md:text-left">
              App Screenshots
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 snap-x">
              {appData.screenshots.map((shot, idx) => (
                <div key={idx} className="flex-shrink-0 snap-start">
                  <img
                    src={shot}
                    alt={`${appData.appName} screenshot ${idx + 1}`}
                    className="w-48 sm:w-56 h-auto rounded-2xl object-cover border border-white/10 shadow-lg"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About App / Safety Section */}
        <div className="mt-16 bg-[#111116] rounded-2xl p-6 sm:p-8 border border-white/5">
          <h2 className="text-lg font-bold text-white mb-3">About {appData.appName}</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            {appData.shortDescription || `${appData.appName} is designed to deliver a smooth and secure user experience on Android devices. Keep your app updated from Google Play for the latest performance improvements.`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5 text-xs text-gray-400">
            <div>
              <span className="text-gray-500 block">Developer Support</span>
              {appData.contactEmail ? (
                <a href={`mailto:${appData.contactEmail}`} className="text-[#f5c842] hover:underline">
                  {appData.contactEmail}
                </a>
              ) : (
                <span>support@downloadkart.com</span>
              )}
            </div>
            <div>
              <span className="text-gray-500 block">Legal & Policies</span>
              <div className="flex gap-3 mt-1">
                <Link href={`/apps/${slug}/privacy`} className="text-gray-300 hover:text-white underline">
                  Privacy Policy
                </Link>
                <Link href={`/apps/${slug}/terms`} className="text-gray-300 hover:text-white underline">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-gray-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} {appData.appName}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href={`/apps/${slug}/privacy`} className="hover:text-gray-300">Privacy</Link>
            <Link href={`/apps/${slug}/terms`} className="hover:text-gray-300">Terms</Link>
            <a href="https://downloadkart.com" className="hover:text-gray-300">DownloadKart</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
