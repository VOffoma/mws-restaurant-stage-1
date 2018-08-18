let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();
});



/**
 * Register ServiceWorker
 */
registerServiceWorker = () => {
  if(!navigator.serviceWorker) return;
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Registration worked'))
    .catch((error) => console.log(error));
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods()
    .then((neighborhoods) => {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    })
    .catch(error => console.error(error));
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines()
    .then((cuisines) => {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    })
    .catch(error => console.error(error));
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  updateRestaurants();
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: constants.mapboxToken,
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);
 
}


/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
  .then((restaurants) => {
    resetRestaurants(restaurants);
    fillRestaurantsHTML();
  })
  .catch(error => console.error(error));

}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  
  self.restaurants = [];
  const div = document.getElementById('restaurants-list');
  div.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const div = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    div.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const article = document.createElement('article');

  const image = document.createElement('img');
  image.alt = '';
  image.className = 'restaurant-img';
  // image.src = DBHelper.imageUrlForRestaurant(restaurant);
  const {sourceSet, sizes, src} = getImageSourceSetAndSizes(restaurant);
  image.srcset = sourceSet;
  image.sizes = sizes;
  image.src = src;
  
  const imageDiv = document.createElement('div');
  imageDiv.append(image)
  article.append(imageDiv);

  const detailsDiv = document.createElement('div');

  
  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  detailsDiv.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  detailsDiv.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  detailsDiv.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', `View details for ${restaurant.name} restaurant`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  detailsDiv.append(more)

  article.append(detailsDiv);
  return article;
}


 /**
   * get srcset and sizes for responsive images
   */
  getImageSourceSetAndSizes = (restaurant) => {
    let image = restaurant.photograph;
    let imageName = image.substring(0, image.lastIndexOf('.'));
    let sourceSet = `/images/${imageName}-150_small.jpg 150w, /images/${imageName}-270_medium.jpg 270w, /images/${imageName}-540_large.jpg 540w`;
    let sizes = "(max-width: 659px) 133px, (max-width: 760px) 240px,  (min-width: 760px) 270px";
    let src = `/images/${imageName}-540_large.jpg`;
    return {sourceSet, sizes, src};
    
  }

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

} 


