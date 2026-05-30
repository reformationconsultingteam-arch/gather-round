#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const INDEX = path.join(DIST, 'index.html');
const FALLBACK = path.join(DIST, '404.html');

const BASE_URL = '/gather-round';

const HEAD_INJECT = `
    <link rel="manifest" href="${BASE_URL}/manifest.json" />
    <link rel="apple-touch-icon" href="${BASE_URL}/icons/icon-192.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Gather Round" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="description" content="Track your family game-night sessions, scores, and stats." />
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('${BASE_URL}/sw.js').then(function (reg) {
            // A worker is "ready to take over" when it reaches installed state while another
            // worker already controls the page (i.e. a genuine update, not the first install).
            function notifyReady(worker) {
              if (!worker || !navigator.serviceWorker.controller) return;
              window.__swWaiting = worker;
              window.dispatchEvent(new CustomEvent('swUpdateReady'));
            }
            if (reg.waiting) notifyReady(reg.waiting);
            reg.addEventListener('updatefound', function () {
              var installing = reg.installing;
              if (!installing) return;
              installing.addEventListener('statechange', function () {
                if (installing.state === 'installed') notifyReady(reg.waiting || installing);
              });
            });
          }).catch(function () {});

          // When the new worker activates, reload once so the page runs the fresh assets.
          var refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
          });
        });
      }
    </script>
`;

if (!fs.existsSync(INDEX)) {
  console.error(`inject-pwa-head: ${INDEX} not found. Run \`expo export -p web\` first.`);
  process.exit(1);
}

let html = fs.readFileSync(INDEX, 'utf8');

if (html.includes('rel="manifest"')) {
  console.log('inject-pwa-head: manifest already linked, skipping.');
} else {
  html = html.replace('</head>', `${HEAD_INJECT}  </head>`);
  fs.writeFileSync(INDEX, html, 'utf8');
  console.log('inject-pwa-head: injected PWA head tags into index.html');
}

fs.writeFileSync(FALLBACK, html, 'utf8');
console.log('inject-pwa-head: wrote SPA fallback 404.html');
