/*
* My Recipes - mobile cozi-integrated js app
*/
(function(_window, $) {

    'use strict';

    /*global window: false */
    /*global mrTools: false */
    /*global mrCoziAppLib: false */

    var _version = '1.0.5',
        _utils = {},
        _mrTools = null,
        _mrCoziAppLib = null,
        _logger = null;

    _utils.constants = {};
    _utils.settings = {};

    _utils.constants.APP_NAME = 'mrCoziAppMobile';
    _utils.constants.LOGGER_PREFIX = 'mrCoziAppMobile (' + _version + ') -> ';
    _utils.constants.NO_RUN_COOKIE_NAME = 'mrCoziApp_NO-RUN';
    _utils.constants.COZI_LOGO_URL = 'http://cdn-image.myrecipes.com/sites/all/themes/myrecipes/images/cozi/cozi-registration-cozi-logo-mobile.png';
    _utils.constants.GREEN_CHECK_URL = 'http://cdn-image.myrecipes.com/sites/all/themes/myrecipes/images/cozi/cozi-registration-green-check.png';
    _utils.constants.PINTEREST_LOGO_URL = 'http://cdn-image.myrecipes.com/sites/all/themes/myrecipes/images/cozi/recipe-mobile-pinterest-icon.png';
    _utils.constants.FACEBOOK_LOGO_URL = 'http://cdn-image.myrecipes.com/sites/all/themes/myrecipes/images/cozi/recipe-mobile-facebook-icon.png';

    _utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_ALREADY_SAVED = 'recipeAlreadySaved_mobile';
    _utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_RESET = 'recipeSaveButtonReset_mobile';
    _utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_SAVING = 'recipeSaveButtonSaving_mobile';

    _utils.settings.isDev = false;
    _utils.settings.jsFilesPath = _window._mre_js_path  || '/sites/all/themes/myrecipes/js';
    _utils.settings.port = document.location.port !== "80" ? ":" +  document.location.port : "";
    _utils.settings.jsUrlBase = document.location.protocol +  '//' + document.location.hostname  + _utils.settings.port + _utils.settings.jsFilesPath;
    _utils.settings.jsUrlBaseDev = 'http://localhost:8888';
    _utils.settings.mrToolsFileName = 'mr-tools.js';
    _utils.settings.mrToolsUrl =  ((_utils.settings.isDev) ? _utils.settings.jsUrlBaseDev : _utils.settings.jsUrlBase) + '/' + _utils.settings.mrToolsFileName;
    _utils.settings.mrCoziAppLibFileName = 'mr-cozi-app-lib.js';
    _utils.settings.mrCoziAppLibUrl =  ((_utils.settings.isDev) ? _utils.settings.jsUrlBaseDev : _utils.settings.jsUrlBase) + '/' + _utils.settings.mrCoziAppLibFileName;

    _utils.features = {};

    //kill-switch for dev and debugging.
    if ((_window.MR_TOOLS && typeof _window.MR_TOOLS.getCookie === 'function') && _window.MR_TOOLS.getCookie(_utils.constants.NO_RUN_COOKIE_NAME) !== null) {
        _window.console.warn(_utils.constants.NO_RUN_COOKIE_NAME + ': EXITING! (mobile)');

        //exit the app
        return;
    }

   /**
    * Initializes the applcation
    *
    * @return undefined
    */
    _utils.init = function () {
      //expose _utils as a global
      _window[_utils.constants.APP_NAME] = _utils;

      _utils.loadMrTools().done(function () {
          //set a cache referece to mrTools
          _mrTools = mrTools;

         _utils.loadMrCoziAppLib().done(_utils.start);
      });
    };

   /**
    * Starts the applcation
    *
    * @return undefined
    */
    _utils.start = function () {
        //instantiate the logger
        _logger = mrTools.newLogger(_utils.constants.LOGGER_PREFIX);

        //set a cache referece to mrCoziAppLib
        _mrCoziAppLib = mrCoziAppLib;

        //add log method to all features
        _utils.addLogMethodToFeatures();

        //make logger public
        _window[_utils.constants.APP_NAME].logger = _logger;

        _mrTools.bindEvent(_mrCoziAppLib.utils.constants.EVENT_COZI_AUTHORIZATION_REQUIRED, function () {
            _logger.info('EVENT: coziAuthorizationReqired');

            //scroll to top so that the login dialog is shown
            _mrTools.scrollTop();
        });

        //register features
        mrCoziAppLib.registerFeatures(_utils.features);

        //trigger the context change event so that features are processed
        _mrTools.triggerEvent(_mrCoziAppLib.utils.constants.EVENT_USER_CONTEXT_CHANGE);

        _logger.info('mrCoziAppMobile has started');
    };

   /**
    * Asyncronously loads mr-cozi-app.lib.js
    *
    * @return undefined
    */
    _utils.loadMrCoziAppLib = function () {
      return $.getScript(_utils.settings.mrCoziAppLibUrl);
    };

   /**
    * Asyncronously loads mr-tools.js
    *
    * @return undefined
    */
    _utils.loadMrTools = function () {
      return $.getScript(_utils.settings.mrToolsUrl);
    };

    /**
    * Adds a log method to each feature object
    *
    * @return undefined
    */
    _utils.addLogMethodToFeatures = function () {
      $.each(_utils.features, function(objName, feature) {

        //add a log method to the feature
        feature.log = function(msg){
          _logger.log(' ' + objName + ' -> ' + (msg || ''));

          //make the log method chainable
          return _logger;
        };

        _logger.log('addLogMethodToFeatures -> added log method to: ' + objName);
      });

      _logger.log('_utils.addLogMethodToFeatures');
    };

    /**
    * FEATURE: The mobile hamburger menu
    */
    _utils.features.all_hamburgerMenu = {
        type : 'all',
        name : 'hamburgerMenu',
        /**
        * Initializes the feature
        */
        initialize : function () {
            //add the custom css
            mrTools.addNewStylesheet(this.getCssText());

            //shoe the legacy mobile menu
            this.showLegacyMobileMenu();

            //dom setup
            this.domSetup();

            //add ids to old menu elements
            this.addIdsToOldMenuElements();

            //setup menu
            this.setupMenu();

            //setup event bindings
            this.setupBindings();

            this.log('initialize');
        },
        /**
        * Executed each time the user context switches to anonymous
        */
        anonymous : function () {
          //hide the logout link
          this.getLogoutLinkMenuChoice().hide();

          this.log('anonymous');
        },
        /**
        * Executed each time the user context switches to coziUser
        */
        coziUser : function () {
          //show the logout link
          this.getLogoutLinkMenuChoice().show();

          this.log('coziUser');
        },
        /**
        * Bind the various UI elements
        */
        setupBindings : function () {
          //bind mobileNavicon click
          this.bindHamburderMenuClick();

          //bind the logout link
          this.bindLogoutMenuItem();

          //bind the my recipe box link
          this.bindMyRecipeBoxMenuItem();

          //bind the my recipe box link
          this.bindShoppingListsMenuItem();

          this.log('setupBindings');
        },
        /**
        * Binds the hamburger menu (hide and show)
        */
        bindHamburderMenuClick : function () {
          $('#mobileNavicon').click(function () {
            $('#newMenuContainer').toggleClass('hidden');
          });

          this.log('bindHamburderMenuClick');
        },
        /**
        * Binds the click of the My Recipe Box menu item
        */
        bindMyRecipeBoxMenuItem : function () {
          var me = this;

          $('#myRecipeBoxMenuItem').click(function () {
            //require authentication
            _mrCoziAppLib.requireAuth(function () {
              window.location.href = '/m/my_recipe_file/?choice=recipes';
            });

            me.log('bindMyRecipeBoxMenuItem-> click');
          });

          this.log('bindMyRecipeBoxMenuItem');
        },
        /**
        * Binds the click of the Shopping List menu item
        */
        bindShoppingListsMenuItem : function () {
          var me = this;

          $('#shoppingListsMenuItem').click(function () {
            me.log('bindShoppingListsMenuItem -> click');

            //require authentication
            _mrCoziAppLib.requireAuth(function () {
              window.location.href = '/m/my_recipe_file/?choice=lists';
            });
          });

          this.log('bindShoppingListsMenuItem');
        },
        /**
        * Binds the logout menu item
        */
        bindLogoutMenuItem : function () {
          var me = this;

          this.getLogoutLinkMenuChoice().click(function () {
            //log the user out
            mrCoziAppLib.logoff();

            //hide the menu
            me.getMenuContainer().addClass('hidden');

            me.log('bindLogoutMenuItem -> log out click');
          });

          this.log('bindLogoutMenuItem');
        },
        /**
        * Returns the menu container element
        */
        getMenuContainer : function () {
            this.log('getMenuContainer');

            return $('#newMenuContainer');
        },
        /**
        * Sets up the menu
        */
        setupMenu : function () {
            //inject the HTML
            this.injectMenuHtml();

            this.log('setupMenu');
        },
        /**
        * Shows the legacy mobile menu
        */
        showLegacyMobileMenu : function () {
          var cssString = '';

          cssString = [
            '#bodyMainHeader.header-main.container .nav-main #block-ti-lsg-mr-core-mr-legacy-mobile-menu.block-ti-lsg-mr-core-mr-legacy-mobile-menu.block.block-ti-lsg-mr-core {display: block !important;}'
          ].join('');

          $('body').append('<style>' +  cssString + '</style>');

          this.log('showLegacyMobileMenu');
        },
        /**
        * Returns the logout menu item
        */
        getLogoutLinkMenuChoice : function () {
            this.log('getLogoutLinkMenuChoice');

            return $('#newMenuContainer .newMenuItem.signOut');
        },
        /**
        * Handles DOM setup tasks
        */
        domSetup : function () {
          //show the legacy mobile menu
          $('#bodyMainHeader #block-ti-lsg-mr-core-mr-legacy-mobile-menu').css({'display' : 'block'});

          //add new mobile navicon
          $('header').first().find('.header-top').prepend('<a id="mobileNavicon"></a>');

          this.log('domSetup');
        },
        /**
        * Add ID attributes to old menu items so that they can be accessed more efficiently
        */
        addIdsToOldMenuElements : function () {
          var me = this,
            $body = $('body'),
            $header = $body.find('header').first();

          //header
          $body.attr('id', 'bodyMain');
          $header.attr('id', 'bodyMainHeader');
          $header.find('.logo').attr('id', 'bodyMainHeaderLogo');

          //my recipe file
          $('#menu .menu .subMenu .links a').each(function () {
            if ($(this).text() === 'My Recipe File'){
              $(this).attr('id', 'myRecipeFileLink');
              me.log('>> found: myRecipeFileLink');
            }
          });

          this.log('utils.addIdsToOldMenuElements');
        },
        /**
        * Injects the hamburger menu into the page
        */
        injectMenuHtml : function () {
          var $menuContainer = this.menuContainer();

          //inject the hambuger menu container
          $('#bodyMainHeader').append($menuContainer);

          //for each menu item in the hidden legacy menu,
          //re-create that item, using the original attributes
          $('#menu2 .links a').each(function (index) {
            var $me = $(this),
              linkTxt = $me.text(),
              idText = linkTxt.replace(' ', ''),
              elementId = 'shadowElement_' + idText,
              elementIdForjQuery = '#' + elementId,
              targetElementId = elementId + '_ORIGINAL',
              htmlString = '',
              myHref = $me.attr('href'),
              myOnclick = $me.attr('onclick');

            //give the original element an ID
            $me.attr('id', targetElementId);

            //build the new menu item, using attributes from the legacy menu item
            htmlString = '<li id="' + elementId + '" class="newMenuItem shadowElement"><a href="' +  myHref +  '" onclick="' + myOnclick + '">' + linkTxt + '</a></li>';

            //inject the new menu item into the hamburger menu, in reverse order
            $('#newMenuItemsList').prepend(htmlString);
          });

          this.log('injectMenuHtml');
        },
        /**
        * Returns the HTML for the hamburger menu container
        */
        menuContainer : function () {
            this.log('menuContainer');

            return [
                '<div id="newMenuContainer" class="hidden">',
                '<ul id="newMenuItemsList">',
                  '<li class="newMenuItem shadowElement myRecipeFile" id="myRecipeBoxMenuItem">My Recipe Box</li>',
                  '<li class="newMenuItem shadowElement shoppingList" id="shoppingListsMenuItem">Shopping List</li>',
                  '<li class="newMenuItem shadowElement OurMagazines"><a href = "https://subscription.timeinc.com/storefront/link/1023793.html">Our Magazines</a></li>',
                  '<li class="newMenuItem shadowElement signOut">Sign Out</li>',
                '</ul>',
                '</div>'
            ].join('');
        },
        /**
        * Custom CSS for the hamburger menu
        */
        getCssText : function () {
            this.log('getCssText');

            return [
              //'header{position:relative;width:312px}',
              '#bodyMainHeaderLogo{position:relative;top:2px;}',
              '#menu{position:relative;}',
              '#menu .menu,#menu2,#menu2.enabled{display:none!important;}',
              '#mobileNavicon{font-size:32px;text-rendering: geometricPrecision;background-color:#AF0800;color:#fff;padding:0 5px;}',
              '#mobileNavicon:hover{cursor:pointer;}', '#menu .menu,#menu2,#menu2.enabled{display:none!important;}',
              '#bodyMain #ad300x50{margin:0 auto 20px!important;}',
              '#bodyMain header .srch #searchbox{width:260px;}',
              '#menu .username{position:absolute;width:80px;right: -5px;z-index:10000;}',
              '#mobileNavicon,#bodyMain header .logo{display:inline-block;}',
              '#mobileNavicon{background-color:#af0800;color:#fff;font-size:32px;padding:18px 30px 25px 20px}',
              '#mobileNavicon:before{background:none repeat scroll 0 0 #fff;box-shadow:0 .25em 0 .1px #fff,0 .5em 0 .1px #fff;content:\'\';font-weight:bold;height:0.097em;left:12px;position:absolute;top:0.35em;width:.7em}',
              '#bodyMainHeaderLogo,#bodyMainHeaderLogo a{float:none;}',
              '#user_status .username,#user_status .signIn,#menu .signIn{display:none;}',
              '#bodyMainHeader .srch{margin-top:-25px;}',
              '#newMenuContainer{position:absolute;width:260px;z-index:1000;height:auto;top:55px;margin:0 auto;background-color:rgba(255, 255, 255, 0.95);}',
              '#newMenuContainer.hidden{display:none;}',
              '#newMenuItemsList{padding:5px;border:4px solid #f2f2f2;}',
              '#newMenuItemsList, #newMenuItemsList li{list-style-type:none;margin:0;padding:0}',
              '#newMenuItemsList li.newMenuItem{font-size:18px;font-weight:bold;border-top:1px solid #ccc;}',
              '#newMenuItemsList li.newMenuItem a{display:block;line-height:30px;padding:5px;color:#000;}',
              '#newMenuItemsList li.newMenuItem.myRecipeFile, #newMenuItemsList li.newMenuItem.shoppingList, #newMenuItemsList li.newMenuItem.writeReview, #newMenuItemsList li.newMenuItem.editZipStores, #newMenuItemsList li.newMenuItem.signOut{line-height:30px;padding:9px;}',
              '#newMenuItemsList li.newMenuItem:first-child{border-top:none;}',
              '#newMenuItemsList .newMenuItem.shadowElement.shoppingList{width:auto!important;}',
              '#newMenuItemsList li.newMenuItem:hover, #newMenuItemsList li.newMenuItem.selected{cursor:pointer;background-color:#999;color:#fff;}',
              '#newMenuItemsList li.newMenuItem.shadowElement.signOut{display:none;}',
              '#bodyMainHeader .arrow_box{position:absolute;width:275px;height:180px;background:#fff;border:1px solid #bbb;top:45px;z-index:1000;}',
              '#bodyMainHeader .arrow_box {position: absolute;background: #fff;border: 1px solid #bbb;}',
              '#bodyMainHeader .arrow_box:after, .arrow_box:before {bottom: 100%;left: 23px;border: solid transparent;content: \' \';height: 0;width: 0;position: absolute;pointer-events: none;}',
              '#bodyMainHeader  .arrow_box:after {border-color: rgba(255, 255, 255, 0);border-bottom-color: #fff;border-width: 15px;margin-left: -15px;}',
              '#bodyMainHeader  .arrow_box:before {border-color: rgba(187, 187, 187, 0);border-bottom-color: #bbb;border-width: 16px;margin-left: -16px;}',
              '#newMenuCookiedMessage{display:none;padding-top:25px;padding-left:20px;font-size:18px;}',
              '#newMenuCookiedMessage .header{margin-bottom:10px;font-weight:700;font-size:20px}',
              '#newMenuCookiedMessage .deck{margin-bottom:10px}',
              '#newMenuCookiedMessage .closeButton{display:block;width:120px;margin:20px auto 0;padding:10px;text-align:center;background-color:#d81f00;line-height:18px;color:#fff;text-transform:uppercase}',
              '#newMenuCookiedMessage .closeButton:hover{cursor:pointer}'
            ].join('');
        }
    };

    /**
    * FEATURE: The login dialog
    */
    _utils.features.all_loginDialog = {
        type : 'all',
        name : 'loginDialog',
        /**
        * Initializes the feature
        */
        initialize : function () {
            var me = this,
              $menuContainer = this.getMenuContianer();

            //add the custom css
            mrTools.addNewStylesheet(this.getCssText());

            //bind the coziAuthorizationReqired event
            _mrTools.bindEvent(_mrCoziAppLib.utils.constants.EVENT_COZI_AUTHORIZATION_REQUIRED, function () {
                _logger.info('EVENT: coziAuthorizationReqired');

                me.showLoginDialog();
            });

            //inject the login dialog background
            $('body').append($(this.getLoginDialogBackgroundHtml()));

            //inject the user id container
            $menuContainer.append($(this.getUserIdLinkHtml()));

            //inject the sub-menu
            $menuContainer.append($(this.getSubMenuHtml()));

            //inject the login dialog
            this.getUserStatusElement().append($(this.getLoginDialogHtml()));

            //setupBindings
            this.setupBindings();

            this.log('initialize');
        },
        /**
        * Executed each time the user context switches to anonymous
        */
        anonymous : function () {
            //hide the user name link
            this.getUserNameLink().hide();

            //empty the username link content
            this.getUserNameLink().find('.userName').html('');

            //show the login link
            this.getSignInLink().show();

            this.log('anonymous');
        },
        /**
        * Executed each time the user context switches to coziUser
        */
        coziUser : function () {
          var me = this;

          //hide the login link
          this.getSignInLink().hide();

          //get the account info for the current user
          _mrCoziAppLib.cozi.auth.getAccountInfo(function (jsonData) {
            if (!jsonData || !jsonData.adults || !jsonData.adults[0]) {
              me.log('_mrCoziAppLib.cozi.auth.getAccountInfo -> problem with account data. EXITING.');

              //exit
              return;
            }

            //show the user name for the current user
            me.getUserNameLink().find('.userName').html(jsonData.adults[0].name);

            //show the username link
            me.getUserNameLink().show();
          });

          this.log('coziUser');
        },
        /**
        * Setup event bindings for this features UI elements
        */
        setupBindings : function () {
            var me = this;

            $('#user_status .overlayToggleLink').click(function () {
              //trigger the event that shows the login dialog
              _mrTools.triggerEvent(_mrCoziAppLib.utils.constants.EVENT_COZI_AUTHORIZATION_REQUIRED);
            });

            $('#loginDialogBackground').click(function () {
                me.hideLoginDialog();
            });

            //registration
            $('#mrCoziMobileJoinNowLink').click(function () {
              //hide the log in dialog
              me.hideLoginDialog();

              //trigger the event that shows the registration dialog
              _mrTools.triggerEvent(_mrCoziAppLib.utils.constants.EVENT_COZI_REGISTRATION_REQUESTED);
            });

            //login button
            this.getSubmitButton().click(function () {
              //hide any previous error messages
              me.getLoginFailureErrorContainer().hide();

              //show loading mode
              me.startLoadingMode();

              //attempt cozi login
              mrCoziAppLib.logon({
                username: me.getUserNameInput().val(),
                password: me.getPasswordInput().val(),
                success: function (jsonData) {
                  me.log('mrCoziAppLib.logon -> SUCCESS').dir(jsonData);;

                  //hide loading mode
                  me.stopLoadingMode();

                  //hide the login dialog
                  me.hideLoginDialog();
                },
                error: function (errorObj) {
                  me.log('>> mrCoziAppLib.logon -> ERROR.').dir(errorObj);

                  //hide loading mode
                  me.stopLoadingMode();

                  //show the login error message
                  me.getLoginFailureErrorContainer().show();
                }
              });
            });

          this.log('setupBindings');
        },
        /**
        * Updates UI for when the authenticaion AJAX call is in-progress
        */
        startLoadingMode : function () {
            //hide the submit button
            this.getSubmitButton().hide();

            //show the ajax spinner
            this.getAjaxSpinner().show();

            this.log('startLoadingMode');
        },
        /**
        * Updates UI for when the authenticaion AJAX call has stopped
        */
        stopLoadingMode : function () {
            //show the submit button
            this.getSubmitButton().show();

            //hide the ajax spinner
            this.getAjaxSpinner().hide();

            this.log('stopLoadingMode');
        },
        /**
        * Shows the login dialog
        */
        showLoginDialog : function () {
            //empty the form inputs
            this.getUserNameInput().val('');
            this.getPasswordInput().val('');

            //show the login dialog and modal background
            $('#loginDialog').show();
            $('#loginDialogBackground').show();

            this.log('showLoginDialog');
        },
        /**
        * Hides the login dialog
        */
        hideLoginDialog : function () {
            //hide the login dialog and modal background
            $('#loginDialog').hide();
            $('#loginDialogBackground').hide();

            //hide any previous error messages
            this.getLoginFailureErrorContainer().hide();

            this.log('hideLoginDialog');
        },
        /**
        * Returns the user name input value
        */
        getUserNameInput : function () {
            this.log('getUserNameInput');

            return $('#coziUsernameInput');
        },
        /**
        * Returns the password input value
        */
        getPasswordInput : function () {
            this.log('getPasswordInput');

            return $('#coziPasswordInput');
        },
        /**
        * Returns the submit button
        */
        getSubmitButton : function () {
            this.log('getSubmitButton');

            return $('#coziLogonButton');
        },
        /**
        * Returns the ajax spinner
        */
        getAjaxSpinner : function () {
            this.log('getAjaxSpinner');

            return $('#mrCoziSsoFormAjaxSpinner');
        },
        /**
        * Returns the legacy menu container
        */
        getMenuContianer : function () {
            this.log('getMenuContianer');

            return $('.menu-bar');
        },
        /**
        * Returns the user status element
        */
        getUserStatusElement: function () {
            this.log('getUserStatusElement');

            return $('#user_status');
        },
        /**
        * Returns the sign-in link
        */
        getSignInLink : function () {
            this.log('getSignInLink');

            return $('#user_status .signIn');
        },
        /**
        * Returns the user name link
        */
        getUserNameLink : function () {
            this.log('getUserNameLink');

            return $('#coziUserId');
        },
        /**
        * Returns the error container for the login dialog
        */
        getLoginFailureErrorContainer : function () {
            this.log('getLoginFailureErrorContainer');

            return $('#mrCoziSsoFailedCredsMsg');
        },
        /**
        * Custom CSS for this feature
        */
        getCssText : function () {
            this.log('getCssText');

            return [
                '#loginDialog{display:none;}',
                '#loginDialogBackground{position:fixed;display:none;background-color:black;width:100%;height:100%;left:0;top:0;opacity:0.6;z-index:9999;}',
                '#loginDialogBackground:hover{cursor:pointer;}',
                //login error
                '#mrCoziSsoFailedCredsMsg{display:none;color: #cc0000;}',
                //ajax spinner
                '#mrCoziSsoFormAjaxSpinner{display:none;width:128px;margin:0 auto;}',
                //user ID link
                '#coziUserId{position: absolute;display:none;width: 80px;padding-left: 4px;top: 3px;right: 0;color: #af0800;z-index: 999999;}'
            ].join('');
        },
        /**
        * Returns the HTML for the user name link
        */
        getUserIdLinkHtml : function () {
            this.log('getUserIdLinkHtml');

            return [
                '<a href="/m/my_recipe_file/" id="coziUserId">',
                    '<span class="greeting">Hi </span>',
                    '<span class="userName"></span>',
                '</a>'
            ].join('');
        },
        /**
        * Returns the HTML for the login modal background
        */
        getLoginDialogBackgroundHtml : function () {
          this.log('getLoginDialogBackgroundHtml');

          return '<div id="loginDialogBackground"></div>';
        },
        /**
        * Returns the HTML for the legacy sub-menu
        */
        getSubMenuHtml : function () {
            this.log('getSubMenuHtml');

            return [
                '<div id="user_status">',
                    '<div class="signIn" style="display: block;"><a href="#" class="overlayToggleLink">Sign In</a>',
                '</div>'
            ].join('');
        },
        /**
        * Returns the HTML for the login modal dialog
        */
        getLoginDialogHtml : function () {
            this.log('getLoginDialogHtml');

            return [
            '<div id="loginDialog" class="subMenu-signIn">',
                '<h4>Sign in to your MyRecipes account</h4>',
                '<p style="font-size:16px;">Not a member yet? <a class="joinNow" id="mrCoziMobileJoinNowLink" href="#" style="font-size:16px;">Join Now.</a></p>',
                '<div class="errors"></div>',
                '<div id="mrCoziSsoFailedCredsMsg" class="row">',
                    '<p class="msg">Login failed. Please check your email address and password.</p>',
                '</div>',
                '<ul>',
                    '<li>',
                    '<label for="coziUsernameInput">Email</label>',
                    '<input type="text" name="coziUsernameInput" id="coziUsernameInput" value="">',
                    '</li>',
                    '<li>',
                    '<label for="coziPasswordInput">Password <span>(Must be at least 8 characters)</span></label>',
                    '<input type="password" name="coziPasswordInput" id="coziPasswordInput" value="">',
                    '</li>',
                    '<li class="forgotPassword"><a href="/m/profile/forgot_password/">Forgot Password?</a></li>',
                    '<li><div id="mrCoziSsoFormAjaxSpinner"><img src="http://img2-2.timeinc.net/toh/i/r/ajax-loader-horizontal-bars.gif"></div></li>',
                    '<li>',
                    '<input type="submit" value="Sign In" id="coziLogonButton">',
                    '</li>',
                '</ul>',
                '<div class="callout"></div>',
            '</div>'
            ].join('');
        }
    };

    /**
    * FEATURE: Cozi registration modal dialog
    */
    _utils.features.all_registrationDialog = {
        type : 'all',
        name : 'registrationDialog',
        dialogInjected : false,
        visibilityClass : 'visible',
        credentials : {},
        dialogContainerCssId : 'mrCoziMobileJoinNowForm',
        dialogContainerjQuerySelector : function(){return '#' + this.dialogContainerCssId; },
        /**
        * Initializes the feature
        */
        initialize : function () {
          var me = this;

          _mrTools.bindEvent(mrCoziAppLib.utils.constants.EVENT_COZI_REGISTRATION_REQUESTED, function(){
            me.showDialog();
          });

          this.log('initialize');
        },
        /**
        * Injects the registration dialog
        */
        injectDialog : function () {
          var $dialog = $(this.getHtml()),
            $mainContent = $('#main-content'),
            $content = $('#content');

          //add the custom CSS
          mrTools.addNewStylesheet(this.getCss());

          //injet dialog here
            if ($mainContent.length) {
              //Drupal pages
                $mainContent.append($dialog);
            } else if ($content.length){
              //KA pages
              $content.prepend($dialog);
            }

          //set a flag that the dialog has already been injected
          this.dialogInjected = true;

          //bind the UI controls for this feature
          this.bindDialogControls();

          this.log('injectDialog');
        },
        /**
        * Shows the registration modal dialog
        */
        showDialog : function () {
          //collapse the hamburger menu
          $('#newMenuContainer').addClass('hidden');

          //hide the main content
          $('.region.region-content').hide();

          //restore the main content
          $('.region.region-content').hide();

          //hide the share save bar so the register form is easier to use
          $('#saveShareNextBar').hide();

          //if the registration dialog has not already been injected
          if (!this.dialogInjected) {
            //inject the registration modal dialog
            this.injectDialog();
          }

          //show the registration modal dialog
          this.getDialogContainer().addClass(this.visibilityClass);

          this.log('showDialog');
        },
        /**
        * Hides the registration modal dialog
        */
        hideDialog : function () {
            //restore the main content
            $('.region.region-content').show();

            //restore the share save bar
            $('#saveShareNextBar').show();

          this.getDialogContainer().removeClass(this.visibilityClass);
          this.resetDialogFull();

          this.log('hideDialog');
        },
        /**
        * Returns the registration modal dialog container
        */
        getDialogContainer : function () {
          this.log('getDialogContainer');

          return $(this.dialogContainerjQuerySelector());
        },
        /**
        * Returns the registration modal submit button
        */
        getSubmitButton : function () {
          this.log('getSubmitButton');

          return $('#coziMobileRegistrationSubmitButton');
        },
        /**
        * Returns the registration modal ajax spinner GIF
        */
        getAjaxLoaderContainer : function () {
          this.log('getAjaxLoaderContainer');

          return this.getDialogContainer().find('.ajaxLoaderContainer');
        },
        /**
        * Re-sets any existing UI error message
        */
        resetErrorMessages : function () {
          this.getDialogContainer().find('.errorContainer').hide();
          this.getDialogContainer().find('.errorContainer .msg').html('');

          this.log('resetErrorMessages');
        },
        /**
        * Re-sets the registration modal dialog after failed registration attempt
        */
        resetDialogPartial : function () {
          var me = this;

          setTimeout(function () {
            me.getAjaxLoaderContainer().hide();
            me.getSubmitButton().show();
          }, 1000);

          this.log('resetDialogPartial');
        },
        /**
        * Re-sets the registration modal dialog after successful registration attempt
        */
        resetDialogFull : function () {
          var me = this;

          setTimeout(function () {
            me.getDialogContainer().find('.checks').show();
            me.getSubmitButton().show();
            me.getDialogContainer().find('.#mrCoziMobileRegStatusMessage .message').hide();
            me.getAjaxLoaderContainer().hide();
            me.getDialogContainer().find('h2').show();
            me.getDialogContainer().find('input[type="text"], input[type="password"]').val('');
            me.resetErrorMessages();
          }, 1000);

          this.log('resetDialogFull');
        },
        /**
        * Event handler for the registration modal dialog submit button (registers a user)
        */
        registerUser : function () {
          var me = this,
            creds = this.credentials;

          //show the in-progress status message
          this.getDialogContainer().find('#mrCoziMobileRegStatusMessage .message').show();

          mrCoziAppLib.cozi.auth.createAccount({
            email : creds.email,
            password : creds.password,
            name : creds.name,
            postalCode : creds.postalCode,
            success : function (jsonData) {
              //update the UI to indicate account creation succeeded
              me.getDialogContainer().find('.greenCheckContainer').show();
              me.getDialogContainer().find('.satusMessage p').text('Account created. Logging in.');

              //log the new user in
              me.handleRegistrationSuccess(jsonData);

              me.log('create account: SUCCESS').dir(jsonData);
            },
            error : function (err) {
              me.log('>> create account: ERROR.').dir(err);

              //re-set the dialog for failed registration attempt
              me.resetDialogPartial();

              me.getDialogContainer().find('#mrCoziMobileRegStatusMessage .message').hide();
              me.getDialogContainer().find('#mrCoziSsoFailedCredsMsg').show();
              me.getDialogContainer().find('#mrCoziSsoFailedCredsMsg .msg').html('<p>There was an error creating your account. Please check the email address.</p>');
            }
          });

          this.log('registerUser');
        },
        /**
        * Event handler for successful user registration
        */
        handleRegistrationSuccess : function () {
          var me = this,
            creds = this.credentials;

          mrCoziAppLib.logon({
            username : creds.email,
            password : creds.password,
            success : function (jsonData) {
              me.log('mrCoziAppLib.logon -> SUCCESS.').dir(jsonData);

              //update the UI
              me.getDialogContainer().find('.satusMessage').hide();
              me.getAjaxLoaderContainer().hide();
              me.hideDialog();
            },
            error: function (errorObj) {
              me.log('mrCoziAppLib.logon -> ERROR.').dir(errorObj);
            }
          });

          this.log('handleRegistrationSuccess');
        },
        /**
        * Bind the UI controls
        */
        bindDialogControls : function () {
          var me = this;

          //bind the registration modal dialog submit button
          this.getSubmitButton().click(function (evt) {
            evt.preventDefault();
            evt.stopPropagation();

            //validate the form
            me.validateForm();
          });

          this.log('bindDialogControls');
        },
        /**
        * Validate the registration modal dialog forms
        */
        validateForm : function () {
          var me = this,
              emailRegExp = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/igm,
              nameRegExp = /^[a-zA-Z0-9]{3,15}$/,
              zipRegExp = /^[0-9a-zA-Z]{1,1}[-\sA-Za-z0-9]{0,8}$/,
              passwordRegExp = /^[a-zA-Z0-9]{8,}$/,
              errorMessages = [],
              $errorMessage = this.getDialogContainer().find('#mrCoziSsoFailedCredsMsg'),
              thisUsername = $('#coziUsernameInput_new').val(),
              thisPassword = $('#coziPasswordInput_new').val(),
              thisPasswordConfirmation = $('#coziPasswordInput_new_CONFIRM').val(),
              thisName = $('#coziName_new').val(),
              thisPostalCode = $('#coziZipInput_new').val(),
              valArrayEmailExists = [!!thisUsername && (thisUsername !== '')],
              valArrayEmailIsValid = [(emailRegExp.test(thisUsername))],
              valArrayPasswordExists = [(!!thisPassword && (thisPassword !== ''))],
              valArrayPasswordIsValid = [(passwordRegExp.test(thisPassword))],
              valArrayPasswordsMatch = [(thisPassword === thisPasswordConfirmation)],
              valArrayZipExists = [(!!thisPostalCode),(thisPostalCode !== '')],
              valArrayZipIsValid = [(zipRegExp.test(thisPostalCode))],
              valArrayNameExists = [(!!thisName),(thisName !== '')],
              valArrayNameIsValid = [(nameRegExp.test(thisName))],

              emailExists = _mrTools.validateForm(valArrayEmailExists),
              emailIsValid = _mrTools.validateForm(valArrayEmailIsValid),
              passwordExists = _mrTools.validateForm(valArrayPasswordExists),
              passwordIsValid = _mrTools.validateForm(valArrayPasswordIsValid),
              passwordsMatch = _mrTools.validateForm(valArrayPasswordsMatch),
              zipExists = _mrTools.validateForm(valArrayZipExists),
              zipIsValid = _mrTools.validateForm(valArrayZipIsValid),
              nameExists = _mrTools.validateForm(valArrayNameExists),
              nameIsValid = _mrTools.validateForm(valArrayNameIsValid);

              //hide the title and checks
              this.getDialogContainer().find('.checks').hide();
              this.getDialogContainer().find('h2').hide();

              //hide any previous error messages
              $errorMessage.hide();
              $errorMessage.find('.msg').html('');

          //form validation
          if (!nameExists) {
            errorMessages.push('<p>Please fill in your member name.</p>');
          }

          if (nameExists && !nameIsValid) {
            errorMessages.push('<p>This member name must be 6-15 alphanumeric characters (A-Z,a-z,0-9, no spaces).</p>');
          }

          if (!emailExists) {
            errorMessages.push('<p>Please fill in your email address.</p>');
          }

          if (emailExists && !emailIsValid) {
            errorMessages.push('<p>Invalid email address. Address must be in the format \'name@domain.com\'.</p>');
          }

          if (!passwordExists) {
            errorMessages.push('<p>Please enter a password.</p>');
          }

          if (passwordExists && !passwordIsValid) {
            errorMessages.push('<p>Invalid password. Passwords are case sensitive and must be at least 8 characters long.</p>');
          }

          if (passwordExists && !passwordsMatch) {
            errorMessages.push('<p>Your passwords entered do not match. Please try again.</p>');
          }

          if (!zipExists) {
            errorMessages.push('<p>Please fill in your Postal Code.</p>');
          }

          if (zipExists && !zipIsValid) {
            errorMessages.push('<p>Please fill in a valid Postal Code.</p>');
          }

          if (errorMessages.length) {
            $(errorMessages).each(function (index, message) {
              $errorMessage.find('.msg').append(message);
            });

            $errorMessage.fadeIn();
            return;
          }

          this.getDialogContainer().find('.formContainer .formField').hide();
          this.getDialogContainer().find('.checks').hide();

          this.getSubmitButton().fadeOut(800, function () {
            me.getDialogContainer().find('#mrCoziMobileRegStatusMessage').show();
            me.getAjaxLoaderContainer().show();
          });

          //create the credentials object for the registerUser method
          this.credentials = {
            email : thisUsername,
            password : thisPassword,
            name : thisName,
            postalCode : thisPostalCode
          };

          //register the user
          this.registerUser(this.credentials);

          this.log('validateForm');
        },
        /**
        * Returns the HTML for the registration modal dialog
        */
        getHtml : function () {
          this.log('getHtml');

          return [
            '<div class="joinNow" id="mrCoziMobileJoinNowForm">',
                 '<div id="mrCoziMobileRegStatusMessage" style="display:none;">',
                   '<p class="message"><b style="color:#333;font-size: 22px;">Creating your account</b></p>',
                  '<div class="ajaxLoaderContainer">',
                   '<img src="http://img2-2.timeinc.net/toh/i/r/ajax-loader-horizontal-bars.gif">',
                   '</div>',
                   ('<img src="'   + _utils.constants.GREEN_CHECK_URL  + '" class="check" style="display:none;margin: 20px auto;width:50px;">'),
                 '</div>',
                 '<div id="mrCoziMobileJoinNowForm_header">',
                 '<h2>Join MyRecipes for FREE and...</h2>',
                   '<ul class="checks">',
                     '<li>Save your favorite recipes from MyRecipes AND anywhere on the web</li>',
                     '<li>Access shopping lists on the go</li>',
                     '<li>Drag and drop recipes from your recipe box to create a weekly mean plan</li>',
                     '<li>Share dinner ideas and other events with your family using the shared family calendar</li>',
                   '</ul>',
                 '<div>',
                 '<form id="joinNowForm">',
                   '<div style="margin:0;padding:0;display:inline">',
                   '</div>',
                   '<ul id="mrCoziMobileJoinNowForm_ul">',
                       '<li>',
                           '<label for="coziName_new">User Name (for public display)</label>',
                           '<input type="text" id="coziName_new" name="coziName_new">',
                      ' </li>',
                      ' <li>',
                           '<label for="coziUsernameInput_new">Email Address</label>',
                          ' <input type="text" id="coziUsernameInput_new" name="coziUsernameInput_new">',
                       '</li>',
                       '<li>',
                          ' <label for="coziPasswordInput_new">Password (Must be at least 8 characters)</label>',
                           '<input type="password" value="" id="coziPasswordInput_new" name="coziPasswordInput_new">',
                      ' </li>',
                      ' <li>',
                           '<label for="coziPasswordInput_new_CONFIRM">Confirm Password</label>',
                           '<input type="password" value="" id="coziPasswordInput_new_CONFIRM" name="coziPasswordInput_new_CONFIRM">',
                       '</li>',
                       '<li>',
                           '<label for="coziZipInput_new">Postal Code</label>',
                           '<input type="text" maxlength="9" id="coziZipInput_new" name="coziZipInput_new[zip]">',
                       '</li>',
                       '<li>',
                         '<div class="row" id="mrCoziSsoFailedCredsMsg">',
                           '<div class="msg"></div>',
                         '</div>',
                       '</li>',
                       '<li>',
                           '<input type="submit" value="Sign Up" id="coziMobileRegistrationSubmitButton">',
                       '</li>',
                       '<li style="position:relative;">',
                           '<div id="poweredByCozi">',
                           '<p class="label">powered by</p>',
                           ('<img src="'  + _utils.constants.COZI_LOGO_URL + '" class="coziLogo" />'),
                           '</div>',
                       '</li>',
                   '</ul>',
                 '</form>',
             '<div class="privacy_policy">',
                 '<span>We respect your privacy. Read our <a href="http://www.cozi.com/Privacy-Policy.htm" target="_blank">Privacy Policy</a>',
                      '&nbsp;&nbsp;and <a href="http://www.cozi.com/Terms-of-Use.htm" target="_blank">Terms of Service</a>.</span>',
             '</div>',
         '</div>'
          ].join('');
        },
        /**
        * Returns the custom CSS for this feature
        */
        getCss : function () {
          this.log('getCss');

          return [
            '#mrCoziMobileJoinNowForm{display:none;}',
            '#mrCoziMobileJoinNowForm.visible{display:block;}',
            '#mrCoziMobileJoinNowForm .ajaxLoaderContainer{display:none;width:128px;margin:0 auto;}',
            '#mrCoziMobileJoinNowForm #joinNowForm{margin-top: 20px;}',
            '#mrCoziMobileJoinNowForm_header h2{font-size: 18px;}',
            '#mrCoziMobileJoinNowForm_header .checks,#mrCoziMobileJoinNowForm_header .checks li{list-style-type:none;}',
            '#mrCoziMobileJoinNowForm_header .checks li:before{content: "✓";font-size: 28px;font-weight: bold;}',
            '#mrf_shoppingListToutListContainer .shoppingList .slIngredients.mrCozi ul ul li.recipeTitle{background-color: #ededed;padding: 10px;border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;color: #af0800;}',

            '#mrCoziMobileJoinNowForm.joinNow form ul{margin:0 0 15px;padding:0;font-weight:700;list-style:none}',
            '#mrCoziMobileJoinNowForm.joinNow form li{margin:0 0 10px;padding:0;clear:both;text-align:center}',
            '#mrCoziMobileJoinNowForm.joinNow form li:after{display:table;content:"";clear:both}',
            '#mrCoziMobileJoinNowForm.joinNow label{display:block;float:left;padding-bottom:1px;color:#777}',
            '#mrCoziMobileJoinNowForm.joinNow input[type="text"]{width:280px;padding:2px;float:left;border:1px solid #bbb}',
            '#mrCoziMobileJoinNowForm.joinNow input[type="password"]{width:280px;padding:2px;float:left;border:1px solid #bbb}',
            '#mrCoziMobileJoinNowForm.joinNow .privacy_policy{margin:0;padding:0 20px 5px;font-size:11px;text-align:left;color:#666;background:url(http://cdn-image.myrecipes.com/static/i/lock_icon.png) no-repeat}',
            '#mrCoziMobileJoinNowForm.joinNow input[type="submit"]{border-radius:5px;padding:3px 10px;color:#fff;font:bold 12px arial,sans-serif;text-transform:uppercase;background:#c00;border:none;cursor:pointer}',
            '#mrCoziMobileJoinNowForm.joinNow .errors{margin:0 0 10px;padding:5px;background:#fdd;color:#af0800}',
            '#mrCoziMobileJoinNowForm.joinNow .errors ul{margin:0 0 0 20px;font-weight:400;list-style-type:disc}',
            '#mrCoziMobileJoinNowForm.joinNow .errors li{margin:5px 0;text-align:left}',
            '#mrCoziMobileJoinNowForm.joinNow input.error{background:#fdd}'
          ].join('');
        }
    };

    /**
    * FEATURE: Share/save/next bar
    */
    _utils.features.recipe_shareSaveNextFooterBar = {
      type : 'recipe',
      name : 'shareSaveNextFooterBar',
      constants: {
        STANDARD_DELAY : 50,
        PERMALINK: false,
        RECIPE_ID: false
      },
      /**
      * Initializes the feature
      */
      initialize : function(){
        this.log('initialize');

        if (!this.isRecipePage()){this.log('not a recipe page. EXITING.'); return;}

        //setup event bindinds
        this.setupEventBindings();

        //set CSS
        this.setupCss();

        //setup permalink and recipe id values
        this.constants.PERMALINK = mrCoziAppLib.utils.getRecipePermalinkFromUrl();

        this.constants.RECIPE_ID = this.getRecipeId(mrCoziAppLib.utils.getRecipePermalinkFromUrl());

        //setup the DOM
        this.setupDom();
      },
      /**
      * Executed each time the user context switches to anonymous
      */
      anonymous : function(){
        this.log('anonymous');

        _mrTools.triggerEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_RESET);
      },
      /**
      * Executed each time the user context switches to coziUser
      */
      coziUser : function(){
        var me = this;

        this.log('coziUser');

        //make sure this runs last
        setTimeout(function(){
          me.checkIfRecipeAlreadySaved();
        }, 1000);
      },
      /**
      * Returns the save recipe button
      */
      getSaveButton : function(){
        this.log('getSaveButton');

        return $('#saveShareNextBar .saveButton');
      },
      /**
      * Sets-up binding for custom events
      */
      setupEventBindings : function(){
        var me = this;

        this.log('setupEventBindings');

        //triggered when the user clicks the save recipe button
        _mrTools.bindEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_SAVING, function(){
          //update the UI
          me.updateButtonSaving(me.getSaveButton());

          //log the event
          me.log('EVENT: ' + _utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_SAVING);
        });

        //triggered when the user context changes to anonymous
        _mrTools.bindEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_RESET, function(){
          //update the UI
          me.updateButtonReset(me.getSaveButton());

          //log the event
          me.log('EVENT: ' + _utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_RESET);
        });

        //triggered when it is determined that the current recipe has already been saved
        _mrTools.bindEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_ALREADY_SAVED, function(){
          //update the UI
          me.updateButtonSaved(me.getSaveButton());

          //log the event
          me.log('EVENT: ' + _utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_ALREADY_SAVED);
        });
      },
      /**
      * Utility - delays execution of a function
      */
      delay : function(delay,callback){
        this.log('delay');

        if (!callback || !(callback instanceof Function)){return; }

        delay = delay || this.constants.STANDARD_DELAY;

        setTimeout(callback, delay);
      },
      /**
      * Sends an omniture report
      */
      omnitureReport : function(message){
        this.log('omnitureReport');

        if (!window.omniCommunityTracker || !message){return; }

        window.omniCommunityTracker(message);
      },
      /**
      * Binds the save recipe button
      */
      bindSaveButton : function(message){
        var me = this;

        this.log('bindSaveButton');

        this.getSaveButton().click(function(){
            //this requires authentication
            mrCoziAppLib.requireAuth(function(){
            //save the recipe
            me.saveRecipe();
          });
        });
      },
      /**
      * Re-sets save recipe button
      */
      updateButtonReset : function($element){
        this.log('updateButtonReset');

        $element
          .unbind()
          .removeClass('saving')
          .removeClass('saved')
          .removeClass('noPointer')
          .html('<b class="buttonText"><i>+</i>Save</b>');

        //setup binding
        this.bindSaveButton();

        return this;
      },
      /**
      * Updates save recipe button while the save is in-progress
      */
      updateButtonSaving : function($element){
        this.log('updateButtonSaving');

        $element
          .addClass('saving')
          .html('<i>Saving...</i>');

        return this;
      },
      /**
      * Updates save recipe button after the save has succeeded
      */
      updateButtonSaved : function($element){
        this.log('updateButtonSaved');

        $element
          .removeClass('saving')
          .addClass('noPointer')
          .addClass('saved')
          .unbind()
          .removeAttr('href')
          .html('<i>Saved!</i>');

        return this;
      },
      /**
      * Handles DOM-setup tasks
      */
      setupDom : function(){
        this.log('setupDom');

        //inject the saveShareNextBar into the DOM
        $('body').prepend(this.getSaveShareNextBar());

        //setup the next button
        this.setupNextButton();

        //setup the next share buttons
        this.setupShareButtons();

        //addCustomCssFixes
        this.addCustomCssFixes();
      },
      /**
      * Creates the next button (next recipe)
      */
      setupNextButton : function(){
        var me = this,
          $newNextLink = null,
          $oldNextLink = null,
          oldNextLink = $('.pane-ti-lsg-mr-recipe-recipes-related .node--tout h4 a')[0];

        this.log('setupDom');

        if ($(oldNextLink).length){
          $oldNextLink = $(oldNextLink);

          $oldNextLink.attr('id','oldNextLink');

          $newNextLink = $('#saveShareNextBar .nextButton');

          $newNextLink.click(function(){
            //send the omniture report
            me.omnitureReport('next-bottom-bar');

            //wait one second so that the omniture report completes
            me.delay(1000,function(){
              //follow the hyperlink
              window.location.href = $oldNextLink.attr('href');
            });
          })

          //set the title attribute
          $newNextLink.attr('title', $oldNextLink.text())

          //show the next recipe link
          $newNextLink.show();
        }
      },
      /**
      * Sets-up social sharing buttons
      */
      setupShareButtons : function(){
        var $oldFb = $('.share .facebook a'),
          $oldPinterest = $('.share .pinit a'),
          $newFb = $('#saveShareNextBar img.facebookLink').parent(),
          $newPinterest = $('#saveShareNextBar img.pinterestLink').parent();

        this.log('setupShareButtons');

        if (!$oldFb.length || !$oldPinterest.length){return; }

        $newFb
          .attr('href',$oldFb.attr('href'))
          .attr('onclick','omniCommunityTracker("share-fb-bottom-bar")');

        $newPinterest
          .attr('href', $oldPinterest.attr('href'))
          .attr('onclick','omniCommunityTracker("pin-it-bottom-bar")');
      },
      /**
      * Returns the ID of the recipe
      */
      getRecipeId : function(permalink){
        var permalinkPattern = /.+\/recipe\/.+-\d+\//,
          retVal = false,
          match = false;

        this.log('getRecipeId');

        if(!permalink || typeof permalink != 'string'){return; }

        match = permalink.match(/\d{1,}/);

        if(match){
          retVal = match[0];
        }

        return retVal;
      },
      /**
      * Determines if the current page is a recipe page
      */
      isRecipePage : function(){
        var is404 = ( $('meta[name=ctype]').length &&  $('meta[name=ctype]').attr('content') === '404-page'),
          pattern = /myrecipes.(local|com)\/m\/recipe\//,
          loc = window.location.href,
          retVal = false;

        this.log('isRecipePage');

        if (loc.match(pattern) && ( loc.indexOf('/images') === -1) && !is404){
          retVal = true;

          this.log('>> this is a recipe page');
        } else {
          this.log('>> this is not a recipe page.');
        }

        return retVal;
      },
      /**
      * Add CSS tweaks
      */
      addCustomCssFixes : function(){
        this.log('addCustomCssFixes');

        if (navigator.userAgent.indexOf('Android') > -1){
          this.log('>> user agent is android browser');

          $('#saveShareNextBar .container .nextButton').css({'right' : '-100px'});
        }
      },
      /**
      * Returns the HTML for the save share next bar
      */
      getSaveShareNextBar : function(){
        this.log('getSaveShareNextBar');

        return [
          '<div id="saveShareNextBar">',
          '<div class="container">',
          '<span class="saveButton"><b class="buttonText"><i>+</i>Save</b></span>',
          ('<a target="_blank"><img class="pinterestLink" src="' + _utils.constants.PINTEREST_LOGO_URL + '"></a>'),
          ('<a target="_blank"><img class="facebookLink" src="' + _utils.constants.FACEBOOK_LOGO_URL + '"></a>'),
          '<span class="nextButton"><b class="buttonText">Next&nbsp;</b></span>',
          '</div>',
          '</div>'
        ].join('');
      },
      /**
      * Determines if the current recipe has already been saved
      */
      checkIfRecipeAlreadySaved : function () {
        var me = this,
          thisRecipe = window.recipe,
          winLocationHref = window.location.href.replace('/m', ''),
          recipeFound = false;

        this.log('checkIfRecipeAlreadySaved');

        //remove the query string and hash
        winLocationHref = winLocationHref.replace(window.location.search, '');
        winLocationHref = winLocationHref.replace(window.location.hash, '');

        //ascyncronously fetch all of the currently saved recipes
        mrCoziAppLib.getAllCoziRecipes(function(jsonData){
          //iterate through all of the currently saved recipes
          $.each(jsonData, function(index, recipe){
            var recipeUrlIsValid = false;

            //very helpful for debugging
            me.log('>> checking: ' + recipe.sourceUrl + ' vs: ' + winLocationHref);
            _logger.dir(recipe);

            recipeUrlIsValid = (recipe.sourceUrl && recipe.sourceUrl.length && recipe.sourceUrl.indexOf('http') > -1 && winLocationHref === recipe.sourceUrl);

            if(recipeUrlIsValid){
              me.log('>> match found.');
              recipeFound = true;
            }
          });

          //if the above check determines that the recipe was already saved
          if (recipeFound){
            //trigger the recipe already saved change event
            _mrTools.triggerEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_ALREADY_SAVED);
          } else {
            //trigger the save button re-set event (which sets-up the button for saving)
            _mrTools.triggerEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_RESET);
          }
        });
      },
      /**
      * Saves the current recipe
      */
      saveRecipe : function () {
        var me = this,
          rec = {},
          $el = this.getSaveButton();

        //trigger the saving event, which updates the UI
        _mrTools.triggerEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_SAVING);

        //make the async call to get the data for this recipe
        mrCoziAppLib.getAsyncRecipe({
          id : mrCoziAppLib.utils.getRecipePermalinkFromUrl(),
          callback : function(jsonData){
            //if there are errors from the async recipe data call
            if (jsonData.errors){
              _logger.warn('>> error returned my async recipe call:').dir(jsonData);

              //trigger the button re-set event
              _mrTools.triggerEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_RESET);

              //exit
              return
            }

            //for debugging
            me.log('>> getAsyncRecipe:')
            _logger.dir(jsonData);

            //create the recipe object
            rec = mrCoziAppLib.createRecipeObject(jsonData);

            //save the recipe
            mrCoziAppLib.saveRecipeToCozi(function(recipe){
              me.log('>> successfully saved recipe:');
              _logger.dir(recipe);

              //trigger the already saved event (update the button to a "saved" state)
              _mrTools.triggerEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_ALREADY_SAVED);

              //send omniture report
              me.omnitureReport('save-recipetomrf-bottom-bar');
            }, rec);
          }
        });
      },
      /**
      * Adds the custom CSS for this feature to the page
      */
      setupCss : function () {
      this.log('setupCss');

      var cssText = [
        '#menu2.enabled{display:none!important;}',
        'body.recipes #ad300x50{width:320px;margin:0 auto!important;}',
        '#saveShareNextBar{position:fixed;bottom:0;width:100%;margin:0 auto;padding-top:10px;z-index:99999;}',
        '#saveShareNextBar .container{width:320px;margin:0 auto;padding: 5px 0 10px;background-color:rgba(255, 255, 255, 0.8);}',
        '#saveShareNextBar .saveButton,#saveShareNextBar .nextButton{height:31px;padding:5px;background-color:rgba(175, 8, 0, 0.7);border-radius:3px;}',
        '#saveShareNextBar .buttonText{font-weight:bold;text-transform:uppercase;color:#fff;}',
        '#saveShareNextBar .saveButton,#saveShareNextBar .nextButton,#saveShareNextBar .pinterestLink,#saveShareNextBar .facebookLink{vertical-align:middle;}',
        '#saveShareNextBar .saveButton i{position:relative;left:-1px;}',
        '#saveShareNextBar .saveButton:hover,#saveShareNextBar .nextButton:hover,#saveShareNextBar .pinterestLink:hover,#saveShareNextBar .facebookLink:hover{cursor:pointer;}',
        '#saveShareNextBar .saveButton.saving{color:#fff;background-color:#006400;}',
        '#saveShareNextBar .saveButton.saved{color:#fff;background-color:#b8b8b8;}',
        '#saveShareNextBar .saveButton.noPointer:hover{cursor:default;}',
        '#saveShareNextBar .saveButton{margin-left: 10px;visibility:visible;}',
        '#saveShareNextBar .container span.nextButton:after{content:"\\25BA\";color:#fff;}',
        '#saveShareNextBar .pinterestLink{margin: 0 15px 0 10px;}',
        '#saveShareNextBar .nextButton{position:relative;right:-113px;}',
        '#saveShareNextBar img{width:28px;}'
        ].join('');

        $('body').append('<style>' + cssText + '</style>');
      }
    };

    /**
    * FEATURE: Shows saved shopping lists on the my recipe file page
    */
    _utils.features.mrf_shoppingListToutListContainer = {
      type : 'mrf',
      name : 'mrf_shoppingListToutListContainer',
      alreadyViewedShoppingLists : false,
      /**
      * Initializes the feature
      */
      initialize : function () {
        var me = this,
          $mrCoziMrfPageShoppingListsLink = $('a[href^="/m/r/shopping_lists/"]');

        if(mrTools.env.pageContext.type !== 'mrf'){return; }

        //add custom CSS
        this.addShoppingListCustomCss();

        $('.mrfLinks').after(this.getMainContainer());

        $mrCoziMrfPageShoppingListsLink.attr('id','mrCoziMrfPageShoppingListsLink');
        $mrCoziMrfPageShoppingListsLink.attr('href', '#');

        this.log('initialize');
      },
      /**
      * Executed each time the user context switches to anonymous
      */
      anonymous : function () {
        this.getElement().hide();
        this.removeOldLists();
        this.shoppingListsLink().find('.count').html('(0)');

        this.setupClickHander();

        this.log('anonymous');
      },
      /**
      * Executed each time the user context switches to coziUser
      */
      coziUser : function () {
       this.setupClickHander();

        //if shopping lists was requested in the query string, show it
        if (window.location.search && (window.location.search.indexOf('choice=lists') > - 1)) {
          $('.mrfLinks h3').hide();
          this.renderAllLists();
        } else {
          //otherwise, just update the total count
          if (this.alreadyViewedShoppingLists) {
            $('.mrfLinks h3').show();
            this.renderAllLists('keepHidden');
          } else {
            this.renderAllLists('keepHidden');
          }
        }

        this.log('coziUser');
      },
      /**
      * Returns the shopping list container
      */
      getElement : function () {
        this.log('getElement');
        return $('#mrf_shoppingListToutListContainer');
      },
      /**
      * Returns the shopping list link
      */
      shoppingListsLink : function () {
        this.log('shoppingListsLink');
        return $('#mrCoziMrfPageShoppingListsLink');
      },
      /**
      * Returns the MRF tout list container
      */
      getMrfContainer : function () {
        this.log('getMrfContainer');
        return $('#mrf_myRecipeFileToutListContainer');
      },
      /**
      * Adds custom CSS for this feature
      */
      addShoppingListCustomCss : function () {
          var cssText = [
            '#mrf_shoppingListToutListContainer .shoppingList .slIngredients.mrCozi ul ul li.recipeTitle{background-color: #ededed;padding: 10px;border-top: 1px solid #ccc;border-bottom: 1px solid #ccc;color: #af0800;}',
            '#mrf_shoppingListToutListContainer .shoppingList .slIngredients.mrCozi ul ul li {margin-bottom: 30px;}'
        ].join('');

        this.log('addShoppingListCustomCss');

        mrTools.addNewStylesheet(cssText);
      },
      /**
      * Returns the HTML for the feature container
      */
      getMainContainer : function () {
        this.log('getMainContainer');

          return  [
            '<div id="mrf_shoppingListToutListContainer" style="display:none;">',
              '<div class="shoppingList mrCozi" id="shoppingList">',
                '<h1>Main Shopping List</h1>',
              '</div>',
            '</div>'
          ].join('');
      },
      /**
      * Returns the HTML for the list container
      */
      getListContainer : function (listObj) {
        this.log('getListContainer');

        return [
          '<div class="slIngredients mrCozi">',
              '<ul class="by_recipe">',
                  '<li>',
                      ('<h3><span>' + listObj.title + '</span></h3>'),
                      '<ul class="list"></ul>',
                  '</li>',
              '</ul>',
          '</div>'
          ].join('');
      },
      /**
      * Creates a shopping list list - list item
      */
      getListItem : function (listItemObj) {
        var regExp = /^[A-Z \-éÉ]+$/gm,
            liOpener = '<li>';

          this.log('getListItem');

          if(listItemObj.text !== '   ' && regExp.test(listItemObj.text)){
            liOpener = '<li class="recipeTitle">';
          }

          return liOpener + listItemObj.text + '</li>';
      },
      /**
      * Renders the shopping list
      */
      renderList : function (listObj) {
        var me = this,
            $list = $(this.getListContainer(listObj));

        this.log('renderList');

        $.each(listObj.items, function (index,listItem) {
          $list.find('ul.list').append(me.getListItem(listItem));
        });

        return $list;
      },
      /**
      * Removes any existing shopping list items
      */
      removeOldLists : function () {
        this.log('removeOldLists');
        this.getElement().find('.slIngredients.mrCozi').remove();
      },
      /**
      * Renders all shopping lists in the page
      */
      renderAllLists : function (keepHidden) {
        var me = this,
            $container = this.getElement();

        this.log('renderAllLists');

        this.getMrfContainer().hide();
        this.removeOldLists();

        if (!keepHidden || typeof keepHidden === 'undefined') {
          setTimeout(function () {
            $container.fadeIn();
          }, 500);
        }

        mrCoziAppLib.getAllCoziShoppingLists(function (lists) {
          var totalLists = 0;

          totalLists = lists.length;

          //lets ignore empty lists
          $.each(lists, function (index, list) {
            if(!list.items.length){totalLists--; }
          });

          //update the UI
          me.shoppingListsLink().find('.count').html('(' + totalLists +  ')');

          //iterate though all of the shopping lists
          $.each(lists, function(index, list) {
            //lets ignore empty lists
            if (!list.items.length) {return; }

            //append this shopping list
            $container.find('#shoppingList.shoppingList h1').after(me.renderList(list));
          });
        });
      },
      /**
      * Setup the click event handler for the "Shopping Lists" link
      */
      setupClickHander : function () {
        var me = this,
          $shoppingListsLink = this.shoppingListsLink();

        this.log('setupClickHander');

        $shoppingListsLink.unbind();

        $shoppingListsLink.click(function (e) {
          e.preventDefault();
          e.stopPropagation();

          //require authentication
          _mrCoziAppLib.requireAuth(function () {
            $shoppingListsLink.parent().parent().find('h3').hide();
            me.renderAllLists();

            //set a flag in case of logout/log back in
            me.alreadyViewedShoppingLists = true;
          });
        });
      }
    };

    //############ UPDATED - MOBILE PAGINATION - START ##########################

    /**
    * FEATURE: Shows saved recipes (with pagination) on the my recipe file page
    * If saved recipes are organized into folders, those folders are shown in a dropdown
    */
    _utils.features.mrf_myRecipeFileToutListContainer = {
      type : 'mrf',
      name : 'mrf_myRecipeFileToutListContainer',
      dataPageChangeEventName: 'mrfDataPageChange',
      initialize : function(){
        this.log('initialize');

        if(mrTools.env.pageContext.type !== 'mrf'){return;}

      $('#recipeUpdates').hide();
      this.mrfLinks().after('<div id="mrf_myRecipeFileToutListContainer" class="horizTouts horizTouts75"><ul class="list"></ul></div>');

        $('#content .mrfHd')
          .css({'font-size' : '18px', 'font-weight' : 'bold'});
          jQuery('#page-title')
            .text('My Recipe Box');

        this.recipeUpdates().hide();
        //this is being done already in the v2 init
        //this.mrfLinks().after('<div id="mrf_myRecipeFileToutListContainer" class="horizTouts horizTouts75"><ul class="list"></ul></div>');

        //add css needd for my recipe box
        this.addMyRecipeBoxCustomCss();

        //change the saved recipes link href
        $('a[href^="/m/r/my_recipe_file/saved_recipes/"]').attr('href','/m/my_recipe_file/saved_recipes/');
      },
      getElement : function(){
        this.log('getElement:');

        return $('#mrf_myRecipeFileToutListContainer ul');
      },
      profileEditLink : function(){
        this.log('profileEditLink');

        return $('a[href^="/m/r/profile/edit/"]');
      },
      savedRecipesLink : function(){
        this.log('savedRecipesLink');
        //new MRF
        //return $('a[href^="/m/r/my_recipe_file/saved_recipes/"]');
        return $('a[href^="/m/my_recipe_file/saved_recipes/"]');
      },
      mrfLinks : function(){
        this.log('mrfLinks');

        return $('.mrfLinks');
      },
      recipeUpdates : function(){
        this.log('recipeUpdates');

        return $('#recipeUpdates');
      },
      personalRecipesLink : function(){
        this.log('personalRecipesLink');
        //new MRF
        //return $('a[href^="/m/r/my_recipe_file/saved_recipes/personal_recipes/"]').parent();
        return $('a[href^="/m/my_recipe_file/saved_recipes/personal_recipes/"]').parent();
      },
      shoppingListsContainer : function(){
        this.log('shoppingListsContainer');

        return $('#mrf_shoppingListToutListContainer');
      },
      addMyRecipeBoxCustomCss : function(){
          var cssText = [
          '.horizTouts li,.horizTouts ul{list-style:none;margin:0;padding:0}',
          '.horizTouts .tout::after{clear:both;content:"";display:table}',
          '.horizTouts .tout{margin:10px 0 15px}',
          '.tout .img{float:left;margin-right:10px}',
          '.tout h4{font-size:13px;margin:0 0 5px}',
          '.tout a{font-weight:700;color:#af0800!important}',
          '.tout .recipeDek{font-size:10px;margin:0 0 3px}'
        ].join('');

        this.log('addMyRecipeBoxCustomCss');

        mrTools.addNewStylesheet(cssText);
      },
      setupSavedRecipesAndShoppingListsLinks : function(anonymousOrCozi){
        this.log('setupSavedRecipesAndShoppingListsLinks');

        if (anonymousOrCozi === 'cozi'){
          this.savedRecipesLink_seutupHander('cozi');
        } else {
          this.savedRecipesLink_seutupHander('anonymous');
        }
      },
      convertDate : function(dateString){
        if (!dateString){return ''; }

        this.log('convertDate');

        var raw = dateString.split('T'),
            rawDate = raw[0].split('-'),
            d = new Date(rawDate[0],(rawDate[1] - 1),rawDate[2]).toString(),
            final = d.split(' 00')[0].toString();

        return final;
      },
      savedRecipesLink_seutupHander : function(anonymousOrCozi){
        var me = this,
            $savedRecipesLink = this.savedRecipesLink(),
            $el = this.getElement();

        this.log('savedRecipesLink_seutupHander');

        $savedRecipesLink.unbind();

        $savedRecipesLink.click(function(e){
          e.preventDefault();
          e.stopPropagation();

          if (anonymousOrCozi === 'cozi'){
            me.showSavedRecipes();
          } else {
            //todo - kevin - what is this?
            $('#user_status .signIn .overlayToggleLink').click();
          }
        });
      },
      makeRecipeLi : function(recipe){
        var recUrl = recipe.url.replace('myrecipes.com/recipe','myrecipes.com/m/recipe');

        this.log('makeRecipeLi');

        return [
          '<li class="recipe ">',
              '<div class="tout">',
                  '<div class="img">',
                      ('<a href="' + recUrl + '">'),
                         ('<img width="75" height="75" src="' + recipe.photo + '">'),
                      '</a>',
                  '</div>',
                  '<div class="txt">',
                      ('<h4><a href="' + recUrl + '">' + recipe.name + '</a></h4>'),
                      '<div class="recipeDek">',
                      '<span class="savedDate">Saved: ' + this.convertDate(recipe.creationDate) + '</span></div>',
                  '</div>',
              '</div>',
          '</li>'
        ].join('');
      },
      showSavedRecipes : function(keepHidden){
        var me = this,
            $el = this.getElement();

        this.log('showSavedRecipes');

        this.shoppingListsContainer().hide();
        $el.children().remove();

        if(!keepHidden || typeof keepHidden === 'undefined'){
          setTimeout(function(){
            $el.parent().fadeIn();
          },500);
        }

        //mrCoziLib.getAllCoziRecipes(function(jsonData){
        mrCoziAppLib.getAllCoziRecipes(function(jsonData){
          me.savedRecipesLink().find('.count').html('(' + jsonData.recipes.length +  ')');
          $.each(jsonData.recipes,function(index,recipe){
            $el.append(me.makeRecipeLi(recipe));
          });
        });
      },
      setupClickHander : function(){
        var me = this,
            $savedRecipesLink = this.savedRecipesLink();

        this.log('setupClickHander');

        $savedRecipesLink.unbind();

        $savedRecipesLink.click(function(e){
          e.preventDefault();
          e.stopPropagation();


          /*
          mrCoziLib.getUserContext(function(userObj){
            if(userObj.anonymous){
              $('#user_status .signIn .overlayToggleLink').click();
            }
          });

          mrCoziLib.sso().ready(function(){
            $('.mrfLinks h3 a[href="/m/r/shopping_lists/"]').parent().hide();
            //me.showSavedRecipes();
            me.v2GetRecipeListContainerAndRecipFoldersContainer().show();
            me.mrfLinks().hide();

            //show the pagination modules
            me.v2GetMrfPaginationContainer().show();
          });
          */

          _mrCoziAppLib.requireAuth(function(){
            $('.mrfLinks h3 a[href="/m/r/shopping_lists/"]').parent().hide();
            //me.showSavedRecipes();
            me.v2GetRecipeListContainerAndRecipFoldersContainer().show();
            me.mrfLinks().hide();

            //show the pagination modules
            me.v2GetMrfPaginationContainer().show();
          });

        });
      },
      anonymous : function(){
        var me = this,
            $el = this.getElement();

        this.log('anonymous');

        //in-case this was called more than once per page load
        this.v2Reset();

        this.recipeUpdates().hide();
        $el.children().remove();

        me.savedRecipesLink().find('.count').html('(0)');

        this.personalRecipesLink().hide();
        this.profileEditLink().hide();
        me.setupClickHander();
      },
      kaUser : function(){
          //maybe nothing to do
      },
      coziUser : function(){
        this.log('coziUser');

        this.recipeUpdates().hide();
        this.personalRecipesLink().hide();
        this.profileEditLink().hide();
        this.setupClickHander();

        //if recipes was requested in the query string, show it
        if (window.location.search && (window.location.search.indexOf('choice=recipes') > - 1)){
          $('.mrfLinks h3').hide();
          //this.showSavedRecipes();
          this.v2Init();
        } else {
          //otherwise, just update the total count
          //this.showSavedRecipes('keepHidden');

          if (this.alreadyViewedRecipes || _utils.features.mrf_shoppingListToutListContainer.alreadyViewedShoppingLists){
            this.mrfLinks().show();
            this.v2Init();
          } else {
            this.v2Init('keepHidden');
          }
        }
      },
      //############ addded for migration START ##########################
      v2Folders : {},
      v2RenderRecipes : [],
      alreadyViewedRecipes: false,
      v2GetCreds : function(){
        this.log('v2GetCreds');

        return mrCoziAppLib.cozi.auth.getCookie();
      },
      v2GetFoldersSelect : function(){
        this.log('v2GetFoldersSelect');

        return $('#coziRecipeFolders');
      },
      v2GetRecipFoldersContainer : function(){
        this.log('v2GetRecipFoldersContainer');

        return $('#coziRecipeFoldersContainer');
      },
      v2GetMrfPaginationContainer : function(){
        this.log('v2GetMrfPaginationContainer');

        return $('.mrfPaginationContainer');
      },
      v2GetRecipeListContainer : function(){
        this.log('v2GetRecipeListContainer');

        return $('#mrf_myRecipeFileToutListContainer .list');
      },
      v2GetRecipeListContainerAndRecipFoldersContainer  : function(){
        this.log('v2GetRecipeListContainerAndRecipFoldersContainer');

        return $('#mrf_myRecipeFileToutListContainer .list, #coziRecipeFoldersContainer');
      },
      v2Reset : function(){
        this.log('v2Reset');

        this.v2Folders = {};
        this.v2RenderRecipes = [];
        this.v2GetRecipeListContainer().children().remove();
        this.v2GetFoldersSelect().remove();
        this.v2GetRecipFoldersContainer().remove();
        this.v2GetMrfPaginationContainer().remove();
        this.v2GetAjaxSpinner().remove();

        //set the page to 0
        this.dataPageNumber = 0;
      },
      v2Init: function(keepHidden){
        var me = this,
          queryStringChoice = this.v2ChoiceQueryString();

        this.log('v2Init');

        //do not initialize if choice is listsl
        if(queryStringChoice && queryStringChoice === 'lists'){return; }

        //add custom CSS to the page
        this.v2AddCssToPage();

        //in case there is no quer string
        if (keepHidden){
          this.v2KeepHidden = true;
        }

        //in-case this was called more than once per page load
        this.v2Reset();

       //if there is a choice=XXX query string
        if(this.v2ChoiceQueryString()){
          //show AJAX spinner
          $('.mrfLinks').before(this.v2CreateAjaxSpinner());
        }

        //dom setup
        this.v2DomSetup();

        //TO DO: is this really needed??

        //bind the data page change event
        _mrTools.bindEvent(this.dataPageChangeEventName, function(){
          me.v2UpdatePaginationButtons();
        });

        //get getRecipes
        this.v2GetRecipes();

        //set a flag for logout/log back in
        this.alreadyViewedRecipes = true;
      },
      pagedData: [],
      v2DomSetup : function(){
        this.log('v2DomSetup');

        this.v2GetRecipeListContainer().css({'display':'none'});
        this.v2GetRecipeListContainer().children().remove();
        $('#mrf_myRecipeFileToutListContainer').before(this.v2GetDropdown());
      },
      v2AddCssToPage : function(){
          this.log('v2AddCssToPage');

          mrTools.addNewStylesheet(this.v2GetCssText());
      },
      v2GetCssText : function(){
          this.log('v2GetCssText');

          return [
            '#content .mrfPaginationContainer{padding:10px 0;background-color:#f3f3f3;text-align:center;}',
            '#content .mrfPaginationContainer span{display: inline-block;width: 23%;margin-right: 1%;font-weight:bold;color: #af0800;}',
            '#content .mrfPaginationContainer span.last{margin-right:0;}',
            '#content .mrfPaginationContainer span:hover{cursor:pointer;}',
            '#content .mrfPaginationContainer .disabled{color:#ccc;}'
          ].join('');
      },
      v2ChoiceQueryString : function(){
        var locSearch = window.location.search,
          choiceRecipes = locSearch.indexOf('choice=recipes'),
          choiceShoppingLists = locSearch.indexOf('choice=lists');

          this.log('v2ChoiceQueryString');

          if (choiceRecipes && choiceRecipes > -1){return 'recipes'; }
          if (choiceShoppingLists && choiceShoppingLists > -1){return 'lists'; }

          return false;
      },
      v2BuildUrl : function(){
        var base = _mrCoziAppLib.utils.constants.COZI_API_URL_BASE + '/api/ext/1505/',
            path = '/food/recipe/?auth=',
            user =  this.v2GetCreds(),
            id = user.accountId,
            auth = user.auth;

        this.log('v2BuildUrl');

        return base + id + path + auth;
      },
      v2CreatePaginationModule : function(){
        var paginationModule = $('<div class="mrfPaginationContainer"><span class="first">First</span><span span class="previous"><< Previous</span><span class="next">Next >></span><span class="last">Last</span></div>');

        this.log('v2CreatePaginationModule');

        //if this is not a query string choice=XXX view
        //do not show the pagination modules
        if(!this.v2ChoiceQueryString()){
          paginationModule.css({'display' : 'none'});
        }

        return paginationModule;
      },
      v2CreateAjaxSpinner : function(){
        this.log('v2CreateAjaxSpinner');

        return $('<div id="ajaxSpinnerContainerMobileMyRecipeBox" style="text-align:center;"><img src="http://cdn-image.myrecipes.com/sites/all/themes/myrecipes/images/cozi/cozi-migration-ajax-loader_32x32.gif"></div>');
      },
      v2GetAjaxSpinner : function(){
        this.log('v2GetAjaxSpinner');

        return $("#ajaxSpinnerContainerMobileMyRecipeBox");
      },
      maxRecipeDisplay: 10,
      v2CreatePagedData : function(jsonData){
        var i = 0,
            //will contain paged data
            pagedDataArray = [],
            //the max number of elements to show in the page at a time
            maxDisplay = this.maxRecipeDisplay;

        this.log('v2CreatePagedData');

        $.each(jsonData,function(index, element){
            //if we have reachd the max
            if (index !== 0 && (index % maxDisplay) === 0){
              //setup an index for the next page of data
              i++;
            }

            //create a new page of data, if needed
            if (!pagedDataArray[i]){pagedDataArray[i] = []}

            //add the element to the current page of data
            pagedDataArray[i].push(element);
        });

        //cache the paged data
        this.pagedData = pagedDataArray;

        //return the paged data
        return pagedDataArray;
      },
      v2GetRecipes : function(){
        var me = this;

        this.log('v2GetRecipes');

        $.ajax({
          url: me.v2BuildUrl(),
          type: 'GET',
          dataType: 'json',
          success: function(jsonData){
            _logger.log('v2GetRecipes: SUCCESS').dir(jsonData);

            me.savedRecipesLink().find('.count').html('(' + jsonData.length + ')');
            me.v2ProcessData(jsonData);

           //show the folders drop-down
            $('#mrf_myRecipeFileToutListContainer').show();

            //show the pagination modules
            $('#mrf_myRecipeFileToutListContainer').before(me.v2CreatePaginationModule());
            $('#mrf_myRecipeFileToutListContainer').after(me.v2CreatePaginationModule());

            //bind the pagination buttons
            me.v2BindPaginationButtons();
          },
          error: function(errorMesage){
            _logger.warn('v2GetRecipes: ' + errorMesage);
          },
        })
      },
      v2CreateOptions : function(folders){
        var me = this,
          html = '<option></option>';

          this.log('v2CreateOptions');

         $.each(me.v2Folders,function(index,folder){
            var $option = $(html);

            $option.attr('value',folder);
            $option.text(folder);
            me.v2GetFoldersSelect().append($option);
         });
      },
      v2BuildFolders : function(jsonData){
        var me = this;

        this.log('v2BuildFolders');

        $.each(jsonData,function(index,recipe){
          if(recipe.tags && recipe.tags['has-folder'] && recipe.tags['has-folder'].length ){
           $.each(recipe.tags['has-folder'],function(index,tag){
              if(!me.v2Folders.tag){
                  me.v2Folders[tag] = tag;
              }
           });
          }
        });
      },
      v2ShowAllRecipes: function(jsonData){
        var me = this;

        this.log('v2ShowAllRecipes');

        if(!jsonData){return; }

        $.each(jsonData,function(index,recipe){
            me.v2RenderRecipes.push(recipe);
        });

        //show recipes
        me.v2ShowDataPage(0);
      },
      v2GetFirstPageNumber: function(){
        this.log('v2GetFirstPageNumber');

        this.dataPageNumber = 0
        return 0;
      },
      v2GetNextPageNumber: function(){
        this.log('v2GetNextPageNumber');

        if (this.dataPageNumber === (this.pagedData.length -1)){
          return this.dataPageNumber;
        }

        //increment the data page number
        this.dataPageNumber++;

        //return the data page number
        return this.dataPageNumber;
      },
      v2GetPreviousPageNumber: function(){
        var retval = 0;

        this.log('v2GetPreviousPageNumber');

        if (this.dataPageNumber === 0){
          return retval;
        }

        //decrement the data page number
        this.dataPageNumber = this.dataPageNumber - 1;

        retval = this.dataPageNumber;

        //return the data page number
        return retval;
      },
      v2GetLastPageNumber: function(){
        this.log('v2GetLastPageNumber');

        this.dataPageNumber = this.pagedData.length - 1;

        return this.dataPageNumber;
      },
      v2ShowDataPage: function(pageNumber){
        var me = this,
            tempData = [];

        this.log('v2ShowDataPage');

         if(pageNumber === undefined){return; }

        //empty recipe list
        me.v2GetRecipeListContainer().children().remove();

        tempData = me.v2CreatePagedData(me.v2RenderRecipes);

        $.each(tempData[pageNumber],function(index,recipe){
            me.v2GetRecipeListContainer().append(me.v2MakeRecipeLi(recipe));
        });

        //update the pagination UI
        setTimeout(function(){
          me.v2UpdatePaginationButtons();
        },250);
      },
      v2BindPaginationButtons: function(){
        var me = this,
            $paginationContainer = $('#content .mrfPaginationContainer'),
            $firstPageLink = $paginationContainer.find('.first'),
            $nextPageLink = $paginationContainer.find('.next'),
            $previousPageLink = $paginationContainer.find('.previous'),
            $lastPageLink = $paginationContainer.find('.last'),
            $allPaginationLinks = $paginationContainer.find('span');

          this.log('v2BindPaginationButtons');

          $firstPageLink.on('click', function(){
              if($(this).hasClass('disabled')){return; }
              me.v2ShowDataPage(me.v2GetFirstPageNumber());
          });

          $nextPageLink.on('click', function(){
              if($(this).hasClass('disabled')){return; }
              me.v2ShowDataPage(me.v2GetNextPageNumber());
          });

          $previousPageLink.on('click', function(){
              if($(this).hasClass('disabled')){return; }
              me.v2ShowDataPage(me.v2GetPreviousPageNumber());
          });

          $lastPageLink.on('click', function(){
              if($(this).hasClass('disabled')){return; }
              me.v2ShowDataPage(me.v2GetLastPageNumber());
          });

        //TO DO: is this really needed??
          $allPaginationLinks.on('click', function(){
            //trigger a data page change event
            _mrTools.triggerEvent(me.dataPageChangeEventName);
          });
      },
      v2UpdatePaginationButtons: function(){
          var me = this,
              disabledClassName = 'disabled',
              $paginationContainer = $('#content .mrfPaginationContainer'),
              $firstPageLink = $paginationContainer.find('.first'),
              $nextPageLink = $paginationContainer.find('.next'),
              $previousPageLink = $paginationContainer.find('.previous'),
              $lastPageLink = $paginationContainer.find('.last'),
              $allPaginationLinks = $paginationContainer.find('span');

          this.log('v2UpdatePaginationButtons');

          //reset all
          $allPaginationLinks.removeClass(disabledClassName);

          if (me.dataPageNumber === 0){
              $firstPageLink.addClass(disabledClassName);
              $previousPageLink.addClass(disabledClassName);
          }

          if (me.dataPageNumber === (me.pagedData.length - 1)){
              $lastPageLink.addClass(disabledClassName);
              $nextPageLink.addClass(disabledClassName);
          }
      },
      cachedJsonData : [],
      dataPageNumber: 0,
      v2MakeRecipeLi : function(recipe){
        var defaultImageUrl = 'http://cdn-image.myrecipes.com/sites/all/themes/myrecipes/images/legacy/img_noPhoto150.gif';

        this.log('v2MakeRecipeLi');

        return [
          '<li class="recipe ">',
              '<div class="tout">',
                  '<div class="img">',
                      ('<a href="' + recipe.sourceUrl + '">'),
                         ('<img width="75" height="75" src="' + (recipe.photoUrl || defaultImageUrl) + '">'),
                      '</a>',
                  '</div>',
                  '<div class="txt">',
                      ('<h4><a href="' + recipe.sourceUrl + '">' + recipe.name + '</a></h4>'),
                      '<div class="recipeDek">',
                      '<span class="savedDate">Saved: ' + this.convertDate(recipe.creationDate) + '</span></div>',
                  '</div>',
              '</div>',
          '</li>'
        ].join('');
      },
      v2GetDropdown : function(jsonData){
        var html = [
            '<div class="recipeFolders" id="coziRecipeFoldersContainer" style="display:none;">',
                '<form>',
                    '<fieldset>',
                        '<label for="folders" style="margin-right:20px;">Folders:</label>',
                        '<select id="coziRecipeFolders">',
                        //'<option value="pleaseSelect">------- Please Select ---------</option>',
                        '<option value="all">All Recipes</option>',
                        '</select>',
                    '</fieldset>',
                '</form>',
            '</div>'
        ].join('');

        this.log('v2GetDropdown');

        return $(html);
      },
      v2ProcessData : function(jsonData){
        var me = this;

        this.log('v2ProcessData');

        //hide the ajax spinner
        me.v2GetAjaxSpinner().hide();

        me.v2BuildFolders(jsonData);

        me.v2CreateOptions(me.v2Folders);

        $.each(jsonData,function(index, recipe){
          me.cachedJsonData.push(recipe);
        });

        //show all recipes by default
        me.v2RenderRecipes = jsonData;

        //show recipes
        me.v2ShowDataPage(0);

        $( "#coziRecipeFolders" ).change(function () {
            var folderName = this.value;

            //remove the please select option
            if (!me.v2PleaseSelectRemoved){
              $('#coziRecipeFoldersContainer option[value="pleaseSelect"]').remove();
              me.v2PleaseSelectRemoved = true;
            }

            //empty v2RenderRecipes
            me.v2RenderRecipes.length = 0;

             me.dataPageNumber = 0;

            //empty recipe list
            me.v2GetRecipeListContainer().children().remove();

            //if all recipes was selected
            if (folderName === 'all'){
              me.v2RenderRecipes = jsonData;
              //show all recipes
              me.v2ShowAllRecipes(me.cachedJsonData);

              /*
                $.each(jsonData,function(index,recipe){
                    me.v2RenderRecipes.push(recipe);
                });

                $.each(jsonData,function(index,recipe){
                    me.v2GetRecipeListContainer().append(me.v2MakeRecipeLi(recipe));
                });
              */

                //exit
                return;
            }

            //$.each(jsonData,function(index,recipe){
            $.each(me.cachedJsonData,function(index,recipe){
                if (recipe.tags && recipe.tags['has-folder'] && recipe.tags['has-folder'].length){
                    $.each(recipe.tags['has-folder'],function(index,folder){
                        if (folder === folderName){
                            me.v2RenderRecipes.push(recipe);
                        }
                    });
                }
            });

            //show recipes
            me.v2ShowDataPage(0);
            /*
            $.each(me.v2RenderRecipes,function(index,recipe){
                me.v2GetRecipeListContainer().append(me.v2MakeRecipeLi(recipe));
            });
            */
        })

        if (!this.v2KeepHidden){
          this.v2GetRecipeListContainerAndRecipFoldersContainer().show();
          this.mrfLinks().hide();
        } else {
           this.v2GetMrfPaginationContainer().hide();
        }
      }
      //############ addded for migration ##########################
    };

    //############ UPDATED - MOBILE PAGINATION - END ##########################


  _utils.features.recipe_saveRecipeButton = {
    type : 'recipe',
    name : 'recipe_saveRecipeButton',
    initialize : function(){
      var me = this;

      //if this is a UGC recipe, disable this module
      if (window.location.href.indexOf('/recipe/ugc/') > -1 ){
          this.coziUser = function(){};
          this.anonymous = function(){};
          return;
      }


      this.getElement()
      //set an ID on the save recipe button
      .attr('id', 'coziSaveRecipeButton')
      //add the text
      .text('+ Save');

      //add custom CSS
      this.setupCss();

      
      //bind the custom events
      this.bindCustomEvents();
    },
    shareNextBarSaveButtonWasClicked : false,
    saveShareNextBarSaveButton : function(){
      return $('#saveShareNextBar .saveButton');
    },
    bindCustomEvents : function(){
      var me = this;

      this.log('bindCustomEvents');

      _mrTools.bindEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_SAVING, function(){
        me.updateButtonSaving(me.getElement());
        me.log('EVENT: ' + _utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_SAVING);
      });

      _mrTools.bindEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_ALREADY_SAVED, function(){
        me.updateButtonSaved(me.getElement());
        me.log('EVENT: ' + _utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_ALREADY_SAVED);
      });

      _mrTools.bindEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_RESET, function(){
        me.resetButton(me.getElement());
        me.log('EVENT: ' + _utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_RESET);
      });
    },
    setupCss : function(){
      this.log('setupCss');

      var cssText = [
        '#coziSaveRecipeButton.shareBtn.shareBtnSave{width:85px;height:30px;margin:0;line-height:30px;background-image:none!important;background-color:#ca1517;border-radius:5px;color: #fff;font-size:16px;text-align:center;}',
        '#coziSaveRecipeButton.shareBtn.shareBtnSave.saving{color:#fff;background-color:#006400;}',
        '#coziSaveRecipeButton.shareBtn.shareBtnSave.saved{color:#fff;background-color:#b8b8b8;}',
        '#coziSaveRecipeButton.shareBtn.shareBtnSave.noPointer:hover{cursor:default;}'
      ].join('');

      $('body').append('<style>' + cssText + '</style>');
    },
    bindSaveButtonClick : function($element){
      var me = this;

      this.log('bindSaveButtonClick');

      //unbind
      this.getElement().unbind();

      //bind click
      this.getElement().click(function(evt){
        evt.preventDefault();
        evt.stopPropagation();

        _mrCoziAppLib.requireAuth(function(){
          _mrTools.triggerEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_SAVING);
          me.saveRecipe_coziUser();
        });
      });

    },
    resetButton : function($element){
      this.log('resetButton');

      $element
        .unbind()
        .removeClass('saving')
        .removeClass('saved')
        .removeClass('noPointer')
        .html('<b class="buttonText"><i>+</i>Save</b>');

      this.bindSaveButtonClick($element);

      return this;
    },
    updateButtonSaving : function($element){
      this.log('resetButton');

      $element
        .addClass('saving')
        .html('<i>Saving...</i>');

      return this;
    },
    updateButtonSaved : function($element){
      $element
        .removeClass('saving')
        .addClass('saved')
        .addClass('noPointer')
        .unbind()
        .html('Saved!');

      return this;
    },
    getSingleRecipeInfo : function(callback){
      var me = this;

        $.ajax({
          url : (mrTools.env.urlBase + '/ti_recipes/data/' + mrCoziAppLib.utils.getRecipePermalinkFromUrl() + '.json'),
          success : function(jsonData){
              _logger.log('>> getSingleRecipeInfo: OK.').dir(jsonData);

              if (!jsonData.errors && callback  && callback instanceof Function){
                callback(jsonData);
              }
          }
        });
    },
    saveRecipe_coziUser : function(){
      var me = this,
          $el = this.getElement(),
          $saveShareNextBarSaveButton = this.saveShareNextBarSaveButton();

      //trigger the already saving event
      _mrTools.triggerEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_SAVING);

      me.getSingleRecipeInfo(function(recipeData){

        _logger.warn('>> getSingleRecipeInfo:').dir(recipeData);

        //mrCoziLib.saveRecipeToCozi(function(recipe){
        mrCoziAppLib.saveRecipeToCozi(function(recipe){
          //omniture
          omniCommunityTracker('save-recipetomrf');

          //trigger the already saved event
          _mrTools.triggerEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_ALREADY_SAVED);

        },mrCoziAppLib.createRecipeObject(recipeData));
      });
    },
    checkIfRecipeAlreadySaved_coziUser : function(){
      var me = this,
          $el = this.getElement(),
          winLocationHref = window.location.href.replace('/m',''),
          recipeFound = false;

        //get all saved recipes
        mrCoziAppLib.getAllCoziRecipes(function(jsonData){

        //iterate through all of the saved recipes
        $.each(jsonData,function(index,recipe){
          var recipeUrlIsValid = false;

          //remove the query string and hash
          winLocationHref = winLocationHref.replace(window.location.search, '');
          winLocationHref = winLocationHref.replace(window.location.hash, '');
          //in case the query string or hash are partial
          winLocationHref = winLocationHref.replace('?', '');
          winLocationHref = winLocationHref.replace('#', '');

          me.log('checking: ' + recipe.sourceUrl  + ' vs: ' + winLocationHref);

          recipeUrlIsValid = (recipe.sourceUrl && recipe.sourceUrl.length && recipe.sourceUrl.indexOf('http') > -1 && winLocationHref === recipe.sourceUrl);

          //if the recipe was already saved
          if(recipeUrlIsValid){
            //trigger the already saved event
            _mrTools.triggerEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_ALREADY_SAVED);

            //flag this so we know not to set the click event below
            recipeFound = true;
          }
        });

        //if the recipe was not found
        if (!recipeFound){
          //bind the save button click
          me.bindSaveButtonClick();
        }
      });
    },
    getElement : function(){
      return $('a.shareBtn.shareBtnSave');
    },
    anonymous : function(){
      this.log('anonymous');

      _mrTools.triggerEvent(_utils.constants.EVENT_RECIPE_PAGE_MOBILE_RECIPE_BUTTON_RESET);
    },
    coziUser : function(){
      var me = this;

      this.log('coziUser');

      //make sure this runs last
      setTimeout(function(){
        me.checkIfRecipeAlreadySaved_coziUser();
      }, 1000);
    }
  };

    /**
    * save all recipes and ingredients - meal planner page
    */
    _utils.features.planner_addAllRecipesAndIngredientsButtons = {
      type : 'planner',
      name : 'planner_addAllRecipesAndIngredientsButtons',
      /**
      * Initializes the feature
      *
      * @return undefined
      */
      initialize : function(){
        this.log('initialize');

        //setup custom CSS
        mrTools.addNewStylesheet(this.getCssText());

        //setup KA And COZI Buttons
        this.setupKaAndCoziButtons();

        //cache buttons text for reset
        this.cacheButtonsText();

        //bind custom events
        this.bindCusomtEvents();

        //DOM setup
        this.domSetup();
      },
      ingredientsArray : [],
      defaultList : null,
      /**
      * Caches the original button text in case they need to be reset
      *
      * @return undefined
      */
      cacheButtonsText : function(){
        this.log('cacheButtonsText');

        this.recipeButtonText = this.getElement().find('a').eq(0).text();
        this.ingredientsButtonText = this.getElement().find('a').eq(1).text();
      },
      /**
      * Re-sets the text for both the save recieps and save ingredients buttons and re-binds them
      *
      * @return undefined
      */
      resetSaveButtons : function(){
        var $saveRecipesButton = this.getElement().find('a').eq(0),
          $saveIngredientsButton = this.getElement().find('a').eq(1);

        //re-set the ingredients array
        this.ingredientsArray = [];

        this.log('resetSaveButtons');

        //bind save recipes button COZI
        this.bindSaveRecipessButton_COZI();

        //bind save ingredients button COZI
        this.bindSaveIngredientsButton_COZI();

        //reset the button text
        $saveRecipesButton.text(this.recipeButtonText);
        $saveIngredientsButton.text(this.ingredientsButtonText);

        //remove the saved classes
        $saveRecipesButton.removeClass('saved');
        $saveIngredientsButton.removeClass('saved');
      },
      anonymous : function(){
        this.log('anonymous');
        this.resetSaveButtons();
      },
      coziUser : function(){
        this.log('coziUser');
        this.resetSaveButtons();
      },
      constants : {
        EVENT_PLANNER_PAGE_RECIPES_SAVING : 'plannerPageRecipesSaving',
        EVENT_PLANNER_PAGE_RECIPES_SAVED : 'plannerPageRecipesSaved',
        EVENT_PLANNER_PAGE_SHOPPING_LISTS_SAVING : 'plannerPageShoppingListsSaving',
        EVENT_PLANNER_PAGE_SHOPPING_LISTS_SAVED : 'plannerPageShoppingListsSaved'
        //EVENT_PLANNER_PAGE_BUTTONS_RESET : 'plannerPageButtonReset'
      },
      domSetup : function(){
        this.log('domSetup');

        this.wmpBtns_KA().hide();
        this.getElement().show();
      },
      bindCusomtEvents : function(){
        var me = this;

        this.log('coziUser');

        _mrTools.bindEvent(this.constants.EVENT_PLANNER_PAGE_RECIPES_SAVING, function(){
          //update the SAVE ALL MAIN DISHES TO RECIPE FILE button
          me.updateButtonSaving(me.getElement().find('a').eq(0));

          //save all recipes
          me.saveAllRecipesToCozi();

          //log the event
          me.log('EVENT: ' + me.constants.EVENT_PLANNER_PAGE_RECIPES_SAVING);
        });

        _mrTools.bindEvent(this.constants.EVENT_PLANNER_PAGE_RECIPES_SAVED, function(){
          //update the SAVE ALL MAIN DISHES TO RECIPE FILE button
          me.updateButtonSaved(me.getElement().find('a').eq(0));

          //log the event
          me.log('EVENT: ' + me.constants.EVENT_PLANNER_PAGE_RECIPES_SAVED);
        });

        _mrTools.bindEvent(this.constants.EVENT_PLANNER_PAGE_SHOPPING_LISTS_SAVING, function(){
          //update the Add All Main Dishes To Shopping List button
          me.updateButtonSaving(me.getElement().find('a').eq(1));

          //save all ingredients
          me.saveAllIngredients();

          //log the event
          me.log('EVENT: ' + me.constants.EVENT_PLANNER_PAGE_SHOPPING_LISTS_SAVING);
        });

        _mrTools.bindEvent(this.constants.EVENT_PLANNER_PAGE_SHOPPING_LISTS_SAVED, function(){
          //update the Add All Main Dishes To Shopping List button
          me.updateButtonSaved(me.getElement().find('a').eq(1));

          //log the event
          me.log('EVENT: ' + me.constants.EVENT_PLANNER_PAGE_SHOPPING_LISTS_SAVED);
        });
      },
      getElement : function(){
        //will be updated by the initialize method
      },
      wmpBtns_KA : function(){
        //will be updated by the initialize method
      },
      overlayToggleLink : function(){
       return $('#user_status .signIn .overlayToggleLink');
      },
      recsArr : function(){
        if (Drupal && Drupal.settings && Drupal.settings.mealPlannerRecipeIDs){
          return Drupal.settings.mealPlannerRecipeIDs.split(',');
        } else {
          return [];
        }
      },
      omintureSaveRecipesReportMesssageText : 'save-recipetomrf-mealplanner',
      omintureSaveToShoppingListReportMesssageText : 'save-shoppinglist-mealplanner',
      sendOmnitureReport : function(messageText){
        if (!omniCommunityTracker){_logger.warn('>> sendOmnitureReport: omniCommunityTracker not found'); return; }
        if (!messageText || (messageText === '')){_logger.warn('>> sendOmnitureReport: no message text'); return; }

        //send the omniture report
        omniCommunityTracker(messageText);
      },
      getCssText : function(){
          this.log('getCssText');

          return [
            //meal planner
            '#wmpBtns_COZI{clear: both;display: none;margin:0 0 30px 30px;text-align: center;}',
            '#wmpBtns_COZI a {display:block;width: 270px;background: none repeat scroll 0 0 #c00;border-radius: 5px;color: #fff;margin-bottom: 10px;padding: 3px 8px;text-decoration: none;text-transform: uppercase;}',
            '#wmpBtns_COZI .saving{background-color:#006400;}',
            '#wmpBtns_COZI .saved{background-color:#ccc;}',
            '#wmpBtns_COZI .saved:hover{cursor:default;}'
          ].join('');
      },
      setupKaAndCoziButtons : function(){
        var $old_wmpBtns = $('#wmpBtns'),
            $wmpBtns_COZI = $old_wmpBtns.clone();

        this.log('setupKaAndCoziButtons');

        $wmpBtns_COZI.attr('id','wmpBtns_COZI');

        $wmpBtns_COZI.css({'display' : 'none'});

        $old_wmpBtns.find('a').css({'width' : '270px', 'margin-left' : '30px','display' : 'block'});

        $old_wmpBtns.after($wmpBtns_COZI);

        //update the wmpBtns_KA method
        this.wmpBtns_KA = function(){this.log('wmpBtns_KA'); return $old_wmpBtns; }

        //update the getElement method
        this.getElement = function(){this.log('getElement'); return $wmpBtns_COZI; }

        //unbind the original KA buttons
        this.wmpBtns_KA().find('a').unbind();
      },
      bindSaveRecipessButton_COZI : function(){
        var me = this,
          $button = this.getElement().find('a').eq(0);

        this.log('bindSaveRecipessButton_COZI');

        //remove any previous bindings
        $button.unbind();

        //save all recipes
        $button.click(function(e){
          var $this = $(this);

          //prevent the hash (#) from showing up in the address bar
          e.preventDefault();
          e.stopPropagation();

          mrCoziAppLib.requireAuth(function(){
            _mrTools.triggerEvent(me.constants.EVENT_PLANNER_PAGE_RECIPES_SAVING);
          });
        });
      },
      bindSaveIngredientsButton_COZI : function(){
        var me = this,
          $button = this.getElement().find('a').eq(1);

        this.log('bindSaveIngredientsButton_COZI');

        //remove any previous bindings
        $button.unbind();

        $button.click(function(e){
          var $this = $(this);

          //prevent the hash (#) from showing up in the address bar
          e.preventDefault();
          e.stopPropagation();

          mrCoziAppLib.requireAuth(function(){
            _mrTools.triggerEvent(me.constants.EVENT_PLANNER_PAGE_SHOPPING_LISTS_SAVING);
          });
        });
      },
      saveAllRecipesToCozi : function(){
        var me = this;

        this.log('saveAllRecipesToCozi');

        //_utils.saveAllRecipesToCozi(this.recsArr(), function(){
        mrCoziAppLib.saveAllRecipesToCozi(this.recsArr(), function(){
          //update the UI
          _mrTools.triggerEvent(me.constants.EVENT_PLANNER_PAGE_RECIPES_SAVED);

          //send the omniture report
          me.sendOmnitureReport(me.omintureSaveRecipesReportMesssageText);
        });
      },
      updateButtonSaving : function($element){
        this.log('updateButtonSaving');

        $element.html('Saving....').addClass('saving');

        return this;
      },
      updateButtonSaved : function($element){
        this.log('updateButtonSaved');

        $element.html('Saved!').removeClass('saving').addClass('saved').addClass('noPointer').unbind();

        $element.click(function(e){
          e.preventDefault();
          e.stopPropagation();
        });

        return this;
      },
      getDefaultShoppingList : function(listsArray){
        var retVal = null;

        this.log('getDefaultShoppingList');

        if (!listsArray || !listsArray.length){this.log('listsArray not provided'); return; }

        retVal = listsArray[0];

        $.each(listsArray,function(index, list){
          if(list.title === 'Groceries'){
            retVal = list;
          }
        });

        return retVal;
      },
      getRecipeDataAll : function(lists){
        var me = this,
            myArr = me.ingredientsArray,
            deps = [],
            allRecs = new $.Deferred();

        this.log('getRecipeDataAll');

        $.when(allRecs).done(function(){
          _logger.log('>> all ingredients added to array. About to send:').dir(myArr);

          //mrCoziLib.addMultipleItemsToCoziShoppingList({
          mrCoziAppLib.addMultipleItemsToCoziShoppingList({
            list : me.defaultList.listId,
            items : myArr,
            success : function(jsonData){
              _logger.dir('>> addMultipleItemsToCoziShoppingList: OK').dir(jsonData);;

              //update the UI
              _mrTools.triggerEvent(me.constants.EVENT_PLANNER_PAGE_SHOPPING_LISTS_SAVED);

              //send the omniture report
              me.sendOmnitureReport(me.omintureSaveToShoppingListReportMesssageText);
            },
            error : function(){
              _logger.warn('addMultipleItemsToCoziShoppingList: FAILED:');
            }
          });
        });

        $.each(lists,function(index,item){
          var newDef = new $.Deferred();

          deps.push(newDef);

          $.when(newDef).done(function(){
            _logger.log('newDef #: ' + index + ' was resolved');
          });
        });

        $.when.apply($, deps).done(function(){
          _logger.log('deps >> done');
          allRecs.resolve();
        });

        $.each(lists,function(index,item){
          var urlPart1 = mrTools.env.urlBase + '/ti_recipes/data/',
              urlPart2 = '.json',
              recDef = new $.Deferred();

          $.when(recDef).done(function(){
            deps[index].resolve();
          });

          me.getRecipeData({
            count: index,
            recUrl : (urlPart1 + item + urlPart2),
            allRecs : lists,
            buildArr : myArr,
            defObj : recDef
          });
        });
      },
      getRecipeData : function(obj){
        var me = this;

        this.log('getRecipeData');

        $.ajax({
          url : obj.recUrl,
          success : function(jsonData){
            //add recipe title in ALL CAPS first
            if (jsonData.recipe.name && (jsonData.recipe.name !== '')){
              obj.buildArr.push({"text": jsonData.recipe.name.toUpperCase()});
            }

            $.each(jsonData.recipe.ingredients.ingredient,function(index,ingredient){
              _logger.log('>> just pushed: ' + ingredient.name);

              obj.buildArr.push({"text": mrCoziAppLib.makeIngredientString(ingredient)});

              if (index === (jsonData.recipe.ingredients.ingredient.length - 1)){
                obj.defObj.resolve();
              }
            });
          }
        });
      },
      saveAllIngredients : function(){
        var me = this,
            recs = this.recsArr();

        this.log('saveAllIngredients');

        //get all shopping lists
        mrCoziAppLib.getAllCoziShoppingLists(function(lists){

            //get the default shopping list
            me.defaultList = me.getDefaultShoppingList(lists);

            //loop through all shopping lists and get the one that matches the default shopping list we set earlier
            $.each(lists,function(index,thisList){


              if(thisList.listId === me.defaultList.listId){
                //if you find a match, add all of the items from the existing version of the list
                ///to the beginning of the ingredientsArray
                //this POST of multiple items wipes out the list, so we need to re-create it first,
                //and then add the new items
                $.each(thisList.items,function(index,thisIngredient){

                  _logger.log('iteration: thisList.items').dir(thisIngredient);

                  me.ingredientsArray.push({"text": thisIngredient.text});
                });
              }
            });

            _logger.log('>> previous shopping list entries added to array:').dir(me.ingredientsArray);

            //make the async calls needed for all recipes
            me.getRecipeDataAll(recs);
        });
      }
    };

  /**
  * FEATURE: Saves ingredients from current recipe to Cozi shopping list
  */
  _utils.features.recipe_saveToShoppingListButton = {
    type : 'recipe',
    name : 'recipe_saveToShoppingListButton',
    /**
    * Initializes the feature
    */
    initialize : function () {
      var $newButton = $('<div title="Add the ingredients from this recipe to your Cozi shopping list" id="recipe_saveToShoppingListButton_mrCoziMobile"><span>+&nbsp;Add To Shopping List</span></div>');

      //setup custom event bindings
      this.setupEventBindings();

      //add the CSS for this feature
      mrTools.addNewStylesheet(this.getCssText());

      //add the save recipe button that will be used for anonymous or cozi users
      this.getKaButton().after($newButton);

      //remove the KA save recipe button (no longer needed)
      this.getKaButton().remove();
    },
    anonymous : function(){
    //trigger the ingredients button re-set event (which sets-up the button for saving)
    _mrTools.triggerEvent(this.constants.EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_BUTTON_RESET);
    },
    coziUser : function(){
    //trigger the ingredients button re-set event (which sets-up the button for saving)
    _mrTools.triggerEvent(this.constants.EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_BUTTON_RESET);
    },
    constants : {
      EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_ALREADY_SAVED : 'ingredientsSaveButtonAlreadySaved_mobile',
      EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_BUTTON_RESET : 'ingredientsSaveButtonReset_mobile',
      EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_BUTTON_SAVING : 'ingredientsSaveButtonSaving_mobile'
    },
    /**
    * Updates the save to shopping list button to a "saving" state
    */
    updateButtonSaving : function () {
      this.getElement()
        .addClass('saving')
        .find('span').html('<i>Saving....</i>');
    },
    /**
    * Updates the save to shopping list button to a "saved" state
    */
    updateButtonSaved : function () {
      this.getElement()
        .removeClass('saving')
        .addClass('saved')
        .find('span').html('<i>Saved!</i>');
    },
    /**
    * Returns the save to shopping list button
    */
    getElement : function () {
      return $('#recipe_saveToShoppingListButton_mrCoziMobile');
    },
    /**
    * Returns the KA version of the save to shopping list button (comes in the page markup)
    */
    getKaButton : function () {
      return $('#addRecipeToShoppingListButton_mr3163');
    },
    /**
    * Sets-up binding for custom events
    */
    setupEventBindings : function () {
      var me = this;

      //triggered when the user clicks the save recipe button
      _mrTools.bindEvent(this.constants.EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_BUTTON_SAVING, function () {
        //update the save recipe button to a "saving" state
        me.updateButtonSaving();

        //log the event
        me.log('EVENT: ' + me.constants.EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_BUTTON_SAVING);
      });

      //triggered when the user context changes to anonymous
      _mrTools.bindEvent(this.constants.EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_BUTTON_RESET, function () {
        //restore the save recipe button to a pre "saved" state
        me.setupClickHandler();

        //log the event
        me.log('EVENT: ' + me.constants.EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_BUTTON_RESET);
      });

      //triggered when it is determined that the current recipe has already been saved
      _mrTools.bindEvent(this.constants.EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_ALREADY_SAVED, function () {
        //update the save recipe button to a "saved" state
        me.updateButtonSaved();

        //log the event
        me.log('EVENT: ' + me.constants.EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_ALREADY_SAVED);
      });

      this.log('setupEventBindings');
    },
    /**
    * Returns custom CSS for the feature
    */
    getCssText : function () {
      this.log('getCssText');

      return [
      '#recipe_saveToShoppingListButton_mrCoziMobile {background-color:#ca1517;border-radius:5px;color:#fff;display:none;height:30px;line-height:30px;margin: 0 0 0 10px;text-align:center;width:50%;}',
      '#recipe_saveToShoppingListButton_mrCoziMobile:hover{cursor:pointer;}',
      '#recipe_saveToShoppingListButton_mrCoziMobile.saving{background-color:#006400;}',
      '#recipe_saveToShoppingListButton_mrCoziMobile.saved{background-color:#b8b8b8;}'
      ].join('');
    },
    /**
    * Returns the "Groceries" shopping list from an array of shopping lists (if not found, the first list is returned)
    */
    getDefaultShoppingList : function (listsArray) {
      var retVal = null;

      if (!listsArray || !listsArray.length) {this.log('no shopping list array provided'); return; }

      retVal = listsArray[0];

      $.each(listsArray, function (index, list) {
        if(list.title === 'Groceries') {
          retVal = list;
        }
      });

      this.log('Default ShoppingList -> ').dir(retVal);

      return retVal;
    },
    /**
    * Event handler for the add to shopping list button
    */
    saveToShoppingList_COZI : function(){
      var me = this,
          $el = this.getElement(),
          ingredientsArray = [],
          thisRecipe = {},
          thisRecipeIngredients = [];

      //trigger the saving event
      _mrTools.triggerEvent(this.constants.EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_BUTTON_SAVING);

      //get the async recipe data
      mrCoziAppLib.getAsyncRecipe({
        id : mrCoziAppLib.utils.getRecipePermalinkFromUrl().replace(/\//g,'').replace('ugc', ''),
        callback : function (jsonData) {
          if (jsonData.errors) {
            _logger.log('>> error returned my async recipe call:', function () {
              console.dir(jsonData);
            });

            //if there are errors, exit
            return;
          }

          //get all saved shopping lists
          mrCoziAppLib.getAllCoziShoppingLists(function(lists){
            //get a reference to the default shopping list
            var list = me.getDefaultShoppingList(lists);

              thisRecipe = jsonData.recipe;
              thisRecipeIngredients = thisRecipe.ingredients.ingredient;

              //loop through all shopping lists and get the one that matches the default shopping list we set earlier
              $.each(lists, function(index, thisList) {
                if (thisList.listId === list.listId) {
                  //if you find a match, add all of the items from the existing version of the list
                  ///to the beginning of the ingredientsArray
                  //this POST of multiple items wipes out the list, so we need to re-create it first,
                  //and then add the new items
                  $.each(thisList.items, function (index, thisIngredient) {
                    ingredientsArray.push({"text": thisIngredient.text});
                  });
                }
              });

              _logger.log('>> ingredientsArray:').dir(ingredientsArray);;

              //make the first element the recipe title in all caps
              ingredientsArray.push({"text": thisRecipe.name.toUpperCase()});

              //iterate the list of ingredients and each to the array as an objecct
              $.each(thisRecipeIngredients,function(index,ingredient){
                ingredientsArray.push({"text": mrCoziAppLib.makeIngredientString(ingredient)});
              });

              _logger.log('about to POST this array of multiple ingredients:').dir(ingredientsArray);

              //POST multiple ingredients to cozi
              mrCoziAppLib.addMultipleItemsToCoziShoppingList({
                list : list.listId,
                items : ingredientsArray,
                success : function(jsonData){
                  _logger.log('>> addMultipleItemsToCoziShoppingList: OK').dir(jsonData);

                  //trigger the recipe already saved change event
                  _mrTools.triggerEvent(me.constants.EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_ALREADY_SAVED);

                  //omniture
                  omniCommunityTracker('add-shoppinglist');
                },
                error : function(){
                  _logger.warn('addMultipleItemsToCoziShoppingList: FAILED:');

                  //trigger the re-set event
                  _mrTools.triggerEvent(me.constants.EVENT_RECIPE_PAGE_MOBILE_INGREDIENTS_BUTTON_RESET);
                }
              });
          });
        }
      });
    },
    setupClickHandler : function(){
      var me = this,
        $el = this.getElement(),
        $link = $el.find('span');

      //un-bind the button elements
      $link.unbind();
      $el
        .removeClass('saving')
        .removeClass('saved')
        .unbind()
        .show()
        .find('span').html('+&nbsp;Add To Shopping List');

      $el.click(function(e){
        //this requires authorization
        mrCoziAppLib.requireAuth(function(){
          me.saveToShoppingList_COZI();
        });
      });
    }
  };

  //livefyre review widget
  _utils.features.recipe_LiveFyreRatings = {
    type : 'recipe',
    name : 'recipe_LiveFyreRatings',
    dev: false,
    //devUrlBase: 'http://localhost:8888/',
    devUrlBase : _utils.settings.jsUrlBaseDev,
    prodUrlBase: '',
    dependenciesUrlBase : '',
    liveFyreRatingsWidgetUrl: '',
    liveFyreRatingsWidgetFile: 'mr-livefyre-reviews.js',
    initialize : function(){
      //do not show ratings on UGC recipe pages
      if (window.location.href.indexOf('/recipe/ugc/') > -1){return; }

      //if the widget is enabled or there is a preview query string parameter
      if (this.isEnbled() || this.previewMode()){
        //override CSS
        this.overrideCss();
        //build URLS needed for dependencies
        this.buildUrls();
        //load the widget
        this.loadLiveFyreRatingsWidget();
      }
    },
    isEnbled : function(){
      return (window.Drupal && window.Drupal.settings && window.Drupal.settings.enable_livefyre && (window.Drupal.settings.enable_livefyre === 1));
    },
    previewMode : function(){
      return window.location.search && window.location.search.indexOf('livefyre=preview') > -1;
    },
    buildUrls : function(){
        //me.prodUrlBase = ('//' + mrCoziMobile.constants.JS_CDN_PATH);
       // this.prodUrlBase = window.mrCoziMobile.constants.MR_COZI_LIB_URL.replace('mr-cozi-lib.js','');

        this.prodUrlBase = _utils.settings.jsUrlBase + '/';

        this.dependenciesUrlBase = (this.dev ? this.devUrlBase : this.prodUrlBase);
        this.liveFyreRatingsWidgetUrl = (this.dependenciesUrlBase + this.liveFyreRatingsWidgetFile);

    },
    overrideCss : function(){
      var cssText = [
        '#mr-livefyre-ratings .fyre-comment-date{display:block;margin:20px 0;float:none;}',
        '#mr-livefyre-ratings .fyre-reviews-write{float:none;margin: 20px 0;top: 0;}',
        '#mr-livefyre-ratings .fyre-reviews .fyre-reviews-breakdown, #mr-livefyre-ratings .fyre-live-container{display:none;}'
      ].join('');

      $('body').append('<style>' + cssText + '</style>');
    },
    loadLiveFyreRatingsWidget : function(){
      $.getScript(this.liveFyreRatingsWidgetUrl).done(function(a,b,c){
          var a = 1;
      });
    }
  };

    //initialize the applcation
    _utils.init();
})(window, window.jQuery || window.$);