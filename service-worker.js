// ================= Service Worker =================
const CACHE_NAME = 'timetable-v1.3.0';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './styles/main.css',
    './styles/splash.css',
    './styles/themes/dark.css',
    './styles/themes/light.css',
    './styles/components/cards.css',
    './styles/components/buttons.css',
    './styles/components/animations.css',
    './styles/pages/menu.css',
    './styles/pages/schedule.css',
    './styles/pages/realtime.css',
    './scripts/main.js',
    './scripts/utils/time.js',
    './scripts/utils/storage.js',
    './scripts/modules/search/search.js',
    './scripts/modules/search/search.css',
    './scripts/modules/theme/theme.js',
    './scripts/modules/theme/theme.css',
    './scripts/modules/weekly/weekly.js',
    './scripts/modules/weekly/weekly.css',
    './scripts/modules/holidays/holidays.js',
    './scripts/modules/holidays/holidays.css',
    './scripts/modules/animations/animations.js',
    './scripts/modules/expand/expand.js',
    './scripts/modules/expand/expand.css',
    './scripts/modules/calendar/calendar.js',
    './scripts/modules/calendar/calendar.css',
    './scripts/modules/homework/homework.js',
    './scripts/modules/homework/homework.css',
    './data/schedule.json',
    './data/holidays.json',
    './data/events.json',
    './data/homework.json',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png'
];

// 安裝：快取所有檔案
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('已開啟快取');
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

// 啟用：清除舊快取
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('刪除舊快取:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 攔截請求：優先使用快取，然後更新
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            });
        })
    );
});