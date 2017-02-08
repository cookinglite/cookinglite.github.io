/**
* Cozi meal planner tool-bar
*
* Version 1.1.7
*
*/

(function (_win, $) {
  "use strict";

  /*global window: false */

  var _appName = 'mrCoziMealPlannerToolbar',
    _loggerPrefix = _appName + ': ',
    _logging = false,
    _logg = function (msg, func) {
      if (!_logging) {return; }
      if (msg && _win.console && _win.console.log) {_win.console.log(_loggerPrefix + msg); }

      if (func && func instanceof Function && _win.console && _win.console.dir) {func(); }
    },
    //container for all methods
    _utils = {};

  //off-switch for dev and debugging.
  if (_win.MR_TOOLS && (typeof _win.MR_TOOLS.getCookie === 'function') && _win.MR_TOOLS.getCookie('mealPlannerToolbar_NO-RUN') !== null) {
    _logging = true;
    _logg('mealPlannerToolbar_NO-RUN: EXITING. (v2)');
    return;
  }

  _utils.constants = {};
  _utils.state = {appDisabled : false, trackingPixelFired : false};
  _utils.data = {sponsoredJson : {}};
  _utils.DOM = {};
  _utils.dates = {};
  _utils.config = {};

  //sponsored recipe json data
  _utils.state.sponsoredRecipeJsonDone = null;
  //used to determine last monday and next monday
  _utils.dates.lastMonday = '';
  _utils.dates.nextMonday = '';
  _utils.dates.lastMondayAsArray = '';
  _utils.dates.nextMondayAsArray = '';
  _utils.dates.lastMondayDate = '';
  _utils.dates.nextMondayDate = '';
  _utils.dates.lastMondayFormatted = '';
  _utils.dates.nextMondayFormatted = '';
  _utils.dates.mealPlannerInstanceDate = '';
  //used to cache references to toolbar DOM elements
  _utils.DOM.$toolbarApp = null;
  _utils.DOM.$handle = null;
  _utils.DOM.$instructionsContainer = null;
  _utils.DOM.$instructions = null;
  _utils.DOM.$finalSave = null;
  _utils.DOM.$saveButtons =  null;
  _utils.DOM.$cancelButton =  null;
  //constants
  _utils.constants.UX_UPDATED_EVENT_NAME = 'coziMealPlannerToolBar:uxUpdated';
  _utils.constants.AD_TRACKING_PIXEL_URL = 'http://pubads.g.doubleclick.net/gampad/ad?iu=/8484/mre/recipefinder/menubar_tracking&sz=1x1&t=&c=';
  _utils.constants.LOGGING_COOKIE_NAME = _appName + '_LOGGER';
  _utils.constants.URL_BASE = mrTools.env.urlBase;
  _utils.constants.SPONSORED_RECIPES_JSON_URL = (_utils.constants.URL_BASE + '/recipe/menu-toolbar/json');
  _utils.constants.APP_READY_EVENT_NAME = _appName + ':appReady';
  _utils.constants.MEAL_PLANNER_TOOLBAR_HANDLE_TITLE_TEXT = 'Drag and drop recipe images to include in this week\'s meal plan';
  _utils.constants.DISABLED_CONTENT_MESSAGE = 'Click here to search for recipes and start your weekly meal plan';
  _utils.constants.DISABLED_CONTENT_TITLE = 'Find your favorite recipe and save it to your meal planner toolbar';
  _utils.constants.MEAL_PLANNER_TOOLBAR_NO_SAVED_DISHES_TEXT = 'Please drag at least one dish before saving';
  _utils.constants.MEAL_PLANNER_TOOLBAR_SAVED_MEAL_PLAN_SUCCESS_TEXT = 'Your meal plan has been saved';
  _utils.constants.MEAL_PLANNER_TOOLBAR_DROPPED_MEAL_CLOSE_BUTTON_TEXT = 'Remove this dish from your meal plan';
  _utils.constants.MEAL_PLANNER_DATE_RANGE = 5;
  _utils.constants.CUSTOM_DROP_EVENT_NAME = 'mrCoziMptoolbar:dropEvent';
  _utils.constants.LOCAL_STORAGE_DATA_NAME = 'mrCoziMealPlannerToolbarSaved';
  _utils.constants.PLUGIN_CUSTOM_ID = 'coziMealPlannerToolbarPlgin';
  _utils.constants.PLUGIN_CUSTOM_ID_FOR_JQUERY = ('#' + _utils.constants.PLUGIN_CUSTOM_ID);
  _utils.constants.WHAT_IS_THIS_LINK_HTML = '<a class="what-is-this" title="Learn more about this toolbar" href="http://www.myrecipes.com/general/meal-planner-toolbar?iid=mp-toolbar-what" target="_blank">what is this?</a>';
  _utils.constants.OMNITURE_EVENT_TEXT_ADD_TO_CALENDAR = 'mpt-add-to-calendar';
  _utils.constants.OMNITURE_EVENT_TEXT_CHOOSE_WEEK = 'mpt-choose-week';
  _utils.constants.OMNITURE_EVENT_TEXT_MINIMIZE = 'mpt-minimize';
  _utils.constants.OMNITURE_EVENT_TEXT_CONTINUE = 'mpt-continue';
  _utils.constants.OMNITURE_EVENT_TEXT_DRAG_RECIPE = 'mpt-drag-recipe';
  _utils.constants.OMNITURE_EVENT_TEXT_DRAG_RECIPE_SPONSORED_BASE = 'mpt-drag-sponsor-';
  _utils.constants.OMNITURE_EVENT_VIEW_RECIPE = 'mpt-viewrecipe';
  //strings to check in UA for mobile/tablet-hosted browsers
  _utils.constants.MOBILE_AND_TABLET_UA_STRINGS = [
    'Mobile', 'mobile', 'iPhone', 'iPad', 'Droid', 'droid', 'Android', 'android', 'webOS', 'Kindle', 'Kindle Fire', 'Silk', 'RIM', 'BB', 'Nexus', 'CriOS', 'NetFront', 'UP.Browser', 'SymbianOS', 'Symbian', 'Windows CE', 'Windows CE; PPC', 'AU-MIC-A920', 'SEMC-Browser', '6230i', 'MOT-E398'
  ];

  //check for logging.
  if (_win.MR_TOOLS && (typeof _win.MR_TOOLS.getCookie === 'function') && _win.MR_TOOLS.getCookie(_utils.constants.LOGGING_COOKIE_NAME) !== null) {
    _logging = true;
    _logg('>> logging is active (v2)');
  }

 /**
  * Initializes the application
  *
  * @return undefined
  */
  _utils.init = function () {
    _logg('_utils.init');

    if (_utils.isMobileOrTabletDevice()) {_logg('this is a tablet or mobile device. EXITING.'); return; }

    //kick-off the async call
    _utils.state.sponsoredRecipeJsonDone = _utils.getSponsoredRecipeJason();

    //set the global object
    _win[_appName] = _win[_appName] || _utils;

    //determine if this is a non-recipe page
    //if (_win.mrCoziLib.utils.pageContext.type !== 'recipe') {
    if (mrTools.getPageContext().type !== 'recipe') {
      
      _utils.state.appDisabled = true;
    }

    //setup binding for maximize event to fire ad-tracking pixel
    $(document).on('jqueryMinMaxBox:maximize', function () {
      //don't fire ad tracking pixel if the toolbar is disabled (i.e. non-recipe pages)
      if (_utils.state.appDisabled) {return; }
      //don't fire ad tracking pixel if it has been fired already
      if (_utils.state.trackingPixelFired) {return; }

      //prevent the the ad tracking pixel from firing more than once
      _utils.state.trackingPixelFired = true;

      //fire the ad tracking pixel
      _utils.fireAdTrackingPixel();
    });

    //setup date variables
    _utils.setupDateVariables();
  };

  /**
  * Starts the application
  * 
  * Creates the object needed by the minMaxBox plugin
  * And then instantiates the plugin
  *
  * @return undefined
  */
  _utils.startApp = function () {
    _logg('_utils.startApp');

    var pluginObj = {
      id: _utils.constants.PLUGIN_CUSTOM_ID,
      deferRender: true,
      keepMinimized: _utils.state.appDisabled,
      handleText: _utils.constants.MEAL_PLANNER_TOOLBAR_HANDLE_TITLE_TEXT,
      customCss: _utils.getCssArray(),
      content : _utils.tbHtml,
      preRender : _utils.preRender,
      postRender: _utils.postRender,
      deferredReady : _utils.minMaxBoxDeferredReady,
      onMinimize: _utils.minMaxBoxMinimizeHandler,
      onMaximize: _utils.minMaxBoxMaximizeHandler
    };

    //add a listener for the coziMealPlannerToolBar:uxUpdated event
    _win.jQuery(document).on(_utils.constants.UX_UPDATED_EVENT_NAME, _utils.addRecipeLinks);

    //instantiate the minMaxBox plugin
    $('body').minMaxBox(pluginObj);
  };

  /**
  * Determines if the user-agent reports a mobile or tablet device
  * 
  * @see _utils.constants.MOBILE_AND_TABLET_UA_STRINGS
  *
  * @return bolean
  */
  _utils.isMobileOrTabletDevice = function () {
    var nAgt = _win.navigator.userAgent,
      mobArr =  _utils.constants.MOBILE_AND_TABLET_UA_STRINGS,
      i = 0,
      retVal = false;

    //loop through all the elemnts in the array of mobile device UA strings
    for (i = (mobArr.length - 1); i >= 0; i--) {
      //compare the indexed mobile device string against the user's browser UA string
      if ((nAgt.indexOf(mobArr[i]) > -1)) {
        retVal = true;
      }
    }

    _logg('_utils.isMobileOrTabletDevice: ' + retVal);

    return retVal;
  };

 /**
  * Fires an ad-tracking pixel
  *
  * @return undefined
  */
  _utils.fireAdTrackingPixel = function () {
    var imageUrl = (_utils.constants.AD_TRACKING_PIXEL_URL + _utils.getTimeStamp()),
      $img = $('<img style="display:none;">');

    _logg('_utils.fireAdTrackingPixel: ' + imageUrl);

    $img.attr('src', imageUrl);

    $('body').append($img);
  };

  /**
  * Handles tasks that should be completed before rendering the meal planner toolbar
  *
  * @param $el (required) jQuery object, the meal planner toolbar container
  * @param options (required) object, the options passed to the meal jQuery.minMaxBox plugin when instantiated
  *
  * @see jQjuery.minMaxBox plugin
  *
  * @return undefined
  */
  _utils.preRender = function ($el, options) {
    _logg('_utils.preRender');

    //only show this to anonymous and cozi users
    /*
    _win.mrCoziLib.getUserContext(function (obj) {
      if (obj.anonymous || obj.coziUser) {
        $(_utils.constants.PLUGIN_CUSTOM_ID_FOR_JQUERY).show();
      }
    });
*/

     //only show this to anonymous and cozi users
    $(_utils.constants.PLUGIN_CUSTOM_ID_FOR_JQUERY).show();

    //update the UX from the last session
    _utils.updateUxFromLocalStorage();

    //cache DOM elements
    _utils.cacheDomElements();

    //set default content for all days
    _utils.setDefaultContentForAllDAys();

    //wrap main image
    _utils.wrapMainImage();

    //even though we have bindings to do, the app is ready
    $(document).trigger(_utils.constants.APP_READY_EVENT_NAME);

    $.when(_utils.state.sponsoredRecipeJsonDone).done(function () {
      _utils.handlePostSponsorJsonDataFetch(options);
    });

    //if the app has been disabled, don't bother with bindings
    if (_utils.state.appDisabled) {
      _logg('app is disabled, skipping event binding');
      _utils.disableToolbar();
      return;
    }

    //bind dragenter, dragleave, dragover and drop for each day of the week
    _utils.bindDragenterDragleaveDragoverAndDrop();

    //take care of misc DOM setup tasks
    _utils.domSetup();

    //bind toolbar controls
    _utils.bindToolbarControls();
  };

 /**
  * Implements post-render tasks
  *
  * @return undefined
  */
  _utils.postRender = function () {
    _logg('_utils.postRender');

    _logg('post-render callback');

    //if the app has been disabled, don't bother with bindings
    if (_utils.state.appDisabled) {
      _logg('>> app is disabled, skipping "Close Button Hover And Click Events" bindind');
      return;
    }

    //bind close buttons and mouseover/mouseleave events
    setTimeout(_utils.setupCloseButtonHoverAndClickEvents, 1000);

    //show hover links for existing dropped / sposnored recipes
    _utils.addRecipeLinks();
    _utils.addRecipeLinks('sponsored');
  };

  /**
  * Fires an omniture event using the omniCommunityTracker method
  * 
  * @param eventText (required) string, the event text you want to pass to omniCommunityTracker
  *
  * @return boolean
  */
  _utils.reportOmnitureEvent = function (eventText) {
    if (!_win.omniCommunityTracker || !(_win.omniCommunityTracker instanceof Function)) {_logg('window.omniCommunityTracker not found. EXITING.'); return false; }

    if (!eventText || !(typeof eventText === 'string')) {_logg('eventText string not provided. EXITING.'); return false; }

    //send the omniture event
    _win.omniCommunityTracker(eventText);

    _logg('_utils.reportOmnitureEvent >> sent: ' + eventText);

    return true;
  };

 /**
  * Handles misc DOM manipulation tasks
  *
  * @return undefined
  */
  _utils.domSetup = function () {
    _logg('_utils.domSetup');

    //add the "What's this" link to the handle
    $('.minMaxBox-container .left h3').after(_utils.constants.WHAT_IS_THIS_LINK_HTML);

    //give the main image positioning so that the added draggable icon can be positioned absolutely
    $('.tout-image-300x300').css({'position' : 'relative'});
  };

 /**
  * Implements tasks that need to wait for the minMaxBox deferred callback
  *
  * @see _utils.startApp -> pluginObj
  *
  * @return undefined
  */
  _utils.minMaxBoxDeferredReady = function () {
    _logg('_utils.minMaxBoxDeferredReady');

  };

  /**
  * Sets properties of _utils.DOM that are cached-refernces to meal planner toolbar DOM elements
  *
  * @return undefined
  */
  _utils.cacheDomElements = function () {
    _logg('_utils.cacheDomElements');

    _utils.DOM.$toolbarApp = $(_utils.constants.PLUGIN_CUSTOM_ID_FOR_JQUERY);
    _utils.DOM.$handle = _utils.DOM.$toolbarApp.find('.minMaxBox-container .handle');
    _utils.DOM.$instructionsContainer = _utils.DOM.$toolbarApp.find('.instructionsContainer');
    _utils.DOM.$instructions = _utils.DOM.$toolbarApp.find('.instructions');
    _utils.DOM.$finalSave = _utils.DOM.$toolbarApp.find('.finalSave');
    _utils.DOM.$saveButtons =  _utils.DOM.$toolbarApp.find('#saveCoziMealPlanFromToolbar_firstWeek, #saveCoziMealPlanFromToolbar_secondWeek');
    _utils.DOM.$cancelButton =  _utils.DOM.$toolbarApp.find('#cancelCoziMealPlanFromToolbar');
  };

  /**
  * Handles tasks for the minMaxBox minimize event
  *
  * @return undefined
  */
  _utils.minMaxBoxMinimizeHandler = function () {
    _logg('_utils.minMaxBoxMinimizeHandler');

    _utils.reportOmnitureEvent(_utils.constants.OMNITURE_EVENT_TEXT_MINIMIZE);
  };

  /**
  * Handles tasks for the minMaxBox maximize event
  *
  * @return undefined
  */
  _utils.minMaxBoxMaximizeHandler = function () {
    _logg('_utils.minMaxBoxMaximizeHandler');
  };

  /**
  * Wraps the main recipe page image in an anchor element
  * This is needed in order to support drag-and-drop in IE
  *
  * @return undefined
  */
  _utils.wrapMainImage = function () {
    var winLoc = _win.location,
      winLocHref = '',
      $newAnchor = $('<a href="#" class="mainRecipeImageDragAnchor draggableRecipe"></a>'),
      $editorTitle = $('#page-title'),
      $ugcTitle = $('.pageHead h1'),
      pageTitle = '',
      $mainRecipeImage = _utils.getMainRecipeImage(),
      $mainRecipeImageParent = null;

      //make sure there is a main recipe image
      if ($mainRecipeImage && $mainRecipeImage.length) {
        $mainRecipeImageParent = $mainRecipeImage.parent();
      }
      
    //page title element differs between edit and UGC
    if ($editorTitle.length) {
      pageTitle = $editorTitle.text();
    } else if ($ugcTitle.length) {
      pageTitle = $ugcTitle.text();
    }

    if (!_win.location.origin) {
      _win.location.origin = _win.location.protocol + "//" + _win.location.hostname + (_win.location.port ? ':' + _win.location.port : '');
    }

    winLocHref = winLoc.origin + winLoc.pathname;

    //if (_win.mrCoziLib.utils.pageContext.type === 'recipe') {
    if (mrTools.getPageContext().type === 'recipe') {
        //add the data-title attribute to the main recipe image
        $mainRecipeImage
          .attr('data-title', pageTitle)
          .attr('data-url', winLocHref);

        //if the main recipe image already has an anchor as a parent
        if ($mainRecipeImageParent.is('a')) {
          //add the classes we need to the parent anchor so it can be dragable
          $mainRecipeImageParent
            .addClass('mainRecipeImageDragAnchor')
            .addClass('draggableRecipe');
        } else {
          //wrap the main image with the new dragable anchor
          $mainRecipeImage.wrap($newAnchor);
        }
    }

    _logg('_utils.wrapMainImage');
  };

  /**
  * The success handler for the sponsored JSON ajax call
  *
  * @param options (required) object, the options that were passed to the minMaxBox plugin plugin when instantiated.
  * There are tasks that need to be commplted after the sponsored recipe JSON is in-hand, but before the tool-bar is maximized.
  * When options.deferred.resolve() is called, that is when the tool-bar is maximized.
  *
  * @see _utils.preRender, _utils.state.sponsoredRecipeJsonDone
  *
  * @return undefined
  */
  _utils.handlePostSponsorJsonDataFetch = function (options) {
    _logg('_utils.handlePostSponsorJsonDataFetch: ', function () {
      console.dir(options);
    });

    //cache the 75x75 images so that they work on first drag
    _utils.preCache75x75Images();

    //render the sponsored image
    _utils.renderSponsLogo(_utils.data.sponsoredJson);

    //render the sponsored logo caption
    _utils.renderSponsorLogoCaption();

    //render the sponsored meals section
    _utils.renderSponsorMeals();

    //if the app has been disabled, don't bother with bindings
    if (!_utils.state.appDisabled) {
      //setup the drag event handler for the main image
      _utils.setupDragHandlerMain();

      //setup the drag event handler for sponsored recipe images
      _utils.setupDragHandlerSponsored();

      //give each draggable recipe image a unique id
      _utils.createUniqueImageIds();
    }

    //resolve the app
    options.deferred.resolve();
  };

  /**
  * Binds the dragenter, dragleave, dragover, and drop event handler for the days-of-the-week drop elements.
  *
  * @return undefined
  */
  _utils.bindDragenterDragleaveDragoverAndDrop = function () {
    _logg('_utils.bindDragenterDragleaveDragoverAndDrop');

    $('.minMaxBox-container .userArea .days li').bind({
      dragover: _utils.allowDragover,
      drop: _utils.dropHandlerSingle,
      dragenter: function () {
        //only allow one dropped meal element per droppable
        if ($(this).children().length) {return; }
        //update the UI to indicate the user has dragged something over this element
        $(this).addClass('dragEnter');
      },
      dragleave: function () {
        var $me = $(this);

        setTimeout(function () {
          $me.removeClass('dragEnter');
        }, 1000);
      }
    });
  };

  /**
  * Binds event handler for Add to my calendar, save, and cancel
  *
  * @return undefined
  */
  _utils.bindToolbarControls = function () {
    _logg('_utils.bindToolbarControls');

    //after something is dropped
    $(document).on(_utils.constants.CUSTOM_DROP_EVENT_NAME, _utils.customDropEventHandler);

    //bind the controls
    $('#coziMealPlannerToolbar_saveMoreRecipes').click(_utils.saveMoreRecipesButtonClickHandler);

    $('#coziMealPlannerToolbar_saveMoreRecipes, #coziMealPlannerToolbar_viewMyMealPlan').click(function () {
      //report this event to omniture
      _utils.reportOmnitureEvent(_utils.constants.OMNITURE_EVENT_TEXT_CONTINUE);
    });

    _utils.DOM.$instructions.click(_utils.instructionsClickHandler);

    _utils.DOM.$cancelButton.click(_utils.cancelButtonsClickHandler);

    _utils.DOM.$saveButtons.click(_utils.saveButtonsClickHandler);
  };

  /**
  * Gets the string from local storage and de-serializes it into an array.
  *
  * @see _utils.updateLocalStorage
  *
  * @return array
  */
  _utils.localStorageToArray = function () {
    var retVal = false;

    if (_win.localStorage.getItem(_utils.constants.LOCAL_STORAGE_DATA_NAME)) {
      retVal = JSON.parse(_win.localStorage.getItem(_utils.constants.LOCAL_STORAGE_DATA_NAME));
    }

    _logg('_utils.localStorageToArray', function () {
      console.dir(retVal);
    });

    return retVal;
  };

  /**
  * Updates local storage data when the user has dropped or deletd a meal
  *
  * @return undefined
  */
  _utils.updateLocalStorage = function () {
    var meals = [];

    _logg('_utils.updateLocalStorage');

    $('.userArea .days li').each(function (index) {
      var $droppedImage = $(this).find('a.droppedImage');

      if ($droppedImage.length) {
        meals.push({
          day : index,
          image : $droppedImage.find('img').attr('src'),
          recipeUrlOrId : $droppedImage.attr('data-url'),
          title: $droppedImage.attr('title')
        });
      }
    });

    _win.localStorage.setItem(_utils.constants.LOCAL_STORAGE_DATA_NAME, JSON.stringify(meals));
  };

  /**
  * Retrieves local storage dropped-recipe data and then updates the DOM accordinly.
  *
  * @see _utils.localStorageToArray
  *
  * @return undefined
  */
  _utils.updateUxFromLocalStorage = function () {
    _logg('_utils.updateUxFromLocalStorage');

    $.each(_utils.localStorageToArray(), function (index, item) {
      var $image = _utils.createImage(),
        $closeButton = _utils.getCloseButton(),
        $container = $('#coziMealPlannerToolbar .days li').eq(item.day);

      $image.attr('data-url', item.recipeUrlOrId);
      $image.attr('title', item.title);
      $image.find('img').attr('src', item.image);

      $container
        .html($image)
        .append($closeButton);
    });

    //set default content for empty days
    _utils.setDefaultContentForEmptyDays();
  };

  /**
  * Removes local storage data.
  * It sets it to a string representation of an empty array.
  * Just in case we try to de-serialize it later.
  *
  * @return undefined
  */
  _utils.deleteLocalStorageData = function () {
    _logg('_utils.deleteLocalStorageData');

    _win.localStorage.setItem(_utils.constants.LOCAL_STORAGE_DATA_NAME, '[]');
  };

  /**
  * Removes the image property from recipe objects.
  * This is needed beecause these objects are actually
  * included in the PUT to cozi API, and the image property
  * is not needed.
  *
  * @see _utils.localStorageToArray
  *
  * @return array
  */
  _utils.getLocalStorageDataWithoutImageUrls = function () {
    var newArray = [],
      oldArray = (_utils.localStorageToArray() || []);

    $.each(oldArray, function (index, item) {
      delete item.image;
      newArray.push(item);
    });

    return newArray;
  };

  /**
  * Returns the specified element to its default state.
  *
  * @param $el (required) jQuery object, must be: '.days li'
  *
  * @return undefined
  */
  _utils.setDefaultContent = function ($el) {
    _logg('_utils.setDefaultContent');

    if (!$el || !$el.length) {return; }

    $el.html($el.attr('data-default'));

    //remove the hasChild class
    $el.removeClass('hasChild');
  };

  /**
  * Returns each day of the week element to its default state.
  *
  * @see _utils.setDefaultContent
  *
  * @return undefined
  */
  _utils.setDefaultContentAll = function () {
    _logg('_utils.setDefaultContentAll');

    $('#coziMealPlannerToolbar .days li').each(function () {
      _utils.setDefaultContent($(this));
    });
  };

  /**
  * Sets the default content of a day-of-the-week drop-element, if it does not have an a.droppedImage child.
  *
  * @return undefined
  */
  _utils.setDefaultContentForAllDAys = function () {
    _logg('_utils.setDefaultContentForAllDAys');

    //set the default content for each days li
    $('.minMaxBox-container .userArea .days li').each(function () {
      if ($(this).find('a.droppedImage')) {return; }
      _utils.setDefaultContent($(this));
    });
  };

 /**
  * Sets the day-of-the-week text for any drop-area element that does not have a recipe.
  *
  * @return undefined
  */
  _utils.setDefaultContentForEmptyDays = function () {
    _logg('_utils.setDefaultContentForEmptyDays');

    //check each droppable element to see if it has a child
    $('.minMaxBox-container .userArea .days li').each(function () {
      var $me = $(this);

      //if this element has no children
      if (!$me.find('.droppedImage').length) {
        //remove the close button
        $me.find('closeButton').remove();
        //set default content
        _utils.setDefaultContent($me);
      }
    });
  };

  /**
  * Takes an image URL and gets the 75x75 version of that URL.
  *
  * @param imageUrl (required) string, must be a valid image URL.
  *
  * @return string
  */
  _utils.get75Image = function (imageUrl) {
    var retVal = imageUrl,
      defaultImageName = 'img_noPhoto150.gif',
      newDefaultImageName = 'img_noPhoto75.gif',
      customImage300x300 = '300x300',
      customImage75x75 = '75x75';

    _logg('_utils.get75Image: ' + imageUrl);

    imageUrl = imageUrl || '';

    if (imageUrl.indexOf(defaultImageName) > -1) {
      retVal = imageUrl.replace(defaultImageName, newDefaultImageName);
    } else if (imageUrl.indexOf(customImage300x300) > -1) {
      retVal = imageUrl.replace(customImage300x300, customImage75x75);
    }

    //return the 75x75 image url
    return retVal;
  };

  /**
  * Returns a reference to the main recipe image
  *
  * @return jQuery object: <img >
  */
  _utils.getMainRecipeImage = function () {
    var $img = false,
      $recipeFallbackImage = $('.pane-ti-lsg-mr-recipe-recipe-fallback-image img'),
      $recipeImageUgc = $('.featPhotoA .photo img'),
      //$customImage = $('.tout-image-300x300 .field-image img');
      $customImage = $('.tout-image-300x300 img');

    _logg('_utils.getMainRecipeImage');

    if ($recipeFallbackImage.length) {
      $img = $recipeFallbackImage;
    } else if ($recipeImageUgc.length) {
      $img = $recipeImageUgc;
    } else if ($customImage.length) {
      $img = $customImage;
    }

    return $img;
  };

  /**
  * Returns the 75x75 version of the main recipe image URL.
  *
  * @see _utils.get75Image()
  *
  * @return string
  */
  _utils.getMainRecipeImageUrlAs75x75 = function () {
    var $img = _utils.getMainRecipeImage(),
      imgUrl = '',
      url75x75 = '';

    _logg('_utils.getMainRecipeImageUrlAs75x75');

    if (!$img) {return url75x75; }

    imgUrl = $img.attr('src');
    url75x75 = _utils.get75Image(imgUrl);

    return url75x75;
  };

  /**
  * Caches the 75x75 version of images so that they work on first drag
  *
  * @return undefined
  */
  _utils.preCache75x75Images = function () {
    _logg('_utils.preCache75x75Images');

    function makeDummyImage(url) {
      var $image = $('<img style="display:none;">');

      $image.addClass('preCached75x75Image');
      $image.attr('src', url);
      $('body').append($image);
    }

    //cache the 75x75 image for each sponsored recipe image
    $('#coziMealPlannerToolbar .sponsorArea .sponsorMeals li a img').each(function () {
      var url75x75 = _utils.get75Image($(this).attr('src'));

      makeDummyImage(url75x75);
    });

    //cache the 75x75 image for the main image
    makeDummyImage(_utils.getMainRecipeImageUrlAs75x75());
  };

 /**
  * Sets up variables that are used to create formatted meal planner dates.
  *
  * @return undefined
  */
  _utils.setupDateVariables = function () {
    var dates = _utils.dates;

    _logg('_utils.setupDateVariables');

    dates.lastMonday = _utils.getMonday('last').toString();
    dates.nextMonday = _utils.getMonday('next').toString();
    dates.lastMondayAsArray = dates.lastMonday.split(' ');
    dates.nextMondayAsArray = dates.nextMonday.split(' ');
    dates.lastMondayDate = dates.lastMondayAsArray[1] + ' ' + dates.lastMondayAsArray[2];
    dates.nextMondayDate = dates.nextMondayAsArray[1] + ' ' + dates.nextMondayAsArray[2];
    dates.lastMondayFormatted = _utils.formatDateForMealPlanerInstantiation(_utils.getMonday('last'));
    dates.nextMondayFormatted = _utils.formatDateForMealPlanerInstantiation(_utils.getMonday('next'));
    dates.mealPlannerInstanceDate = dates.lastMondayFormatted;

    //start the app
    _utils.startApp();
  };

  /**
  * Returns either the last or next monday as a date object,
  * depending on the value of lastOrNext
  *
  * @param lastOrNext (required) string, "last" or "next"
  *
  * @see _utils.getLastMonday, _utils.getNextMonday
  *
  * @return date object
  */
  _utils.getMonday = function (lastOrNext) {
    var retVal = null,
      dt = new Date();

    if (lastOrNext === 'last') {
      retVal = _utils.getLastMonday(dt);
    } else if (lastOrNext === 'next') {
      retVal = _utils.getNextMonday(dt);
    }

    _logg('_utils.getMonday: ' + retVal);

    return retVal;
  };

  /**
  * Returns a date object that represents the last monday that occured.
  * If today is monday, then today is returned.
  *
  * @param dateString (required) string, a  valid date object
  *
  * @return date object
  */
  _utils.getLastMonday = function (dateString) {
    var retVal = null,
      day = 0,
      diff = 0;

    dateString = new Date(dateString);
    day = dateString.getDay();
    diff = dateString.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday

    retVal =  new Date(dateString.setDate(diff));

    _logg('_utils.getLastMonday: ' + retVal);

    return retVal;
  };

  /**
  * Returns a date object that represents the next monday that will occur.
  * If today is monday, then today is returned.
  *
  * @param dateObj (required) date
  *
  * @see _utils.getLastMonday
  *
  * @return date object
  */
  _utils.getNextMonday = function (dateObj) {
    var retVal = null;

    dateObj.setDate(dateObj.getDate() + 7);

    retVal = _utils.getLastMonday(dateObj);

    _logg('_utils.getNextMonday: ' + retVal);

    return retVal;
  };

  /**
  * Returns a string that can be used for the "date" argument when instantiating the mealPlaner class
  *
  * @param dateObject (required) object, a valid JS date object
  *
  * @see mrCoziMealPlannerLib.formatDateForMealPlan
  *
  * @return string
  */
  _utils.formatDateForMealPlanerInstantiation = function (dateObject) {
    var hypenatedDate = _win.mrCoziMealPlannerLib.formatDateForMealPlan(dateObject),
      retVal = hypenatedDate.replace(/-/g, '');

    _logg('_utils.formatDateForMealPlanerInstantiation: ' + retVal);

    return retVal;
  };

 /**
  * Prevents the default behavior of an elements dragover event.
  *
  * @return undefined
  */
  _utils.allowDragover = function (event) {
    _logg('_utils.allowDragover');
    //prevent the browser from any default behavior
    event.preventDefault();
  };

  /**
  * Handler for the drop event of a day-of-the-week DOM element.
  * Allows for only one child "meal" element at a time.
  *
  * @param event (required) event object
  *
  * @return undefined
  */
  _utils.dropHandlerSingle = function (event) {
    var id = '',
      datUrlAttr = 'data-url',
      datTitleAttr = 'data-title',
      $originalImage = null,
      originalImageIdBase  = '#',
      originalImageId = '',
      $newimage = _utils.createImage().find('img'),
      imageSrc = '';

    _logg('_utils.dropHandlerSingle');

    //prevent the browser from any default behavior
    event.preventDefault();

    //only allow one child element at a time
    if ($(this).find('img').length) {_logg('>> only one image allowed at a time. EXITING'); return; }

    //get a reference to the element that is being dropped
    id = event.originalEvent.dataTransfer.getData("text");

    originalImageId = originalImageIdBase + id;

    $originalImage = $(originalImageId).find('img');

    //only allow recipe images that we have managed to be dropped
    if (!$originalImage.parent().hasClass('draggableRecipe')) {
      _logg('>> this is not a managed recipe image. EXITING');
      $(this).removeClass('dragEnter');
      return;
    }

    //add the hasChild class so that the UI can update
    $(event.target).addClass('hasChild');

    //trigger the custom event so that we can update the UI
    $(document).trigger(_utils.constants.CUSTOM_DROP_EVENT_NAME);

    imageSrc = $originalImage.attr('src');

    $newimage.attr('src', _utils.get75Image(imageSrc));

    if ($originalImage.parent().hasClass('droppedImage')) {
      $(event.target).html('');
      $(event.target).append($originalImage.parent());
    } else {
      $newimage.parent().attr(datUrlAttr, $originalImage.attr(datUrlAttr));
      $newimage.parent().attr(datTitleAttr, $originalImage.attr(datTitleAttr));
      $newimage.parent().attr('title', $originalImage.attr(datTitleAttr));
      $(event.target).html($newimage.parent());

      //report this event to omniture for first-time drops (i.e. not when sometnhing is moved)
      if ($originalImage.parent().hasClass('sponsored')) {
        //is the mp_toolbar_sponsored flag is set to: 1 ?
        if (_win.Drupal && _win.Drupal.settings && _win.Drupal.settings.mp_toolbar_sponsored && _win.Drupal.settings.mp_toolbar_sponsored === 1) {
          //if the mp_toolbar_sponsored flag is set to: 1, fire the sponsored omniture flag:  mpt-drag-sponsor-[recipe title]
          _utils.reportOmnitureEvent(_utils.constants.OMNITURE_EVENT_TEXT_DRAG_RECIPE_SPONSORED_BASE + $originalImage.attr(datTitleAttr));
        } else {
          //if the mp_toolbar_sponsored flag is set to: 0 (or not present), fire the edit omniture flag: drag-recipe-edit-toolbar
          _utils.reportOmnitureEvent('mpt-drag-recipe-edit-toolbar');
        }

      } else {
        _utils.reportOmnitureEvent(_utils.constants.OMNITURE_EVENT_TEXT_DRAG_RECIPE);
      }
    }

    //add the close butt0n
    $(event.target).append(_utils.getCloseButton());

    //remove the dragEnter class
    $(event.target).removeClass('dragEnter');

    //trigger the coziMealPlannerToolBar:uxUpdated event
    window.jQuery(document).trigger(_utils.constants.UX_UPDATED_EVENT_NAME);
  };

  /**
  * Handler for the dragstart event of a "meal" DOM element that has already been dropped on a day-of-the-week DOM element.
  *
  * @param event (required) event object
  *
  * @return undefined
  */
  _utils.dragStartHandlerAlreadyDropped = function (event) {
    var elementId = '';

    _logg('_utils.dragStartHandlerAlreadyDropped');

    if ($(event.target).is('img')) {
      elementId = $(event.target).parent().attr('id');
    } else {
      elementId = event.target.id;
    }

    //set a reference to the element that is currenly being dragged
    event.originalEvent.dataTransfer.setData("text", elementId);
  };

  /**
  * Binds the appropriate event handler for the main recipe image's dragstart event
  *
  * @see _utils.dragStartHandlerMain
  *
  * @return undefined
  */
  _utils.setupDragHandlerMain = function () {
    //cache a reference to the main recipe page image
    var $dragElementMain = null;

    _logg('_utils.setupDragHandlerMain');

    //if (_win.mrCoziLib.utils.pageContext.type !== 'recipe') {return; }
    if (mrTools.getPageContext().type !== 'recipe') {return; }

    $dragElementMain = _utils.getMainRecipeImage().parent();

    //bind the dragStartHandler function to the main recipe page image
    $dragElementMain.bind('dragstart', _utils.dragStartHandlerMain);
  };

  /**
  * Handler for the dragstart event of a "meal" DOM element that has NOT already been dropped.
  *
  * @param event (required) event object
  *
  * @return undefined
  */
  _utils.dragStartHandlerMain = function (event) {
    var dragIcon = null,
      elementId = '';

    _logg('_utils.dragStartHandlerMain');

    if ($(event.target).is('img')) {
      elementId = $(event.target).parent().attr('id');
    } else {
      elementId = event.target.id;
    }

    //set a reference to the element that is currenly being dragged
    event.originalEvent.dataTransfer.setData("text", elementId);

    //create a custom drag image
    dragIcon = document.createElement('img');
    dragIcon.src = _utils.getMainRecipeImageUrlAs75x75();

    //set the custom drag image
    if (event.originalEvent.dataTransfer.setDragImage) {
      event.originalEvent.dataTransfer.setDragImage(dragIcon, 25, 25);
    }
  };

  /**
  * Binds the appropriate event handler for each sponsored recipe image's dragstart event.
  *
  * @see _utils.dragStartHandlerSponsored
  *
  * @return undefined
  */
  _utils.setupDragHandlerSponsored = function () {
    //cache a reference to all sponsored recipe tout images
    var $dragElementsSponsored = $('.sponsorMealsContainter .sponsorMeals li a');

    _logg('_utils.setupDragHandlerSponsored');

    //bind the dragStartHandler function to all sponsored recipe tout images
    $dragElementsSponsored.bind('dragstart', _utils.dragStartHandlerSponsored);
  };

  /**
  * Handler for the dragstart event of a "sponsored meal" DOM element that has NOT already been dropped on a day-of-the-week DOM element.
  *
  * @param event (required) event object
  *
  * @return undefined
  */
  _utils.dragStartHandlerSponsored = function (event) {
    var dragIcon = null,
      elementId = '';

    _logg('_utils.dragStartHandlerSponsored');

    if ($(event.target).is('img')) {
      elementId = $(event.target).parent().attr('id');
    } else {
      elementId = event.target.id;
    }

    //set a reference to the element that is currenly being dragged
    event.originalEvent.dataTransfer.setData("text", elementId);

    //create a custom drag image
    dragIcon = document.createElement('img');

    dragIcon.src =  _utils.get75Image($(event.target).find('img').attr('src'));

    //set the custom drag image
    if (event.originalEvent.dataTransfer.setDragImage) {
      event.originalEvent.dataTransfer.setDragImage(dragIcon, 25, 25);
    }
  };

  /**
  * Handles UX changes needed before actually saving the meal plan.
  *
  * @return undefined
  */
  _utils.prepareToolbarForSave = function () {
    _logg('_utils.prepareToolbarForSave');

    var utilsDom = _utils.DOM;

    utilsDom.$finalSave.find('p.header').hide();
    utilsDom.$finalSave.find('.finalSaveControl').hide();
    utilsDom.$finalSave.find('.saveStatus').show();
    utilsDom.$finalSave.parent().parent().parent().find('.days, .sponsorArea').css({'opacity' : '0.5'});
    utilsDom.$finalSave.find('.ajaxSpinnergif').css({'display' : 'block'});
  };

  /**
  * Wraps mrCoziLib.sso, forcing the user to log in when attempting to save meal plan (log-in not needed for logged-in users).
  *
  * @return undefined
  */
  _utils.saveMealPlanSsoWrapper = function () {
    _logg('_utils.saveMealPlanSsoWrapper');

    /*
    _win.mrCoziLib.sso().ready(function () {
      _win.mrCoziLib.getUserContext(function (obj) {
        if (obj.kaUser) {
          $(_utils.constants.PLUGIN_CUSTOM_ID_FOR_JQUERY).fadeOut();
        } else {
          //prepare the toolbar for save
          _utils.prepareToolbarForSave();

          //save the meal plan
          _utils.saveMealPlan();

          //report this event to omniture
          _utils.reportOmnitureEvent(_utils.constants.OMNITURE_EVENT_TEXT_CHOOSE_WEEK);
        }
      });
    });
    */

    mrCoziAppLib.requireAuth(function(){
      //prepare the toolbar for save
      _utils.prepareToolbarForSave();

      //save the meal plan
      _utils.saveMealPlan();

      //report this event to omniture
      _utils.reportOmnitureEvent(_utils.constants.OMNITURE_EVENT_TEXT_CHOOSE_WEEK);
    });
  };

  /**
  * Saves a meal plan
  *
  * @see mrCoziMealPlannerLib.addRecipesToMealPlan
  *
  * @return undefined
  */
  _utils.saveMealPlan = function () {
    _logg('_utils.saveMealPlan');

    //save the meal plan
    _win.mrCoziMealPlannerLib.addRecipesToMealPlan({
      startDate : _utils.dates.mealPlannerInstanceDate,
      totalDays : _utils.constants.MEAL_PLANNER_DATE_RANGE,
      success : _utils.saveMealPlanSuccessHandler,
      recipes : _utils.getLocalStorageDataWithoutImageUrls()
    });
  };

  /**
  * Called when the meal planner save has successfully completed
  *
  * @see mrCoziMealPlannerLib.addRecipesToMealPlan
  *
  * @return undefined
  */
  _utils.saveMealPlanSuccessHandler = function () {
    _logg('_utils.saveMealPlanSuccessHandler');

    //update the UX
    _utils.setDefaultContentAll();
    _utils.DOM.$finalSave.hide();

    _utils.showSuccessMessageInTitleBar();
    _utils.DOM.$handle.show();

    $('.header.saveStatus').hide();

    $('.finalSave .header.choose').show();
    $('#cancelCoziMealPlanFromToolbar').show();
    $('.ajaxSpinnergif').hide();
    $('#saveCoziMealPlanFromToolbar_firstWeek').show();
    $('#saveCoziMealPlanFromToolbar_secondWeek').show();

    //delete the local storage data
    _utils.deleteLocalStorageData();
  };

 /**
  * Sets up bindings for the hover and click events of each dropped recipes close button.
  *
  * @return undefined
  */
  _utils.setupCloseButtonHoverAndClickEvents = function () {
    var $droppables = $("#coziMealPlannerToolbar .userArea .days li");

    _logg('_utils.setupCloseButtonHoverAndClickEvents');

    $droppables.live("mouseover", function () {
      $(this).find('.closeButton').show();
    });

    $droppables.live("mouseleave", function () {
      $(this).find('.closeButton').hide();
    });

    $("#coziMealPlannerToolbar .closeButton").live("click", function () {
      _utils.setDefaultContent($(this).parent());
      //update local storage
      _utils.updateLocalStorage();
    });
  };

  /**
  * Takes care of UX tasks when a meal image is dropped.
  *
  * @see _utils.bindToolbarControls
  *
  * @return undefined
  */
  _utils.customDropEventHandler = function () {
    _logg('_utils.customDropEventHandler: ' + _utils.constants.CUSTOM_DROP_EVENT_NAME);

    //make sure the DOM has been updated
    setTimeout(function () {
      //set default content for empty days
      _utils.setDefaultContentForEmptyDays();
      //update local storage
      _utils.updateLocalStorage();
    }, 50);
  };

  /**
  * Event handler for the "Save more dishes" button that is displayed after you have successfully saved a meal plan.
  *
  * @return undefined
  */
  _utils.saveMoreRecipesButtonClickHandler = function () {
    _logg('_utils.saveMoreRecipesButtonClickHandler');

    $('.userArea .postSave').fadeOut(500, function () {
      $('.days').show();
      _utils.DOM.$finalSave.parent().parent().parent().find('.days, .sponsorArea').css({'opacity' : '1'});
      $('.instructionsContainer, .instructionsContainer .instructions').show();
    });
  };

  /**
  * Event handler for the "Add to my calendar" text.
  *
  * @return undefined
  */
  _utils.instructionsClickHandler = function () {
    _logg('_utils.instructionsClickHandler');

    //make sure there is at least one recipe added to the tool bar
    if (!$('.minMaxBox-container .userArea .days li a.droppedImage').length) {
      _utils.showNoMealsWarning();
      return;
    }

    _utils.DOM.$instructions.hide();
    $('.minMaxBox-container .days').hide();
    $('.instructionsContainer').hide();
    _utils.DOM.$handle.hide();

    //set delay to avoid accidential save click
    setTimeout(function () {
      //_utils.DOM.$finalSave.fadeIn();
      _utils.DOM.$finalSave.show();
    }, 250);

    //report this event to omniture
    _utils.reportOmnitureEvent(_utils.constants.OMNITURE_EVENT_TEXT_ADD_TO_CALENDAR);
  };

  /**
  * Event handler for the "Save" button that is displayed when you are ready to save a meal plan.
  *
  * @return undefined
  */
  _utils.saveButtonsClickHandler = function () {
    var mpDate =  $(this).attr('data-week');

    _logg('_utils.saveButtonsClickHandler');

    /*
    _win.mrCoziLib.getUserContext(function (obj) {
      if (obj.anonymous) {
        _win.KA.iframeOverlay(_win.mrCoziDesktop.defaultKaIframeOverlayObject);
      }
    });
    */

    if (mpDate === 'first') {
      _utils.dates.mealPlannerInstanceDate = _utils.dates.lastMondayFormatted;
    } else if (mpDate === 'second') {
      _utils.dates.mealPlannerInstanceDate = _utils.dates.nextMondayFormatted;
    }

    _utils.saveMealPlanSsoWrapper();
  };

  /**
  * Event handler for the "Cancel" button that is displayed when you are ready to save a meal plan.
  *
  * @return undefined
  */
  _utils.cancelButtonsClickHandler = function () {
    _logg('_utils.saveButtonsClickHandler');

    _utils.DOM.$finalSave.hide();
    $('.days').show();
    _utils.DOM.$handle.show();
    $('.instructionsContainer').show().find('.instructions').show();
  };

 /**
  * Creates a <li>, using data returned by _utils.getSponsoredRecipeJason.
  *
  * @param dataObj (required) object, must contain "image", "title" and "path" properties
  *
  * @see _utils.getSponsoredRecipeJason
  *
  * @return jQuery object: <li>
  */
  _utils.createSposoredMealListItem = function (dataObj) {
    var $li = $('<li></li>'),
      $anchor = $('<a href="#" draggable="true" class="draggableRecipe sponsored"></a>'),
      $image = $('<img alt="Recipe Photo">');

    _logg('_utils.createSposoredMealListItem');

    $image
      .attr('src', dataObj.image)
      .attr('title', dataObj.title.replace('&amp;', '&'))
      .attr('data-title', dataObj.title)
      .attr('data-url', dataObj.path);

    $anchor.append($image);
    $li.append($anchor);

    //return the list-item element
    return $li;
  };

 /**
  * Injects an <img > element for the sponsor logo, using data returned by _utils.getSponsoredRecipeJason.
  *
  * @param dataObj (required) object, must contain a "logo" property
  *
  * @return undefined
  */
  _utils.renderSponsLogo = function (dataObj) {
    _logg('_utils.renderSponsLogo', function () {
      console.dir(dataObj);
    });

    $('#coziMealPlannerToolbar .sponsorLogo .sponsorLogoImage').attr('src', dataObj.logo);
  };

 /**
  * Renders the sponsored logo text in meal planner toolbar, using data returned by _utils.getSponsoredRecipeJason.
  *
  * @see _utils.getSponsoredRecipeJason
  *
  * @return undefined
  */
  _utils.renderSponsorLogoCaption = function () {
    _logg('_utils.renderSponsorLogoCaption');

    var text = _utils.data.sponsoredJson.logo_text;

    $(_utils.constants.PLUGIN_CUSTOM_ID_FOR_JQUERY).find('.sponsorLogoCaption .text').text(text);
  };

 /**
  * Injects <li> elements for each sponsored meal returned by _utils.getSponsoredRecipeJason.
  *
  * @see _utils.getSponsoredRecipeJason
  *
  * @return undefined
  */
  _utils.renderSponsorMeals = function () {
    _logg('_utils.renderSponsorMeals');

    $.each(_utils.data.sponsoredJson.recipes, function (index, item) {
      _logg('sponsored meal item:', function () {
        console.dir(item);
      });

      $('.sponsorMealsContainter .sponsorMeals').append(_utils.createSposoredMealListItem(item));
    });
  };

  /**
  * Creates a new image element, used for the dropped-meal DOM element.
  *
  * @return jQuery object: <img >
  */
  _utils.createImage = function () {
    var $anchor = $('<a></a>'),
      $newImage = $('<img>');

    _logg('_utils.createImage');

    $anchor
      .attr('href', '#')
      .addClass('droppedImage')
      .addClass('draggableRecipe');

    $newImage
      .attr('alt', 'Recipe Photo')
      .attr('src', 'http://cdn-image.myrecipes.com/sites/all/themes/myrecipes/images/legacy/img_noPhoto150.gif');

    $anchor.append($newImage);

    $anchor.attr('id', _utils.createUniqueId('droppedImage_'));

    //bind the dragStartHandler function to all dragElements
    $anchor.bind('dragstart', _utils.dragStartHandlerAlreadyDropped);

    $anchor.find('img').click(function (e) {
      e.preventDefault();
      e.stopPropagation();
    });

    return $anchor;
  };

  /**
  * Creates a close button, to be used for a dropped-meal DOM element.
  *
  * @return jQuery object: <span>
  */
  _utils.getCloseButton = function () {
    var id = _utils.createUniqueId('closeButton_'),
      $closeButton = $('<span>X</span>');

    _logg('_utils.getCloseButton');

    $closeButton
      .attr('id', id)
      .attr('title', _utils.constants.MEAL_PLANNER_TOOLBAR_DROPPED_MEAL_CLOSE_BUTTON_TEXT)
      .addClass('closeButton');

    return $closeButton;
  };

  /**
  * Handles UX when user attempts to save meal plan when no recipes are dropped yet.
  *
  * @return undefined
  */
  _utils.showNoMealsWarning = function () {
    var $instructions = $('.instructions'),
      $sponsorArea = $('.sponsorArea'),
      $handle = $('.minMaxBox-container .handle'),
      $days = $('#coziMealPlannerToolbar .days li'),
      $h3 = $handle.find('h3'),
      oldH3Text = $h3.text(),
      warningColor = '#000';

    _logg('_utils.showNoMealsWarning');

    $instructions.hide();
    $sponsorArea.css({'opacity' : '0.5'});

    $days.css({'outline' :  ('1px solid ' + warningColor)});
    $handle.css({'background-color' : warningColor});

    $h3.text(_utils.constants.MEAL_PLANNER_TOOLBAR_NO_SAVED_DISHES_TEXT);

    setTimeout(function () {
      $h3.text(oldH3Text);
      $handle.removeAttr('style');
      $handle.addClass('fadeToRed');
      $days.css({'outline' : 'none'});
      $instructions.fadeIn(800);
      $sponsorArea.css({'opacity' : '1'});
    }, 2000);

    setTimeout(function () {
      $handle.removeClass('fadeToRed');
    }, 5000);
  };

  /**
  * Informs the user that their meal plan was saved.
  *
  * @return undefined
  */
  _utils.showSuccessMessageInTitleBar = function () {
    var $handle = $('.minMaxBox-container .handle'),
      $h3 = $handle.find('h3'),
      oldH3Text = $h3.text();

    _logg('_utils.showSuccessMessageInTitleBar');

    $h3.text(_utils.constants.MEAL_PLANNER_TOOLBAR_SAVED_MEAL_PLAN_SUCCESS_TEXT);

    $('.userArea .postSave ').fadeIn(400);

    $handle.addClass('fadeToGreen');

    setTimeout(function () {
      $handle.removeClass('fadeToGreen');
      $handle.addClass('fadeToRed');
    }, 5000);

    setTimeout(function () {
      $h3.text(oldH3Text);
    }, 4000);

    setTimeout(function () {
      $handle.removeClass('fadeToRed');
    }, 10000);
  };

  /**
  * Creates a time stamp
  *
  * @return number
  */
  _utils.getTimeStamp = function () {
    var date = new Date(),
      dateSeconds = date.getTime();

    _logg('_utils.getTimeStamp > ' + dateSeconds);

    return dateSeconds;
  };

  /**
  * Createsa a unique id for a DOM element.
  *
  * @param prefix (optional) string, used as  prefix for the ID
  *
  * @see _utils.getTimeStamp
  *
  * @return string
  */
  _utils.createUniqueId = function (prefix) {
    var retVal = '';

    prefix = prefix || (_appName + '_');

    retVal = prefix + _utils.getTimeStamp();

    _logg('_utils.createUniqueId: ' + retVal);

    return retVal;
  };

  /**
  * Gives each draggable recipe image a unique id.
  *
  * @see _utils.createUniqueId
  *
  * @return undefined
  */
  _utils.createUniqueImageIds = function () {
    var mainImageIdPrefix = 'mainRecipeImage_',
      sponsoredImageIdPrefix = 'sponsoredRecipeImage_',
      $mainImage = _utils.getMainRecipeImage(),
      $sponsoredImages = $('.sponsorMealsContainter .sponsorMeals li a');

    _logg('_utils.createUniqueImageIds');

    //if (_win.mrCoziLib.utils.pageContext.type === 'recipe') {
    if (mrTools.getPageContext().type === 'recipe') {
      $mainImage.parent().attr('id', _utils.createUniqueId(mainImageIdPrefix));
    }

    $sponsoredImages.each(function (index) {
      var $me = $(this);

      $me.attr('id', (sponsoredImageIdPrefix + '_' + index));
    });
  };

 /**
  * Makes an asyncronous call to get sponsored recipe data.
  *
  * @return jQuery.deferred
  */
  _utils.getSponsoredRecipeJason = function () {
    _logg('_utils.getSponsoredRecipeJason');

    //return a deferred
    return $.ajax({
      url : _utils.constants.SPONSORED_RECIPES_JSON_URL,
      dataType : "json",
      success : function (jsonData) {
        _utils.data.sponsoredJson = jsonData;

        _logg('sponsored json data:', function () {
          console.dir(_utils.data.sponsoredJson);
        });
      }
    });
  };

  /**
  * Puts the meal planner toolbar in a disabled state.
  *
  * @return undefined
  */
  _utils.disableToolbar = function () {
    _logg('_utils.disableToolbar');

    $('#coziMealPlannerToolbarPlgin .content').addClass('disabled');

    $('#coziMealPlannerToolbarPlgin .minMaxBox-container').append(_utils.disableToolbarHtml());
  };

  /**
  * Contains custom CSS needd by the meal planner toolbar.
  *
  * This is passed to the jQuery.minMaxBox plugin.
  *
  * @see jQuery.minMaxBox plugin
  * @see _utils.startApp -> customCss
  *
  * @return array
  */
  _utils.getCssArray = function () {
    _logg('_utils.getCssArray');

    return [
      //override
      ' .minMaxBox-wrapper{display:none;}',
      ' .minMaxBox-container{width:1000px;background-color:#fff;}',
      ' .minMaxBox-container .handle{min-width:600px;text-align:left;}',
      ' .minMaxBox-container .left h3{display:inline-block;}',
      ' .minMaxBox-container .left .what-is-this{position: absolute;right: 35px;line-height: 20px;font-weight:bold;color: #fff;}',
      //container
      ' .container{width: 998px;height: 110px;margin: 0;padding: 0;background-color: #fff;}',
      //disabled message
      ' .content.disabled{opacity:0.3;}',
      ' .disabledMessage{position:absolute;width: 1000px;top:0;left:0;line-height:110px;}',
      ' .disabledMessage a{color:#333;font-size:28px;font-weight:bold;}',
      //user area
      ' .userArea{display: inline-block;width: 600px;padding: 0 0 0 5px;}',
      ' .userArea,.userArea ul, .userArea ul li{margin: 0;padding: 0;list-style-type:none;}',
      ' .userArea .days li img.droppedImage{width:90px;height:90px;}',
      ' .userArea .days li img.droppedImage:hover,.sponsorArea .sponsorMeals img:hover{cursor:pointer;}',
      ' .userArea .days li.dragEnter{background-color:#cc0000;}',
      ' .userArea ul.days,.instructionsContainer{display:inline-block;vertical-align: top;}',
      ' .userArea ul li{position:relative;float: left;width: 75px;height: 75px;margin-left: 15px;-webkit-border-radius: 3px;-moz-border-radius: 3px;background-color: #ededed;color:#cbcbcb;font-size:26px;line-height:75px;text-align:center;}',
      ' .userArea li:last-child{margin-right:0;}',
      ' .circle {width: 25px;height: 25px;text-align: center;background-color: #cc0000;border-radius: 50%;font-size: 22px;color:#fff;}',
      //user area/sponsora area
      ' .userArea, .sponsorArea{margin: 13px 0 5px;padding:0;height: 90px;background-color: #fff;color:white;}',
      //instructions
      ' .instructionsContainer{width:120px;height:90px;}',
      ' .instructionsContainer .deck{left: 5px;position: relative;top: 5px;width: 68px;color: #cc0000;font-size:12px;text-indent: -30px;}',
      ' .instructions{height: 70px;padding-top: 10px;position:relative;left:5px;top:10px;}',
      ' .instructions:hover{cursor:pointer;}',
      ' .instructionsContainer .circle, .instructionsContainer .deck{display: inline-block;margin: 0;padding: 0;}',
      ' .ajaxSpinnergif{position:relative;margin:20px auto;display:none;width:32px;height:32px;}',
      //final save
      ' .finalSave{text-align: center;color:#000;}',
      ' .finalSave .finalSaveControl{display:inline-block;width: 150px;height:50px;margin-right: 10px;background-color:#cc0000;color:white;font-weight:bold;text-align:center;vertical-align: top;line-height:50px; font-size: 16px;}',
      ' .finalSave .finalSaveControl.last{margin-right:0;background-color:#333;}',
      ' .finalSave .finalSaveControl:hover{cursor:pointer;}',
      ' .finalSave  .header{margin: 0 0 10px;color:#333;font-size:16px;font-weight:bold;}',
      ' .header.saveStatus{display:none;}',
      //close button
      ' .userArea .days .closeButton{display:none;position:absolute;width: 24px;top:-10px;right:-10px;}',
      ' .userArea .days .closeButton:hover{cursor:pointer;}',
      //closeButton as circle
      ' .closeButton{display:block;width:24px;height:24px;border-radius:12px;color:#fff;line-height:24px;text-align:center;text-decoration:none;background:#000;font-family:arial;font-size:14px}',
      ' .closeButton:hover{background-color:#c00;cursor:pointer}',
      //post-save
      ' .postSave{margin:0;padding:0;position: relative;top: 10px;}',
      ' .postSave .postSaveButton{display:inline-block;width: 190px;height:50px;margin-right: 10px;background-color:#cc0000;color:white;font-weight:bold;text-align:center;vertical-align: top;line-height:50px; font-size: 16px;}',
      ' .postSave .postSaveButton:hover{cursor:pointer;}',
      ' .postSave a.postSaveButton{text-decoration:none;}',
      (' #coziMealPlannerToolbar_viewMyMealPlan:after{position: relative;left: 7px;top:1px;content: url("' + _utils.constants.OPEN_IN_NEW_WINDOW_ICON_DATA_URI()  + '");}'),
      //title bar css transition
      ' .handle.fadeToGreen {background-color: #006400;-webkit-transition: background-color 1000ms linear;-moz-transition: background-color 1000ms linear;-o-transition: background-color 1000ms linear;-ms-transition: background-color 1000ms linear;transition: background-color 1000ms linear;}',
      ' .handle.fadeToRed {background-color: #cc0000;-webkit-transition: background-color 1000ms linear;-moz-transition: background-color 1000ms linear;-o-transition: background-color 1000ms linear;-ms-transition: background-color 1000ms linear;transition: background-color 1000ms linear;}',
      //sponsor area
      ' .sponsorArea{display: inline-block;margin: 5px 0 0 5px;width: 390px;vertical-align: top;}',
      ' .sponsorLogoCaption{position:relative;margin:0;padding:0;color:#333;}',
      ' .sponsorLogoCaption .text{margin:0;padding:0;font-weight:bold;}',
      ' .sponsorLogo, .sponsorMealsContainter{float: left;vertical-align: top;margin:0;padding:0;}',
      ' .sponsorMealsContainter .sponsorMeals {margin: 0;padding: 0;}',
      ' .sponsorMealsContainter .sponsorMeals, .sponsorMealsContainter .sponsorMeals li{margin:0;padding:0;}',
      ' .sponsorMealsContainter .sponsorMeals li {display:inline-block;margin: 8px 0 0 3px;}',
      ' .sponsorMealsContainter .sponsorMeals li img{margin: 0;padding: 0;width:75px;height:75px;}',

      ' .sponsorLogo{border-left: 1px solid #a3a3a3;height: 90px;margin-top: 5px;position: relative;width: 140px;}',
      ' .sponsorLogo .sponsorLogoImage,.sponsorLogo .dragToAdd{display:inline-block;}',
      ' .sponsorLogo .sponsorLogoImage{position: relative;width: 120px;margin: 5px 0;top: -8px;}',
      ' .sponsorLogo .dragToAdd {bottom: -8px;height: 30px;left: 84px;position: absolute;width: 60px;}',

      //recipe hover links
      ' .sponsorMealsContainter .sponsorMeals li{position:relative;}',
      ' .days li a.recipeLink:hover{color:#fff!important;background-color:#cc0000!important;}',
      ' li a.recipeLink:hover{color:#fff!important;background-color:#cc0000!important;}'
    ];
  };

  /**
  * HTML needed by the meal planner toolbar.
  *
  * @see _utils.disableToolbar
  *
  * @return string
  */
  _utils.disableToolbarHtml = function () {
    _logg('_utils.disableToolbarHtml');

    return [
      '<div class="disabledMessage">',
      ('<a title="' + _utils.constants.DISABLED_CONTENT_TITLE + '" href="' + _utils.constants.URL_BASE +  '/recipe-finder-1">'),
      _utils.constants.DISABLED_CONTENT_MESSAGE,
      '</a>',
      '</div>'
    ].join('');
  };

  /**
  * HTML needed by the meal planner toolbar.
  *
  * This is passed to the jQuery.minMaxBox plugin.
  *
  * @see jQuery.minMaxBox plugin
  *
  * @see _utils.startApp -> content
  *
  * @return string
  */
  _utils.tbHtml = function () {
    return [
      '<div class="container" id="coziMealPlannerToolbar">',
      '<div class="userArea">',
      '<ul class="days">',
      ('<li data-default="Mon"></li>'),
      '<li data-default="Tues"></li>',
      '<li data-default="Wed"></li>',
      '<li data-default="Thurs"></li>',
      '<li data-default="Fri"></li>',
      '</ul>',
      '<div class="instructionsContainer">',
      '<div class="instructions" title="Add these meals to your Cozi calendar" >',
      '<p class="circle">+</p>',
      '<p class="deck">Add to <br /> my calendar</p>',
      '</div>',
      '</div>',
      '<div class="finalSave" style="display:none">',
      '<p class="header choose">Choose the date of your meal plan</p>',
      '<div data-week="first" title="Save this meal plan to the week of: ' + _utils.dates.lastMondayDate + '" class="finalSaveControl" id="saveCoziMealPlanFromToolbar_firstWeek">Week of ' + _utils.dates.lastMondayDate + '</div>',
      '<div data-week="second" title="Save this meal plan to the week of: ' + _utils.dates.nextMondayDate + '"  class="finalSaveControl" id="saveCoziMealPlanFromToolbar_secondWeek">Week of ' + _utils.dates.nextMondayDate + '</div>',
      '<div class="finalSaveControl last" id="cancelCoziMealPlanFromToolbar">Cancel</div>',
      '<p class="header saveStatus">Saving your meal plan</p>',
      '<img class="ajaxSpinnergif" src="' + _utils.constants.AJAX_LOADER_GIF_DATA_URI() + '">',
      '</div>',
      '<div class="postSave" style="display:none">',
      '<div class="postSaveButton" id="coziMealPlannerToolbar_saveMoreRecipes" title="Show meal planner toolbar and save more dishes.">Save more dishes</div>',
      '<a href="http://my.cozi.com/meals/?plan" target="_blank" class="postSaveButton" id="coziMealPlannerToolbar_viewMyMealPlan" title="View your meal plan calendar">View my meal plan</a>',
      '</div>',
      '</div>',
      '<div  class="sponsorArea">',
      '<div class="sponsorLogo">',
      '<div class="sponsorLogoCaption"><p class="text"></p></div>',
      '<img class="sponsorLogoImage" />',
      '<img class="dragToAdd" src="' +  _utils.constants.DRAG_TO_ADD_DATA_URI()  +  '" />',
      '</div>',
      '<div class="sponsorMealsContainter">',
      '<ul class="sponsorMeals">',
      //sponsored meal <li> elements will go here
      '</ul>',
      '</div>',
      '</div>',
      '</div>'
    ].join('');
  };

  /**
  * Returns the data-uri used for the "open in new window" icon.
  *
  * @see _utils.tbHtml
  *
  * @return string
  */
  _utils.constants.OPEN_IN_NEW_WINDOW_ICON_DATA_URI = function () {
    _logg('_utils.constants.OPEN_IN_NEW_WINDOW_ICON_DATA_URI');

    return 'data:image/png;base64,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';
  };

  /**
  * Returns the markup for the "Drag to add" instructions over the main image.
  *
  * @see _utils.tbHtml
  *
  * @return string
  */
  _utils.dragToAddHtml = function () {
    _logg('_utils.dragToAddHtml');

    return [
      '<span>Drag to add instructions</span>'
    ].join('');
  };

  /**
   * Add recipe links
   *
   * @return undefined
   */
  _utils.addRecipeLinks = function (containerType) {
    var containers = '',
      linkSelector = '',
      recipeContainers = '#coziMealPlannerToolbar .days li',
      recipeContainersSponsored = '#coziMealPlannerToolbar .sponsorMeals li',
      recipeLinkCSS = {
        'position' : 'absolute',
        'display' : 'none',
        'height' : '18px',
        'margin' : '0 auto',
        'padding' : '5px 5px',
        'bottom' : '0',
        'right' : '0',
        'font-size' : '12px',
        'line-height' : '12px',
        'color' : '#fff',
        'background-color' : '#000'
      };

    if (containerType && (containerType === 'sponsored')) {
      recipeLinkCSS.bottom = '3px';
      linkSelector = 'a img';
      containers = recipeContainersSponsored;
    } else {
      linkSelector = 'a.droppedImage';
      containers = recipeContainers;
    }

    $(containers).each(function () {
      var $me = $(this),
        $link = $me.find(linkSelector),
        $recipeLink = null,
        $newWindowIcon = $('<img class="newWindowIcon" />');

      //if there is no a.droppedImage child element, this drop area is empty. exit.
      if (!$link.length) {return; }

      //if there is already an a.recipeLink child element, exit.
      if ($me.find('a.recipeLink').length) {return; }

      //set the src attribute for the new window icon
      $newWindowIcon.attr('src', _utils.constants.NEW_WINDOW_ICON_DATA_URI);

      //set the CSS for the new window icon
      $newWindowIcon.css({
        'width' : '13px',
        'height' : '11px'
      });

      //create the recipe link
      $recipeLink = $('<a class="recipeLink"><span>View</span></a>');

      //set the href attribute for the recipe link
      $recipeLink.attr('href', $link.attr('data-url'));

      //set the target attribute for the recipe link
      $recipeLink.attr('target', '_blank');

      //set the title attribute for the recipe link
      $recipeLink.attr('title', ('View ' +  $link.attr('title').replace('&amp;', '&')  +  ' in a new window'));

      //set the css for the recipe link
      $recipeLink.css(recipeLinkCSS);

      //setup a click handler so that the omniture report is sent
      $recipeLink.click(function () {
        _utils.reportOmnitureEvent(_utils.constants.OMNITURE_EVENT_VIEW_RECIPE);
      });

      //set the css for the span that has the "View" text
      $recipeLink.find('span').css({
        'margin-right' : '5px'
      });

      //inject the window icon
      $recipeLink.append($newWindowIcon);

      //inject the recipe link
      $me.append($recipeLink);

      //set the mouseenter event handler (shows the "View" link)
      $me.mouseenter(function () {
        $recipeLink.fadeIn(300);
      });

      //set the mouseleave event handler (hides the "View" link)
      $me.mouseleave(function () {
        $recipeLink.fadeOut(300);
      });
    });
  };

  _utils.constants.NEW_WINDOW_ICON_DATA_URI = 'data:image/png;base64,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';


  /**
  * Returns the data-uri used for the "drag to add" image.
  *
  * @see _utils.tbHtml
  *
  * @return string
  */
  _utils.constants.DRAG_TO_ADD_DATA_URI = function () {
    _logg('_utils.constants.DRAG_TO_ADD_DATA_URI');

    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFYAAAAqCAMAAAAeaFx/AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAWVQTFRF7Scu54iI/O7u2kRE+N3dzxER8bu79czM1jMz0yIi65mZ5Hd37qqq3VVV4GZm/v7+7Ssy7Sox70JJ/vr6+sfI70FH+s3P+8/R+snL9Ht/+LK1+sPF9pqd+K6x+b2/96ap/vPz96eq8mds96Om83Z78mpv/ezs/vn59IGF9p6h+9XW7jlA8E1T83J270ZM/OXm/fHx8Vhd8mlu9p2g9pWZ/evs7jY8/OPk9pyf+bi67jg/+s3O8FNZ7Swz829z/Obn8Vdc8mNo/e3t8Vpf9HyA+9TW/OPj/OHi70hO96Wo7Swy9IKG96Cj8FFW9ZGV7Skw7TE38mZr+LO2+9na7TA3/e7v/vT1+b/B70pQ+svN/vv796Gk9H+E9YqN+sXH+be68m5y8ExS8mRp/e/w+LG09pWY9Y6R/err9YiM/N3f9ZKW/ODh8Vlf/vj49pib96ir+szN/Nvc/enq/efo////zAAA////KsA/HAAAAHd0Uk5T/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wCpn6RlAAADEUlEQVR42uyXZ3OcMBCGVRAgkLg79957bKf33nvvvfeesPz+rMRx5pLMwBV/yUQztpGQHlYvu68wSTalkf/YTcYGnPsAImIFsx3utIKlIKjrhsIv4IbQEpYBtUHjH4YLPc+MUZpOYW7jYb5MN0eDUlg3xSbAEykxJux6ArCHUOwJlirAQXDgDPWCsJwIbhq0TkBToKFyUBBf4JAvqAbP3tUSfKqYhoDxAjWasBQXQAhmh1w4icRofeEl2q9P1pDtrL6gAGvno7Q+LpIaLxWuNT8YOQ5F9cnCqBKZQKNS0XLEOhHKhgy7Y1zmCESi0p6oC5945sIzcz0rewlsKEEGdosyHVBS8ygBGYpUFXtPKz+KgFIhWBks4HKVJjzoVGUIWSRUBL7rZjqaFNDMMSnCSiWY2shD6qUbdkzmsvQRmY7MdRq/O/AEZp+mZZetxhFc2dLrsoN5EkoI2YYxqsLyL411swoKnG7auOC59M9ajK0jbIPWVPjx+97OsEFGiyA3upM8X2kDG1DWOAIy084X/jAhtaWFskKQjbqUprBCIay0jgbZlLBvCLZbS99bwqKthsa6fKGocX50cVeDyk18SMgWQ778emCx/BGprJIhmratKh8Pyyg9FOqtj5A9H2auGvLh7afGng583B0XYBnaJxYq2hcekRLfmHlrHuTfWHKnRg5VZ99OztuYbRstwAboqD6iKZgYEYnHjFE7PzH+RB49Jke2xfGP+6++Xhqb3D/0oACLRwuXoTRaaMAO9pQvQ1D5wl0mq5WLpGcwLlMYJLV94A5qig4tPSYgUsZgcDSP/VkjC5V3pHaltyw2cbzUwB233rEfIF6TJcQzZCSOz1fJ6mBZbJkW3yU7MM5v/YSs7f3zbmX0xVxb2Mq9CyeQO4X1Vl2bWGxIYbQ+82WdzE+1hY3HyT77vgZPYnZdO75rYit2Kkf7ZofPEdJ/o9Lu923/epw+YOhZlTS1YyMdfDZPk9PZ5cvxuZ468sD15bO/v8SWsL0903lX/3zz4JOhldt/S+SWsHHfwD/5L8kvAQYAiZeQ77p1pDIAAAAASUVORK5CYII=';
  };

  /**
  * Returns the data-uri used for the ajax loader image.
  *
  * @see _utils.tbHtml
  *
  * @return string
  */
  _utils.constants.AJAX_LOADER_GIF_DATA_URI = function () {
    _logg('_utils.constants.AJAX_LOADER_GIF_DATA_URI');

    return 'data:image/gif;base64,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';
  };

  //initialize the application
  _utils.init();

}(window, window.jQuery));