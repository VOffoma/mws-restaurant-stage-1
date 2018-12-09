/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Server URL.
   */

  static get SERVER_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static async fetchRestaurants() {
    try{
      const response = await fetch(`${DBHelper.SERVER_URL}/restaurants/`);
      const jsonResponse = await response.json();
      return jsonResponse;
    }
    catch(error) {
        const errorMessage = (`Request failed. Returned status of ${error.status}`);
        return errorMessage;
    }
  }

  /**
   * Fetch all restaurants.
   */
  static async updateFavoriteState(restaurantId, isFavorite) {
    try{   
      const url = `${DBHelper.SERVER_URL}/restaurants/${restaurantId}/?is_favorite=${isFavorite}`;
      const response = await fetch(url, {method: 'PUT'});
      const jsonResponse = await response.json();
      return jsonResponse;
    }
    catch(error) {
        const errorMessage = (`Request failed. Returned status of ${error.status}`);
        return errorMessage;
    }
  }

   /**
   * Fetch all restaurants.
   */
  static async fetchReviewsByRestaurant(restaurantId) {
    try{
      const response = await fetch(`${DBHelper.SERVER_URL}/reviews/?restaurant_id=${restaurantId}`);
      const jsonResponse = await response.json();
      return jsonResponse;
    }
    catch(error) {
        const errorMessage = (`Request failed. Returned status of ${error.status}`);
        return errorMessage;
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static async fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.

     try {
      const restaurants = await DBHelper.fetchRestaurants();
      const restaurant = restaurants.find(r => r.id == id);
      return restaurant;
     } catch (error) {
       return 'Restaurant does not exist';
     }
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static async fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    try {
      const restaurants = await DBHelper.fetchRestaurants();
      const results = restaurants.filter(r => r.cuisine_type == cuisine);
      return results;
     } catch (error) {
       return error;
     }
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
 
  static async fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    try {
      const restaurants = await DBHelper.fetchRestaurants();
      const results = restaurants.filter(r => r.neighborhood == neighborhood);
      return results;
     } catch (error) {
       return error;
     }
  }


  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */

  static async fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    try {
      const restaurants = await DBHelper.fetchRestaurants();
      let results = restaurants;
      if (cuisine != 'all') { // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != 'all') { // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood);
      }
      return results;
     } catch (error) {
       return error;
     }
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */

  static async fetchNeighborhoods(callback) {
    // Fetch all restaurants
    try {
      const restaurants = await DBHelper.fetchRestaurants();
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
      return uniqueNeighborhoods;
     } catch (error) {
       return error;
     }
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
 
  static async fetchCuisines(callback) {
    // Fetch all restaurants
    try {
      const restaurants = await DBHelper.fetchRestaurants();
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
      return uniqueCuisines;
     } catch (error) {
       return error;
     }
  
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

 

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */


}



