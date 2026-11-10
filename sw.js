/*
 * Service Worker: macht die Seite offline nutzbar.
 *
 * - Die Seite selbst (HTML, CSS, JS, Icons) wird im internen Speicher der WebApp abgelegt.
 *   Mit Internet wird immer die neueste Version geladen, ohne Internet die gespeicherte.
 * - Audios werden NUR gespeichert, wenn jemand auf „Offline speichern“ tippt (siehe app.js).
 *   Sie liegen dann im Cache "audio-v1" des Browsers, nicht als Dateien in einem Ordner.
 */
var SHELL_CACHE = 'shell-v1';
var AUDIO_CACHE = 'audio-v1';
var SHELL_FILES = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'data.js',
  'manifest.webmanifest',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(function (c) { return c.addAll(SHELL_FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== SHELL_CACHE && k !== AUDIO_CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isAudio(url) {
  return url.hostname === 'codes.cornelsen.de' && url.pathname.indexOf('/codes/assetfiles/') === 0;
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // Audios: gespeicherte Datei verwenden, sonst ganz normal aus dem Netz.
  if (isAudio(url)) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(function (c) {
        return c.match(url.href, { ignoreVary: true }).then(function (hit) {
          return hit || fetch(req);
        });
      })
    );
    return;
  }

  // Eigene Seite: erst Netz (damit Änderungen sofort ankommen), sonst Speicher.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then(function (res) {
        if (res.ok) {
          var copy = res.clone();
          caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (hit) {
          return hit || caches.match('index.html');
        });
      })
    );
  }
});
