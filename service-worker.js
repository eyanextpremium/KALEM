const CACHE_NAME = 'kalem-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/script.js',
  '/manifest.json'
];

// Service Worker Yüklenirken (Install) Dosyaları Önbelleğe Alır
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Kalem: Önbellek oluşturuluyor...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Eski Önbellekleri Temizler (Aktifleştirme Aşaması)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Kalem: Eski önbellek temizleniyor...');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Ağ İsteklerini Yakalar ve Çevrimdışı Çalışmayı Sağlar
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Eğer önbellekte varsa oradan getir, yoksa internetten çek
        return cachedResponse || fetch(event.request);
      }).catch(() => {
        // Eğer internet yoksa ve önbellekte de bulunamadıysa (örneğin dinamik bir API isteği) fallback yapılabilir.
      })
  );
});