/** @type {import('next').NextConfig} */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost")
      .hostname;
  } catch {
    return "localhost";
  }
})();

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Macro binaries (.zip, .exe) can exceed the default 1MB server-action
      // body limit. Bump to 50MB; upload larger files via the Supabase
      // dashboard and set file_path manually.
      bodySizeLimit: "50mb",
    },
  },
};

module.exports = nextConfig;
