/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ['mongoose', 'bcryptjs', 'razorpay'],
}

module.exports = nextConfig
