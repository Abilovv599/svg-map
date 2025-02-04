import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: {
        loader: "@svgr/webpack",
        options: {
          svgoConfig: {
            plugins: [
              {
                name: "prefixIds",
                params: {
                  prefixIds: false,
                  prefixClassNames: false
                }
              },
            ],
          },
        },
      },
    });

    return config;
  },
};

export default nextConfig;
