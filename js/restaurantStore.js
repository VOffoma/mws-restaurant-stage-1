const restaurantStore = {
    db: null,
  
    init: function() {
      if (this.db) { return Promise.resolve(this.db); }
      return idb.open('restaurant-data', 1, function(upgradeDb) {
        const restaurantListStore = upgradeDb.createObjectStore('restaurants', { keyPath: 'id'});
        upgradeDb.createObjectStore('reviews', { keyPath: 'id'});
        upgradeDb.createObjectStore('unSavedReviews', {autoIncrement : true, keyPath: 'review_id' });
        restaurantListStore.createIndex('id', 'id');
      }).then(function(db) {
        return this.db = db;
      });
    },

    saveRecords: async function(recordStore, data) {
      let db = await this.init();
      const tx = db.transaction(recordStore, 'readwrite');
      const store = tx.objectStore(recordStore);
      if(!Array.isArray(data)){
        store.put(data);
      }
      else{
        for(let i in data){
          await store.put(data[i]);
        }
      }
      return tx.complete;
    },

    retrieveRecords: async function(recordStore){
      let db = await this.init();
      const tx = db.transaction(recordStore);
      const store = tx.objectStore(recordStore);
      const records =  await store.getAll();
      return records;
    },

    findRecords: function(data, property, value){
      return data.filter((item) => item[property] == value);
    },

    retrieveUnsavedRecords: async function(recordStore){
      const records = await this.retrieveRecords(recordStore);
      const unSyncedRecords = this.findRecords(records, 'saved', false);
      return unSyncedRecords;
    },

    deleteRecord: async function(recordStore, property){
      let db = await this.init();
      const tx = db.transaction(recordStore, 'readwrite');
      const store = tx.objectStore(recordStore);
      await store.delete(property);
      return tx.complete;
    }
    
  }
