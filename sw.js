if (typeof idb === "undefined") {
    self.importScripts('lib/idb.js');
}


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
        })
        .then(() => createDatabase())
        .then(() => self.clients.claim())
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
        if(event.request.url == "http://localhost:1337/restaurants"){
            event.respondWith(
                fetch(event.request)
                .then(async (response) => {
                    const responseCopy = response.clone();
                    const restaurants = await responseCopy.json();
                    await addRestaurantsToIDB(restaurants);
                    return response;
                })
                .catch(async () => {
                    const restaurants = await fetchRestaurantsFromIDB();
                    const blob = new Blob([JSON.stringify(restaurants, null, 2)], {type : 'application/json'});
                    const init = { "status" : 200 , "statusText" : "success" };
                    return new Response(blob, init);

                    //https://stackoverflow.com/questions/44037816/converting-a-json-object-into-a-response-object
                })
                .catch((error) => console.log(error))
            );
        }
        else{
            event.respondWith(
                fetch(event.request)
                .then(response => addToCache(dynamicCache, event.request, response))
                .catch(() => fetchFromCache(event))
            );
        }
   
});


const addToCache = (cacheKey, request, response) => {
      const responseCopy = response.clone();
      caches.open(cacheKey).then(cache => cache.put(request, responseCopy));
      return response;
}

const fetchFromCache = (event) => {
    return caches.match(event.request).then(response => response); 
}

const createDatabase = () => {
    idb.open('restaurant-data', 1, (upgradeDb) => {
        const restaurantListStore = upgradeDb.createObjectStore('restaurantList', {
            keyPath: 'id',
        });
        restaurantListStore.createIndex('id', 'id');
    });
}

const addRestaurantsToIDB = async (restaurants) => {
    let db = await idb.open('restaurant-data', 1);
    const tx = db.transaction('restaurantList', 'readwrite');
    const store = tx.objectStore('restaurantList');

    for(let i in restaurants){
        await store.put(restaurants[i]);
    }
    return tx.complete;
}


const fetchRestaurantsFromIDB = async () => {
    let db = await idb.open('restaurant-data', 1);
    const tx = db.transaction('restaurantList');
    const store = tx.objectStore('restaurantList');

    let restaurants = await store.getAll();
    db.close();
    return restaurants;
}


