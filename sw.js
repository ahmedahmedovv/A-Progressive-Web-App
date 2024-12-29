const CACHE_NAME = 'habit-tracker-v1';
const CACHE_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(CACHE_ASSETS);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch Event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

// Improved badge update handling
self.addEventListener('sync', event => {
    if (event.tag === 'update-badge') {
        event.waitUntil(updateBadgeCount());
    }
});

async function updateBadgeCount() {
    try {
        // Get habits from localStorage instead of cache
        const habits = JSON.parse(localStorage.getItem('habits')) || [];
        const today = new Date().toDateString();
        const uncompleted = habits.filter(h => !h.dates[today]).length;
        
        if ('ExperimentalBadge' in self) {
            // Chrome implementation
            await self.ExperimentalBadge.set(uncompleted);
        } else if ('setAppBadge' in navigator) {
            // Standard implementation
            if (uncompleted > 0) {
                await navigator.setAppBadge(uncompleted);
            } else {
                await navigator.clearAppBadge();
            }
        }
    } catch (error) {
        console.error('Error updating badge:', error);
    }
}

// Add periodic badge updates
self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-badge') {
        event.waitUntil(updateBadgeCount());
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // Handle notification click
    event.waitUntil(
        clients.matchAll({
            type: 'window'
        }).then(function(clientList) {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
}); 