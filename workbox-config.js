module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{html,js,css,png,jpg,jpeg,gif,svg,webp,woff,woff2,ttf,otf,json,ico,webmanifest}',
  ],
  swDest: 'dist/sw.js',
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  navigateFallback: 'index.html',
  navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
  runtimeCaching: [
    {
      urlPattern: /\.(?:woff2?|ttf|otf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts',
        expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
  ],
};
