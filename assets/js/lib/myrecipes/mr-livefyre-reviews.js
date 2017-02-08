// LiveFyre reviews for recipe pages

(function (_window, $) {
  "use strict";

  /*global window: false */

  var _appName = 'mr-LiveFyre-app',
    _version = '2.0.0',
    _logger = null,
    _drupalSettingsOk = (_window.Drupal && _window.Drupal.settings) ? true : false,
    _getDrupalSetting = function () {return ''; },
    _utils = {config : {}, constants : {}};

  //off-switch for dev
  if (_window.MR_TOOLS && (typeof _window.MR_TOOLS.getCookie === 'function') && _window.MR_TOOLS.getCookie('livefyre_NO-RUN') !== null) {return; }


  _utils.constants.LOGGER_PREFIX = _appName + ' (' + _version + ') -> ';
  _utils.constants.LIVEFYRE_SCRIPT_URL = '//cdn.livefyre.com/Livefyre.js';
  //these are updated in _utils.setupAjaxUrls
  _utils.constants.URL_BASE = '';
  _utils.constants.MR_LIVEFYRE_SERVICES_USER_TOKEN_URL = '';
  _utils.constants.MR_LIVEFYRE_SERVICES_COLLECTION_METADATA_TOKEN_URL = '';
  //these are used in _utils.setupAjaxUrls to build the final ajax URLs
  _utils.constants.MAX_REVIEWS_DISPLAYED = 25;
  _utils.constants.MR_LIVEFYRE_SERVICES_PATH = '/services/livefyre/';
  _utils.constants.MR_LIVEFYRE_SERVICES_USER_TOKEN_PATH = 'user_token';
  _utils.constants.MR_LIVEFYRE_SERVICES_COLLECTION_METADATA_TOKEN_PATH = 'collection_metadata_token';
  _utils.constants.POST_AS_BUTTON_TEXT = 'Post your recipe review';
  _utils.constants.POST_EDIT_BUTTON_TEXT = 'Edit your recipe review';
  _utils.constants.SHOW_REVIEW_BUTTON_TEXT = 'Show My Review';
  _utils.constants.COMMENT_COUNT_LABEL = 'Be the first to rate it';
  _utils.constants.COMMENT_COUNT_LABEL_PLURAL = 'Ratings and Reviews';

  /**
    * Provides safe acess to Drupal.settings
    *
    * @return string
  */
  _getDrupalSetting = function (settingName) {
    settingName = settingName || '';

    if (!_drupalSettingsOk){return '';}

    return _window.Drupal.settings[settingName] || '';
  };

  _utils.config.appType = 'reviews';
  _utils.config.articleId = _getDrupalSetting('nid');
  _utils.config.siteId = _getDrupalSetting('lf_site_id');
  _utils.config.network = _getDrupalSetting('lf_network_name');

  _utils.config.liveFyreDomElementid = 'mr-livefyre-ratings';
  //these are used in the ajax calls that get the user and collection metadata tokens
  _utils.config.userToken = '';
  _utils.config.seo_title = '';
  _utils.config.user_id = '';
  _utils.config.display_name = '';

  //used by Livefyre.require
  _utils.config.networkConfig = {
    network: _utils.config.network,
    strings: {
      postAsButton: _utils.constants.POST_AS_BUTTON_TEXT,
      postEditButton: _utils.constants.POST_EDIT_BUTTON_TEXT,
      showReviewBtn: _utils.constants.SHOW_REVIEW_BUTTON_TEXT,
      commentCountLabel : _utils.constants.COMMENT_COUNT_LABEL,
      commentCountLabelPlural : _utils.constants.COMMENT_COUNT_LABEL_PLURAL
    }
  };

  //used by Livefyre.require
  _utils.config.convConfig = {
    collectionMeta: '',
    enableHalfRating: false,
    ratingSummaryEnabled: true,
    app: _utils.config.appType,
    siteId: _utils.config.siteId,
    el: _utils.config.liveFyreDomElementid,
    articleId: _getDrupalSetting('nid')
    //initialNumVisible: _utils.constants.MAX_REVIEWS_DISPLAYED
  };

  _utils.config.authDelegateObject = {
    login: function (callback) {
      mrCoziAppLib.requireAuth(function () {
        //when the async call to get user token is done
        _utils.getUserToken().done(function () {
          //pass the user-token to livefyre
          callback(null, {livefyre : _utils.config.userToken});
        });
      });
    },
    //these three methods don't do anything now, but livefyre suggesting that they be there
    //so that when this obeject is passed to auth.delegate, the properties are recognized
    logout: function (errback) {errback(null); },
    //return true is in these so that the js linter does not complain about "empty block"
    viewProfile: function () {return true; },
    editProfile: function () {return true; }
  };

  /**
    * Initializes the application
    *
    * @return undefined
  */
  _utils.init = function () {
    //instantiate the logger
    debugger;
    _logger = mrTools.newLogger(_utils.constants.LOGGER_PREFIX);

    _logger.info('_utils.init -> ').dir(_utils.config);

    //add custom CSS
    _utils.addCustomCss();

    //setup logout binding
    _utils.setupLogoutBinding();

    //setup ajax urls
    _utils.setupAjaxUrls();

    //start the app
    _utils.startApp();
  };

  /**
    * Starts the application
    *
    * @return undefined
  */
  _utils.startApp = function () {
    //make async call for livefyre js file
    $.when($.getScript(_utils.constants.LIVEFYRE_SCRIPT_URL)).done(_utils.initLivefyre);

    _logger.log('_utils.startApp');
  };

  _utils.addCustomCss = function () {
    var cssText = [
      // Hide 'Edit Profile' link
      '.fyre-edit-profile-link{display: none !important;}',
      // Hide 'Logout' link
      '.fyre-logout-link{display: none;}',
      //hide the log-in link
      '.fyre-auth{visibility: hidden;}'
    ].join('');

    $('body').append('<style>' + cssText + '</style>');

    _logger.log('_utils.addCustomCss');
  };

  /**
    * Logs out the current livefyre user
    *
    * @return undefined
  */
  _utils.logoutLivefyreUser = function () {
    _window.Livefyre.require(['auth'], function (auth) {
      //log out the livefyre user
      auth.logout();

      _logger.warn('_utils.logoutLivefyreUser -> LIVEFYRE USER LOGGED OUT');
    });
  };

  /**
  * Checks to see if the user is anonymous, and if so, logs-out the livefyre user
  * (in case they logged-out of a cozi account on a previous DESKTOP page)
  *
  * @return undefined
  */
  _utils.logOutAnonymousLivefyreUser = function () {
    _logger.log('_utils.logOutAnonymousLivefyreUser');

    //even if the cozi user is logged out, we still need to manually call auth.logout
    if (!mrCoziAppLib.cozi.auth.userIsLoggedIn()) {
      _utils.logoutLivefyreUser();

      _logger.warn('_utils.logOutAnonymousLivefyreUser -> MR USER IS ANONYMOUS');
    }
  };

  /**
  * Setsup binding so that MR logout triggers LiveFyre logout
  *
  * @return undefined
  */
  _utils.setupLogoutBinding = function () {
    mrTools.bindEvent(mrCoziAppLib.utils.constants.EVENT_COZI_LOGOUT_SUCCESS, _utils.logoutLivefyreUser);

    _logger.log('_utils.setupLogoutBinding');
  };

  /**
    * Sets up URLs used for ajax calls
    *
    * @return undefined
  */
  _utils.setupAjaxUrls = function () {
    debugger;
    var CONSTANTS = _utils.constants,
      SERVICES_PATH = CONSTANTS.MR_LIVEFYRE_SERVICES_PATH;

    _utils.constants.URL_BASE = mrTools.env.urlBase;

    //update the URL constatnts used for AJAX calls
    CONSTANTS.MR_LIVEFYRE_SERVICES_USER_TOKEN_URL = CONSTANTS.URL_BASE + SERVICES_PATH + CONSTANTS.MR_LIVEFYRE_SERVICES_USER_TOKEN_PATH;
    CONSTANTS.MR_LIVEFYRE_SERVICES_COLLECTION_METADATA_TOKEN_URL = CONSTANTS.URL_BASE + SERVICES_PATH + CONSTANTS.MR_LIVEFYRE_SERVICES_COLLECTION_METADATA_TOKEN_PATH;

    if (window.location.search.indexOf('pldebugmr') > -1) {
      CONSTANTS.MR_LIVEFYRE_SERVICES_COLLECTION_METADATA_TOKEN_URL = mrTools.env.urlBase + ':3000/assets/js/lib/myrecipes/token.json';
    }

    _logger.log('_utils.setupAjaxUrls -> _utils.constants').dir(CONSTANTS);
  };


  /**
    * Asyncronously fetches recipe data
    *
    * @return new $.Deferred()
  */
  _utils.getRecipeInfo = function () {
    var deferred = new $.Deferred();

    //_window.mrCoziLib.getAsyncRecipe({
    _window.mrCoziAppLib.getAsyncRecipe({
      id : _window.mrCoziAppLib.utils.getRecipePermalinkFromUrl(),
      callback : function (jsonData) {
        //cache the seo_title
        _utils.config.seo_title = jsonData.recipe.editorial_recipe_data.seo_title;

        //resolve the deferred
        deferred.resolve();

        _logger.info('_utils.getRecipeInfo -> _window.mrCoziAppLib.getAsyncRecipe -> callback').dir(jsonData);
      }
    });

    _logger.log('_utils.getRecipeInfo');

    return deferred;
  };

  /**
    * Asyncronously fetches a livefyre metadata token
    *
    * @return new $.Deferred()
  */
  _utils.getMetaToken = function () {
    debugger;
    var deferred = new $.Deferred(),
      userData = {article_id: _getDrupalSetting('nid'), title : _utils.config.seo_title, url: window.location.href},
        callType = "POST";

    if (window.location.search.indexOf('pldebugmr') > -1) {
      callType = "GET";
    }

    $.ajax({
      type: callType,
      url: _utils.constants.MR_LIVEFYRE_SERVICES_COLLECTION_METADATA_TOKEN_URL,
      data: userData,
      dataType: 'json',
      success : function (jsonData) {
        //cache the json collection meta token
        _utils.config.convConfig.collectionMeta = jsonData.token;

        //resolve the deferred
        deferred.resolve();

        _logger.info('_utils.getMetaToken -> $.ajax -> success').dir(jsonData);
      }
    });

    _logger.log('_utils.getMetaToken');

    //return the deferred
    return deferred;
  };

  /**
    * Asyncronously fetches a migrated Cozi user's legacy ID
    *
    * @return new $.Deferred()
  */
  _utils.getLegacyKaId = function (configObject) {
    var urlBase = 'http://rest.cozi.com/api/ext/1506/',
        urlPath = '/ka/profile/?auth=',
        fullUrl = '';

    configObject = configObject || {};

    if(!configObject.accountId ||  !configObject.auth){return; }

    configObject.callback = (configObject.callback && (configObject.callback instanceof Function)) ? configObject.callback : function(){};

    fullUrl = urlBase + configObject.accountId + urlPath + configObject.auth;

    return _window.jQuery.ajax({
        url: fullUrl,
        type: 'GET',
        dataType: "json",
        success: function(jsonData){
            configObject.callback(jsonData);

            _logger.info('_utils.getMetaToken -> _window.jQuery.ajax -> success').dir(jsonData);
        }
    });

    _logger.log('_utils.getMetaToken');
  };

  /**
    * Asyncronously fetches a livefyre user token
    *
    * @return new $.Deferred()
  */
  _utils.getUserToken = function () {
    var deferred = new $.Deferred(),
      userData = {user_id: '', display_name: ''},
      authObject = mrCoziAppLib.cozi.auth.getLoggedInAuthCookieAsObject();

    function getAjaxToken() {
      _window.jQuery.ajax({
        type: "POST",
        url: _utils.constants.MR_LIVEFYRE_SERVICES_USER_TOKEN_URL,
        data: userData,
        dataType: 'json',
        success : function (jsonData) {
          //cache the user token
          _utils.config.userToken = jsonData.token;

          //resolve the deferred
          deferred.resolve();

          _logger.info('_utils.getMetaToken -> getAjaxToken -> success').dir(jsonData);
        }
      });
    }

    mrCoziAppLib.cozi.auth.getAccountInfo(function(userProfile){
        //cache the userProfile id
        userData.user_id = userProfile.id;
        //cache the userProfile display name
        userData.display_name = userProfile.adults[0].name.replace(/\s/g, '-');

         _logger.info('_utils.getMetaToken -> mrCoziAppLib.cozi.auth.getAccountInfo -> userProfile & userData')
           .dir(userProfile)
           .dir(userData);

        //see if this user has a legacy KA id
        _utils.getLegacyKaId({
          accountId: authObject.accountId,
          auth: authObject.auth,
          callback: function(jsonData){
              //is this a legacy KA user that was migrated?
              if (jsonData && jsonData[0] && jsonData[0].profileId && jsonData[0].name) {
                //use legacy Ka user info instead
                userData.user_id = jsonData[0].profileId;
                userData.display_name = jsonData[0].name;
              }

              //make the ajax call for the user token
              getAjaxToken();

              _logger.info('_utils.getMetaToken -> getAjaxToken -> _utils.getLegacyKaId -> callback -> jsonData & userData')
                .dir(jsonData)
                .dir(userData);
            }
        });
    });

    _logger.log('_utils.getUserToken');

    //return the deferred
    return deferred;
  };

  /**
    * Instantiates the livefyre widget
    *
    * @return undefined
  */
  _utils.initLivefyre = function () {
    var requireLivefyre = function () {
        _window.Livefyre.require(['fyre.conv#3', 'auth'], function (Review, auth) {
          debugger;
          var review = new Review(_utils.config.networkConfig, [_utils.config.convConfig], function () {return true; });

          auth.delegate(_utils.config.authDelegateObject);

          //make sure anonymous users are logged-out
          _utils.logOutAnonymousLivefyreUser();

          _logger.log('_utils.initLivefyre -> requireLivefyre');

          //the only reason this is returned is so that
          //the js linter does not complain: "Do not use 'new' for side effects."
          return review;
        });
      };

    $.when(_utils.getRecipeInfo()).done(function () {
      _utils.getMetaToken().done(requireLivefyre);

      _logger.info('_utils.getRecipeInfo().done()');
    });

    _logger.log('_utils.initLivefyre');
  };

  //initialize the application
  _utils.init();
}(window, window.jQuery || window.$));