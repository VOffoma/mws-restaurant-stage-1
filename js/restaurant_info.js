let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', async (event) => {  
  initMap();
  fetchReviewsFromURL();
  navigator.serviceWorker.getRegistration().then(function(registration) {
  // navigator.serviceWorker.ready.then(function(registration) {
    if(registration && ('sync' in registration)){
      registration.sync.register('test');

      const reviewForm = document.getElementById('reviewForm');
      const nameField = document.getElementById('reviewer');
      const commentField = document.getElementById('comment');
      const ratingField = document.getElementById('rating'); 
    
      reviewForm.addEventListener('submit', function(event){
        event.preventDefault();
        const modal = document.getElementById('myModal');
        const newReview = {
          restaurant_id: getParameterByName('id'),
          name: nameField.value,
          comments: commentField.value,
          rating: ratingField.value,
        };

      
        console.log(newReview);
        
        restaurantStore.saveRecords('unSavedReviews', newReview).then(() => {
          commentField.value = "";
          nameField.value = "";
          ratingField.value = "";
          modal.style.display='none'
          return registration.sync.register('add-new-review');
        })
        // .then((result) => {
        //   console.log(result);
        // })
        .then(() => {
           displayNewReview(newReview);
        })
        .catch(function(err) {
          console.error(err);
        });

      });
    }
  }).catch((err) => {
    console.error(err); 
  });

});


/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL()
    .then((restaurant) => {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    })
    .catch((error) => console.error(error));
}  

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = async () => {
  try {
    if (self.restaurant) { // restaurant already fetched!
      return self.restaurant;
    }
    const id = getParameterByName('id');
    if(!id) throw 'No restaurant id in URL'; // no id found in URL
    const restaurant = await DBHelper.fetchRestaurantById(id);
    self.restaurant = restaurant;
    fillRestaurantHTML();
    return restaurant;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Get current restaurant from page URL.
 */
fetchReviewsFromURL = async () => {
  try {
    const id = getParameterByName('id');
    if(!id) throw 'No restaurant id in URL'; // no id found in URL
    const reviews = await DBHelper.fetchReviewsByRestaurant(id);
    fillReviewsHTML(reviews);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.alt = restaurant.name;
  image.className = 'restaurant-img'
  // image.src = DBHelper.imageUrlForRestaurant(restaurant);
  const {sourceSet, src} = getImageSourceSetAndSrc(restaurant);
  image.srcset = sourceSet;
  image.src = src;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  const favoriteToggle = fillFavoriteToggleControl(restaurant.is_favorite);
  cuisine.appendChild(favoriteToggle);
  

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  // const favoriteToggle = document.getElementById('favorite-toggle');
  // if(restaurant.is_favorite){
  //   favoriteToggle.checked = favoriteToggle.value = restaurant.is_favorite;
  // }
  // else{
  //   favoriteToggle.checked = favoriteToggle.value = false;
  // }
  
  
  // fill reviews
  //fillReviewsHTML();
}

fillFavoriteToggleControl =  (isFavorite) => {
  const span = document.createElement('span');
  span.setAttribute('id', 'favoriteState');

  const input = document.createElement('input');
  input.setAttribute('type', 'checkbox');
  input.setAttribute('id', 'favorite-toggle');

  if(isFavorite != null){
    input.checked = input.value = isFavorite;
  }
  else{
    input.checked = input.value = false;
  }
  
  input.onclick = toggleFavoriteState;

  const label = document.createElement('label');
  label.setAttribute('for', 'favorite-toggle');

  const i = document.createElement('i');
   i.className = "fas fa-heart";
   label.appendChild(i);

   span.appendChild(input);
   span.appendChild(label);
   return span;

}

 /**
   * get srcset and sizes for responsive images
   */
  getImageSourceSetAndSrc = (restaurant) => {
    let image = restaurant.photograph;
    let sourceSet = `images/${image}-270_medium.jpg , images/${image}-540_large.jpg 2x`;
    let src = `images/${image}-540_large.jpg`;
    return {sourceSet, src};
    
  }
 

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');
  // const title = document.createElement('h3');
  // title.innerHTML = 'Reviews';
  // container.appendChild(title);


  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
 
  const div = document.getElementById('reviews-list');
  reviews.forEach(review => {
    div.appendChild(createReviewHTML(review));
  });
  container.appendChild(div);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const article = document.createElement('article');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  article.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  article.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  article.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  article.appendChild(comments);

  return article;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

displayNewReview = (newReview) => {
  const firstReview = document.querySelector('#reviews-list article');
  const parentDiv = firstReview.parentNode;
  const newReviewHTML = createReviewHTML(newReview);
  parentDiv.insertBefore(newReviewHTML, firstReview);
}

/**
 * 
 */

toggleFavoriteState = () => {
  const favoriteToggle = document.getElementById('favorite-toggle');
  const isFavorite = favoriteToggle.checked;
  const restaurantId = getParameterByName('id');
  DBHelper.updateFavoriteState(restaurantId, isFavorite).then(() => {
    favoriteToggle.value = isFavorite;

  })
  .catch((error) => console.error(error));
  // console.log(isFavorite, favoriteToggle.value);
}
          
