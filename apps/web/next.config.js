/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/budget",
        destination: "/budgets",
        permanent: false,
      },
      {
        source: "/report",
        destination: "/reports",
        permanent: false,
      },
      {
        source: "/alert",
        destination: "/alerts",
        permanent: false,
      },
      {
        source: "/provider",
        destination: "/providers",
        permanent: false,
      },
    ];
  },
};
module.exports = nextConfig;
