import connectDB from "@/lib/mongodb";
import Blog from "@/models/Blog";
import Navbar from "@/components/Navbar";
import SmartImage from "@/components/SmartImage";
import ThemeToggle from "@/components/ThemeToggle";
import { renderBlogContentWithProductImages, resolveBlogFeaturedImage } from "@/lib/blog-product-images";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, User, Share2 } from "lucide-react";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://downloadkart.in").replace(/\/+$/, "");

  try {
    await connectDB();
    const blog = await Blog.findOne({ slug, status: true }).populate('product_id', 'name images').lean();

    if (!blog) {
      return {
        title: "Article Not Found | DownloadKart",
        description: "The requested blog article could not be found.",
      };
    }

    const cleanDesc = blog.excerpt || "Premium creator strategy guide and tutorials.";
    const resolvedImage = resolveBlogFeaturedImage(blog);

    return {
      title: `${blog.title} | DownloadKart`,
      description: cleanDesc,
      openGraph: {
        title: `${blog.title} | DownloadKart`,
        description: cleanDesc,
        url: `${baseUrl}/blog/${blog.slug}`,
        images: [
          {
            url: resolvedImage || "",
            width: 1200,
            height: 630,
            alt: blog.title,
          }
        ],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: blog.title,
        description: cleanDesc,
        images: [resolvedImage || ''],
      }
    };
  } catch (error) {
    console.error("Error generating blog metadata:", error);
    return {
      title: "Blog Guide | DownloadKart",
    };
  }
}

export default async function BlogDetailsPage({ params }) {
  const { slug } = await params;
  await connectDB();
  
  const blog = await Blog.findOne({ slug, status: true }).populate('product_id', 'name images').lean();

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#0a0a0f] text-white p-6 font-sans">
        <h1 className="text-2xl font-bold mb-4">404 - Article Not Found</h1>
        <p className="text-gray-400 mb-8">The blog article you are looking for does not exist or has been removed.</p>
        <Link href="/blog" className="bg-[#f5c842] text-[#0a0a0f] px-6 py-3 rounded-full no-underline font-bold font-syne hover:scale-105 transition-transform">Back to Blogs</Link>
      </div>
    );
  }

  const pubDate = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  }) : 'Recently';
  const resolvedFeaturedImage = resolveBlogFeaturedImage(blog);
  const renderedContent = renderBlogContentWithProductImages(blog.content, blog.product_id);

  // Inject dynamic structured Article JSON-LD
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://downloadkart.in").replace(/\/+$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "image": resolvedFeaturedImage || "",
    "datePublished": blog.createdAt ? new Date(blog.createdAt).toISOString() : new Date().toISOString(),
    "dateModified": blog.updatedAt ? new Date(blog.updatedAt).toISOString() : new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": blog.author || "Admin"
    },
    "description": blog.excerpt,
    "url": `${baseUrl}/blog/${blog.slug}`
  };

  const hasFaqs = Array.isArray(blog.faqs) && blog.faqs.length > 0;
  const faqJsonLd = hasFaqs ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": blog.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <div className="theme-page font-dm min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        {/* Nav */}
        <nav className="sticky top-0 z-[100] border-b border-[#f5c842]/10 bg-[var(--nav-bg)] px-6 py-4 backdrop-blur-xl shrink-0">
          <div className="mx-auto flex max-w-[1152px] items-center justify-between gap-4">
            <Link
              href="/"
              className="shrink truncate font-syne text-xl font-bold text-[#f5c842] no-underline flex items-center gap-2"
            >
              <span>DownloadKart</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/blog" className="theme-link text-sm no-underline">← Blogs</Link>
              <Link href="/" className="theme-link text-sm no-underline">Store</Link>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Article content block */}
        <main className="flex-grow w-full max-w-[800px] mx-auto px-6 py-10 md:py-16">
          
          {/* Back button */}
          <Link href="/blog" className="theme-link no-underline inline-flex items-center gap-2 text-xs sm:text-sm mb-8 font-sans">
            <ArrowLeft size={16} /> Back to Learning Hub
          </Link>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs text-[var(--muted-2)] font-semibold mb-5 font-sans">
            <span className="flex items-center gap-1.5"><User size={14} className="text-[#f5c842]" /> By {blog.author}</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-[#f5c842]" /> {pubDate}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-[#f5c842]" /> {blog.read_time} min read</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-white font-syne leading-tight tracking-tight mb-6">
            {blog.title}
          </h1>

          {/* Excerpt */}
          <p className="text-gray-400 text-base sm:text-lg italic border-l-4 border-[#f5c842] pl-4 py-1.5 mb-10 leading-relaxed font-sans">
            {blog.excerpt}
          </p>

          {/* Featured Image */}
          {resolvedFeaturedImage && (
            <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden border border-[#f5c842]/15 mb-12 shadow-2xl">
              <SmartImage
                src={resolvedFeaturedImage}
                alt={blog.title}
                width={1200}
                loading="eager"
                fetchPriority="high"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Main Rich Content HTML Body */}
          <div 
            className="prose prose-invert max-w-none text-gray-300 leading-relaxed font-sans text-sm sm:text-base space-y-6"
            style={{
              "--tw-prose-headings": "var(--heading)",
              "& h2": { fontFamily: "Syne, sans-serif", fontWeight: 700, color: "white", marginTop: "2rem", marginBottom: "1rem" }
            }}
          >
            {/* Custom styling inject for HTML blocks */}
            <style>{`
              .blog-rich-content h2, .blog-rich-content h3 { font-family: 'Syne', sans-serif; font-weight: 700; color: white; margin-top: 2rem; margin-bottom: 1rem; }
              .blog-rich-content h2 { font-size: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.5rem; }
              .blog-rich-content h3 { font-size: 1.25rem; }
              .blog-rich-content p { margin-bottom: 1.5rem; line-height: 1.75; }
              .blog-rich-content ul, .blog-rich-content ol { padding-left: 1.5rem; margin-bottom: 1.5rem; list-style-position: outside; }
              .blog-rich-content ul { list-style-type: disc; }
              .blog-rich-content ol { list-style-type: decimal; }
              .blog-rich-content li { margin-bottom: 0.5rem; line-height: 1.6; }
              .blog-rich-content a { color: #f5c842; font-weight: 600; text-decoration: underline; transition: color 0.2s; }
              .blog-rich-content a:hover { color: #e0a800; }
              .blog-rich-content blockquote { font-style: italic; border-left: 4px solid #f5c842; padding-left: 1rem; margin: 1.5rem 0; color: #a1a1aa; }
              .blog-rich-content img { border-radius: 1rem; border: 1px solid rgba(255,255,255,0.08); margin: 1.5rem 0; max-width: 100%; height: auto; }
            `}</style>
            
            <div 
              className="blog-rich-content"
              dangerouslySetInnerHTML={{ __html: renderedContent }} 
            />
          </div>

          {/* Conversational FAQ SGE Accordion Section */}
          {hasFaqs && (
            <div className="mt-16 border-t border-white/5 pt-12">
              <h2 className="text-xl sm:text-2xl font-bold font-syne text-white tracking-tight mb-6 flex items-center gap-2">
                ❓ Frequently Asked Questions
              </h2>
              <div className="flex flex-col gap-4 font-sans">
                {blog.faqs.map((faq, index) => (
                  <details 
                    key={index} 
                    className="group border border-white/5 bg-[#0e0e18]/20 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#f5c842]/20 hover:shadow-[0_4px_20px_rgba(245,200,66,0.03)]"
                  >
                    <summary className="flex justify-between items-center cursor-pointer p-5 select-none list-none outline-none">
                      <span className="text-sm sm:text-base font-syne font-bold text-gray-200 transition-colors group-hover:text-white">
                        {faq.question}
                      </span>
                      <span className="text-[#f5c842] text-sm shrink-0 transition-transform duration-300 group-open:rotate-180 select-none">
                        ▼
                      </span>
                    </summary>
                    <div className="p-5 pt-0 text-xs sm:text-sm text-gray-400 border-t border-white/5 leading-relaxed bg-white/[0.01]">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Promotional Marketing Banner */}
          <div className="mt-16 bg-gradient-to-br from-[#f5c842]/10 to-[#e0a800]/5 border border-[#f5c842]/20 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f5c842]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex-1">
              <h3 className="font-syne font-bold text-white text-lg sm:text-xl mb-2 flex items-center gap-2">🚀 Ready to scale your business?</h3>
              <p className="text-gray-400 text-xs sm:text-sm max-w-[480px] leading-relaxed">
                Explore our catalog of highly premium templates, bundles, and growth resources designed to save you hours of work!
              </p>
            </div>
            <Link 
              href="/"
              className="bg-gradient-to-br from-[#f5c842] to-[#e0a800] text-[#0a0a0f] font-syne font-bold border-none px-6 py-3.5 rounded-xl text-xs sm:text-sm no-underline shadow-lg shadow-[#f5c842]/20 hover:scale-105 active:scale-95 transition-all text-center shrink-0 w-full md:w-auto"
            >
              Browse Store →
            </Link>
          </div>

        </main>

        {/* Footer */}
        <footer className="border-t border-[#f5c842]/15 bg-[var(--bg)] px-6 py-8 shrink-0">
          <div className="mx-auto max-w-[1152px] text-center text-xs text-[var(--muted-2)]">
            <p>© {new Date().getFullYear()} DownloadKart. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
