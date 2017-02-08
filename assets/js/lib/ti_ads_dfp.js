
/**
 * Wrapper on top of TGX that add necessary functionality, such as responsive ads, lazy loading etc.
 */
window.time_dfp = window.time_dfp || [];

(function(root){

    var Utilities = function () {
        //this.oldIE = ($('html').hasClass('lt-ie9')) ? true : false;
        //this.isTouch = (Modernizr.touch) ? true : false;

        // Override default breakpoints
        /*if (window.RS !== undefined && window.RS.environment_vars !== undefined && window.RS.environment_vars.breakpoints !== undefined) {
         this.breakPoints = window.RS.environment_vars.breakpoints;
         }*/
        this.breakpoint = this.getResponsiveBreakpoint();
        this.callbacks = {};
        this.initialize_listeners();
    };

    // Returns true if str is empty, null or undefined.
    Utilities.prototype.isEmpty = function (str) {
        return (!str || 0 === str.length);
    };

    Utilities.prototype.breakPoints = [
        [768, 'sm'],
        [1024, 'md'],
        [1280, 'lg'],
        [1400, 'xl']
    ];

    Utilities.prototype.getBrowserWidth = function () {
        var width;
        if (document.body && document.body.offsetWidth) {
            width = document.body.offsetWidth;
        }
        if (document.compatMode === 'CSS1Compat' &&
            document.documentElement &&
            document.documentElement.offsetWidth ) {
            width = document.documentElement.offsetWidth;
        }
        if (window.innerWidth) {
            width = window.innerWidth;
        }

        return width;
    };

    // Get current break point
    Utilities.prototype.getResponsiveBreakpoint = function () {
        var i, point, browser_width = this.getBrowserWidth();
        for (i = 0; i < this.breakPoints.length; i++) {
            point = this.breakPoints[i];
            if (browser_width <= point[0]) {
                return point[1];
            }
        }

        // If browser_width isn't less than any of the breakpoints, return the last/largest size.
        return point[1];
    };

    // Given List of breakpoints, will return if current breakpoint it in  the list
    Utilities.prototype.inBreakPoint = function (list) {
        var index = list.indexOf(this.breakpoint);
        if (index !== -1) {
            return true;
        }
        return false;
    };

    Utilities.prototype.getUrlParameter = function(key, alternateQueryString, noHash, delimiter) {
        delimiter = typeof delimiter == 'string' && delimiter !== '' ? delimiter : '&';
        key = key.replace(/[\[]/, '\\\[').replace (/[\]]/, '\\\]');
        var regex = new RegExp('[\\?' + delimiter + ']' + key + '=([^' + delimiter + (typeof noHash == 'boolean' && noHash ? '' : '#') + ']*)');
        var result = regex.exec (typeof alternateQueryString == 'string' && alternateQueryString.length > 0 ? '?' + alternateQueryString : location.href);
        return result === null ? '' : result [1];
    };

    Utilities.prototype.toggleClasses = function(element) {
        var $this = element,
            $togglePrefix = $this.data('prefix') || 'this',
            $toggled = $('.' + $this.data('toggled'));

        $this.toggleClass($togglePrefix + '-is-active');
        $toggled.toggleClass($togglePrefix + '-is-active');

        // Remove a class on another element, if needed.
        if ($this.data('remove')) {
            $('.' + $this.data('remove')).removeClass($this.data('remove'));
        }

        // If the toggle element trigger is opening a modal, add the .has-close
        // class to the trigger and the close icon will also toggle the target element.
        if ($this.hasClass('has-close')) {
            $toggled.addClass($togglePrefix + '-is-active--with-close');
            $('.js-close').click(function(){
                $this.removeClass($togglePrefix + '-is-active');
                $toggled.removeClass($togglePrefix + '-is-active');
            });
        }
    };

    Utilities.prototype.add_listener = function (event, callback, context) {
        if (this.callbacks[event] === undefined) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push([callback, context]);
    };

    Utilities.prototype.initialize_listeners = function () {
        var self = this;

        window.addEventListener('resize', function () {
            var _self = self;
            // Remove previous resize Timeout
            if (self.resizeTimeout !== null) {
                window.clearTimeout(self.resizeTimeout);
            }
            // Wait 1/2 second for end of resize event
            self.resizeTimeout = window.setTimeout(function () {
                window.clearTimeout(_self.resizeTimeout);
                _self.resizeHandler();
            },500);
        });

        window.addEventListener('scroll', function () {
            self.fireEvent('onScroll');
        });

    };

    Utilities.prototype.resizeHandler = function (e) {
        // Reset Breakpoint
        var oldPoint = this.breakpoint, newPoint = oldPoint;
        newPoint = this.getResponsiveBreakpoint();

        if (oldPoint !== newPoint) {
            this.breakpoint = newPoint;
        }

        // Only reload ads when breakpoint changes
        if (oldPoint !== this.breakpoint) {
            this.fireEvent('onBreakpointChange', newPoint, oldPoint);
        }
    };

    Utilities.prototype.fireEvent = function (event, arg1, arg2) {
        var i, cb, ctx;
        if (this.callbacks[event] !== undefined) {
            for (i = 0; i < this.callbacks[event].length; i++) {
                cb = this.callbacks[event][i];
                // We have a context
                if (cb[1] !== undefined) {
                    ctx = cb[1];
                }
                cb[0].apply(ctx, [arg1, arg2]);
            }
        }
    };

    // Pass args as strings of image urls.
    Utilities.prototype.preloadImages = function() {
        for (var i = 0; i < arguments.length; i++) {
            var img = new Image();
            img.src = arguments[i];
        }
    };

    Utilities.prototype.isLoggedIn = function () {
        var loggedIn = false,
            profilesCookie = $.cookie('TISub');

        if (profilesCookie !== undefined && profilesCookie !== '') {
            loggedIn = true;
        }

        return loggedIn;
    };

    Utilities.prototype.monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Returns the # of days in a given month (1-based, not 0-based) in a given 4-digit year. Ex. (1, 2015) for January 2015
    Utilities.prototype.getDaysInMonth = function (month, year) {
        return new Date(year, month, 0).getDate();
    };

    root.utilities = new Utilities();

    tgx_ad_slots.push(function(ads){
        ads.setUtilities(root.utilities);
    });

    return root.utilities;


})(this);


(function (root, factory) {
    /*
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        require('ti_ads', [], factory);
    } else {
        // Browser globals
        root.ti_ads = factory();
    }
    */
    root.ti_ads = factory(root);
}(this,
    function(root) {

        var utils = null;

        var ut = function () {};
        var utlp = ut.prototype;
        // Same as _.has()
        utlp.has =  has =  function(o, p){
            return o != null && Object.prototype.hasOwnProperty.call(o, p);
        };
        utlp.isArray = function(o) {
            return Array.isArray(o);
        };
        utlp.each = function (collection, iteratee) {
            return baseEach(collection, toFunction(iteratee));
        };
        utlp.getUrlParameter = function(key, alternateQueryString, noHash, delimiter) {
            delimiter = typeof delimiter == 'string' && delimiter !== '' ? delimiter : '&';
            key = key.replace(/[\[]/, '\\\[').replace (/[\]]/, '\\\]');
            var regex = new RegExp('[\\?' + delimiter + ']' + key + '=([^' + delimiter + (typeof noHash == 'boolean' && noHash ? '' : '#') + ']*)');
            var result = regex.exec (typeof alternateQueryString == 'string' && alternateQueryString.length > 0 ? '?' + alternateQueryString : location.href);
            return result === null ? '' : result [1];
        };
        var utl = new ut();

        // Constructor
        var Ads = function () {

            // Default amount of pixel the viewport should be with in for a 'deferred' ad to load
            this.DEFER_PIXEL_AMOUNT = 300;

            // List of breakpoints in order of size
            this.adBreakPoints = [[768, 'sm'], [1024, 'md'], [1280, 'lg'], [1400, 'xl']];

            // Override default breakpoints
            if (window.RS !== undefined && window.RS.environment_vars !== undefined && window.RS.environment_vars.breakpoints !== undefined) {
                this.adBreakPoints = window.RS.environment_vars.breakpoints;
            }

            // Collection of ad slots on the page
            this.adSlots = [];
            // Keeps track of ad size calls to refresh after max calls per size
            this.adCalls = {};
            // Maximum call per ad size before updating correlator
            this.maxCallsPerSize = 3;
            // Track position values
            this.position = {};

            // Exclusive ad ID.. that should be hidden when other ads come into view
            this.exclusive = [];

            // What is the current break point
            this.breakpoint = this.getResponsiveBreakpoint();

            this.resizeTimeout = null;

            // 1 == position one, 2 == originally domReady, 3 == all loaded
            this.currentPriority = 1;


            // Keep track of scroll position.
            this.lastScrollRecord = 0;
            this.scrollDebounce = 100;

            // Milliseconds to wait until next refresh or removal so we get viewability
            this.deferAdRefresh = 2000;

            this.adConfig = (typeof rsAdConfig !== 'undefined') ? rsAdConfig : {};
            this.tgx = {};
            this.dfpConfig = {};
            this.adFactory = {};
            this.setUpAds();
            this.hatInitialized = false;
            this.domIsReady = false; // domready has not yet fired
        };

        Ads.prototype.setUtilities = function (u) {
            utils = u;
            this.pageListener();
        };


        Ads.prototype.getResponsiveBreakpoint = function () {
            // For rendering optimization we get the initial browser width
            // which is calculated very early on to prevent unneeded 'forced synchronous layout'
            var i, point, browser_width = (function () {
                var width;
                if (document.body && document.body.offsetWidth) {
                    width = document.body.offsetWidth;
                }
                if (document.compatMode === 'CSS1Compat' &&
                    document.documentElement &&
                    document.documentElement.offsetWidth ) {
                    width = document.documentElement.offsetWidth;
                }
                if (window.innerWidth) {
                    width = window.innerWidth;
                }

                return width;
            })();

            if (utils !== null) {
                return utils.getResponsiveBreakpoint();
            }
            for (i = 0; i < this.adBreakPoints.length; i++) {
                point = this.adBreakPoints[i];
                if (browser_width < point[0]) {
                    return point[1];
                }
            }

            // If browser_width isn't less than any of the breakpoints, return the last/largest size.
            return point[1];
        };

        Ads.prototype.deferSetUpAds = function () {
            window._tmp_ti_ads = this;
            var js = '<script>window._tmp_ti_ads.setUpAds(); window._tmp_ti_ads = undefined;</script>';
            document.write(js);
        };

        Ads.prototype.setUpAds = function () {
            var c = this.adConfig, tgx, af, zone = '', i, _this = this;

            this.ti_dfp_config = {
                setTargeting: {
                }, // additional targeting globally
                setGlobalTargeting: {},
                enableSingleRequest: false, // expecting the call to be done in SRA
                collapseEmptyDivs: true, // this is different than jquery.dfp. if (false) we call googletag.pubads().collapseEmptyDivs(), if (true) we call googletag.pubads().collapseEmptyDivs(true)  see - https://support.google.com/dfp_premium/answer/3072674
                sitename: c['TiiAdConfig'].indexOf('.') !== -1 ? c['TiiAdConfig'].substring(c['TiiAdConfig'].indexOf('.') + 1) : c['TiiAdConfig']
            };

            if (c['zone'] !== undefined) {
                this.ti_dfp_config.zone = c['zone'];
            }

            if (c['CmSitename'] !== undefined) {
                this.adConfig.cmsitename = c['CmSitename'];
            }
            else {
                this.adConfig.cmsitename = this.ti_dfp_config.sitename;
            }

            if (c['channel'] !== undefined) {
                this.ti_dfp_config.setGlobalTargeting.ch = c['channel'];
            }

            if (c['subchannel'] !== undefined) {
                this.ti_dfp_config.setGlobalTargeting.sch = c['subchannel'];
            }

            if (c['articleId'] !== undefined) {
                this.ti_dfp_config.setGlobalTargeting.aid = c['articleId'];
            }

            if (c['contentType'] !== undefined) {
                this.ti_dfp_config.setGlobalTargeting.ctype = c['contentType'];
            }

            if (c['contentPage'] !== undefined) {
                this.ti_dfp_config.setGlobalTargeting.ptype = 'content';
            }

            if (c['packageId'] !== undefined) {
                this.ti_dfp_config.setGlobalTargeting.pid = c['packageId'];
            }

            if (c['params'] !== undefined) {
                for (i in c['params']) {
                    if (c['params'].hasOwnProperty(i)) {
                        this.ti_dfp_config.setGlobalTargeting[i] = c['params'][i];
                    }
                }
            }

            if (c['debugads'] !== undefined) {
                this.ti_dfp_config.debug = c['debugads'];
            }

            if (c['testads'] !== undefined) {
                this.ti_dfp_config.testads = c['testads'];
            }

            this.getZoneOverride();

            window.time_dfp.push(function(){window.time_dfp.init(_this.ti_dfp_config);});


            window.addEventListener('dfp.slotRenderEnded', function(e) {
                _this.evntAdRendered(e);
            });

            // Execute FF PreAd before any ad calls
            this.firefoxPreAd(true);

            // Execute predefined ad slots
            if (window.tgx_ad_slots !== undefined && utl.isArray(window.tgx_ad_slots)) {
                _tgx_ad_slots = window.tgx_ad_slots;

            }

            async_runner = function(func) {
                func.call(_this, _this);
            };

            window.tgx_ad_slots = {push: async_runner};

            for (i = 0, len = _tgx_ad_slots.length; i < len; i++) {
                window.tgx_ad_slots.push(_tgx_ad_slots[i]);
            }


            if (document.readyState != 'loading'){
                    this.domReady();
            } else {
                document.addEventListener('DOMContentLoaded', function () { _this.domReady();});
            }
        };

        // Fire ads deferred for dom ready
        Ads.prototype.domReady = function () {
            this.domIsReady = true;
            this.loadDeferredAds();
        };

        Ads.prototype.pageListener = function () {
            var self = this;

            // Listen for Breakpoint changes, and reload ads if necessary
            utils.add_listener('onBreakpointChange', function (newPoint, oldPoint) {
                self.onBreakpointChange(newPoint, oldPoint);
            });

            utils.add_listener('onScroll', function () {
                if (self.debounceScroll()) {
                    self.trackView();
                    self.loadDeferredAds();
                }
            });
        };

        // Debouce scroll so we don't fire repaints too often
        Ads.prototype.debounceScroll = function() {
            var top  = window.pageYOffset || document.documentElement.scrollTop;
                //left = window.pageXOffset || document.documentElement.scrollLeft;
            if (Math.abs(top - this.lastScrollRecord) > this.scrollDebounce) {
                this.lastScrollRecord = top;
                return true;
            }
            return false;
        };

        // Callback for breakpoint change
        Ads.prototype.onBreakpointChange = function (newPoint, oldPoint) {
            // Reset Breakpoint
            this.breakpoint = newPoint;

            // Only reload ads when breakpoint changes
            this.reRenderResponsiveAds(newPoint, oldPoint);
        };

        // Loads deferred ads
        // type = type of deferred ada to load, defaults to Pixels (lazy loading)
        Ads.prototype.loadDeferredAds = function (type) {
            var slot;

            // Determine what breakpoint this width is in
            for (var i in this.adSlots) {
                slot = this.adSlots[i];

                // for some reason we need to do this
                if (typeof slot === 'function') {
                    continue;
                }

                // Is slot already rendered
                if (slot.rendered) {
                    continue;
                }

                if (this.okToRender(slot)) {
                    this.firefoxPreAd();
                    this.renderAd(+i);
                }
            }
            if (this.domIsReady && this.currentPriority < 4) {
                this.currentPriority++;
                this.loadDeferredAds();
            }
        };

        // Fire inView/ofOufView events for slots with 'trackView' set
        Ads.prototype.trackView = function (type) {
            var slot, callback;

            for (var i in this.adSlots) {
                slot = this.adSlots[i];

                // Only track specified slots
                if (!utl.has(slot, 'trackView') || (utl.has(slot, 'trackView') && !slot.trackView)) {
                    continue;
                }

                callback = this.getResponsiveAd(slot, 'callback');

                // determine if ad slot is in view or not
                if (this.verge.inViewport(slot.el) && !slot.viewStatus) {
                    slot.viewStatus = true;
                    // Invoke callback if provided
                    if (callback !== false) {
                        callback.apply(slot, ['inView']);
                    }
                } else if (!this.verge.inViewport(slot.el) && slot.viewStatus) {
                    slot.viewStatus = false;
                    // Invoke callback if provided
                    if (callback !== false) {
                        callback.apply(slot, ['outOfView']);
                    }
                }
            }

        };

        /**
         * Adds a new Ad Slot
         *
         * Structure of an AdSlot object
         * var adSlot = {
         *      // default ad size, if ad is not responsive this is required
         *      width: 300,
         *      height: 250,
         *
         *      // Optional: For Consumer Ads set to true
         *      cm: true,
         *
         *      // Optional: Additional Params to use setParam()
         *      params: {
         *          cmpos: 'featuredstrybar',
         *          cmtyp: 'tout'
         *      },
         *
         *      // Optional if not responsive: Array of responsive ad sizes based on break point name
         *      responsive: {
         *          'micro': [],    // 450px
         *          'small': [],    // 750px
         *          'medium': [],   // 800px
         *          'large': [],    // 1024px
         *          'larger': [],   // 1206px
         *      },
         *
         *      // Optional: Defer ad load until within given amount of pixels
         *      defer: ads.DEFER_PIXEL_AMOUNT, // should default to 100 pixels
         *
         *      // Force a position value. and subsequent call to the sizes will increase the position value
         *      position: 1,
         * }
         *
         * @param slot
         */
        Ads.prototype.addSlot = function (slot) {
            // Default rendered value
            var slotIndex;
            slot.rendered = false;
            slot.viewStatus = false;

            //Set default slot correlator status.
            if (slot.updateCorrelator === undefined) {
              slot.updateCorrelator = false;
            }

            // Cached the slot Element for optimization
            slot.el = document.getElementById(slot.id);

            // Add slot to slot list
            slotIndex = this.adSlots.push(slot) - 1;


            if (utl.has(slot, 'exclusive')) {
                this.exclusive.push(slot.id);
            }

            if (this.okToRender(slot)) {
                this.renderAd(slotIndex);
            }
            this.loadDeferredAds();
        };

        // Constructs an ad call
        Ads.prototype.renderAd = function (index) {
            var ad, i, slot = this.adSlots[index], adSizes = this.getResponsiveAd(slot, 'sizes'), position,
                adClass = this.getResponsiveAd(slot, 'class'), callback = this.getResponsiveAd(slot, 'callback'), ad;

            if (adSizes === false) {
                return;
            }

            ad = {
                id: slot.id,
                size: this.breakOutSize(adSizes),
                targeting: {}
            };

            if (adSizes === false) {
                return;
            }
            
            //Trigger updateCorrelator() if slot set to TRUE.
            if (slot.updateCorrelator === true) {
              this.resetAdCalls();
              this.updateCorrelator();
            }
            
            // Determine if we need to update correlator
            this.trackAdSizes(adSizes);

            if (utl.has(slot, 'cm') && slot.cm) {
                // cm Ad
                ad.targeting.cmpos = this.getPosition(adSizes);
                ad.targeting.cmtyp = "";
                ad.sitename = this.adConfig.cmsitename;
            }

            // Apply additional parameters if set
            if (utl.has(slot, 'params')) {
                for (i in slot.params) {
                    if (slot.params.hasOwnProperty(i)) {
                        ad.targeting[i] = slot.params[i];
                    }
                }
            }

            // Use Position value or calculate new one
            if (utl.has(slot, 'position')) {
                this.setPositions(adSizes, slot.position);
                position = slot.position;
            }
            else {
                position = this.getPosition(adSizes);
            }
            ad.targeting.pos = position;

            slot.el.innerHTML = '';

            if (utl.has(slot, 'companion')) {
                ad.companion = true;
            }

            window.time_dfp.push(function(){
                window.time_dfp.defineSlot(ad);
            });

            // Set rendered property
            this.adSlots[index].rendered = true;
            this.adSlots[index].lastRendered = Date.now();

            // Append class if specified
            if (adClass !== false) {
                if (utl.isArray(adClass)) {
                    for (i = 0; i < adClass.length; i++) {
                        if (slot.el.classList) {
                            slot.el.classList.add(adClass[i]);
                        }
                        else {
                            slot.el.className += ' ' + adClass[i];
                        }
                    }
                }
                else {
                    if (slot.el.classList) {
                        slot.el.classList.add(adClass);
                    }
                    else {
                        slot.el.className += ' ' + adClass;
                    }
                }
            }

            // Invoke callback if provided
            if (callback !== false) {
                callback.apply(slot, ['render', adSizes, this.breakpoint]);
            }

        };

        Ads.prototype.okToRender = function (slot) {
            // Determine ad priority
            var load = true;
            var priority = 2;

            if (utl.has(slot, 'position') && +slot.position === 1) {
                // Don't load ads position > 1 if priority ads have not fired yet
                priority = 1;
            }

            if (utl.has(slot, 'priority')) {
                // Don't load ads position > 1 if priority ads have not fired yet
                priority = +slot.priority;
            }

            // Determine if the ad is deferred for later
            // Possible values for 'defer' are
            // int - i.e. 100, 300 etc for amount of pixels
            // string  -/D/s int + 's' for amount of seconds
            // string - 'domReady' -- load after domReady
            if (utl.has(slot, 'defer')) {
                /*
                if (slot.defer === 'domready' && !this.domIsReady) {
                    // Dom is not yet ready, this ad slot will be called later
                    return true;
                }
                */
                // is lazy loaded add in viewport
                if (!this.verge.inViewport(slot.el, slot.defer)) {
                    load = false;
                }

            }

            // Are we in the right priority
            if (priority > this.currentPriority) {
                load = false;
            }

            return load;
        };

        Ads.prototype.evntAdRendered = function(e) {
            var adId, slotId, el, slot, callback;
            if (e.detail.arg.isEmtpy) {

            }
            else {
                adId = e.detail.arg.slot.getSlotId().getDomId();
                //el = document.getElementById(adId);
                //slotId = el.parentElement.id;
                slot = this.getSlotById(adId);
                if (slot !== false) {
                    callback = this.getResponsiveAd(slot, 'callback');
                    // Invoke callback if provided
                    if (callback !== false) {
                        callback.apply(slot, ['rendered', e]);
                    }
                }
            }
        };


        Ads.prototype.reRenderResponsiveAds = function (newPoint, oldPoint) {
            var i, i2, slot, adClass, callback;

            for (i in this.adSlots) {

                slot = this.adSlots[i];

                if (utl.has(this.adSlots, i) && utl.has(slot, 'responsive')) {

                    adClass = this.getResponsiveAd(slot, 'class', oldPoint);
                    callback = this.getResponsiveAd(slot, 'callback', oldPoint);

                    // Clear contents
                    slot.el.innerHTML = '';
                    // unhide if hidden
                    slot.el.style.display = '';


                    // Remove adClass on the slot
                    if (adClass !== false) {
                        if (utl.isArray(adClass)) {
                            for (i2 = 0; i2 < adClass.length; i2++) {
                                if (slot.el.classList) {
                                    slot.el.classList.remove(adClass[i2]);
                                }
                                else {
                                    slot.el.className = slot.el.className.replace(new RegExp('(^|\\b)' + adClass[i2].split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
                                }
                            }
                        }
                        else {
                            if (slot.el.classList) {
                                slot.el.classList.remove(adClass);
                            }
                            else {
                                slot.el.className = slot.el.className.replace(new RegExp('(^|\\b)' + adClass.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
                            }
                        }
                    }

                    this.adSlots[i].rendered = false;

                    // Invoke callback if provided
                    if (callback !== false) {
                        callback.apply(slot, ['remove', false, newPoint, oldPoint]);
                    }

                    if (utl.has(slot, 'defer')) {
                        if (!this.verge.inViewport(slot.el, slot.defer)) {
                            continue;
                        }
                    }
                    this.firefoxPreAd();
                    this.renderAd(+i);
                }
            }

        };

        Ads.prototype.firefoxPreAd = function (firstTime) {
            var ad;
            var adSizes = ['2x1','2x9'];
            var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
            var divEl;
            var bodyEl;
            var slotId = 'ffPreAd' + this.adSlots.length; // Number to ad uniqueness to the slot

            if (!isFirefox) {
                return;
            }

            // disable for now
            return;

            divEl = document.createElement('div');
            divEl.setAttribute('id', slotId);
            divEl.setAttribute('style', 'display:none');

            bodyEl = document.body;
            bodyEl.appendChild(divEl);

            ad = adFactory.getMultiAd(adSizes);
            ad.write(slotId);

            // Don't remove the Element if it's on the first time run. as the OOP call happens in the first ad call
            if (firstTime === undefined || !firstTime) {
                setTimeout(function() {
                    divEl.remove();
                }, 10000);
            }
        };

        Ads.prototype.getResponsiveAd = function (slot, attr, breakpoint) {
            var size, responsive_sizes, bp;

            // Set default attribute to pull out
            if (attr === undefined) {
                attr = 'sizes';
            }
            // Defaults to current breakpoint
            if (breakpoint === undefined) {
                breakpoint = this.breakpoint;
            }

            if (utl.has(slot, 'responsive')) {
                // Responsive ad
                if (utl.has(slot.responsive, breakpoint)) {
                    bp = slot.responsive[breakpoint];

                    // if responsive breakpoint is only a size we return false for other attributes
                    if (attr !== 'sizes' && !utl.has(bp, attr)) {
                        return false;
                    }
                    else if (attr !== 'sizes' && utl.has(bp, attr)) {
                        return bp[attr];
                    }

                    // Returning the right sizes
                    if (utl.isArray(bp)){
                        responsive_sizes = bp;
                    }
                    else {
                        // Breakpoint is an object, with a 'sizes' element
                        responsive_sizes = bp.sizes;
                    }

                    // Get size of the size array
                    if (responsive_sizes.length === 1) {
                        // for only one ad sizes we return array
                        size = responsive_sizes[0].split('x');
                        return [[size[0], size[1]]];
                    }
                    // for multiple ad sizes return list of sizes as [WxH, WxH]
                    return responsive_sizes;
                }
            }
            else {
                if (attr === 'sizes') {
                    return [[slot.width, slot.height]];
                }
                else if(utl.has(slot, attr)) {
                    return slot[attr];
                }
            }
            return false;
        };

        Ads.prototype.breakOutSize = function (sizes) {
            var size_array, size, i;
            if (sizes === false){
                return false;
            }
            if (!utl.isArray(sizes)){
                size = sizes.split('x');
                return [+size[0], +size[1]];
            }
            if (!utl.isArray(sizes[0]) && typeof sizes[0] === 'number'){
                return [+sizes[0], +sizes[1]];
            }
            size_array = [];
            for (i = 0; i < sizes.length; i++) {
                if (utl.isArray(sizes[i])) {
                    size_array.push([+sizes[i][0], +sizes[i][1]]);
                }
                else {
                    size = sizes[i].split('x');
                    size_array.push([+size[0], +size[1]]);
                }
            }

            if (size_array.length === 1) {
                size_array = size_array[0];
            }

            return size_array;
        };

        Ads.prototype.breakIndex = function (breakpoint) {
            if (breakpoint === undefined) {
                breakpoint = this.breakpoint;
            }
            // Determine what breakpoint this width is in
            for (var i in this.adBreakPoints) {
                if (this.adBreakPoints.hasOwnProperty(i)) {
                    point = this.adBreakPoints[i];

                    if (breakpoint === point[1]){
                        return +i;
                    }
                }
            }
            return false;
        };

        Ads.prototype.getZoneOverride = function () {
            var override = utl.getUrlParameter('adZoneOverride');
            if (override) {
              this.setZone(override);
            }
        };

        Ads.prototype.setZone = function (zone) {
            this.ti_dfp_config.zone = decodeURIComponent(zone);
        };

        Ads.prototype.trackAdSizes = function (adSizes) {
            var i, size;

            for (i in adSizes) {
                if (!adSizes.hasOwnProperty(i)) {
                    continue;
                }
                size = adSizes[i];
                if (utl.isArray(size)) {
                    // only one size
                    size = String(size[0]) + 'x' + String(size[1]);
                }
                if(this.adCalls[size] !== undefined && this.adCalls[size] >= this.maxCallsPerSize) {
                    // reset addCalls
                    this.resetAdCalls();
                    this.updateCorrelator();
                }

                if (this.adCalls[size] === undefined) {
                    this.adCalls[size] = 0;
                }

                this.adCalls[size]++;
            }
        };

        Ads.prototype.setPositions = function (adSizes, position) {
            var i, size;

            for (i in adSizes) {
                if (!adSizes.hasOwnProperty(i)) {
                    continue;
                }
                size = adSizes[i];

                if (utl.isArray(size)) {
                    // only one size
                    size = String(size[0]) + 'x' + String(size[1]);
                }
                this.setPosition(size);
            }
        };

        Ads.prototype.setPosition = function (size, position) {
            if (utl.isArray(size)) {
                // only one size
                size = String(size[0]) + 'x' + String(size[1]);
            }
            if (this.position[size] === undefined) {
                this.position[size] = 0;
            }

            if (position === undefined) {
                this.position[size]++;
            }
            else if (this.position[size] < position) {
                this.position[size] = position;
            }

            return this.position[size];
        };

        Ads.prototype.getPosition = function (adSizes) {
            var i, size, position = 0, t_position = 0;

            for (i in adSizes) {
                if (!adSizes.hasOwnProperty(i)) {
                    continue;
                }
                size = adSizes[i];
                if (utl.isArray(size)) {
                    // only one size
                    size = String(size[0]) + 'x' + String(size[1]);
                }

                t_position = this.setPosition(size);

                // Get the largest position from all the ad Calls
                if (t_position >= position) {
                    position = t_position;
                }
            }

            return position;
        };

        Ads.prototype.resetAdCalls = function () {
            this.adCalls = {}; // just reset the counting mechanism
        };

        Ads.prototype.updateCorrelator = function () {
            window.time_dfp.push(function(){window.time_dfp.updateCorrelator();});
        };

        Ads.prototype.refreshSlots = function (slots) {
            var i, slot;
            window.time_dfp.push(function(){window.time_dfp.refresh(slots);});
            for (i = 0; i < slots.length; i++) {
                slot = this.getSlotById(slots[i]);
                slot.lastRendered = Date.now();
            }
        };

        Ads.prototype.refireSlots = function (slots) {
            var i, slot, callback;
            for (i = 0; i < slots.length; i++) {
                slot = this.getSlotById(slots[i]);

                callback = this.getResponsiveAd(slot, 'callback', this.breakpoint);

                // Clear contents
                slot.el.innerHTML = '';
                // unhide if hidden
                slot.el.style.display = '';
                slot.rendered = false;

                // Invoke callback if provided
                if (callback !== false) {
                    callback.apply(slot, ['remove', false]);
                }

                if (utl.has(slot, 'defer')) {
                    if (!this.verge.inViewport(slot.el, slot.defer)) {
                        continue;
                    }
                }
                this.firefoxPreAd();
                this.renderAd(this.getSlotIndexById(slots[i]));
            }
        };

        Ads.prototype.getSlotById = function (id) {
            var i, slot;
            for (i = 0; i < this.adSlots.length; i++) {
                slot = this.adSlots[i];
                if (slot.id === id) {
                    return slot;
                }
            }
            return false;
        };

        Ads.prototype.getSlotIndexById = function (id) {
            var i, slot;
            for (i = 0; i < this.adSlots.length; i++) {
                slot = this.adSlots[i];
                if (slot.id === id) {
                    return i;
                }
            }
            return false;
        };

        // Hide specific Ad Div, set force if should be forced to hide if it's under this.deferAdRefresh limit
        Ads.prototype.hide = function (id, force) {
            var slot = this.getSlotById(id), lastRendered;
            lastRendered = Date.now() - slot.lastRendered;
            if (
                (slot.lastRendered === undefined || (force !== undefined && force))
                || (slot.rendered && lastRendered > this.deferAdRefresh)) {
                slot.el.style.display = 'none';
            } else if (lastRendered < this.deferAdRefresh && slot.rendered && slot.el.style.pendingHide === undefined) {
                slot.el.style.pendingHide = true;
                setTimeout(function(){
                    slot.el.style.pendingHide = undefined;
                    slot.el.style.display = 'none';
                }, this.deferAdRefresh - lastRendered);
            }
        };

        // Re-display an ad div hidden by .hide(). Set 'force' to reloade with in the 'deferAdRefresh' threshold.
        Ads.prototype.show = function (id, refresh, force) {
            var slot = this.getSlotById(id), _this = this, lastRendered;
            if (slot.el.style.display === 'none' || (force !== undefined && force)) {
                slot.el.style.display = '';
                if (refresh !== undefined) {
                    this.refreshSlots([id]);
                }
            } else if (slot.el.style.pendingHide !== undefined) {
                setTimeout(function(){
                    if (slot.el.style.display === 'none') {
                        slot.el.style.display = '';
                        if (refresh !== undefined) {
                            _this.refreshSlots([id]);
                        }
                    }
                }, this.deferAdRefresh);
            }
        };


        //https://github.com/ryanve/verge
        (function(root, name, make) {
            if (typeof module != 'undefined' && module['exports']) module['exports'] = make();
            else root[name] = make();
        }(Ads.prototype, 'verge', function() {

            var xports = {}
                , win = typeof window != 'undefined' && window
                , doc = typeof document != 'undefined' && document
                , docElem = doc && doc.documentElement
                , matchMedia = win['matchMedia'] || win['msMatchMedia']
                , mq = matchMedia ? function(q) {
                    return !!matchMedia.call(win, q).matches;
                } : function() {
                    return false;
                }
                , viewportW = xports['viewportW'] = function() {
                    var a = docElem['clientWidth'], b = win['innerWidth'];
                    return a < b ? b : a;
                }
                , viewportH = xports['viewportH'] = function() {
                    var a = docElem['clientHeight'], b = win['innerHeight'];
                    return a < b ? b : a;
                };

            /**
             * Test if a media query is active. Like Modernizr.mq
             * @since 1.6.0
             * @return {boolean}
             */
            xports['mq'] = mq;

            /**
             * Normalized matchMedia
             * @since 1.6.0
             * @return {MediaQueryList|Object}
             */
            xports['matchMedia'] = matchMedia ? function() {
                // matchMedia must be binded to window
                return matchMedia.apply(win, arguments);
            } : function() {
                // Gracefully degrade to plain object
                return {};
            };

            /**
             * @since 1.8.0
             * @return {{width:number, height:number}}
             */
            function viewport() {
                return {'width':viewportW(), 'height':viewportH()};
            }
            xports['viewport'] = viewport;

            /**
             * Cross-browser window.scrollX
             * @since 1.0.0
             * @return {number}
             */
            xports['scrollX'] = function() {
                return win.pageXOffset || docElem.scrollLeft;
            };

            /**
             * Cross-browser window.scrollY
             * @since 1.0.0
             * @return {number}
             */
            xports['scrollY'] = function() {
                return win.pageYOffset || docElem.scrollTop;
            };

            /**
             * @param {{top:number, right:number, bottom:number, left:number}} coords
             * @param {number=} cushion adjustment
             * @return {Object}
             */
            function calibrate(coords, cushion) {
                var o = {};
                cushion = +cushion || 0;
                o['width'] = (o['right'] = coords['right'] + cushion) - (o['left'] = coords['left'] - cushion);
                o['height'] = (o['bottom'] = coords['bottom'] + cushion) - (o['top'] = coords['top'] - cushion);
                return o;
            }

            /**
             * Cross-browser element.getBoundingClientRect plus optional cushion.
             * Coords are relative to the top-left corner of the viewport.
             * @since 1.0.0
             * @param {Element|Object} el element or stack (uses first item)
             * @param {number=} cushion +/- pixel adjustment amount
             * @return {Object|boolean}
             */
            function rectangle(el, cushion) {
                el = el && !el.nodeType ? el[0] : el;
                if (!el || 1 !== el.nodeType) return false;
                return calibrate(el.getBoundingClientRect(), cushion);
            }
            xports['rectangle'] = rectangle;

            /**
             * Get the viewport aspect ratio (or the aspect ratio of an object or element)
             * @since 1.7.0
             * @param {(Element|Object)=} o optional object with width/height props or methods
             * @return {number}
             * @link http://w3.org/TR/css3-mediaqueries/#orientation
             */
            function aspect(o) {
                o = null == o ? viewport() : 1 === o.nodeType ? rectangle(o) : o;
                var h = o['height'], w = o['width'];
                h = typeof h == 'function' ? h.call(o) : h;
                w = typeof w == 'function' ? w.call(o) : w;
                return w/h;
            }
            xports['aspect'] = aspect;

            /**
             * Test if an element is in the same x-axis section as the viewport.
             * @since 1.0.0
             * @param {Element|Object} el
             * @param {number=} cushion
             * @return {boolean}
             */
            xports['inX'] = function(el, cushion) {
                var r = rectangle(el, cushion);
                return !!r && r.right >= 0 && r.left <= viewportW();
            };

            /**
             * Test if an element is in the same y-axis section as the viewport.
             * @since 1.0.0
             * @param {Element|Object} el
             * @param {number=} cushion
             * @return {boolean}
             */
            xports['inY'] = function(el, cushion) {
                var r = rectangle(el, cushion);
                return !!r && r.bottom >= 0 && r.top <= viewportH();
            };

            /**
             * Test if an element is in the viewport.
             * @since 1.0.0
             * @param {Element|Object} el
             * @param {number=} cushion
             * @return {boolean}
             */
            xports['inViewport'] = function(el, cushion) {
                // Equiv to `inX(el, cushion) && inY(el, cushion)` but just manually do both
                // to avoid calling rectangle() twice. It gzips just as small like this.
                var r = rectangle(el, cushion);
                return !!r && r.bottom >= 0 && r.right >= 0 && r.top <= viewportH() && r.left <= viewportW();
            };

            return xports;
        }));


        // Return instance for use throughout the page, just Require it.
        var ads = new Ads();
        return ads;
    }
));
