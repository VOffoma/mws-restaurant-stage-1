const filesToCache = [
    './',
    './index.html',
    './restaurant.html',
    './css/styles.css',
    './js/constants.js',
    './js/dbhelper.js',
    './js/main.js',
    './js/restaurant_info.js',
    './img/1.jpg',
    './img/2.jpg',
    './img/3.jpg',
    './img/4.jpg',
    './img/5.jpg',
    './img/6.jpg',
    './img/7.jpg',
    './img/8.jpg',
    './img/9.jpg',
    './img/10.jpg'
];

const staticCacheName = 'restaurant-reviews-cache';
const cacheList = [staticCacheName];

/**
 * Cache the site's assets when the service worker installs
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(staticCacheName)
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
 * Delete every cache that is not that for the app when the serviceworker activates
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
    event.respondWith(
        fetchFromCache(event)
          .catch(() => fetch(event.request))
         .then(response => addToCache(staticCacheName, event.request, response))
    );
});


function addToCache(cacheKey, request, response){
    if(response && response.ok){
      const responseCopy = response.clone();
      caches.open(cacheKey).then(cache => cache.put(request, responseCopy));
      return response;
    } else {
        console.error("there is a issue with : ", request);
    }
}

function fetchFromCache(event){
    console.log('from cache', event.request.url);
    return caches.match(event.request).then(response => response); 
}

