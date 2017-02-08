(function(_window, $){

  'use strict';

  /*global window: false */
  /*global mrTools: false */

  var _version = '1.2.0',
    _logger = null,
    _mrTools = mrTools,
    _safeFunction = _mrTools.safeFunction,
    _safeFunctionApply = _mrTools.safeFunctionApply,
    _utils = {},
    _cozi = {};

  _utils.constants = {};
  _utils.settings = {};
  _utils.config = {};
  _utils.config.ajaxBase = {};
  _utils.sso = {};
  _utils.registeredFeatures = [];

  _cozi.auth = {};
  _cozi.api = {};
  _cozi.recipe = {};
  _cozi.shoppingLists = {};

  _utils.constants.APP_NAME = 'mrCoziAppLib';
  _utils.constants.LOGGER_PREFIX = _utils.constants.APP_NAME + ' (' + _version + ') -> ';
  _utils.constants.CANONICAL = $('link[rel="canonical"]').attr('href');
  _utils.constants.LOGGER_PREFIX_DEFAULT = 'mrCoziAppLib_LOGGER_DEFAULT -> ';
  _utils.constants.LOGGED_IN_COOKIE_NAME = (_utils.constants.APP_NAME + '_AUTHENTICATED');
  _utils.constants.AUTH_COOKIE_EXPIRATION = 7;
  _utils.constants.COZI_API_PATH = '/coziapi';
  _utils.constants.COZI_API_URL_BASE = mrTools.env.urlBase + _utils.constants.COZI_API_PATH;
  _utils.constants.EVENT_COZI_LOGIN_SUCCESS = 'coziLogInSuccess';
  _utils.constants.EVENT_COZI_LOGOUT_SUCCESS = 'coziLogOutSuccess';
  _utils.constants.EVENT_COZI_LOGIN_FAILURE = 'coziLogInFailure';
  _utils.constants.EVENT_COZI_AUTHORIZATION_REQUIRED = 'coziAuthorizationReqired';
  _utils.constants.EVENT_COZI_REGISTRATION_REQUESTED = 'coziRegistrationRequested';
  _utils.constants.EVENT_USER_CONTEXT_CHANGE = 'userContextChange';

  //base ajax config for auth
  _utils.config.ajaxBase.auth = {
      url : (_utils.constants.COZI_API_URL_BASE + '/api/ext/1406/auth/'),
      dataType: 'json',
      type: 'POST'
  };

  //base ajax config for create account
  _utils.config.ajaxBase.createAccount = {
      url: (_utils.constants.COZI_API_URL_BASE + '/api/ext/1303/account/?apikey=myrecipes'),
      dataType: 'json',
      type: 'POST'
  };

  //base ajax config for save recipe
  _utils.config.ajaxBase.saveRecipe = {
      urlBase: (_utils.constants.COZI_API_URL_BASE + '/api/ext/1505/'),
      dataType: 'json',
      type: 'POST'
  };

  //base ajax config for get shopping lists
  _utils.config.ajaxBase.getShoppingLists = {
      url: (_utils.constants.COZI_API_URL_BASE + '/api/ext/1004/'),
      dataType: 'json',
      type: 'GET'
  };

  //base ajax config for create or edit shopping listItem
  _utils.config.ajaxBase.createOrEditShoppingListItem = {
      url: (_utils.constants.COZI_API_URL_BASE + '/api/ext/1004/'),
      dataType: 'json',
      type: 'POST'
  };

  //base ajax config for gets all saved recipes
  _utils.config.ajaxBase.getRecipes = {
      urlBase: (_utils.constants.COZI_API_URL_BASE + '/api/ext/1505/'),
      dataType: 'json',
      type: 'GET'
  };

  //base ajax config for get user account info
  _utils.config.ajaxBase.getAccountInfo = {
      urlBase: (_utils.constants.COZI_API_URL_BASE + '/api/ext/1009/'),
      dataType: 'json',
      type: 'GET'
  };

  /**
  * Initializes the applcation
  *
  * @return undefined
  */
  _utils.init = function () {
    //initialize the applcation

    _logger = mrTools.newLogger(_utils.constants.LOGGER_PREFIX);

    _window[_utils.constants.APP_NAME] = _utils.createGlobalAppObject();

    //bind custom events
    _utils.bindCustomEvents();

    //start the application
    _utils.start();
  };

  /**
  * Starts the applcation
  *
  * @return undefined
  */
  _utils.start = function () {
    //start the application

    _logger.info('Mr Cozi App Lib has loaded!');
  };

  /**
  * Creates the object used for the global singleton
  *
  * @return object
  */
  _utils.createGlobalAppObject = function () {
    var globalAppObject = {
      utils : _utils,
      cozi : _cozi,
      logon : _utils.coziLogon,
      logoff : _cozi.auth.logoff,
      getAccountInfo : _cozi.auth.getAccountInfo,
      requireAuth : _cozi.auth.requireAuth,
      loggedInUser : _cozi.auth.userIsLoggedIn,
      registerFeature : _utils.registerFeature,
      registerFeatures : _utils.registerFeatures,
      createAccount : _cozi.auth.createAccount,
      getAsyncRecipe : _cozi.api.getAsyncRecipe,
      createRecipeObject : _utils.createRecipeObject,
      getAllCoziRecipes : _cozi.recipe.getAll,
      saveRecipeToCozi : _cozi.api.saveRecipeToCozi,
      saveAllRecipesToCozi : _cozi.recipe.saveAllRecipesToCozi,
      makeIngredientString : _cozi.recipe.makeIngredientString,
      ingredientsArrayToString : _utils.ingredientsArrayToString,
      getAllCoziShoppingLists : _cozi.shoppingLists.getAll,
      addMultipleItemsToCoziShoppingList : _cozi.shoppingLists.addMultipleItemsToList,
      getRecipeJsonUrl : _utils.getRecipeJsonUrl,
      getRecipeJsonUrlFromRecipeUrl : _utils.getRecipeJsonUrlFromRecipeUrl
    };

    _logger.log('_utils.createGlobalAppObject ->').dir(globalAppObject);

    return globalAppObject;
  };

  /**
  * Provides  full access to the global wrapper IIFE
  *
  * @return object
  */
  _utils.backdoor = function utilsBackdoor (callback) {
    var retVal = {
      version: _version,
      logger: _logger,
      utils : _utils,
      cozi : _cozi
    };

    if (callback && (callback instanceof Function)) {
      callback(retVal);
    }

    _logger.log('>> _utils.backdoor');
  };

  /**
  * Bind custom events
  *
  * @return undefined
  */
  _utils.bindCustomEvents = function () {
    _mrTools.bindEvent(_utils.constants.EVENT_USER_CONTEXT_CHANGE, function () {
      _utils.processUserContextChange();
    });

    _mrTools.bindEvent(_utils.constants.EVENT_COZI_LOGIN_SUCCESS, function () {
      _mrTools.triggerEvent(_utils.constants.EVENT_USER_CONTEXT_CHANGE);
    });

    _mrTools.bindEvent(_utils.constants.EVENT_COZI_LOGOUT_SUCCESS, function () {
      _mrTools.triggerEvent(_utils.constants.EVENT_USER_CONTEXT_CHANGE);
    });

    _logger.log('bindCustomEvents ->');
  };

  /**
  * Wrapper for all ajax calls.
  * Includes workaround for KA overwritten-ajax issue
  * @return jQuery Deferred
  */
  _utils.ajax = function (configObj) {
    if (!configObj || !(configObj instanceof Object) ) {_logger.warn('_utils.ajax -> no config object provided. EXITING.'); return; }

    _logger.log('_utils.ajax ->> about to attempt AJAX this object:').dir(configObj);

    return $.ajax(configObj);
  };

  /**
  * Determines if the browser is internet explorer 8 or internet explorer 9
  *
  * @return boolean
  */
  _utils.isInternetExplorer = function () {
    var retVal = (window.navigator.appVersion.indexOf('MSIE 8.')!=-1 || window.navigator.appVersion.indexOf('MSIE 9.')!=-1) ? true : false;

    _logger.info('_utils.isInternetExplorer -> ' + retVal);

    return retVal;
  };

  /**
  * Wrapper for _cozi.auth.logon
  *
  * Sets the authentication cookie and triggers the logon success event
  *
  * @return deferred
  */
  _utils.coziLogon = function (authObj) {
    if(!authObj || !authObj.username || !authObj.password){
      _logger.warn('_utils.coziLogon -> either username or password was not supplied. EXITING.');

      //exit
      return;
    }

    _logger.log('_utils.coziLogon -> authObj').dir(authObj);

    return _cozi.auth.logon({
      username: authObj.username,
      password: authObj.password,
      success: function (authObject) {
        //pre-authenticate the user on cozi.com
        _cozi.auth.preAuthenticateToCozi(authObject.auth);

        //set the auth cookie
        _cozi.auth.setCookie(authObject);

        //trigger the logon success event
        _mrTools.triggerEvent(_utils.constants.EVENT_COZI_LOGIN_SUCCESS, authObject);

        //call the success callback, passing it the authObject
        _safeFunction(authObj.success)(authObject);

        _logger.info('_cozi.auth.logon -> SUCCESS:').dir(authObject);
      },
      error: function (errorObj) {
        //trigger the logon success event
        _mrTools.triggerEvent(_utils.constants.EVENT_COZI_LOGIN_FAILURE);

        //call the error callback, passing it the authOerrorObjbject
        _safeFunction(authObj.error)(errorObj);

        _logger.warn('_cozi.auth.logon -> ERROR:').dir(errorObj);
      }
    });
  };

  /**
  * Logs on to Cozi
  *
  * @param autObj (object): contains credentials and callback
  *
  * @return jQuery Deferred
  */
  _cozi.auth.logon = function (authObj) {
    var ajaxConfig = {};

    if (!authObj || !authObj.username || !authObj.password) {
      _logger.warn('either username or password was not supplied ');

      //exit
      return;
    }

    _logger.log('_cozi.auth.logon ->').dir(authObj);

    ajaxConfig.data = JSON.stringify({username : authObj.username, password : authObj.password});

    if (authObj.success) {ajaxConfig.success = authObj.success; }

    if (authObj.error) {ajaxConfig.error = authObj.error; }

    //ajaxConfig = $.extend({},ajaxConfig,_utils.config.ajaxBase.auth);

    //HTTPS issue
    if (_utils.isInternetExplorer()) {
      window.alert('We\'re sorry, please try logging in with another browser (Firefox or Chrome) while we investigate this issue.');

      //exit
      return false;
    }

    ajaxConfig = $.extend({}, ajaxConfig,{
      url: 'https://rest.cozi.com/api/ext/1406/auth/',
      dataType: 'json',
      type: 'POST'
    });

    return _utils.ajax(ajaxConfig);
  };

  /**
  * A wrapper for _cozi.auth.deleteCookie
  *
  * @return boolean
  */
  _cozi.auth.logoff = function (callback) {
    _logger.log('_cozi.auth.logoff');

    //delete the auth cookie
    if (_cozi.auth.deleteCookie()) {_safeFunction(callback)(); }

    //log the user out at cozi.com behind the scenes
    _cozi.auth.logUserOutAtCozi();

    //trigger the logout success event
    _mrTools.triggerEvent(_utils.constants.EVENT_COZI_LOGOUT_SUCCESS);

    return true;
  };

  /**
  * Determines if the user is alrady logged-into Cozi
  *
  * @return boolean
  */
  _cozi.auth.userIsLoggedIn = function () {
    var loggedIn = _cozi.auth.getCookie().error ? false : true;

    _logger.log('_cozi.auth.userIsLoggedIn -> ' + loggedIn);

    return loggedIn;
  };

  /**
  * Authentication wrapper. For any action that requires authentication, pass that action in the callback.
  * This method then determines if the user is alrady logged-into Cozi, and if so, executes the callback right away, or defers it for execution on successful authentication
  *
  * @param (optional) callback - A function to executed once the user has authenticated
  *
  * @return deferred
  */
  _cozi.auth.requireAuth = function (callback) {
    var deferred = $.Deferred(),
    uniqueNum = new Date().getTime(),
    uniqueEventName = _utils.constants.EVENT_COZI_LOGIN_SUCCESS + '.' + uniqueNum;

    function resolve () {
       //execute the callback
      _safeFunction(callback)();
      //resolve the deferred
      deferred.resolve();
    }

    //is the user is already logged-in?
    if (_cozi.auth.userIsLoggedIn()) {
      //resolve this request
      resolve();
    } else {
      //bind the callback to the next successful authentication
      _mrTools.bindEventOnce(uniqueEventName, resolve);
      //trigger an authorization required event, in order to show a loging prompt
      _mrTools.triggerEvent(_utils.constants.EVENT_COZI_AUTHORIZATION_REQUIRED);
    }

    //return the deferred object
    return deferred;
  };

  /**
  * Sets the Cozi authentication cookie, using an object that contains the "auth" and "accountId" values
  *
  * A wrapper for _cozi.auth.setLoggedInAuthCookie
  *
  * @return boolean
  */
  _cozi.auth.setCookie = function (authObj) {
    //make sure the required information was provided
    if (!authObj || !authObj.auth || !authObj.accountId) {
      _logger.warn('_cozi.auth.setCookie >> reqired parameter missing. EXITING.');

      //EXIT
      return false;
    }

    //set the cookie
    _cozi.auth.setLoggedInAuthCookie(authObj.auth, authObj.accountId);

    _logger.log('_cozi.auth.setCookie').dir(_cozi.auth.getLoggedInAuthCookieAsObject());

    return true;
  };

  /**
  * Returns an object that contains the "auth" and "accountId" values stored in the Cozi authentication cookie.
  * @return Object
  */
  _cozi.auth.getCookie = function () {
    var loggedInAuthCookieAsObject = _cozi.auth.getLoggedInAuthCookieAsObject();

    _logger.log('_cozi.auth.getCookie ->').dir(loggedInAuthCookieAsObject);

    return loggedInAuthCookieAsObject;
  };

  /**
  * Deletes the Cozi authentication cookie
  *
  * @return boolean
  */
  _cozi.auth.deleteCookie = function () {
    var cookieName = _utils.constants.LOGGED_IN_COOKIE_NAME;

    //if the cookie does not exist
    if (!_mrTools.getCookie(cookieName)) {
      logger.warn('_cozi.auth.deleteCookie -> cookie does not exist: EXITING.');

      //exit
      return false;
    }

    //delete the cookie
    _mrTools.deleteCookie(cookieName);

    _logger.info('-> cookie deleted: ' + cookieName);

    return true;
  };

  /**
  * Sets the Cozi authentication cookie
  *
  * @return booloean
  */
  _cozi.auth.setLoggedInAuthCookie = function (auth, accountId) {
    var authObj = {},
        authObjAsString = '';

    _logger.log('cozi.auth.setLoggedInAuthCookie -> auth: ' +  auth + ', accountId: ' + accountId);

    if (!auth || !accountId) {
      _logger.warn('_cozi.auth.setLoggedInAuthCookie -> reqired parameter missing. EXITING.');

      //EXIT
      return false;
    }

    //build the authObj
    authObj = {auth : auth,accountId : accountId};

    //seerialize the authObj
    authObjAsString = JSON.stringify(authObj);

    //set the cookie
    _mrTools.setCookie(_utils.constants.LOGGED_IN_COOKIE_NAME,authObjAsString,_utils.constants.AUTH_COOKIE_EXPIRATION);

    _logger.log('_cozi.auth.setLoggedInAuthCookie >> authObj').dir(authObj);

    return true;
  };

  /**
  * Returns an object that contains the "auth" and "accountId" values stored in the Cozi authentication cookie.
  * @return Object
  */
  _cozi.auth.getLoggedInAuthCookieAsObject = function coziGetLoggedInAuthCookiesAsObject() {
    var retVal = {},
      loggedInCookie = mrTools.getCookie(_utils.constants.LOGGED_IN_COOKIE_NAME);

    //is there an existing cookie ?
    if (!loggedInCookie) {
      retVal = {error: 'no cozi credentials found'};
    } else {
      retVal = JSON.parse(loggedInCookie);
    }

    _logger.log('_cozi.auth.getLoggedInAuthCookieAsObject ->').dir(retVal);

    return retVal;
  };

  /**
  * Logs the user into Cozi.com behind the scenes
  *
  * @param auth: an auth string from successful Cozi.com login
  *
  * @return undefined
  */
  _cozi.auth.preAuthenticateToCozi = function (auth) {
    var image = null,
        imageSrc = '';

    if(!auth) {
      _logger.warn('_cozi.auth.preAuthenticateToCozi -> auth parameter missing. EXITING.');

      //exit
      return;
    }

    //crate the image element
    image = document.createElement('img');

    //create the image src attribute
    imageSrc = 'https://my.cozi.com/logon?auth=' + auth;

    //do not display the image
    image.style.display = 'none';
    image.src = imageSrc;

    _logger.log('_utils.preAuthenticateToCozi -> about to add this image for pre-auth: ' + imageSrc);

    //add the image, this wil authenticate the user on cozi.com
    document.getElementsByTagName('body')[0].appendChild(image);
  };

  /**
  * Logs the user out of Cozi.com behind the scenes
  *
  * @return undefined
  */
  _cozi.auth.logUserOutAtCozi = function () {
    //crate the image element
    var image = document.createElement('img'),
      //create the image src attribute
      imageSrc = ('https://my.cozi.com/logon/logout');

    //do not display the image
    image.style.display = 'none';
    image.src = imageSrc;

    _logger.warn('_utils.logUserOutAtCozi -> about to log the user out at cozi.com');

    //add the image, this wil log the user out at cozi.com
    document.getElementsByTagName('body')[0].appendChild(image);
  };

  /**
  * Gets all recipes saved in user Cozi recipe box
  * @param callback : Function to execute after the async call succeeds
  *
  * @return $.Deferred
  */
  _cozi.recipe.getAll = function coziRecipeGetAll (callback) {
      var ajaxBase = _utils.config.ajaxBase.getRecipes,
          authObject = _cozi.auth.getCookie(),
          ajaxConfig = {
            success: function (jsonData) {
              //pass the return data to the callback, if there is one
              _safeFunction(callback)(jsonData);

              _logger.log('_cozi.recipe.getAll -> all recipes -> success -> jsonData:').dir(jsonData);
            },
            error: function (errorData) {
              _logger.warn('_cozi.recipe.getAll -> error: errorData').dir(errorData);
            }
          };

    //build the ajax config object
    ajaxBase.url = ajaxBase.urlBase + authObject.accountId + '/food/recipe/?apikey=myrecipes' + '&auth=' + authObject.auth;
    ajaxConfig = $.extend({},ajaxConfig,ajaxBase);

    _logger.info('_cozi.recipe.getAll -> ajaxConfig: ').dir(ajaxConfig);

    //make the ajax call
    return _utils.ajax(ajaxConfig);
  }

  /**
  * Returns string that represents a single reciep ingredient
  * @param ingredient : object - must contain amount, unit & name properties
  *
  * @return string
  */
  _cozi.recipe.makeIngredientString = function (ingredient) {
        var ingredientText = '';

      //make sure that the required object is provided
      if (!ingredient || !(ingredient instanceof Object)) {
        _logger.warn('no ingredient object provided: EXITING.');

        //exit
        return;
      }

      _logger.log('_cozi.recipe.makeIngredientString -> ingredientObject').dir(ingredient);

      //dont accept undefined or none
      if (!ingredient.unit || ingredient.unit === 'none') {ingredient.unit = ' '; }

      //create the ingredient string
      ingredientText = (ingredient.amount ? ingredient.amount : '') + ' ' + (ingredient.unit ? ingredient.unit  : '') + ' ' + ingredient.name;

      _logger.log('_cozi.recipe.makeIngredientString -> just created ingredient: ' + ingredientText);

      //return the string
      return ingredientText;
  };

  /**
  * Get existing shopping lists for logged-in Cozi user.
  * @param callback - function - A function to be executed when the async call completes
  *
  * @return jQuery Deferred
  */
  _cozi.shoppingLists.getAll = function (callback) {
    var ajaxConfig = {},
        creds = _cozi.auth.getLoggedInAuthCookieAsObject(),
        ajaxBaseObj = _utils.config.ajaxBase.getShoppingLists;

    //make sure we have what is needed for the API call
    if (creds.error || !(callback instanceof Function)) {
      _logger.warn('_cozi.shoppingLists.getAll -> problem with credentials or callback: EXITING.');

      //exit
      return;
    }

    //build the ajax config object
    ajaxConfig = {
      success : callback,
      error : function (error) {
        _logger.warn('_cozi.shoppingLists.getAll -> error:').dir(error);
      }
    };

    ajaxConfig.url = ajaxBaseObj.url + creds.accountId + '/lists/shopping/?auth=' + creds.auth;

    _logger.log('_cozi.shoppingLists.getAll -> ajaxConfig: ').dir(ajaxConfig);

    return _utils.ajax($.extend({},ajaxBaseObj, ajaxConfig));
  };

  /**
  * Create multiple shopping list items in the specified shopping list
  *
  * @param config (object) : Configuration details
  */
  _cozi.shoppingLists.addMultipleItemsToList = function (config) {
    var ajaxConfig = {},
        creds = _cozi.auth.getCookie(),
        ajaxBaseObj = _utils.config.ajaxBase.createOrEditShoppingListItem;

    //make sure we have what is needed for the API call
    if (creds.error || !config) {
      _logger.warn('_cozi.shoppingLists.getAll -> problem with credentials or config object: EXITING.');

      //exit
      return;
    }

    if (!config.list) {
      _logger.warn('_cozi.shoppingLists.addMultipleItemsToList  >> no list id provided');

      //exit
      return;
    }

    _logger.log('_cozi.shoppingLists.addMultipleItemsToList >> config: ').dir(config);

    //build the ajax config object
    ajaxConfig = {
      success : _safeFunction(config.success),
      error : _safeFunction(config.error),
    };

    ajaxConfig.url = ajaxBaseObj.url + creds.accountId + '/lists/shopping/' + config.list + '?auth=' + creds.auth;
    ajaxConfig.data = JSON.stringify({"items": config.items });

    _utils.ajax($.extend({}, ajaxBaseObj, ajaxConfig));
  };

  /**
  * Retrieves account data
  *
  * @param callback - function - function to execute after the ajax call has completed
  *
  * @return deferred
  */
  _cozi.auth.getAccountInfo = function coziAuthGetAccountInfo (callback) {
    var ajaxBase = _utils.config.ajaxBase.getAccountInfo,
      authObject = _cozi.auth.getCookie(),
      ajaxConfig = {
        success: function (jsonData) {
          _safeFunction(callback)(jsonData);

          _logger.log('_cozi.auth.getAccountInfo -> success:').dir(jsonData);
        },
        error: function (errorObject) {
          _logger.log('_cozi.auth.getAccountInfo -> success:').dir(errorObject);
        }
      };

      if (!_cozi.auth.userIsLoggedIn()) {
        _logger.warn('_cozi.auth.getAccountInfo: user not logged in. EXITING.');

        //exit
        return;
      }

    //build the ajaxConfig object
    ajaxBase.url = ajaxBase.urlBase + authObject.accountId + '/household/?detail=true&auth=' + authObject.auth + '&apikey=cozimc%7C4.0.59&time=1407559719896';
    ajaxConfig = $.extend({},ajaxConfig,ajaxBase);

    _logger.log('_cozi.auth.getAccountInfo -> ajaxConfig:').dir(ajaxConfig);

    //make the ajax call
    return _utils.ajax(ajaxConfig);
  };

  /**
  * Creates a new cozi account
  *
  * @param autObj (object) Configuration settings for the login attempt
  */
  _cozi.auth.createAccount = function (authObj) {
    var accountObj = {},
      ajaxConfig = {};

    if (!authObj || !authObj.email || !authObj.password) {
      _logger.warn('_cozi.auth.createAccount -> a required parameter was missing. EXITING.');

      //exit
      return;
    }

    _logger.log('_cozi.auth.createAccount').dir(authObj);

    //build the account object
    accountObj = {
      'account' : {
        'adults' : [
          {
            'email' : authObj.email,
            'name' : (authObj.name || authObj.email)
          }
        ],
        'cobrand' : 'MYRECIPES',
        'eulaCoppaAccepted' : true,
        'name' : (authObj.name || ''),
        'postalCode' : (authObj.postalCode || '')
      },
      'password' : authObj.password
    };

    ajaxConfig.data = JSON.stringify(accountObj);

    //add the success and error callbacks
    ajaxConfig.success = _safeFunction(authObj.success);
    ajaxConfig.error = _safeFunction(authObj.error);

    //legacy
    //ajaxConfig = $.extend({},ajaxConfig,_utils.config.ajaxBase.createAccount);

    //HTTPS issue
    if (navigator.appVersion.indexOf('MSIE 8.')!=-1 || navigator.appVersion.indexOf('MSIE 9.')!=-1) {
      window.alert('We\'re sorry, please try logging in with another browser (Firefox or Chrome) while we investigate this issue.');

      //exit
      return;
    }

    ajaxConfig = $.extend({}, ajaxConfig, {
      url : 'https://rest.cozi.com/api/ext/1303/account/?apikey=myrecipes',
      dataType : 'json',
      type : 'POST'
    });

    return _utils.ajax(ajaxConfig);
  };

  /**
  * Asyncronously fetches a recipe
  * @return Object
  */
  _cozi.api.getAsyncRecipe = function (configObj) {
    var urlPart1 = mrTools.env.urlBase,
        urlPart2 = '/ti_recipes/data/',
        urlPart3 = '',
        urlPart4 = '.json',
        fullUrl = '';

    if (!configObj || !configObj.id) {
      _logger.warn('_cozi.api.getAsyncRecipe - > no recipe id provided.  EXITING.');

      //exit
      return false;
    }

    _logger.log('_utils.getAsyncRecipe -> ' + configObj.id);

    //build the url
    urlPart3 = configObj.id;
    fullUrl = urlPart1 + urlPart2 + urlPart3 + urlPart4;

    //attach the callback
    configObj.callback = _safeFunction( configObj.callback);


    if (window.location.search.indexOf('pldebugmr') > -1) {
      fullUrl = mrTools.env.urlBase + ':3000/assets/js/lib/myrecipes/recipe.json';
    }

    //make the ajax call
    $.ajax({
      url : fullUrl,
      success : function (jsonData) {
        configObj.callback(jsonData);

        _logger.log('_utils.getAsyncRecip -> success -> jsonData').dir(jsonData);
      },
      error : function (error) {
        configObj.callback(error);

        _logger.warn('_utils.getAsyncRecip -> error -> ' + error);
      },
    });
  };

  /**
  * Saves a single recipe to Cozi
  *
  * @param callback: Function to execute after the recipe has been successfully saved
  * @param recipeObj: object - provides recipe details
  *
  * @return $.Deferred
  */
  _cozi.api.saveRecipeToCozi = function saveRecipeToCozi(callback, recipeObj) {
      var ajaxBase = _utils.config.ajaxBase.saveRecipe,
          authObject = _cozi.auth.getCookie(),
          ajaxConfig = {
            data: JSON.stringify(recipeObj.recipe),
            success: function (jsonData){
              //pass the return data to the callback
              _safeFunction(callback)(jsonData);

              _logger.log('_cozi.api.saveRecipeToCozi -> success -> jsonData:').dir(jsonData);
            },
            error: function (error){
              //pass the error to the callback
              _safeFunction(callback)(error);

              _logger.warn('_cozi.api.saveRecipeToCozi -> error: ' + error);
            }
    };
    //build the ajaxConfig object
    ajaxBase.url = ajaxBase.urlBase + authObject.accountId + '/food/recipe/?apikey=myrecipes' + '&auth=' + authObject.auth;
    ajaxConfig = $.extend({}, ajaxConfig, ajaxBase);

    _logger.log('_cozi.api.saveRecipeToCozi -> ajaxConfig: ').dir(ajaxConfig);

    //return the ajax call
    return _utils.ajax(ajaxConfig);
  };

  /**
  * Asyncronously saves multiple recipes to cozi
  *
  * @param recsArr (array), an array of recipe IDs or recipe objects
  * If recsArr contains recipe objects, they must have the property: recipe.url
  *
  * @param callback (function), to be executed when async save is complete
  */
  _cozi.recipe.saveAllRecipesToCozi = function saveAllRecipesToCozi(recsArr, callback) {
    var finalUrl = '',
      urlPart1 = (mrTools.env.urlBase + '/ti_recipes/data/'),
      urlPart2 = '.json';

    //make sure that an array was passed as the first argument
    if (!recsArr ||  !(recsArr instanceof Array) || !recsArr.length) {
      _logger.warn('_cozi.recipe.saveAllRecipesToCozi -> no array provided or array empty');

      //exit
      return;
    }

    //iterate over all of the recipe objects or IDs
    $.each(recsArr, function (index, item) {
      //if an array of recipe objects was passed in
      if (item && item.recipe  && item.recipe.url) {
        finalUrl = _utils.getRecipeJsonUrlFromRecipeUrl(item.recipe.url);

        _logger.info('_utils.saveAllRecipesToCozi -> recipe object ->').dir(item);
      } else {
        //if an array of recipe IDs was passed in
        finalUrl = urlPart1 + item + urlPart2;

        _logger.info('_utils.saveAllRecipesToCozi -> recipe id -> ' + item);
      }

      //make the ajax call
      $.ajax({
          url: finalUrl,
          success : function (jsonData) {
            _logger.log('_cozi.recipe.saveAllRecipesToCozi -> $.ajax -> success:').dir(jsonData);

            _cozi.api.saveRecipeToCozi(function (recipe) {
              //if this is the last async recipe call
              if (index === (recsArr.length - 1)) {
                //pass the error to the callback
                _safeFunction(callback)(jsonData);

                _logger.info('_cozi.recipe.saveAllRecipesToCozi -> $.ajax -> success -> LAST RECIPE').dir(recipe)
              }

              _logger.info('_cozi.recipe.saveAllRecipesToCozi -> $.ajax -> success -> _cozi.api.saveRecipeToCozi').dir(recipe);
            }, _utils.createRecipeObject(jsonData));
          }
      });
    });
  };

  /**
  * Converts an array of ingredients into a string
  *
  * @param ingredientsArray (array) an array of ingredients objects
  *
  * @return string
  */
  _utils.ingredientsArrayToFormattedObjectsArray = function (ingredientsArray) {
    var objectsArray = [];

    if (!ingredientsArray || !(ingredientsArray instanceof Array)) {
      _logger.warn('_utils.ingredientsArrayToFormattedObjectsArray -> array not provided. EXITING');

      //exit
      return;
    }

    $.each(ingredientsArray, function (index, ingredient) {
      //don't accept undefined or none
      if (!ingredient.unit || ingredient.unit === 'none') {ingredient.unit = ' '; }

      //add the ingredient to the array, built using the amount, unit and name properites
      var ingredientText = (ingredient.amount || '') + ' ' + (ingredient.unit || ' ') + ' ' +  ingredient.name;

        //add the ingredient object
        objectsArray.push({
          name: ingredientText
        });

      _logger.log('_utils.ingredientsArrayToFormattedObjectsArray -> ' + ingredient.name + ' added to stringArray');
    })

    _logger.log('_utils.ingredientsArrayToFormattedObjectsArray -> done:').dir(objectsArray);

    //return the array of ingredients objects
    return objectsArray;
  };

  /**
  * Creates a recipe object that has the required properties for the Cozi API calls
  *
  * @param recipeDataObj (object) - An object that contains the recipe data
  *
  * @return object
  */
  _utils.createRecipeObject = function createRecipeObject(recipeDataObj) {
    var recipe = recipeDataObj.recipe || {},
        retVal = {recipe : {}},
        rec = retVal.recipe,
        urlBase = '';

    //make sure we have the recipeDataObj
    if (!recipeDataObj || !(recipeDataObj instanceof Object)) {
      _logger.warn('_utils.createRecipeObject -> recipe data object not provided. EXITING');

      //exit
      return;
    }

    //set the URL base
    urlBase = mrTools.env.urlBase + '/recipe/';

    //just in case editorial_recipe_data is udefined
    recipe.editorial_recipe_data = recipe.editorial_recipe_data || {};

    //build the recipe object
    rec.sourceRaw = urlBase + recipe.premalink;
    rec.name = (recipe.name) ? recipe.name : '';
    rec.sourceLogoUrl = (recipe.editorial_recipe_data.publication_logo_url) ? recipe.editorial_recipe_data.publication_logo_url : '';
    rec.description = recipe.description;
    rec.ingredients = _utils.ingredientsArrayToFormattedObjectsArray(recipe.ingredients.ingredient);
    rec.instructions = '\n' + recipe.preparation.replace(/<\/p><p>/g, '\n\n').replace(/<p>/g, '').replace(/<\/p>/g, '');
    rec.photos = [{
      text: (recipe.editorial_recipe_data.seo_title) ? recipe.editorial_recipe_data.seo_title : '',
      originalUrl: recipe.default_image_url
    }];
    rec.isPublished = true;
    rec.dataType = 'md';

    _logger.log('_utils.createRecipeObject -> recipe object:').dir(retVal);

    //return the recipe object
    return retVal;
  };

  /**
  * Returns the URL for a recipe json file, based on a permalink or recipe ID
  *
  * @param permalinkOrRecipeId (string or number) - either the permalink for the recipe or the recipe id
  *
  * @return string
  */
  _utils.getRecipeJsonUrl = function (permalinkOrRecipeId) {
    var retVal = '',
      urlBase = mrTools.env.urlBase,
      path = '/ti_recipes/data/',
      extension = '.json';

    permalinkOrRecipeId = permalinkOrRecipeId || '';

    retVal = urlBase + path + permalinkOrRecipeId + extension;

    _logger.log('_utils.getRecipeJsonUrl -> ' + retVal);

    //return the url
    return retVal;
  };

  /**
  * Returns the URL for a recipe json file, based on a given recipe URL
  *
  * @param permalinkOrRecipeId (string or number) - either the permalink for the recipe or the recipe id
  *
  * @return string
  */
  _utils.getRecipeJsonUrlFromRecipeUrl = function (recipeUrl) {
    var dataPath = '/ti_recipes/data/';

    //in case nothing was passed-in
    recipeUrl = recipeUrl || '';

    //build the url
    recipeUrl = recipeUrl.replace('/m/recipe/', dataPath).replace('/recipe/', dataPath) + '.json';

    _logger.log('_utils.getRecipeJsonUrlFromRecipeUrl -> ' + recipeUrl);

    //return the url
    return recipeUrl;
  };

  /**
  * Returns the permalink portion of the current recipe url
  * Fails silently if this is not a recipe page
  */
  _utils.getRecipePermalinkFromUrl = function () {
    var winLocHref = window.location.href,
        permalinkArr = '',
        recipeHrefPattern = (mrTools.env.isMobile) ? 'myrecipes.com/m/recipe/' : 'myrecipes.com/recipe/';

    //remove the query string
    if (window.location.search) {
      winLocHref = winLocHref.replace(window.location.search, '');
    }

    //remove the hash
    if (window.location.hash) {
      winLocHref = winLocHref.replace(window.location.hash, '');
    }

    //remove a partial query string
    if (winLocHref.indexOf('?') > -1) {
      winLocHref = winLocHref.replace('?', '');
    }

    //remove a partial query string
    if (winLocHref.indexOf('&') > -1) {
      winLocHref = winLocHref.replace('&', '');
    }

    //remove a partial query string
    if (winLocHref.indexOf('=') > -1) {
      winLocHref = winLocHref.replace('=', '');
    }

    //remove a partial hash
    if (winLocHref.indexOf('#') > -1) {
      winLocHref = winLocHref.replace('#', '');
    }

    //if this is not a recipe page
    if (mrTools.getPageContext().type !== 'recipe') {
      _logger.warn('_utils.getRecipePermalinkFromUrl -> not a recipe page. EXITING');

      //exit
      return false;
    }

    //if /recipe/ was not found in the url
    if (winLocHref.indexOf(recipeHrefPattern) === -1) {
      _logger.warn('_utils.getRecipePermalinkFromUrl -> problem getting the recipe id. EXITING');

      //exit
      //return false;
    }

    if (window.location.search.indexOf('permalink=') > -1) {
      winLocHref = window.location.href;
      recipeHrefPattern = 'permalink=';
    }

    //split the url, to get the permalink
    permalinkArr = winLocHref.split(recipeHrefPattern);

    //if there was some other issue
    if (!permalinkArr[1]) {
      _logger.warn('_utils.getRecipePermalinkFromUrl -> problem constructing the recipe id. EXITING');

      //exit
      return false;
    }

    _logger.log('_utils.getRecipePermalinkFromUrl -> ' + permalinkArr[1]);

    //return the permalink
    return permalinkArr[1];
  };

  /**
  * Registers a single feature that will react to user context switching
  *
  * @param (required) featureObject - An object that represents a feature. Must have a name property
  *
  * @return bolean
  */
  _utils.registerFeature = function (featureObject) {
      featureObject = featureObject || {};

      //the name property is required
      if (!featureObject.name) {
        _logger.warn('_utils.registerFeature -> MISSING featureObject.name. EXITING.');

        //exit
        return false;
      }

      //if the featureObject wants to be initialzed, run that method
      _logger.log('_utils.registerFeature -> about to initialize: ' + featureObject.name);

      //if the feature has an initialize method, exexute it
      if (featureObject.initialize) {
        _safeFunctionApply(featureObject.initialize, featureObject);
      }

      _logger.log('_utils.registerFeature -> about to register: ' + featureObject.name);

      //register the featureObject
      _utils.registeredFeatures.push(featureObject);

      _logger.log('_utils.registerFeature -> registration complete: ' + featureObject.name);

      return true;
  };

  /**
  * Registers a group of features that will react to user context switching
  *
  * @param (required) objectOrArray - An object or array, that contains one or more feature. Each feature must have a name property
  *
  * @return array
  */
  _utils.registerFeatures = function (objectOrArray) {
    objectOrArray = objectOrArray || [];

    //for each feature object in the objectOrArray
    $.each(objectOrArray, function (index, feature) {
    //register that feature
    _utils.registerFeature(feature);
    });

    _logger.log('_utils.registerFeatures -> all registrations complete ->').dir(_utils.registeredFeatures);

    //return all registered features
    return _utils.registeredFeatures;
  };

  /**
  * Iterates through all registered features and calls the appropriate method, based on page type and user context
  *
  * @param pageType (required) A string that indicates the template type
  * @param pageType (required) A string that indicates the user context (i.e. logged in or out)
  *
  * @return boolean
  */
  _utils.processFeature = function (pageType, userContext) {
      _logger.log('_utils.processFeature -> userContext: ' + userContext + ' -> pageType: ' + pageType);

      //pageType is required
      if (!pageType) {
        _logger.warn('_utils.processFeature -> MISSING: pageType. EXITING');

        //exit
        return false;
      }

      if (!userContext) {
        _logger.warn('_utils.processFeature -> MISSING: userContext. EXITING');

        //exit
        return false;
      }

      if (!_utils.registeredFeatures) {
        _logger.warn('_utils.processFeature -> NOT FOUND: _utils.registeredFeatures. EXITING');

        //exit
        return false;
      }

      $.each(_utils.registeredFeatures, function (index, feature) {
        _logger.log('_utils.processFeature -> about to attempt processing for: ' + feature.name + ' -> action: ' + userContext + ' (against page type: ' + pageType + ')');

        //do not process this feature if its type property does not match the current page type (e.g. "recipe")
        if (feature.type !== pageType) {
          _logger.warn('_utils.processFeature -> pageType: ' + pageType + ' -> skipping: ' + feature.name + ' (wrong type. that feature is configured for: ' + feature.type + ')');

          //exit
          return;
        }

        //if this feature has the specified method
        if (feature[userContext]) {
          //execute the method in the context of the feature
          _safeFunctionApply(feature[userContext], feature);
        } else {
          _logger.warn( ('the method: ' + feature[userContext] + ' was not found'));
        }
      });

      return true;
  };

  /**
  * Calls the appropriate method for each registerd element, based on page context
  *
  * @return boolean
  */
  _utils.processUserContextChange = function () {
      var userType = '',
        loggedInUserValue = 'coziUser',
        anonymousUserValue = 'anonymous',
        pageContext = _mrTools.getPageContext().type;

      _logger.log('_utils.processUserContextChange -> ' + pageContext);

      //simplify call to _utils.handleAction
      function processFeature (template) {
        _logger.log('_utils.processUserContextChange -> processFeature -> ' + userType + ' -> ' + template);

        //if template is not provided
        if (!template) {
          _logger.warn('_utils.processUserContextChange -> processFeature -> no template provided. EXITING.');

          //exit
          return;
        }

        //proocess the given method of this feature (e.g. anonymous or coziUser)
        _utils.processFeature(template, userType);
      }

      function processUserContext () {
        //handle all "all" element types
        _utils.processFeature('all', userType);

        //handle all element types that match: 'pageContext'
        switch (pageContext) {
          case 'recipe':
            processFeature('recipe');
            break;
          case 'menu':
            processFeature('menu');
            break;
          case 'mrf':
            processFeature('mrf');
            break;
          case 'planner':
            processFeature('planner');
            break;
          case 'gallery':
            processFeature('gallery');
            break;
          case 'playlist':
            processFeature('playlist');
            break;
          default:
            //do nothing
        }
      }

      //get the user context
      userType = _cozi.auth.userIsLoggedIn() ? loggedInUserValue : anonymousUserValue;

      //process the elements accordingly
      processUserContext(userType);

      return true;
  };

  //initialize the applcation
  _utils.init();
})(window, window.jQuery || window.$);