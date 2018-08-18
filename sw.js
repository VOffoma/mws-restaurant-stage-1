const filesToCache = [
    './',
    './index.html',
    './restaurant.html',
    './css/styles.css',
    './css/responsive.css',
    './js/constants.js',
    './js/dbhelper.js',
    './js/main.js',
    './js/restaurant_info.js'
];

const staticCache = 'restaurant-static-cache';
const dynamicCache = 'restaurant-dynamic-cache'
const cacheList = [staticCache, dynamicCache];

/**
 * Cache the site's assets when the service worker installs
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(staticCache)
            .then((cache) => {
                return cache.addAll(filesToCache);
            })
            .then(() => {
                self.skipWaiting();
            })
            .catch((error) => {
                console.log(error);
            })
    );
});

/**
 * Delete every cache that is not for the app when the serviceworker activates
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                if(cacheList.indexOf(cache) == -1){
                    return caches.delete(cache);
                }
            })
            );
        }).then(() => self.clients.claim())
    )
});


self.addEventListener('fetch', (event) => {
    // Use a cache-first strategy
    // event.respondWith(
    //     fetchFromCache(event)
    //       .catch(() => fetch(event.request))
    //      .then(response => addToCache(staticCacheName, event.request, response))
    // );

    // Use a network-first strategy
    event.respondWith(
        fetch(event.request)
        .then(response => addToCache(dynamicCache, event.request, response))
        .catch(() => fetchFromCache(event))
      );
});


function addToCache(cacheKey, request, response){
      const responseCopy = response.clone();
      caches.open(cacheKey).then(cache => cache.put(request, responseCopy));
      return response;
}

function fetchFromCache(event){
    return caches.match(event.request).then(response => response); 
}

