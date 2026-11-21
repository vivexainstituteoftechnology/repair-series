import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // localhost and 127.0.0.1 are different origins. Real Firebase SMS OTP
  // must be tested on 127.0.0.1; allow that host to use the Turbopack HMR socket.
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
  ],
  turbopack: {
    root: rootDir,
  },
  serverExternalPackages: [
    "firebase-admin",
    "jose",
    "jwks-rsa",
    "pdfkit",
    "qrcode",
    "form-data",
    "sharp",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
