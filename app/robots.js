export default function robots() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.downloadkart.com").replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/cart",
        "/my-downloads",
        "/my-orders",
        "/download",
        "/forgot-password",
        "/login",
        "/register",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
