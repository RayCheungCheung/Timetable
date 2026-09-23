// ================= Service Worker =================
const CACHE_NAME = 'timetable-v1.2.01';
const urlsToCache = [
    '/Timetable/',
    '/Timetable/index.html',
    '/Timetable/manifest.json',
    '/Timetable/styles/main.css',
    '/Timetable/styles/themes/dark.css',
    '/Timetable/styles/themes/light.css',
    '/Timetable/styles/components/cards.css',
    '/Timetable/styles/components/buttons.css',
    '/Timetable/styles/components/animations.css',
    '/Timetable/styles/pages/menu.css',
    '/Timetable/styles/pages/schedule.css',
    '/Timetable/styles/pages/realtime.css',
    '/Timetable/scripts/main.js',
    '/Timetable/scripts/utils/time.js',
    '/Timetable/scripts/utils/storage.js',
    '/Timetable/scripts/modules/search/search.js',
    '/Timetable/scripts/modules/search/search.css',
    '/Timetable/scripts/modules/theme/theme.js',
    '/Timetable/scripts/modules/theme/theme.css',
    '/Timetable/scripts/modules/weekly/weekly.js',
    '/Timetable/scripts/modules/weekly/weekly.css',
    '/Timetable/scripts/modules/holidays/holidays.js',
    '/Timetable/scripts/modules/holidays/holidays.css',
    '/Timetable/scripts/modules/animations/animations.js',
    '/Timetable/scripts/modules/expand/expand.js',
    '/Timetable/scripts/modules/expand/expand.css',
    '/Timetable/scripts/modules/calendar/calendar.js',
    '/Timetable/scripts/modules/calendar/calendar.css',
    '/Timetable/scripts/modules/homework/homework.js',
    '/Timetable/scripts/modules/homework/homework.css',
    '/Timetable/data/schedule.json',
    '/Timetable/data/holidays.json',
    '/Timetable/data/events.json',
    '/Timetable/data/homework.json',
    '/Timetable/assets/icons/icon-192.png',
    '/Timetable/assets/icons/icon-512.png'
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