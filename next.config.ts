import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  // @ts-ignore
  ...(process.env.NETLIFY ? {} : {
    turbopack: {
      root: "C:\\Users\\User\\Documents\\CRM\\paint-crm-web",
    },
  })
};

export default nextConfig;
