module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{html,js,css,png,jpg,jpeg,gif,svg,webp,woff,woff2,ttf,otf,json,ico,webmanifest}',
  ],
  swDest: 'dist/sw.js',
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  // Wait instead of activating mid-session, so the app can prompt the user to reload into the
  // new version. With skipWaiting:false, generateSW emits a SKIP_WAITING message listener that
  // the page posts to (via UpdateBanner) to activate the waiting worker on demand.
  skipWaiting: false,
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
