// next.config.mjs

const nextConfig = {
  // Enables React strict mode for catching bugs early
  reactStrictMode: true,

  // Proxy API calls to FastAPI backend (avoids CORS in dev)
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;