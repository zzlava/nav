/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // 排除 source map 文件
    config.module.rules.push({
      test: /\.map$/,
      use: 'ignore-loader'
    });

    // 处理 chrome-aws-lambda
    if (isServer) {
      config.externals.push('chrome-aws-lambda');
    }

    return config;
  },
}

module.exports = nextConfig 