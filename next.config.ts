import type { NextConfig } from "next";

const FIREBASE_PROJECT_ID = 'smokeless-3f55d'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://${FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/:path*`,
      },
    ]
  },
}

export default nextConfig;
