/**
* My Recipes / Cozi meal planner library
*
* IMPORTANT NOTE:
* This file requires that mr-tools.js and mr-cozi-app-lib.js have already been loaded.
* It references the globals: mrTools and mrCoziAppLib.
*/

/**
* Self-executing function, wraps all implementation code
* This should only happen once
*
* @param _win - the window object
* @param $ - the window.jQuery object
*
* @return undefined
*/
(function (_win, $) {

  "use strict";

  /*global window: false */

  var _appName = 'mrCoziMealPlannerLib',
    _version = '2.0.0',
    _loggerCounter = 0,
    _loggerPrefix = _appName + ': ',
    _logging = false,
    _logg = function (msg, func) {},
    _utils = {},
    _mrTools = _win.mrTools,
    _safeFunction = _mrTools.safeFunction,
    _mrCoziAppLib = _win.mrCoziAppLib;

    _utils.dataCache = {};
    _utils.dataCache.alreadySavedRecipes = 0;
    _utils.dataCache.newSavedRecipes = 0;
    _utils.dataCache.savedCoziRecipes = [];
    _utils.dataCache.lastMealPlanInstance = {};

    _utils.constants = {};
    _utils.constants.ITEM_TYPE_KEY_NAME = 'itemType';
    _utils.constants.MEAL_ITEM_TYPE = 'meal';
    _utils.constants.DEFAULT_SLOT_NAME = 'dinner';

  /**
  * Safely logs message to the JS console.
  *
  * @param msg (text): the message to log to the console
  * @param func (function): an optional function to execute
  *
  * @return undefined
  */
  _logg = function (msg, func) {
    if (!_logging) {return; }

    //increment the logger counter
    _loggerCounter++;

    //add the logger counter to the message
    msg = '(' + _version + ') ' + _loggerCounter + ' > ' + msg;

    if (msg && _win.console && _win.console.log) {
      _win.console.log(_loggerPrefix + msg);
    }

    if (func && func instanceof Function && _win.console && _win.console.dir) {
      func();
    }
  }

  /**
  * Initializes the application
  *
  * @return undefined
  */
  _utils.init = function () {
    _logg('_utils.init');

    _win[_appName] = _win[_appName] || _utils;
  };

  /**
  * Starts the logger
  *
  * @return undefined
  */
  _utils.startLogger = function () {
    _logging = true;

    _logg(_appName + ' LOGGER STARTED');
  };

  /**
  * Adds one or more recipes to a meal plan
  *
  * This is the entry point to the application
  *
  * @return undefined
  */
  _utils.addRecipesToMealPlan = function (newMealPlanInfo) {
      var mealPlan = null;

      //re-set dataCache
      _utils.dataCache.alreadySavedRecipes = 0;
      _utils.dataCache.newSavedRecipes = 0;

      _logg('addRecipesToMealPlan > newMealPlanInfo', function () {
        console.dir(newMealPlanInfo);
      });

      //create a new mealPlan instance
      mealPlan = new _utils.MealPlan();

      //for debugging purposes
      _utils.dataCache.lastMealPlanInstance = mealPlan;

      //set properties needed from newMealPlanInfo
      mealPlan.newMealPlanData_CONFIG = newMealPlanInfo;

      //set a reference to the old meal plan
      //NOTE: this property is asyncronous ($.Deferred)
      mealPlan.oldMealPlan = mealPlan.getOldMealPlan(newMealPlanInfo.startDate, newMealPlanInfo.totalDays);

      //set up the handler for when all cozi.com data has been fetched and cleaned
      mealPlan.setupCoziDataFetchedAndCleanedHandler();

      //return the instance of _utils.MealPlan
      return mealPlan;
  };

  //******************** CLASSES ********************

  //********** START MealPlan class and prototype methods

  /**
  * MealPlan Class
  *
  * When _utils.addRecipesToMealPlan is called,
  * one instance of the _utils.MealPlan class is created.
  * That instance is used throught the proces of creating
  * a new Cozi meal plan, and sending that meal plan
  * to Cozi.com, via the Cozi API.
  *
  * @return instance of the class
  */
  _utils.MealPlan = function () {
    var me = this;

    //the existing meal plan from cozi.com
    this.oldMealPlanData = {empty: true};

    //the raw data from the meal planner toolbar
    this.newMealPlanData_CONFIG = {};

    //temporary data storage
    this.newMealPlanData_TEMP = {recipes: [], asyncRecipes: []};

    //the data that will be sent to cozi when the new meal plan is saved
    this.postData = [];

    //holds planned meals that do not match any slots
    //in the existing cozi meal plan
    this.newSlotDates = {};

    //deferreds used for asyncronous tasks
    this.dataCleaning = $.Deferred();
    this.apiPostDataPrep = $.Deferred();

    _logg('_utils.MealPlan -> instantiated: ', function () {
      console.dir(me);
    });
  };

  /**
  * Get existing meal plan data
  *
  * @return $.Deferred (http request)
  */
  _utils.MealPlan.prototype.getOldMealPlan = function (firstDay, numberOfDays) {
    var me = this,
      httpRequest = null,
      user = _utils.getCredentials(),
      accoutId = user.accountId || '',
      authToken = user.auth || '',
      urlBase = _mrCoziAppLib.utils.constants.COZI_API_URL_BASE;

    httpRequest = $.ajax({
       url: urlBase + '/api/ext/1508/' + accoutId + '/calendar/' + firstDay
               + '/' + numberOfDays + 'days.json?apikey=myrecipes&auth=' + authToken,
       type: 'GET',
       success: function (jsonData) {
          me.getOldMealPlanSuccessHandler(jsonData);
       }
    });

    _logg('_utils.getOldMealPlan');

    //return the promise
    return httpRequest;
  };

  /**
  * Success handlder for getOldMealPlan
  *
  * @return undefined
  */
  _utils.MealPlan.prototype.getOldMealPlanSuccessHandler = function (jsonData) {
    var me = this,
      dataCache = null;

    _logg('getOldMealPlanSuccessHandler -> jsonData:', function () {
      console.dir(jsonData);
    });

    //cache the jsonData
    dataCache = _utils.copyObject(jsonData);

    //if there is an old meal plan
    //(i.e. if jsonData.items is not empty)
    if (jsonData && jsonData.items && !_utils.objectIsEmpty(jsonData.items)) {
      //clean the data
      //(remove any items that are not of type "meal")
      this.removeNonMealItems(dataCache);

      //now that all non-meal items have been removed,
      //check again if items is empty
      if (!_utils.objectIsEmpty(dataCache.items)) {
        //if it is not empty, then cache the data
        //(i.e. cache the old meal plan)
        this.oldMealPlanData = dataCache;
      }
    }

    //if the old meal plan is empty, set a flag to indicate that
    this.oldMealPlanIsEmpty =  !this.hasExistingMealPlans();

    //let observers know that the data has been cleaned
    this.dataCleaning.resolve();

    _logg('getOldMealPlanSuccessHandler > data cleaning done > MealPlan:', function () {
      console.dir(me);
    });
  };

  /**
  * Sets up the handler for when all cozi.com data has been fetched and cleaned
  *
  * @return undefined
  */
  _utils.MealPlan.prototype.setupCoziDataFetchedAndCleanedHandler = function () {
    var mealPlan = this;

    _logg('setupCoziDataFetchedAndCleanedHandler');

    $.when(mealPlan.getAllSavedRecipes(), mealPlan.dataCleaning).done(function () {
      _logg('setupCoziDataFetchedAndCleanedHandler > all cozi.com data has been fetched and cleaned');

      //set the startDate for the new meal plan
      mealPlan.newMealPlanData_TEMP.startDate = _utils.dateToHyphenatedDateString(_utils.newDate(mealPlan.newMealPlanData_CONFIG.startDate));

      //create an async recipe object for all new meal plan recipes
      mealPlan.createAsyncRecipeObjects();

      //set up the handler for when all async recipes are done
      mealPlan.setupAsyncRecipesDoneHandler();

      //set up the handler for when apiPostDataPrep deferred is resolved
      //NOTE: this is where the API POST call gets made
      mealPlan.setupApiPostDataPrepDoneHandler();
    });
  };

  /**
  * Gets all saved recipes
  *
  * @return $.Deferred
  */
  _utils.MealPlan.prototype.getAllSavedRecipes = function () {
    var me = this,
      deferred = $.Deferred();

    _mrCoziAppLib.getAllCoziRecipes(function (jsonData) {
      _logg('getAllSavedRecipes -> SUCCESS ->  jsonData:', function () {
        console.dir(jsonData);
      });

      //cache the saved recipe data
      _utils.dataCache.savedCoziRecipes = jsonData;

      //resolve the deferred
      deferred.resolve();
    });

    //return the deferred
    return deferred;
  };

  /**
  * Creates an async recipe object for all new meal plan recipes
  *
  * @return undefined
  */
  _utils.MealPlan.prototype.createAsyncRecipeObjects = function () {
    var mealPlan = this;

    $.each(mealPlan.newMealPlanData_CONFIG.recipes, function (index, recipeObject) {
      var prop = null, 
        //create a new Recipe instance
        newRecipe = new _utils.Recipe(recipeObject.recipeUrlOrId),
        baseDate = _utils.newDate(mealPlan.newMealPlanData_TEMP.startDate),
        //sets the appropriate offset date based on the "day" property of the recipe object
        thisDate = _utils.getOffsetDate(baseDate, (recipeObject.day + 2)),
        //creates the date that represents this recipe's planned meal date
        //formatted: YYYY-MM-DD
        thisDayAsString = _utils.dateToHyphenatedDateString(_utils.newDate(thisDate));

      //add this recipe to the list of recipes
      mealPlan.newMealPlanData_TEMP.recipes.push(newRecipe);

      //add this recipe's deferred to the list of asyncronous recipes
      //(used to determine when the recipe has been saved, if needed)
      mealPlan.newMealPlanData_TEMP.asyncRecipes.push(newRecipe.async);

      //set the slot (e.g. "breakfast", "lunch", "dinner" or "snack")
      recipeObject.slot = recipeObject.slot || _utils.constants.DEFAULT_SLOT_NAME;

      //set the date so it can be matched to an existing meal plan if needed
      newRecipe.date = thisDayAsString;

      //set the slot
      newRecipe.slot = recipeObject.slot;

      //for every day in the old meal plan's "days" object
      for (prop in mealPlan.oldMealPlanData.days) {
        //if this recipe's date matches the day's date
        if (thisDayAsString === prop) {
          //set a flag so know to match this one up later
          newRecipe.dateMatchesOldMealPlan = true;
        }
      };
    });

    _logg('createAsyncRecipeObjects');
  };

  /**
  * Sets up the handler for when all async recipes are done
  *
  * @return undefined
  */
  _utils.MealPlan.prototype.setupAsyncRecipesDoneHandler = function () {
    var mealPlan = this;

    $.when.apply($, mealPlan.newMealPlanData_TEMP.asyncRecipes).done(function () {
      //if the old meal plan is not empty 
      //(i.e. there is at least one existing planned meal)
      if (!mealPlan.oldMealPlanIsEmpty) {
        //insert the new recipes into the existing meal plan
        mealPlan.insertNewRecipesIntoOldMealPlans();

        //add the existing planned meals to mealPlan.postData
        //(the data that will be sent to the cozi API)
        $.each(mealPlan.oldMealPlanData.items, function(index, item) {
          mealPlan.postData.push({
            itemType: 'meal',
            edit: item
          });
        });
      }

      //add recipes that don't match old meal plan date
      mealPlan.addAsyncRecipesToEmptySlots();

      //iterate over each of the properties of the newSlotDates object
      $.each(Object.keys(mealPlan.newSlotDates), function (index, key) {
        //add data from this slot to the data for the API call
        mealPlan.addNewSlotsToPostData(index, key);
      });

      //notify observers that the API POST data is ready
      mealPlan.apiPostDataPrep.resolve();

      _logg('setupAsyncRecipesDoneHandler');
    });
  };

  /**
  * Sets up the handler for when apiPostDataPrep deferred is resolved
  *
  * @return undefined
  */
  _utils.MealPlan.prototype.setupApiPostDataPrepDoneHandler = function () {
    var mealPlan = this;

    _logg('setupApiPostDataPrepDoneHandler');

    $.when(mealPlan.apiPostDataPrep).done(function () {
        var startDate = _utils.removeHyphensFromString(mealPlan.newMealPlanData_TEMP.startDate),
          numberOfDays = mealPlan.newMealPlanData_CONFIG.totalDays;

        //post the new meal plan to the cozi API
        _utils.sendMealPlanToCozi(startDate, numberOfDays, mealPlan.postData, mealPlan.newMealPlanData_CONFIG.success);
    });
  };

  /**
  * Adds async recipes to empty days in old meal plan
  *
  * @return undefined
  */
  _utils.MealPlan.prototype.addAsyncRecipesToEmptySlots = function () {
    var me = this;

    //add recipes that don't match old meal plan date
    $.each(this.newMealPlanData_TEMP.recipes, function (index, recipe) {
      var noHypenDate = '',
        noHypenDate = '',
        recipeItem = null;

      //if this recipe is already resolved
      //(if it has already been added to a slot in the old existing plan)
      if (recipe.resolved) {
        //ignore this recipe
        return;
      }

      //set the recipe date
      //the format should be: YYYYMMDD
      noHypenDate = _utils.removeHyphensFromString(recipe.date);

      //create the recipe item
      recipeItem = {
        text: recipe.text,
        recipeBoxId: recipe.recipeBoxId
      };

      //if the newSlotDates object does not have
      //a property that matches the current noHypenDate variable
      if (!me.newSlotDates[noHypenDate]) {
        //add a new array with the current recipe,
        //and add it to the newSlotDates object (property = current noHypenDate variable)
        me.newSlotDates[noHypenDate] = [recipeItem];
      } else {
        //otherwise, add this recipe to the existing newSlotDates[noHypenDate] property
        me.newSlotDates[noHypenDate].push(recipeItem);
      }
    });

    _logg('addAsyncRecipesToEmptySlots', function () {
      console.dir(me.newSlotDates);
    });
  };

  /**
  * Adds one async recipe to an empty day in old meal plan
  *
  * @return undefined
  */
  _utils.MealPlan.prototype.addNewSlotsToPostData = function (index, key) {
    var me = this,
      //create a new planned meal object
      //it needs to be a type: "create" (not "edit")
      newPlannedMeal = _utils.newCreateMealObject();

    //add the required properties to this planned meal object
    newPlannedMeal.create.itemDetails.mealSlot = _utils.constants.DEFAULT_SLOT_NAME;
    newPlannedMeal.create.itemDetails.mealItems = me.newSlotDates[key];
    newPlannedMeal.create.day = _utils.addHyphensToYYYYMMDD(key);
    newPlannedMeal.create.startTime = '18:00:00';
    newPlannedMeal.create.endTime = '20:00:00';
    newPlannedMeal.create.description = false;

    //for each of the newSlotDates
    $.each(me.newSlotDates[key], function (index ,recipe) {
      //if this newPlannedMeal already has a description
      if (newPlannedMeal.create.description) {
        //add this recipe's text to the description
        newPlannedMeal.create.description = newPlannedMeal.create.description + '; ' + recipe.text;
      } else {
        //otherwise, use this recipe's text for the description
        newPlannedMeal.create.description = recipe.text;
      }
    });

    //add this planned meal object to the postData array
    //(this is the data that will be sent in the API POST call)
    me.postData.push(newPlannedMeal);
  };

   /**
  * Determines if there are any existing meal plans
  *
  * @return boolean
  */
  _utils.MealPlan.prototype.hasExistingMealPlans = function () {
    return (this.oldMealPlanData.empty) ? false : true;
  };

  /**
  * Inserts new recipes into an existing planned meals
  *
  * @return undefined
  */
  _utils.MealPlan.prototype.insertNewRecipesIntoOldMealPlans = function () {
    var me = this;

    //iterate over all of the NEW recipes
    $.each(me.newMealPlanData_TEMP.recipes, function (index, recipe) {

      //iterate over all of the OLD recipes
      $.each(me.oldMealPlanData.items, function (index, item) {

        //if the recipe date matches the item's day property
        if (recipe.date === item.day) {

          //if the recipe slot matches the item'sitemDetails.mealSlot property
          if (recipe.slot === item.itemDetails.mealSlot) {

            //add this recipe to that slot's mealItems array
            item.itemDetails.mealItems.push({
              text: recipe.text,
              recipeBoxId: recipe.recipeBoxId
            });

            //add this recipe to the item.description
            item.description = me.updateItemDescription(item.description, recipe.text);

            _logg('insertNewRecipesIntoOldMealPlans -> just inserted: ' + recipe.text);

            //resolve this recipe
            recipe.resolved = true;
          }
        }
      });
    });
  };

  /**
  * Appends a given string to an existing string
  *
  * @return string
  */
  _utils.MealPlan.prototype.updateItemDescription = function (existingText, newText) {
    var updatedText = '';

    existingText = existingText || '';
    newText =  newText || '';

    updatedText = existingText + '; ' + newText;

    _logg('updateItemDescription -> ' + updatedText);

    return updatedText;
  };

  /**
  * Removes any mealPlan items that are not type: "meal"
  *
  * @return undefined
  */
  _utils.MealPlan.prototype.removeNonMealItems = function (dataCache) {
    var i = 0,
      thisKeyName = null,
      thisKeyVal = null,
      mealFound = false,
      itemTypeKeyName = _utils.constants.ITEM_TYPE_KEY_NAME,
      dataCacheItems = dataCache.items,
      //create an array of all keys in dataCache.items
      keys = Object.keys(dataCacheItems);

    //iterate over the array of keys in dataCache.items
    for (; i < keys.length; i++) {
      //get the key name and its value
      thisKeyName = keys[i];
      thisKeyVal = dataCacheItems[thisKeyName];

      //if this item is not a type: "meal"
      if (thisKeyVal && thisKeyVal[itemTypeKeyName] &&  (thisKeyVal[itemTypeKeyName] !== _utils.constants.MEAL_ITEM_TYPE)) {
        //remove this item's matching data in the DAYS array
        this.removeNonMealDay(dataCache, dataCacheItems[thisKeyName]);

        //remove this item
        delete dataCacheItems[thisKeyName];
      }
    }
  };

  /**
  * Removes an entry from the DAYS array, based on objectToBeDeleted.id
  *
  * @return undefined
  */
  _utils.MealPlan.prototype.removeNonMealDay = function (dataCache, objectToBeDeleted) {
    var i = 0,
      j = 0,
      thisKeyName = null,
      thisKeyVal = null,
      mealFound = false,
      itemTypeKeyName = _utils.constants.ITEM_TYPE_KEY_NAME,
      dataCacheDays = dataCache.days,
      //create an array of all keys in dataCache.days
      keys = Object.keys(dataCacheDays);

    //iterate over the array of keys in dataCache.days
    for (; i < keys.length; i++) {
      //get the key name and its value
      thisKeyName = keys[i];
      thisKeyVal = dataCacheDays[thisKeyName];

      //for every element in this day's array
      for (j = 0 ; j < thisKeyVal.length; j++) {
        //if this element's id matches the id of objectToBeDeleted
        if (thisKeyVal[j].id === objectToBeDeleted.id) {
          //remove this element from the array
          thisKeyVal.splice(j, 1);
        }
      }

      //if the array is now empty
      if (!thisKeyVal.length) {
        //delete the array
        delete dataCacheDays[thisKeyName];
      }
    }
  };

  //********** END MealPlan class and prototype methods

  //********** START Recipe class and prototype methods

  /**
  * Recipe Class
  *
  * For every recipe that was passed in to _utils.addRecipesToMealPlan,
  * an instance of this class is created.
  *
  * @return instance of _utils.Recipe
  */
  _utils.Recipe = function (recipeUrl) {
    var me = this,
      deferred = $.Deferred();

    //if a recipe URL was not provided
    if (!recipeUrl || !(typeof recipeUrl === 'string')) {

      //resolve the deferred
      deferred.resolve();

      //return an error object
      return {error: 'bad or missing recipe URL'};
    }

    //expose required properties
    this.async = deferred;
    this.id = false;
    this.url = recipeUrl;
    this.alreadySaved = false;
    this.dateMatchesOldMealPlan = false;

    //the recipe data from MyRecipes
    this.myRecipesRecipeData = {};

    //Checks to see if a recipe is already saved
    //and if not, handles required async tasks
    this.validateOrResolveAsyncData();

    _logg('_utils.MealPlan -> instantiated: ', function () {
      console.dir(me);
    });
  };

  /**
  * Checks to see if a recipe is already saved, and if not, handles required async tasks
  *
  * @return undefined
  */
  _utils.Recipe.prototype.validateOrResolveAsyncData = function () {
    var me = this;

    _logg('validateOrResolveAsyncData');

    //if this recipe was already saved in cozi
    if (this.isAreadySaved()) {
      _logg(this.url + ' is already saved in cozi');

      //flag as already saved
      this.alreadySaved = true;

      //resolve the deferred
      this.async.resolve();

    //otherwise, since this recipe was already saved in cozi
    } else {
      _logg(this.url + ' is NOT saved in cozi yet');

      //get the recipe data from myrecipes.com
      this.getMrRecipeData(function (jsonData) {
        //cache the recipe data from my recipes
        me.myRecipesRecipeData = jsonData;

        //save this recipe to cozi
        me.saveToCozi();
      });
    }
  };

  /**
  * Determines if a recipe is already saved in Cozi
  *
  * @return boolean
  */
  _utils.Recipe.prototype.isAreadySaved = function () {
    var me = this,
      alreadySaved = false;

    //iterate overa all of the existing saved recipes
    $.each(_utils.dataCache.savedCoziRecipes, function(index, recipe) {
      //NOTE: the saved recipe's sourceRaw value is the URL of the recipe

      //does the saved recipe's sourceRaw value match
      //this Recipe instance's url ?
      if (recipe.sourceRaw && recipe.sourceRaw === me.url) {
        //flag this Recipe instance as alrady saved
        alreadySaved = true;

        //keep track of how many recipes we have saved
        //in case we need that
        _utils.dataCache.alreadySavedRecipes++;

        //set the recipeBoxId and text properties
        //(this will be needed when we save POST the meal plan to cozi)
        me.recipeBoxId = recipe.recipeId;
        me.text = recipe.name;
      }
    });

    _logg('alreadySaved -> ' + alreadySaved);

    return alreadySaved;
  };

  /**
  * Asyncronously fetches recipe data from MyRecipes
  *
  * @return $.Deferred()
  */
  _utils.Recipe.prototype.getMrRecipeData = function (successCallback) {
    var me = this,
      deferred = $.Deferred();

      //make the async call to get the recipe data
      _mrCoziAppLib.getAsyncRecipe({
        //get the slug
        id: this.url.split('myrecipes.com/recipe/')[1],
        //set the success handler
        callback: function (jsonData) {
          //call the successCallback
          _safeFunction(successCallback)(jsonData);

          _logg('getAsyncRecipe -> SUCCESS ->  jsonData: ', function () {
            console.dir(jsonData);
          });
        }
      });

    //return the deferred
    return deferred;
  };

  /**
  * Saves a recipe to Cozi
  *
  * @return $.Deferred()
  */
  _utils.Recipe.prototype.saveToCozi = function () {
    var me = this,
      deferred = $.Deferred(),
      //create a recipe object that is
      //properly formatted for saving to cozi
      formattedRecipeObject = _mrCoziAppLib.createRecipeObject(me.myRecipesRecipeData);

    //save the recipe to cozi
    _mrCoziAppLib.saveRecipeToCozi(function (jsonData) {
      //increment the number of newly saved recipes
      _utils.dataCache.newSavedRecipes++;

      //flag as already saved
      me.alreadySaved = true;

      //set the recipeBoxId and text properties
      //for this recipe object
      me.recipeBoxId = jsonData.recipeBoxId;
      me.text = jsonData.name;

      //resolve the deferred
      //(lets any observers know that this recipe's async is resolved)
      me.async.resolve();

      _logg('saveRecipeToCozi -> success -> jsonData: ', function () {
        console.dir(jsonData);
      });
    }, formattedRecipeObject);

    return deferred;
  };

  //********** END Recipe class and prototype methods

  //********** START static methods (various utilities)

  /**
  * Gets the credentials of the currently logged-in user
  *
  * @return undefined
  */
  _utils.getCredentials = function () {
    _logg('_utils.getCredentials');

    return _mrCoziAppLib.cozi.auth.getCookie();
  };

  /**
  * Copies an object
  *
  * @return object
  */
  _utils.copyObject = function (objectToCopy) {
    _logg('_utils.copyObject');

    objectToCopy = objectToCopy || {};

    return $.extend(true, {}, objectToCopy);
  };

  /**
  * Determines if an object is empty
  *
  * @return boolean
  */
  _utils.objectIsEmpty = function (obj) {
    var retVal = (obj && obj instanceof Object && Object.keys(obj).length) ? false : true;

    _logg('_utils.objectIsEmpty -> ' + retVal);

    return retVal;
  };

  /**
  * Removes any hyphens from a string
  *
  * @return string
  */
  _utils.removeHyphensFromString = function (textString) {
    textString = textString || '';

    return textString.replace(/-/g, '');
  };

 /**
  * Sends meal plan to cozi
  *
  * @return undefined
  */
  _utils.sendMealPlanToCozi = function (firstDayOfMealPlan, numberOfDays, mealPlanData, successCallback) {
    var user = _utils.getCredentials(),
      accountId = user.accountId || '',
      authToken = user.auth || '',
      urlBase = _mrCoziAppLib.utils.constants.COZI_API_URL_BASE,
      apiUrl = urlBase + '/api/ext/1508/' + accountId + '/calendar/' + firstDayOfMealPlan
                + '/' + numberOfDays + 'days.json?apikey=myrecipes&auth=' + authToken

    _logg('_utils.sendMealPlanToCozi -> ', function () {
      _logg(firstDayOfMealPlan + ' / ' + numberOfDays);
      console.dir(mealPlanData);
    });

    jQuery.ajax({
        url: apiUrl,
        type: 'POST',
        data: JSON.stringify(mealPlanData),
        success: function (jsonData) {
          _logg('_utils.sendMealPlanToCozi -> SUCCESS -> jsonData:', function () {
            console.dir(jsonData);
          });

          //call the success handler
          _safeFunction(successCallback)(jsonData);
        }
    });
  }

  /**
  * Adds a recipe to a planned meal slot
  *
  * @return boolean
  */
  _utils.addRecipeToSlot = function (mealObject, objectType, recipeObject) {
    mealObject[objectType].itemDetails.mealItems.push(recipeObject);
  };

  /**
  * A template for the meal object (create only)
  *
  * @return object
  */
  _utils.newCreateMealObject = function () {
    _logg('_utils.newCreateMealObject');

    return {
      itemType: 'meal',
      create: {
        itemType: 'meal',
        itemDetails: {
          mealSlot: '',
          mealItems: [],
        },
        day: '',
        startTime: '',
        endTime: '',
        description: ''
      }
    }
  };

  /**
  * Creates a date string from a JS date object in the format: YYYY-MM-DD
  *
  * @param dateObject (required) a valid JavaScript date object
  *
  * @return string
  */
  _utils.formatDateForMealPlan = function (dateObject) {
    var retVal,
      year = 0,
      month = 0,
      day = 0,
      delimiter = '-';

    _logg('formatDateForMealPlan. ORIGINAL dateObject: ', function () {
        console.dir(dateObject);
    });

    //make sure a valid Date instance was provided
    if (!dateObject || !(dateObject instanceof Date)) {
      _logg('formatDateForMealPlan -> invalid or missing date parameter');

      //exit
      return false;
    }

    year = dateObject.getFullYear();
    month = dateObject.getMonth() + 1;
    day = dateObject.getDate();

    //ensure that single-digit month and day
    //values are still a two-digit format
    if (month < 10) {month = "0" + month; }
    if (day < 10) {day = "0" + day; }

    //create the formatted date string
    retVal = (year + delimiter + month + delimiter + day);

    _logg('formatDateForMealPlan. FORMATTED: ' + retVal);

    return retVal;
  };

  /**
  * Ensures that the month and date portions of a YYYY-MM-DD string are two characters
  *
  * @return string
  */
  _utils.forceTwoCharacterMonthAndDay = function (dateString) {
    var retVal = '',
    dateStringAsArray = [];

    dateString = (dateString && (typeof dateString === 'string')) ? dateString : '';

    if (dateString.indexOf('-') === -1) {
      return dateString;
    }

    dateStringAsArray = dateString.split('-');

    if (dateStringAsArray[1] && dateStringAsArray[1].length === 1) {
      dateStringAsArray[1] = '0' + dateStringAsArray[1];
    }

    if (dateStringAsArray[2] && dateStringAsArray[2].length === 1) {
      dateStringAsArray[2] = '0' + dateStringAsArray[2];
    }

    retVal = dateStringAsArray.join('-');

    _logg('_utils.forceTwoCharacterMonthAndDay -> ' + retVal);

    return retVal;
  };

  /**
  * Returns a normalized Date object (time set to midnight)
  *
  * @param dateStringOrDateObject - optional - a YYYY-MM-DD formated date string
  * or a Date object
  *
  * @return Date object
  */
  _utils.newDate = function (dateStringOrDateObject) {
    var newDate = null,
      argumentIsString = (dateStringOrDateObject && (typeof dateStringOrDateObject === 'string')),
      argumentIsDate = dateStringOrDateObject && dateStringOrDateObject instanceof Date,
      arugmentProvided = argumentIsString || argumentIsDate;

      

    //if a Date object was provided
    if (argumentIsDate) {
      //use Date date object
      newDate = dateStringOrDateObject;
    //if a YYYY-MM-DD formated date string was provided
    } else if (argumentIsString && (dateStringOrDateObject.indexOf('-') === -1)) {
      //use that to create the new date
      newDate = _utils.yyyymmddToDateObject(dateStringOrDateObject);
    } else {

      //make sure the month and date dates are two characters
      dateStringOrDateObject = _utils.forceTwoCharacterMonthAndDay(dateStringOrDateObject); 

      //otherwise, create a new date, which will be the current date
      newDate = argumentIsString ? new Date(dateStringOrDateObject) : new Date();
    }

    //normalize the date (i.e. set to midnight)
    newDate.setHours(0, 0, 0, 0);

    _logg('_utils.newDate -> ' + newDate);

    //return newDate
    return newDate;
  };

  /**
  * Returns a date that is X days from the given date.
  *
  * @return Date object
  */
  _utils.getOffsetDate = function (baseDateObject, offsetNumber) {
    var offsetDate = null,
      offsetDateTemp = null,
      offsetDate = null;

    //ensure that a valid baseDateObject was provided
    if (!baseDateObject || !(baseDateObject instanceof Date)) {
      _logg('_utils.getOffsetDate -> PROBLEM WITH baseDateObject');
      return false;
    }

    //in case offsetNumber is undefined
    offsetNumber = offsetNumber || 0;

    //create a temp date object
    offsetDateTemp = new Date(_utils.dateToHyphenatedDateString(baseDateObject));
    //create a new date object that is X days away from the baseDateObject
    offsetDate = new Date(offsetDateTemp.setDate(offsetDateTemp.getDate() + offsetNumber));

    _logg('_utils.getOffsetDate -> ' + offsetDate);

    //return the offsetDate
    return offsetDate;
  };

  /**
  * Adds hyphens to a YYYYMMDD formated date string
  *
  * @return string
  */
  _utils.addHyphensToYYYYMMDD = function (yyyymmddDateString) {
    var hyphen = '-',
      year = '',
      month = '',
      day = '',
      hyphenatedDate = '';

    year = yyyymmddDateString.substring(0, 4);
    month = yyyymmddDateString.substring(4, 6);
    day = yyyymmddDateString.substring(6, 8);

    //create the hyphenated date string
    hyphenatedDate = year + hyphen + month + hyphen + day;

    _logg('_utils.addHyphensToYYYYMMDD -> ' + hyphenatedDate);

    return hyphenatedDate;
  };

  /**
  * Converts a YYYYMMDD formated date string to an instance of Date object
  *
  * @return Date instance
  */
  _utils.yyyymmddToDateObject = function (yyyymmddDateString) {
    var year = '',
      month = '',
      day = '',
      newDate = null;

    //ensure that a valid date string was provided
    if (!yyyymmddDateString || !(typeof yyyymmddDateString === 'string')) {
      _logg('_utils.yyyymmddToDateObject -> PROBLEM WITH yyyymmddDateString');

      //exit
      return false;
    }

    //get the respective parts of the date
    year = yyyymmddDateString.substring(0, 4);
    month = yyyymmddDateString.substring(4, 6);
    day = yyyymmddDateString.substring(6, 8);

    //create the new date object
    newDate = new Date(year, (month - 1), day);

    _logg('_utils.yyyymmddToDateObject -> ' + newDate);

    //return the new Date instance
    return newDate;
  }

  /**
  * Converts a date object to a hypenated date format: YYYY-MM-DD
  *
  * @return string
  */
  _utils.dateToHyphenatedDateString = function (dateObject) {
    var hyphenatedDateString = ''

      if (!dateObject || !(dateObject instanceof Date)) {
        _logg('_utils.dateToHyphenatedDateString -> PROBLEM WITH dateObject');
        return '';
      }

    hyphenatedDateString = dateObject.toISOString().substring(0, 10);

    _logg('_utils.dateToHyphenatedDateString -> ' + hyphenatedDateString);

    //return the hypenated date string
    return hyphenatedDateString;
  };

  //********** END static methods (various utilities)

  //initialize the application
  _utils.init();

}(window, window.jQuery));
