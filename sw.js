if (typeof idb === "undefined") {
    self.importScripts('lib/idb.js');
}

self.importScripts('js/restaurantStore.js');



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
        // .then(() => createDatabase())
        .then(() => restaurantStore.init())
        .then(() => self.clients.claim())
    )
});


self.addEventListener('sync', (event) => {
   
    if (event.tag === 'add-new-review') {
      console.log('sync event has been triggered');
      event.waitUntil(postReview());
    }
  });

self.addEventListener('fetch', (event) => {
    // Use a cache-first strategy
    // event.respondWith(
    //     fetchFromCache(event)
    //       .catch(() => fetch(event.request))
    //      .then(response => addToCache(staticCacheName, event.request, response))
    // );
  
        // Use a network-first strategy
        if(event.request.url.startsWith("http://localhost:1337")){
            if(event.request.method == "GET"){
                handleGetRequestsToAPIServer(event);
            }
            else{
                fetch(event.request);
            }
            
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


const postReview = async () => {
    const reviews = await restaurantStore.retrieveRecords('unSavedReviews');
    console.log('from idb:', reviews);
    const postReviewUrl = 'http://localhost:1337/reviews/';
    return Promise.all(reviews.map((review) => {
        const tempReviewId = review.review_id;
        delete review.review_id;
        return fetch(postReviewUrl, {
            method: 'POST',
            body: JSON.stringify(review),
            headers: {
                'Content-Type': 'application/json'
            }
          }).then(function(response) {
            console.log('response', response);
            return response.json();
          }).then( async function(savedReview){
            await restaurantStore.deleteRecord('unSavedReviews', tempReviewId);
            await restaurantStore.saveRecords('reviews', savedReview);
          })
          .catch((err) => console.error(err))
    }))
    
  
}

const handleGetRequestsToAPIServer = (event) => {
    const url = new URL(event.request.url);
    const recordStoreName = url.pathname.substring(1, url.pathname.length -1);

    event.respondWith(
        fetch(event.request)
        .then(async (response) => {
            const responseCopy = response.clone();
            const records = await responseCopy.json();
            await restaurantStore.saveRecords(recordStoreName, records);
            return response;
        })
        .catch(async () => {
            //const restaurants = await fetchRestaurantsFromIDB();
            let records = await getRecords(recordStoreName, url);
            const blob = new Blob([JSON.stringify(records, null, 2)], {type : 'application/json'});
            const init = { "status" : 200 , "statusText" : "success" };
            return new Response(blob, init);

            //https://stackoverflow.com/questions/44037816/converting-a-json-object-into-a-response-object
        })
        .catch((error) => console.log(error))
    );
}

getRecords = async (storeName, urlObject) => {
    if(storeName == 'reviews'){
        let records = await restaurantStore.retrieveRecords(storeName);
        let unSavedRecords = await restaurantStore.retrieveRecords('unSavedReviews');
        let allRecords = [...unSavedRecords, ...records];

        if(urlObject.search != ""){
            let params = new URLSearchParams(urlObject.search.substring(1));
            const restaurantId = parseInt(params.get("restaurant_id"));
            allRecords = restaurantStore.findRecords(allRecords, 'restaurant_id', restaurantId);
            return allRecords;
        }
        return allRecords;
    }
    else {
        let records = await restaurantStore.retrieveRecords(storeName);
        return records;
    }
}




