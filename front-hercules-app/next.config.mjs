/** @type {import('next').NextConfig} */
const backendUrl = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

const nextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
