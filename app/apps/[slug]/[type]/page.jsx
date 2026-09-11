import connectDB from '@/lib/mongodb';
import AppPolicy from '@/models/AppPolicy';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// Helper to sanitize HTML if needed, though we assume admin input is safe
export async function generateMetadata({ params }) {
  const { slug, type } = params;
  if (!['privacy', 'terms'].includes(type)) return { title: 'Not Found' };

  await connectDB();
  const policy = await AppPolicy.findOne({ slug }).lean();
  
  if (!policy) return { title: 'Not Found' };

  const typeName = type === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions';
  return {
    title: `${typeName} - ${policy.appName}`,
    description: `${typeName} for ${policy.appName}`,
  };
}

export default async function AppLegalPage({ params }) {
  const { slug, type } = params;
  
  if (!['privacy', 'terms'].includes(type)) {
    notFound();
  }

  await connectDB();
  const policy = await AppPolicy.findOne({ slug }).lean();

  if (!policy) {
    notFound();
  }

  const isPrivacy = type === 'privacy';
  const documentTitle = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';
  const content = isPrivacy ? policy.privacyPolicy : policy.termsConditions;
  const lastUpdated = new Date(policy.updatedAt || policy.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-200">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
            {policy.appName}
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-700 mb-6">
            {documentTitle}
          </h2>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </p>
        </header>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-10 border-b border-gray-200">
          <Link 
            href={`/apps/${slug}/privacy`}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${isPrivacy ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Privacy Policy
          </Link>
          <Link 
            href={`/apps/${slug}/terms`}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${!isPrivacy ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Terms & Conditions
          </Link>
        </div>

        {/* Content */}
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100 prose prose-blue max-w-none">
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <p className="text-gray-500 italic text-center py-10">No content provided for {documentTitle.toLowerCase()}.</p>
          )}
        </div>

        {/* Footer / Contact */}
        {policy.contactEmail && (
          <div className="mt-12 text-center text-sm text-gray-600 bg-gray-100 p-6 rounded-xl">
            <p className="font-medium mb-1">Questions or concerns?</p>
            <p>Contact us at: <a href={`mailto:${policy.contactEmail}`} className="text-blue-600 hover:underline font-medium">{policy.contactEmail}</a></p>
          </div>
        )}
      </div>
    </div>
  );
}
