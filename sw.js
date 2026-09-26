const CACHE_NAME = "jtkviz-cache-v7";

const ASSETS_TO_CACHE = [
    "./",
    "index.html",
    "style.css",
    "mobil.css",
    "manifest.json",
    "js/kerdesek.js",
    "js/ui.js",
    "js/game-core.js",
    "js/events.js",
    "js/player.js",
    "jtkviz-hatter.jpg",
	"ikon.jpg",
	"ikon-192.png",
	"ikon-512.png"
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return Promise.all(
                ASSETS_TO_CACHE.map(function (url) {
                    return cache.add(url).catch(function (err) {
                        console.warn("Nem sikerült előre gyorsítótárazni:", url, err);
                    });
                })
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (key) {
                    return key !== CACHE_NAME;
                }).map(function (key) {
                    return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", function (event) {
    const url = new URL(event.request.url);

    if (event.request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(event.request).then(function (response) {
            if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, responseClone);
                });
            }
            return response;
        }).catch(function () {
            return caches.match(event.request);
        })
    );
});
/* ----------------------------------------------------------------------------------------------------------------------------------
Amikor legközelebb módosítod bármelyik fájlt (CSS, JS), változtasd meg a CACHE_NAME értékét (pl. "jtkviz-cache-v2") — az activate esemény ez alapján dobja ki a régi cache-t, és tölti be helyette a frisset. Ha ezt elfelejted, a felhasználó a régi, cache-elt verziót fogja kapni akkor is, ha újra feltöltöd a friss fájlokat — ez a leggyakoribb "miért nem látom a változást" hiba PWA-knál.
----------------------------------------------------------------------------------------------------------------------------------- */