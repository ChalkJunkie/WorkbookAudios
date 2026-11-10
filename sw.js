/*
 * Die Offline-Funktion wurde wieder entfernt.
 * Dieser Service Worker räumt nur noch auf: Er löscht alle gespeicherten Daten
 * und meldet sich selbst ab, damit Geräte, die die Testversion geöffnet haben,
 * wieder ganz normal die aktuelle Seite laden.
 */
self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
  );
});
