import type { NextConfig } from "next";

import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());

const nextConfig: NextConfig = {};

export default nextConfig;
