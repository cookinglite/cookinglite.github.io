(function (_window, $) {

    'use strict';

    /*global window: false */

    var _version = '1.0.0',
        _utils = {},
        _logger = null;

    _utils.constants = {};
    _utils.settings = {};
    _utils.env = {};
    _utils.pastEvents = {};
    _utils.pastEventsLog = [];

    _utils.settings.logging = true;
    _utils.settings.loggingData = false;

    _utils.env.isMobile = (/myrecipes.com\/m\//.test(_window.location.href)) ? true : false;

    _utils.constants.DOCUMENT = document;
    _utils.constants.WINDOW_LOCATION_HREF = _window.location.href;
    _utils.constants.EMPTY_FUNCTION = function () {};
    _utils.constants.APP_NAME = 'mrTools';
    _utils.constants.LOGGER_COOKIE_NAME = _utils.constants.APP_NAME + '_LOGGER';
    _utils.constants.LOGGER_DATA_COOKIE_NAME = _utils.constants.APP_NAME + '_LOGGER_DATA';
    _utils.constants.LOGGER_PREFIX = 'mrTools_LOGGER (' + _version + ') -> ';
    _utils.constants.LOGGER_PREFIX_DEFAULT = 'mrTools_LOGGER_DEFAULT -> ';
    _utils.constants.APP_READY_EVENT_NAME = _utils.constants.APP_NAME + '_APP_READY_EVENT';
    _utils.constants.templateNames = {
      ALL : 'all',
      RECIPE : 'recipe',
      MENU : 'menu',
      GALLERY : 'gallery',
      PLANNER : 'planner',
      PLAYLIST : 'playlist',
      MRF : 'mrf'
    };

    /**
    * Initializes the application
    *
    * @return undefined
    */
    _utils.init = function () {
        //create a new logger instance
        _logger = _utils.newLogger(_utils.constants.LOGGER_PREFIX);

        //start the logger
        _utils.setLoggerFlag();

        //start the data logger
        _utils.setDataLoggerFlag();

        //create the global object
        _window[_utils.constants.APP_NAME] = _utils;
        _window[_utils.constants.APP_NAME].version = _version;

        //update settings and constants
        _utils.updateSettingsAndConstants();

        //start the application
        _utils.start();
    };

    /**
    * Starts the application
    *
    * @return undefined
    */
    _utils.start = function () {
        //trigger the app ready event
        _utils.appReady();

        _logger.info('_utils.start');
    };

    /**
    * Triggers an event, signaling that the app is ready
    *
    * @return undefined
    */
    _utils.appReady = function () {
        _utils.triggerEvent(_utils.constants.APP_READY_EVENT_NAME, _utils);

        _logger.log('_utils.appReady -> THE APP IS READY:');
    };

    /**
    * Updates settings and constants
    *
    * @return undefined
    */
    _utils.updateSettingsAndConstants = function () {
        _utils.env.urlBase = document.location.protocol +  '//' + document.location.hostname;
        _utils.env.pageContext = _utils.getPageContext();

        _logger.log('_utils.updateSettingsAndConstants').dir(_utils.env);
    };

    /**
    * Starts the logger (if _utils.settings.logging is set to true)
    *
    * @return undefined
    */
    _utils.setLoggerFlag = function () {
        _utils.settings.logging = _utils.checkForLoggingCookie();
        _logger.log('_utils.setLoggerFlag');
    };

    /**
    * Starts the data logger (if _utils.settings.logging is set to true)
    *
    * @return undefined
    */
    _utils.setDataLoggerFlag = function () {
        _utils.settings.loggingData = _utils.checkForDataLoggingCookie();
        _logger.log('_utils.setDataLoggerFlag');
    };

    /**
    * A wrapper for setTimeout
    *
    * @param delay (required) the number of of ms to delay
    *
    * @param callback (required) A callback function
    *
    * @return undefined
    */
    _utils.delay = function (delay, callback) {
        delay = delay || 800;

        _window.setTimeout(_utils.safeFunction(callback), delay);

        _logger.log('_utils.delay -> ' + delay);
    };

    /**
    * Scrollls to the top of the page
    *
    * @param delay (required) the number of of ms to delay
    *
    * @param callback (required) A callback function
    *
    * @return undefined
    */
    _utils.scrollTop = function (delay) {
        delay = delay || 800;

        //scroll to the top of the page
        $('html, body').animate({
            scrollTop: $('body').offset().top
        }, delay);

        _logger.log('_utils.scrollTop -> ' + delay);
    };

    /**
    * Validates a function
    *
    * @param functionToTest (required) A function to validate
    *
    * If functionToTest is not a valid function, a blank function is returned
    *
    * @return function
    */
    _utils.safeFunction = function (functionToTest) {
        var functionValid = (functionToTest && functionToTest instanceof Function);

        _logger.info('_utils.safeFunction -> ' + functionValid);

        return (functionValid) ? functionToTest : _utils.constants.EMPTY_FUNCTION;
    };

    /**
    * Validates a function and executes it in a specific context
    *
    * @param functionToTest (required) A function to validate
    *
    * @param contextObject (required) An object to which the function will be bound
    *
    * @return function
    */
    _utils.safeFunctionApply = function (functionToTest, contextObject) {
        contextObject = (contextObject && contextObject instanceof Object) ? contextObject : {};

        _logger.info('_utils.safeFunctionApply');

        return _utils.safeFunction(functionToTest).apply(contextObject);
    };

    /**
    * Binds a custom event
    *
    * @param evtName (required) The name of the custom event
    *
    * @return boolean
    */
    _utils.bindEvent = function (eventName, callback) {
        if (!eventName) {
          _logger.warn('_utils.bindEvent -> no event name provided. EXITING.');

          //exit
           return false;
         }

        //bind the event
        $(_utils.constants.DOCUMENT).on(eventName, _utils.safeFunction(callback));

        _logger.log('_utils.bindEvent -> ' + eventName);

        return true;
    };

    /**
    * Binds a custom event, but only once
    *
    * @param evtName (required) The name of the custom event
    *
    * @return undefined
    */
    _utils.bindEventOnce = function (eventName, callback) {
        if (!eventName) {
          _logger.warn('_utils.bindEventOnce -> no event name provided. EXITING.');

          //exit
          return false;
        }

        //bind the event
        $(_utils.constants.DOCUMENT).on(eventName, function(evt, data){
          //call the callback
          _utils.safeFunction(callback)(evt, data);

          //remove the binding
          _utils.unbindEvent(eventName);
        });

        _logger.log('_utils.bindEventOnce -> bound:' + eventName);

        return true;
    };

    /**
    * Binds a custom event, but only once. Even if it has already been triggered
    *
    * @param evtName (required) The name of the custom event
    *
    * @return undefined
    */
    _utils.bindEventReady = function (eventName, callback) {
        if (!eventName) {
          _logger.warn('_utils.bindEventReady -> no event name provided. EXITING');

          //exit
          return false;
        }

        //if the event has already happened
        if (_utils.pastEvents[eventName]) {
          //call the callback right away
            _utils.safeFunction(callback)();
        }

        //bind the event
        _utils.bindEvent(eventName, _utils.safeFunction(callback));

        _logger.log('_utils.bindEventReady -> bound:' + eventName);

        return true;
    };

    /**
    * Binds a custom event, but only once. Even if it has already been triggered
    *
    * @param evtName (required) The name of the custom event
    *
    * @return undefined
    */
    _utils.bindEventReadyOnce = function (eventName, callback) {
        if (!eventName) {
          _logger.warn('_utils.bindEventReadyOnce -> no event name provided. EXITING.');

          //exit
          return false;
        }

        //if the event has already happened
        if (_utils.pastEvents[eventName]) {
            //execute the callback once
            _utils.safeFunction(callback)();

            //dont bind for a future trigger
            return true;
        }

        //bind the event for a future trigger
        $(_utils.constants.DOCUMENT).on(eventName, function (evt, data) {
            //execute the callback once
            _utils.safeFunction(callback)(evt, data);

            //remove the binding
            _utils.unbindEvent(eventName);
        });

        _logger.log('_utils.bindEventOnce -> bound:' + eventName);

        return true;
    };

    /**
    * Unbinds a custom event
    *
    * @param evtName (required) The name of the custom event
    *
    * @return boolean
    */
    _utils.unbindEvent = function (eventName) {
      if (!eventName) {
        _logger.warn('_utils.unbindEvent -> no event name provided. EXITING.');

        //exit
        return false;
      }

      //unbind the event
      $(_utils.constants.DOCUMENT).unbind(eventName);

      _logger.log('_utils.unbindEvent -> unbound:' + eventName);

      return true;
    };

    /**
    * Triggers a custom event
    *
    * @param evtName (required) The name of the custom event to trigger
    *
    * @param eventData (optional) Data to pass to event listeners
    *
    * @return bolean
    */
    _utils.triggerEvent = function (eventName, eventData) {
        if (!eventName) {
          _logger.warn('_utils.triggerEvent -> no event name provided. EXITING.');

          //exit
          return false;
        }

        //in case no data is provided
        eventData = eventData || {};

        //set a record that this event was triggered
        _utils.pastEvents[eventName] = true;

        //if in loging mode, add this event to the event log
        if (_utils.settings.logging) {
            _utils.pastEventsLog.push({
                name: eventName,
                data: eventData
            });
        }

        //triger the event
        $(_utils.constants.DOCUMENT).trigger(eventName, eventData);

        _logger.info('_utils.triggerEvent -> triggered event: ' + eventName);

        return true;
    };

    /**
    * Sets the logger cookie (and refreshes the page if any value is passed-in)
    *
    * @param optional - refresh - determines whether or not to refresh the page after setting the logger cookie
    *
    * @return undefined
    */
    _utils.startLogging = function (refresh) {
        //set the cookie
        _utils.setCookie(_utils.constants.LOGGER_COOKIE_NAME, 'true', 1);

        //set the logging flag to true
        _utils.settings.logging = true;

        _logger.info('Logging now enabled. Please refresh the page.');

        //if any truthy value was passed as "refresh"
        if (refresh) {
          //reload the page
          window.location.reload();
        }
    };

    /**
    * Sets the data logger cookie (and refreshes the page if any value is passed-in)
    *
    * @param optional - refresh - determines whether or not to refresh the page after setting the logger cookie
    *
    * @return undefined
    */
    _utils.startLoggingData = function (refresh) {
      //set the cookie
      _utils.setCookie(_utils.constants.LOGGER_DATA_COOKIE_NAME, 'true', 1);

      _logger.info('Data logging now enabled. Please refresh the page.');

      //set the data logging flag to true
      _utils.settings.loggingData = true;

      //if any truthy value was passed as "refresh"
      if (refresh) {
        //reload the page
        window.location.reload();
      }
    };

    /**
    * Sets the logger and data logger cookies (and refreshes the page if any value is passed-in)
    *
    * @param optional - refresh - determines whether or not to refresh the page after setting the logger cookie
    *
    * @return undefined
    */
    _utils.startLoggingAll = function (refresh) {
      //set the logger cookies
      _utils.startLogging();
      _utils.startLoggingData();

      //if any truthy value was passed as "refresh"
      if (refresh) {
        //reload the page
        window.location.reload();
      }
    };

    /**
    * Deletes the logger cookie (and refreshes the page if any value is passed-in)
    *
    * @param optional - refresh - determines whether or not to refresh the page after deleting the logger cookie
    *
    * @return undefined
    */
    _utils.stopLogging = function (refresh) {
      //delete the cookie
      _utils.deleteCookie(_utils.constants.LOGGER_COOKIE_NAME);

      _logger.info('Logging now disabled. Please refresh the page.');

      //set the data logging flag to false
      _utils.settings.logging = false;

      //if any truthy value was passed as "refresh"
      if (refresh) {
        //reload the page
        window.location.reload();
      }
    };

    /**
    * Deletes the data logger cookie (and refreshes the page if any value is passed-in)
    *
    * @param optional - refresh - determines whether or not to refresh the page after deleting the logger cookie
    *
    * @return undefined
    */
    _utils.stopLoggingData = function (refresh) {
      _utils.deleteCookie(_utils.constants.LOGGER_DATA_COOKIE_NAME);

      //set the data logging flag to true
      _utils.settings.logging = true;

      _logger.info('Data logging now disabled. Please refresh the page.');

      //if any truthy value was passed as "refresh"
      if (refresh) {
        //reload the page
        window.location.reload();
      }
    };

    /**
    * Deletes the logger and data logger cookies (and refreshes the page if any value is passed-in)
    *
    * @param optional - refresh - determines whether or not to refresh the page after deleting the logger cookie
    *
    * @return undefined
    */
    _utils.stopLoggingAll = function (refresh) {
      //delete the logger cookies
      _utils.stopLogging();
      _utils.stopLoggingData();

      //set the data logging flag to true
      _utils.settings.logging = true;

      _logger.info('All logging now disabled. Please refresh the page.');

      //if any truthy value was passed as "refresh"
      if (refresh) {
        //reload the page
        window.location.reload();
      }
    };

    /**
    * Returns a Drupal.setting
    *
    * @return variable  or boolean
    */
    _utils.getDrupalSetting = function (settingName) {
        var drupalSettings = _utils.getDrupalSettings(),
          retVal = false;

        //if the requested property exists
        if (drupalSettings[settingName]) {
          retVal = drupalSettings[settingName];
        }

        _logger.log('_utils.getDrupalSetting -> ' + settingName +  ': ' + retVal);

        //return the value of Drupal.settings[settingName] (or false)
        return retVal;
    };

   _utils.openCoziLinksInNewTab = function () {
      var retVal =  _utils.getDrupalSetting('cozi_links_new_tab') ? true : false;

      _logger.log('_utils.openCoziLinksInNewTab: ' + retVal);

      return retVal;
    };

    /**
    * Sets a cookie
    *
    * @param name (required) The name of the cookie
    * @param prefix (required) The value of the cookie
    * @param prefix (required) The number of days for which the cookie is valid
    *
    * @return boolean
    */
    _utils.setCookie = function (name, value, days) {
     var expires = '',
        date = null;

        if (!name) {
          _logger.warn('_utils.setCookie -> cookie name missing. EXITING.');

          //exit
          return false;
        }

        //set defaults
        days = days || 1;
        value = value || 'true';

        if (days) {
            date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            expires = '; expires=' + date.toGMTString();
        }

        _logger.log('_utils.setCookie -> ' + name);

        document.cookie = name + '=' + value + expires + '; path=/; domain=myrecipes.com';
        return (_utils.getCookie(name) == value);
    };

    /**
    * Gets a cookie
    *
    * @param name (required) The name of the cookie
    *
    * @return string or null
    */
    _utils.getCookie = function (name) {
        var i = 0,
            ca = [];

        if (!name) {
          _logger.warn('_utils.getCookie -> cookie name missing. EXITING.');

          //exit
          return false; 
        }

        ca = document.cookie.split(';');

        for (; ca[i]; i++) {
            ca[i] = $.trim(ca[i]);
            if (ca[i].indexOf(name + '=') === 0) {
                _logger.log('_utils.getCookie -> ' + name + ': ' + ca[i].substring(name.length + 1));
                return ca[i].substring(name.length + 1);
            }
        }

        _logger.warn('_utils.getCookie -> cookie not found.');

        return false;
    };

    /**
    * Deletes a cookie
    *
    * @param name (required) The name of the cookie to delete
    *
    * @return string or null
    */
    _utils.deleteCookie = function (name) {
        if (!name) {
          _logger.warn('_utils.deleteCookie -> cookie name missing. EXITING.');

          //exit
          return false; 
        }

        _utils.setCookie(name, '', -1);

        _logger.log('_utils.deleteCookie -> ' + name);

        return true;
    };

    /**
    * Determines if the logging cookie is set
    *
    * @return booloean
    */
    _utils.checkForLoggingCookie = function () {
        return true;
      var retVal = ( _utils.getCookie(_utils.constants.LOGGER_COOKIE_NAME) ) ? true : false;

      _logger.log('_utils.checkForLoggingCookie -> ' + retVal);

      return retVal;
    };

    /**
    * Determines if the data logging cookie is set
    *
    * @return booloean
    */
    _utils.checkForDataLoggingCookie = function () {
      var retVal = (_utils.getCookie(_utils.constants.LOGGER_DATA_COOKIE_NAME)) ? true : false;

      _logger.log('_utils.checkForDataLoggingCookie -> ' + retVal);

      return retVal;
    };

    /**
    * Provides info on what kind of template is currently loaded
    *
    * @return object
    */
    _utils.getPageContext = function () {
      var names = _utils.constants.templateNames,
        winLocationHref = _utils.constants.WINDOW_LOCATION_HREF,
        retVal = {
          device :  (_utils.env.isMobile ? 'mobile' : 'desktop')
        },
        getDrupalSetting = _utils.getDrupalSetting;

       if (_utils.constants.WINDOW_LOCATION_HREF.indexOf('myrecipes.com/recipe/') > -1 || _utils.constants.WINDOW_LOCATION_HREF.indexOf('myrecipes.com/m/recipe/') > -1) {
          retVal.type = names.RECIPE;
        } else if (getDrupalSetting('isGalleryPage')) {
          retVal.type = names.GALLERY;
        } else if (getDrupalSetting('isMealPlannerPage')) {
          retVal.type = names.PLANNER;
        } else if (getDrupalSetting('isPlaylistPage')) {
          retVal.type = names.PLAYLIST;
        } else if (winLocationHref.indexOf('myrecipes.com/menu/') > -1) {
          retVal.type = names.MENU;
        } else if (  getDrupalSetting('isMyRecipeBoxPage')) {
           retVal.type = names.MRF;
        } else if (window.location.search.indexOf('mrpagecontext=recipe') > -1) {
           retVal.type = names.RECIPE;
        } else {
          retVal.type = false;
        }

      _logger.log('_utils.getPageContext ->').dir(retVal);

      return retVal;
    };

    /**
    * Asyncronously adds a new stylesheet to the DOM
    *
    * @param cssText (required) The css to be added to a style tag
    */
    _utils.addNewStylesheet = function (cssText) {
      _logger.log('utils.addNewStylesheet: ' + cssText);

      if (!cssText) {
        _logger.warn('_utils.addNewStylesheet -> no css text provied. EXITING.');

        //exit
        return false;
      }

      $('head').append('<style>' + cssText + '</style>');
    };

   /**
    * Returns the Drupal.settings obeject (or empty object if not found)
    *
    * @return object
    */
    _utils.getDrupalSettings = function () {
        var retObject = {};

        if (_window.Drupal && _window.Drupal.settings && (_window.Drupal.settings instanceof Object)) {
            retObject = _window.Drupal.settings;
        }

      _logger.log('_utils.getDrupalSettings').dir(retObject);

      return retObject;
    };

    /**
    * Validate a form
    *
    * @param valArr: an array of objects that specify values to test
    */
    _utils.validateForm = function (valArr) {
      var retVal = true;

      _logger.log('_utils.validateForm');

      if (!valArr || !valArr.length || !(valArr instanceof Array)) {
        _logger.log('_utils.validateForm -> no array provided. EXITING.');

        //exit
        return;
      }

      _logger.log('utils.validateForm -> about to validate:').dir(valArr);

      //iterate over the array and test each value
      $.each(valArr, function (index, item) {
        //if the item evaluates to a falsy value
        if (!item) {
          retVal = false;
        }
      })

      return retVal;
    };

    /**
    * Creates a new logger instance
    *
    * @param prefix (optional) Prepended to every message logged by the instance
    *
    * @return object
    */
    _utils.newLogger = function (prefix) {
        var loggerObject = {};

        prefix = (prefix && (typeof prefix === 'string')) ? prefix : _utils.constants.LOGGER_PREFIX_DEFAULT;

        function log (msg) {
            if (!_utils.settings.logging) {return loggerObject; }
            if (!msg) {return; }
            if (_window.console && _window.console.log) {_window.console.log(prefix + msg); }

            //make this method chainable
            return loggerObject;
        }

        function info (msg) {
            if (!_utils.settings.logging) {return loggerObject; }
            if (!msg) {return; }

            if (_window.console.info) {
                _window.console.info(prefix + msg);
            } else {
                log(msg);
            }

            //make this method chainable
            return loggerObject;
        }

        function warn (msg) {
            if (!_utils.settings.logging) {return loggerObject; }
            if (!msg) {return; }

            if (_window.console.warn) {
                _window.console.warn(prefix + msg);
            } else {
                log(msg);
            }

            //make this method chainable
            return loggerObject;
        }

        function dir (obj) {
            if (!_utils.settings.logging || !_utils.settings.loggingData) {return loggerObject; }
            if (!obj){return loggerObject; }

            if (_window.console.dir) {
                _window.console.dir(obj);
            }

            //make this method chainable
            return loggerObject;
        }

        //extend the logger object
        loggerObject.log = log;
        loggerObject.info = info;
        loggerObject.warn = warn;
        loggerObject.dir = dir;

        //return the logger object
        return loggerObject;
    };

    //initialize the applcation
    _utils.init();

})(window, window.jQuery || window.$);
