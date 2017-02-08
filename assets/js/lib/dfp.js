/* globals window */

/**
 * Track tracking for 3rd party tracking for DFP
 */

(function(window) {

    var tracking =  function () {
        var _this = this;

        window.addEventListener('dfp.beforeInit', function(e) {
            _this.fireEvents(_this.onInit, [e.detail.dfp]);
        });

        window.addEventListener('dfp.afterInit', function(e) {
            _this.fireEvents(_this.onAfterInit, [e.detail.dfp]);
        });

        window.addEventListener('dfp.defineSlot', function(e) {
            _this.fireEvents(_this.defineSlot, [e.detail.dfp, e.detail.arg]);
        });

        window.addEventListener('dfp.slotBeforeDisplay', function(e) {
            _this.fireEvents(_this.displaySlot, [e.detail.dfp, e.detail.arg]);
        });

        window.addEventListener('dfp.refresh', function(e) {
            _this.fireEvents(_this.onRefresh, [e.detail.dfp]);
        });

        window.addEventListener('dfp.slotRefresh', function(e) {
            _this.fireEvents(_this.onSlotRefresh, [e.detail.dfp, e.detail.arg]);
        });

        this.onInit = [];
        this.onAfterInit = [];
        // Before Refresh
        this.onRefresh = [];
        this.onSlotRefresh = [];
        this.defineSlot = [];
        this.displaySlot = [];
        this.blockLoad = false;
    };

    tracking.prototype.fireEvents = function (eventArray, e) {
        var i, len;
        for (i = 0, len = eventArray.length; i < len; i++) {
            try {
                eventArray[i].apply(window, e);
            }
            catch (e) {
                console.error('error: tracking.fireEvents - ' + eventArray[i].toString());
                console.error(e);
            }
        }
    };

    window.dfp_tracking = new tracking();

})(window);
/* globals window, document, googletag */

var amznads = amznads || {};

(function() {

    var onInit = function(dfp) {
        var startTime = Date.now(), sleepRound, session_complete = false;
        if( !( typeof dfp.config.amazon !== 'undefined' && dfp.config.amazon === false ) ) {
            sleepRound = dfp.sleep("amazon");
            amznads.asyncParams = {
                'id': '3042',
                'callbackFn': function() {
                    try {
                        amznads.setTargetingForGPTAsync('amznslots');
                    } catch (e) { /*ignore*/ }
                    /* Continue your DFP call here (optional) */
                    dfp.log('Amazon Loaded in ' + (Date.now() - startTime) + ' milliseconds');
                    if (!session_complete) {
                        dfp.wakeup("amazon", sleepRound);
                    }
                    else {
                        dfp.log('Amazon Already woke up dfp, bypassing wakeup()');
                    }
                    session_complete = true;
                },
                'timeout': 2e3
            };
            (function() {
                var head = document.head || document.getElementsByTagName('head')[0], a;
                a = document.createElement('script');
                a.type = 'text/javascript';
                a.async = true;
                //Amazone ads url was explicitely http protocol so i removed http: so that it will work on both protocols.
                a.src = '//c.amazon-adsystem.com/aax2/amzn_ads.js';
                head.appendChild(a); //append after gpt.js
            })();
        }
    };

    var onRefresh = function (dfp) {
        var sleepRound = dfp.sleep('amazon'), _dfp = dfp;
        (function() {
            googletag.cmd.push(function() {
                googletag.pubads().clearTargeting('amznslots'); //clear custom targeting value by key
                var amazonCallbackFunction = function() {
                    amznads.setTargetingForGPTAsync('amznslots');  //reset custom targeting value by key
                    _dfp.wakeup("amazon", sleepRound);
                };
                amznads.getAdsCallback('3042', amazonCallbackFunction);
            });
        })();
    };

    if (window.dfp_tracking !== undefined) {
        window.dfp_tracking.onInit.push(onInit);
        window.dfp_tracking.onRefresh.push(onRefresh);
    }

})();

/* globals window, document, COMSCORE */

var amznads = amznads || {};

(function() {

    var onInit = function(dfp) {
        if( !( typeof dfp.config.comscore !== "undefined" && dfp.config.comscore === false )){
            ( function( d, a ) {
                var s = d.createElement( a ),
                    x = d.getElementsByTagName( a )[ 0 ];
                s.async = true;
                s.src = "//b.scorecardresearch.com/beacon.js?c1=2&c2=6035728";
                x.parentNode.insertBefore( s, x );
            })( document, "script" );
        }
    };

    var onRefresh = function () {
        var url;
        if ( typeof COMSCORE  == "object" ) {
            url = ( arguments.length == 1 ? arguments[ 0 ] : document.location );
            COMSCORE.beacon({
                c1:2,
                c2:6035728,
                c4: url
            });
        }
    };

    if (window.dfp_tracking !== undefined) {
        window.dfp_tracking.onInit.push(onInit);
        window.dfp_tracking.onRefresh.push(onRefresh);
    }

})();

(function() {

    var onInit = function(dfp) {
        var dfpUtil = dfp.dfpUtil;
        var platformVal = dfpUtil.getCookie('TI_PREFS');
        dfp.config.setTargeting = dfp.config.setTargeting || {};
        if(navigator.userAgent.match(/iPad/i) || platformVal === 'tablet'){
            dfp.config.setTargeting.plat = "tablet";
        } else if (navigator.userAgent.match(/Mobi/)||platformVal === 'phone'||platformVal === 'iphone'){
            dfp.config.setTargeting.plat = "mobile";
        } else {
            dfp.config.setTargeting.plat = "desktop";
        }

        dfp.config.setGlobalTargeting = dfp.config.setGlobalTargeting || {};
        /*
         if( typeof dfpUtil.zone !== "undefined" && typeof dfp.config.setTargeting.zone === "undefined"){
         dfp.config.setTargeting.zone = dfpUtil.zone;
         }
         //*/

        if (dfp.config.useBehaviorTracking  || dfp.config.useRevSciTracking) {
            var rsi_segs = [], segs = [];
            var rsi_cookie = dfpUtil.getCookie("rsi_segs");
            var segLen = 10;
            var segQS = "", segArr = [];
            if (rsi_cookie !== null) {
                rsi_segs.rsi_cookie.split("|");
            }
            if (rsi_segs.length < segLen){
                segLen = rsi_segs.length;
            }

            for (var i = 0; i < segLen; i++){
                segArr = rsi_segs[i].split("_");
                if (segArr.length > 1) {
                    segs.push(segArr[1]);
                    //segQS += ("rsi" + "=" + segArr[1] + ";")
                }
            }

            dfp.config.setGlobalTargeting.rsseg = segs;
        }

        if (dfp.config.useQuantcastTracking) {
            var _qsegs = [], i;
            var _qsegs_cookie = dfpUtil.getCookie("__qseg")
            var segLen = _qsegs.length;
            var segArray = [];
            var segs = [];
            if (_qsegs_cookie !== null) {
                _qsegs = _qsegs_cookie.split("|");
            }
            segs[0] = "";
            for (i = 0; i < segLen && i < 10; i++ ){
                segArray = _qsegs[i].split("_");
                if (segArray.length>1){
                    segs.push(segArray[1]);
                }
            }

            dfp.config.setGlobalTargeting.qc = segs;
        }

        if (dfp.config.useTacodaTracking) {
            var tcd_segs = [];
            var tcd_segs_cookie = dfpUtil.getCookie("AxData")
            var segs = [];
            if (tcd_segs_cookie !== null) {
                tcd_segs = tcd_segs_cookie.split("#");
            }

            if(tcd_segs.length > 0 && tcd_segs[1].indexOf("|") > 0) {
                tcd_segs = tcd_segs[1].split("|");
                var segLen = "", segArr = new Array()
                segLen = tcd_segs.length;
                for (var i = 0; i < segLen; i++){
                    segs.push(tcd_segs[i]);
                }
            } else {
                segs.push(tcd_segs[1]);
            }

            dfp.config.setGlobalTargeting.tcseg = segs;
        }

        var referrerDomain = document.referrer.split("/")[2];
        dfp.config.setGlobalTargeting.domain = document.URL.split("/")[2];
        if (document.referrer != "") {
            dfp.config.setGlobalTargeting.rhost = referrerDomain;
        }

        if (typeof referrerDomain == "undefined" || referrerDomain != dfp.config.setGlobalTargeting.domain) {
            dfp.config.setGlobalTargeting.pu = 0;
        }

        return dfp.config;
    };

    if (window.dfp_tracking !== undefined) {
        window.dfp_tracking.onInit.push(onInit);
    }

})();

(function() {
    /**
     * Tealium UDO object for dfp
     * @type {object}
     * @class tealiumdfp
     */
    var tealiumdfp = {
        /**
         * Status for tealium
         * @type {boolian}
         */
        status: false,
        /**
         * Tealium udo mapping for the DFP
         */
        map:{
            "targeting":{
                "slot":{
                    "aid":"content_id",
                    "ch":"site_section1",
                    "pid":"content_package_id",
                    "sch":"site_section2",
                    "ptype":"pi_page_type",
                    "ctype":"template_type",
                },
                "page":{},
            }//,
            //"config":{
            //"sitename":"channel"
            //"cmsitename":"TBD",
            //"zone":"TBD"
            //}
        },
        /**
         * get Tealium value from page if defined
         * @param {string} key
         * @returns {*}
         */
        get:function(key){
            return window.Ti.udo_metadata[key];
        },
        /**
         * Adding page level targeting key value from tealium
         * @param {object} conf
         * @param {object} dfp
         */
        addDfpTargeting:function(conf, dfp){
            var self =this;
            for(var gk in conf){
                if(self.checkIsDefined(gk)){
                    dfp.config.setTargeting[gk] = self.get(conf[gk]);
                }
            }
        },
        /**
         * Adding slot lovel targeting key value from tealium
         * @param {object} conf
         * @param {object} dfp
         */
        addSlotTargeting:function(conf, dfp){
            var self =this;
            for(var sk in conf){
                if(self.checkIsDefined(sk)){
                    dfp.config.setGlobalTargeting[sk] = self.get(conf[sk]);
                }
            }
        },
        /**
         * Adding configuration value from tealium
         * @param {object} conf
         * @param {object} dfp
         */
        addConfig:function(conf, dfp){
            var self =this;
            for(var ck in conf){
                if(self.checkIsDefined(ck)){
                    dfp.config[ck] = self.get(conf[ck]);
                }
            }
        },
        /**
         * Check wheather tealium value exist
         * @param  {string} key
         * @returns {boolean}
         */
        checkIsDefined:function(key){
            return (typeof window.Ti !== 'undefined' && typeof window.Ti.udo_metadata[key] !== 'undefined');
        },
        /**
         * Initialize Tealium Udo object
         * @param {object} dfp
         */
        init:function(dfp){
            if(typeof Ti !== 'undefined' && typeof Ti.udo_metadata !== 'undefined'){
                this.status = true;
                var self = this;
                dfp.config.setTargeting = dfp.config.setTargeting || {};
                dfp.config.setGlobalTargeting = dfp.config.setGlobalTargeting || {};

                for (var key in this.map){
                    if(key == 'targeting'){
                        for (var ekey in this.map[key]){
                            if(ekey=='slot'){
                                self.addSlotTargeting(this.map[key][ekey],dfp);
                            }

                            if(ekey=='page'){
                                self.addDfpTargeting(this.map[key][ekey],dfp);
                            }
                        }
                    }else{
                        self.addConfig(this.map[key],dfp);
                    }
                }
            }
        }
    };

    if (window.dfp_tracking !== undefined) {
        window.dfp_tracking.onInit.push(tealiumdfp.init);
    }
})();

/* globals window, document */

(function() {

    var onInit = function(dfp) {
        if( !( typeof dfp.config.evidon !== "undefined" && dfp.config.evidon === false ) ) {
            (function( d) {
                var evidonscript = document.createElement( "script" );
                evidonscript.async = true;
                evidonscript.type = "text/javascript";
                evidonscript.src = d.isSecure() ?
                    "https://a248.e.akamai.net/f/1016/606/2d/tiads-ssl.timeinc.net/ads/evidon.js" :
                    "http://tiads.timeinc.net/ads/evidon.js";
                var evidonnode =document.getElementsByTagName( "script" )[0];
                evidonnode.parentNode.insertBefore(evidonscript, evidonnode);
            })( dfp.dfpUtil);
        }
    };

    if (window.dfp_tracking !== undefined) {
        window.dfp_tracking.onInit.push(onInit);
    }

})();

/* globals window, document, headertag */

(function() {

    var session_complete = false;
    var propertyFileMap = {
        'rsm' : 'ls-realsimple.js',
        'ckl' : 'ls-cookinglight.js',
        'peo' : 'lls-people.js',
        'col' : 'ls-coastalliving.js',
        'enw' : 'ls-ew.js',
        'fw' : 'ls-foodandwine.js',
        'fort' : 'ls-fortune.js',
        'golf' : 'ls-golf.js',
        'hlt' : 'ls-health.js',
        'ins' : 'ls-instyle.js',
        'mre' : 'ls-myrecipes.js',
        'pesp' : 'ls-peopleenespanol.js',
        'si' : 'ls-si.js',
        'sol' : 'ls-southernliving.js',
        'sun' : 'ls-sunset.js',
        'sun' : 'ls-thedailycut.js',
        'thedrive' : 'ls-thedrive.js',
        'theoutfit' : 'ls-theoutfit.js',
        'thesnug' : 'ls-thesnug.js',
        'tim' : 'ls-time.js',
        'tl' : 'ls-travelandleisure.js',
        'mhi' : 'ls-myhomeideas.js',
        'ess' : 'ls-essence.js'
    };


    var onInit = function(dfp) {
        var src, head, a, startTime = Date.now(), loadEnd, sleepRound;
        sleepRound = dfp.sleep('Index Exchange');
        if (window.headertag_init_once) {
            return;
        }
        window.headertag_init_once = true;
        try {
            src = ('https:' == document.location.protocol ? 'https://js-sec' : 'http://js') + '.indexww.com/ht/' + propertyFileMap[dfp.config.sitename];
            head = document.head || document.getElementsByTagName('head')[0];
            a = document.createElement('script');
            a.type = 'text/javascript';
            a.onload = function() {
                dfp.log('Index Exchange loaded in ' + (Date.now() - startTime) + ' milliseconds');
                headertag.envoke_on_or_after_session_end(function(){
                    dfp.log('Index Exchange Retrieve Demand in ' + (Date.now() - loadEnd) + ' milliseconds');
                    session_complete = true;
                    dfp.wakeup('Index Exchange', sleepRound);
                });
                loadEnd = Date.now();
                headertag.retrieve_demand();
            };
            a.async = true;
            a.src = src;
            head.appendChild(a);
        }
        catch(e) {
            dfp.log('Index Exchange loading error.');
            console.log(e);
        }
    };

    /**
     * Apply Index Exchange Slot Targeting
     *
     * @param dfp - DFP library
     * @param slot - Actual DFP slot
     */
    var applyIndexExchange = function (dfp, slot) {
        var _slot = slot, _dfp = dfp, startTime = Date.now(), sleepRound;
        if (typeof headertag === 'object') {
            if (session_complete) {
                // only put to sleep if we have a previously succesfull retrieve demand
                // Otherwise it will hold up every render until it does.
                sleepRound = dfp.sleep('Index Exchange');
            }
            else {
                _dfp.log('Index Exchange Not Sleeping as we have not retrieved successful demand yet.');
            }
            headertag.retrieve_demand(function(){
                _dfp.log('Index Exchange Retrieve Demand in ' + (Date.now() - startTime) + ' milliseconds');
                headertag.set_slot_targeting(_slot);
                session_complete = true;
                _dfp.wakeup('Index Exchange', sleepRound);
            });
            session_complete = false;
        }
    };

    var onSlotDisplay = function(dfp, slot) {
        applyIndexExchange(dfp, slot);
    };

    /*
     var onSlotRefresh = function(dfp, slot) {
     applyIndexExchange(dfp, slot);
     };
     */
    var onRefresh = function (dfp) {
        var slots = dfp.getAdSlot(), dpf_slots = [];
        for (var i = 0; i < slots.length; i++) {
            dpf_slots.push(slots[i].dfpSlot);
        }
        applyIndexExchange(dfp, dpf_slots);
    };

    if (window.dfp_tracking !== undefined) {
        window.dfp_tracking.onInit.push(onInit);
        window.dfp_tracking.onRefresh.push(onRefresh);
        window.dfp_tracking.displaySlot.push(onSlotDisplay);
        //window.dfp_tracking.onSlotRefresh.push(onSlotRefresh);
    }

})();

(function() {

    var onInit = function(dfp) {
        var dfpUtil = dfp.dfpUtil;
        var _dfp = dfp;
        var sleepRound;
        var domain = dfpUtil.getRootDomain();
        var startTime = Date.now();
        var wokenup = false;

        var onLoad = function() {
            var response = requestAlchemy.responseText;
            var data = JSON.parse( response );
            dfp.log('OneBot Response in ' + (Date.now() - startTime) + ' milliseconds');


            if ( typeof data.trending !== "undefined" && data.trending ){
                dfp.config.setTargeting.trend = "yes";
            }

            if(data.message !== 'not found'){
                _dfp.log("OneBot Message Results");
                _dfp.log( JSON.stringify(data) );
                var tags; // Reuse defined variables as much as possible

                if( data.socialtags && data.socialtags.length > 0 ) {
                    tags = new Array();
                    for( var i=0; i < data.socialtags.length; i++ ) {
                        tags.push( data.socialtags[ i ] );
                    }

                    _dfp.config.setTargeting.Social_Tags = tags;
                }

                if ( data.taxons && data.taxons.length > 0 ) {
                    tags = new Array();
                    for ( var i=0; i < data.taxons.length; i++ ) {
                        if ( data.taxons[ i ].score >= 0.5 ) {
                            tags.push( data.taxons[ i ].name.replace( /\s+/g, "" ).replace( /:/g, "" ).replace( /\?/g, "" ) );
                        }
                    }

                    _dfp.config.setTargeting.Taxons = tags;
                }

                if ( data.concepts && data.concepts.length > 0 ) {
                    tags = new Array();
                    for ( var i=0; i < data.concepts.length; i++ ) {
                        if ( data.concepts[ i ].relevance >= 0.5 ) {
                            tags.push( data.concepts[ i ].name.replace( /\s+/g, "" ).replace( /:/g, "" ).replace( /\?/g, "" ) );
                        }
                    }

                    _dfp.config.setTargeting.Concepts = tags;
                }

                if(data.sentiment && data.sentiment.length > 0) {
                    var simpleSentiment;
                    if (data.sentiment[0] >= 0.75) {
                        simpleSentiment = 'Very Positive';
                    } else if (data.sentiment[0] >= 0.5) {
                        simpleSentiment = 'Positive';
                    } else if (data.sentiment[0] >= 0) {
                        simpleSentiment = 'Neutral';
                    } else if (data.sentiment[0] >= -0.5) {
                        simpleSentiment = 'Negative';
                    } else {
                        simpleSentiment = 'Very Negative';
                    }
                    _dfp.config.setTargeting.Sentiment = tags;
                }
            }
            else {
                _dfp.log("OneBot Message Results - not found");
                _dfp.log( JSON.stringify(data) );
            }
            // wakeup DFP
            if (!wokenup) {
                _dfp.wakeup("One Bot", sleepRound);
                wokenup = true;
            }
        };

        if( !(typeof dfp.config.onebot !== "undefined" &&
            dfp.config.onebot.allow_deny_mode == "allow" &&
            dfp.config.onebot.enabled_root_domains.indexOf(domain) >= 0) ) {
            try {
                var requestTrend, requestAlchemy,currentUrl,cleanUrl,OneBotUrl,OneBotTrendUrl;
                currentUrl = document.URL;
                // For the benefit of testing, remove on deploy
                if(currentUrl.indexOf('test-tiads.timeinc.net') > -1){
                    currentUrl = currentUrl.replace('test-tiads.timeinc.net/dev/test/alchemy-contextual/ads/test/','');
                } else if (currentUrl.indexOf('tiads.timeinc.net') > -1){;
                    currentUrl = currentUrl.replace('tiads.timeinc.net/ads/test/','');
                }

                if ( currentUrl.indexOf( "?" ) > 0 ) {
                    cleanUrl = currentUrl.substring( 0, currentUrl.indexOf( "?" ) );
                } else {
                    cleanUrl = encodeURIComponent( currentUrl );
                }

                if (dfp.dfpUtil.isTestMode()) {
                    cleanUrl = 'http://www.ew.com/article/2015/07/23/hunger-games-mockingjay-part-2-trailer';
                }

                if ( dfpUtil.isSecure() ) {
                    OneBotUrl = "https://d1oggnumqrlfic.cloudfront.net/trending.tidy.json?url=" + cleanUrl + "&tags=all";
                    OneBotTrendUrl = "https://d1oggnumqrlfic.cloudfront.net/trending.tidy.json?url=" + cleanUrl;
                } else {
                    OneBotUrl = "http://cdn.api.onebot.timeinc.com/trending.tidy.json?url=" + cleanUrl + "&tags=all";
                    OneBotTrendUrl = "http://cdn.api.onebot.timeinc.com/trending.tidy.json?url=" + cleanUrl;
                }

                requestTrend = new XMLHttpRequest();
                if ("withCredentials" in requestTrend) {
                    requestTrend.open( "GET", OneBotTrendUrl, true );
                } else if ( typeof XDomainRequest !== "undefined" ) {
                    requestTrend.open( "GET", OneBotTrendUrl, true );
                } else {
                    requestTrend = null;
                }

                if(!requestTrend){
                    console.error("OneBot Trending XMLHttpRequest Initialization Error");
                    return;
                }

                requestAlchemy = new XMLHttpRequest();
                if ("withCredentials" in requestAlchemy) {
                    requestAlchemy.open( "GET", OneBotUrl, true );
                } else if ( typeof XDomainRequest !== "undefined" ) {
                    requestAlchemy.open( "GET", OneBotUrl, true );
                } else {
                    requestAlchemy = null;
                }

                if(!requestAlchemy){
                    console.error("OneBot Treding+Alchemy XMLHttpRequest Initialization Error");
                    return;
                }


                sleepRound = _dfp.sleep("One Bot");
                _dfp.log('Checking trending+Alchemy via OneBot for - ' + cleanUrl );
                requestAlchemy.onload = onLoad;
                requestAlchemy.onerror = function() {
                    console.error( "OneBot Trending+Alchemy Request Error" );
                };
                requestAlchemy.send();

                _dfp.log('Checking trending via OneBot for - ' + cleanUrl );
                requestTrend.onload = onLoad;
                requestTrend.onerror = function() {
                    console.error( "OneBot Trending Request Error" );
                };
                requestTrend.send();
            }
            catch(e){
                console.error("Onebot catch error");
                console.error( e );
            }
        }
    };

    if (window.dfp_tracking !== undefined) {
        window.dfp_tracking.onInit.push(onInit);
    }

})();

/**
 * Output Debugging info for ad slot - ?debugads=1
 */

(function(window) {

    var debugDfp =  function () {
        var _this = this, startTime = Date.now();

        window.addEventListener('dfp.beforeInit', function(e) {
            if (e.detail.dfp.dfpUtil.isDebugMode()) {
                _this.addDebugStyle();
            }
        });

        window.addEventListener('dfp.slotAfterDisplay', function(e) {
            if (e.detail.dfp.dfpUtil.isDebugMode()) {
                // insert Debug Info
                _this.createDebugInfo(e.detail.arg);
            }
        });

        window.addEventListener('dfp.logMsg', function(e) {
            var seconds = (Date.now() - startTime)/1000;
            if (e.detail.dfp.dfpUtil.isDebugMode()) {

                console.log('dfp.logMsg ' + seconds + ': ' + e.detail.arg);
            }
        });
    };

    debugDfp.prototype.addDebugStyle = function () {
        var css = ".ads-debug-info { position: absolute; overflowY: auto; overflowX: auto; width: 300; height: 200; zIndex: 99999; background-color: yellow; text-align: left}",
            head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');

        style.type = 'text/css';
        if (style.styleSheet){
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }
        head.appendChild(style);
    };

    debugDfp.prototype.createDebugInfo = function(slot) {
        var AdId = slot.adUnit.id;
        var Id = AdId + '-debuginfo';
        var el, adDiv, rect, pos, debugHtml;
        if (document.getElementById(Id) === null) {
            adDiv = document.getElementById(AdId);
            rect = adDiv.getBoundingClientRect();
            pos = {
                top: rect.top + document.body.scrollTop,
                left: rect.left + document.body.scrollLeft
            };
            debugHtml = '<textarea id="' + Id + '" style="height: 20px; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: courier; border: 1px solid black; z-index: auto; background-color: rgb(255, 255, 189);">' + slot.debugcode.join('\n') + '</textarea>';
            adDiv.insertAdjacentHTML('beforebegin', debugHtml);
            el = document.getElementById(Id);
        } else {
            el = document.getElementById(Id);
        }
        return el;
    };

    return new debugDfp();
})(window);

/**
 * Track tracking for 3rd party tracking for DFP
 */

(function(window) {

    var global_targeting =  function () {
        var _this = this;
        var tile = 0;

        window.addEventListener('dfp.beforeInit', function(e) {
            var dfp = e.detail.dfp, domain, paths, urlParams = dfp.dfpUtil.getUrlTargeting().Query, value, i, rhost;
            // rhost
            rhost = document.referrer.split("/")[2];
            if (rhost !== undefined) {
                dfp.config.setGlobalTargeting.rhost = rhost;
            }

            // domain
            try {
                domain = window.location.hostname;
            } catch (er) {
                domain = document.URL.split("/")[2];
            }
            dfp.config.setGlobalTargeting.domain =  domain;

            // plat

            // Path
            paths = window.location.pathname.split("/");
            if(!paths[paths.length -1]) {
                paths = paths.slice(1, paths.length -1);
            }
            else {
                paths = paths.slice(1, paths.length);
            }
            dfp.config.setGlobalTargeting.path = paths;

            // debugads
            if (dfp.dfpUtil.isDebugMode()) {
                for (i = 0; i < urlParams.length; i++) {
                    if (urlParams[i].indexOf('debugads') >= 0) {
                        value = urlParams[i].split(':')[1];
                        dfp.config.setGlobalTargeting.debugads = (isNaN(value) ? 1 : value);
                    }
                }
            }

            // testads -- this is set by dfp.js

            // CID
            for (i = 0; i < urlParams.length; i++) {
                if (urlParams[i].indexOf('cid') >= 0) {
                    value = urlParams[i].split(':')[1];
                    dfp.config.setGlobalTargeting.cid = (isNaN(value) ? 1 : value);
                }
            }
        });

        window.addEventListener('dfp.slotBeforeDefine', function(e) {
            // set the 'sz' targeting
            var adUnit = e.detail.arg, dfp = e.detail.dfp;
            tile++;

            try {
                if (adUnit.targeting === undefined) {
                    adUnit.targeting = {};
                }
                if (adUnit.targeting.sz !== undefined) {
                    return;
                }
                adUnit.targeting.sz = dfp.dfpUtil.sizeToString(adUnit.size);
                if (adUnit.oop !== undefined && adUnit.oop) {
                    adUnit.targeting.sz = '1x1';
                }
                adUnit.targeting.id = adUnit.id;
                adUnit.targeting.tile = tile;
            }
            catch (err) {
                // failed to set sizing
            }
        });
    };

    return new global_targeting();

})(window);






/**
 * Track tracking for 3rd party tracking for DFP
 */

(function(window) {

    var autoOop = false;
    var autoRefresh = false;
    var oopId = null;
    var oop;
    var dfpLib;
    var lastOopFired = 0;
    var minimalOopInterval = 10000;

    var oopObj =  function () {

    };

    oopObj.prototype.defineOopSlot = function (dfp, beforeElementId) {
        var oopAd, divEl, parentEl, adEl = null, bodyEl;
        dfpLib = dfp;
        divEl = document.createElement('div');
        divEl.setAttribute('id', oopId);
        divEl.setAttribute('style', 'display:none;width:0px;height:0px');
        if (beforeElementId !== undefined) {
            adEl = document.getElementById(beforeElementId);
        }
        if (adEl !== null) {
            parentEl = adEl.parentNode;
            parentEl.insertBefore(divEl, adEl);
        }
        else {
            bodyEl = document.body;
            bodyEl.appendChild(divEl);
        }

        oopAd = {
            id: oopId,
            oop: true
        };
        dfpLib.defineSlot(oopAd);
    };

    oopObj.prototype.refreshOop = function () {
        if (autoRefresh && oopId !== null) {
            dfpLib.refresh(oopId);
        }
    };

    oop = new oopObj();


    window.addEventListener('dfp.beforeInit', function(e) {
        var dfp = e.detail.dfp;
        if (dfp.config.oop !== undefined) {
            autoOop = dfp.config.oop;
        }
        if (dfp.config.refreshoop !== undefined) {
            autoRefresh = dfp.config.refreshoop;
        }
        dfp.getOopSlotId = function () {
            return oopId;
        };
        dfp.resetOOPSlot = function (id, beforeId) {
            if (id !== undefined && id !== oopId) {
                oopId = id;
                oop.defineOopSlot(dfpLib, beforeId);
            }
            else {
                oop.refreshOop();

            }
        };
    });

    window.addEventListener('dfp.slotBeforeDefine', function(e) {
        var adUnit = e.detail.arg, dfp = e.detail.dfp;
        if (autoOop && oopId === null) {
            oopId = 'oop_' + Date.now();
            oop.defineOopSlot(dfp, adUnit.id);
        }
    });

    window.addEventListener('dfp.refresh', function(e) {
        if (autoOop && autoRefresh && (lastOopFired + minimalOopInterval < Date.now()) ) {
            lastOopFired = Date.now();
            dfpLib.refresh(oopId);
        }
    });


    return oop;

})(window);

/**
 * Time DFP
 */

(function(root, factory) {
        root.time_dfp = factory(root);
    }(this,
        function(window) {
            /* globals document, googletag, CustomEvent */

            // Google DFP Utility functions
            var dfp;
            var dfpUtil = {
                getRootDomain: function() {
                    var arr = window.location.hostname.split('.');
                    if (typeof(arr[1]) == 'undefined') {
                        return (window.location.hostname);
                    } else if (arr.length == 1) {
                        return (window.location.hostname);
                    } else {
                        return (arr[arr.length - 2] + '.' + arr[arr.length - 1]);
                    }
                },
                getSubDomain: function() {
                    return document.domain;
                },
                isDebugMode:function(){
                    var debug = false;
                    if (window.location.search.indexOf( 'debugads' ) >= 0) {
                        debug = true;
                    }
                    if (dfp !== undefined && dfp.config.debug !== undefined && dfp.config.debug) {
                        debug = true;
                    }
                    return debug;
                },
                isTestMode: function(config) {
                    var testads = false;
                    if (window.location.search.indexOf('testads') >= 0) {
                        testads = true;
                    }
                    if (config !== undefined && config.testads !== undefined) {
                        testads = true;
                    }
                    return testads;
                },
                isSecure: function() {
                    return (document.location.protocol == 'https:');
                },
                getCookie: function(sKey) {
                    if (!sKey) {
                        return null;
                    }
                    return decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
                },
                sizeToString: function (size) {
                    var size_string = '', i;
                    var sizeArrayToString = function (ar) {
                        return ar[0] + 'x' + ar[1];
                    };
                    if (Array.isArray(size)) {
                        if (typeof size[0] === 'number') {
                            size_string = sizeArrayToString(size);
                        }
                        else {
                            for (i = 0; i < size.length; i++) {
                                if (size_string !== '') {
                                    size_string += ',';
                                }
                                size_string += sizeArrayToString(size[i]);
                            }
                        }
                    }
                    return size_string;
                },

                // extend({}, objA, objB) -- ripped from http://youmightnotneedjquery.com/#extend
                extend: function(out) {
                    out = out || {};
                    for (var i = 1; i < arguments.length; i++) {
                        if (!arguments[i]) {
                            continue;
                        }
                        for (var key in arguments[i]) {
                            if (arguments[i].hasOwnProperty(key)) {
                                out[key] = arguments[i][key];
                            }
                        }
                    }
                    return out;
                },

                /**
                 * Create an array of paths so that we can target DFP ads to Page URI's
                 * @return Array an array of URL parts that can be targeted.
                 */
                getUrlTargeting: function(url) {

                    // Get the url and parse it to its component parts using regex from RFC2396 Appendix-B (https://tools.ietf.org/html/rfc2396#appendix-B)
                    var urlMatches = (url || window.location.toString()).match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/);
                    var matchedAuthority = urlMatches[4] || '';
                    var matchedPath = (urlMatches[5] || '').replace(/(.)\/$/, '$1');
                    var matchedQuery = urlMatches[7] || '';

                    // Get the query params for targeting against
                    var params = matchedQuery.replace(/\=/ig, ':').split('&');

                    return {
                        Host: matchedAuthority,
                        Path: matchedPath,
                        Query: params
                    };

                },
                sanitize:function(value, config){
                    if (typeof value == "string") {
                        if (config.convertHyphens){
                            value = value.replace(/-/ig, "_");
                        }
                        if (config.stripNonAlphaNumeric){
                            value = value.replace(/[^\w\s\/]/ig, "");
                        }
                    }
                    return value;
                }

            };

            var time_dfp = function() {
                var queue, i;
                this.dfpUtil = dfpUtil;
                this.log('Starting up...');


                this.config =  {
                    setTargeting: {}, // Set googletag.pubads().setTargeting()
                    setGlobalTargeting: {}, // global targeting that will be applied to each individual ad call
                    setLocation: '', // set location for the Ad Calls - https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_setLocation
                    setUrlTargeting: false,
                    enableSingleRequest: false, // expecting the call to be done in SRA
                    collapseEmptyDivs: false, // this is different than jquery.dfp. if (false) we call googletag.pubads().collapseEmptyDivs(), if (true) we call googletag.pubads().collapseEmptyDivs(true)  see - https://support.google.com/dfp_premium/answer/3072674
                    refreshExisting: true,
                    disablePublisherConsole: false,
                    disableInitialLoad: false, // Prevent initial load -  https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_disableInitialLoad
                    globalVar: 'time_dfp', // A global variable too look for and take over for true Async support
                    sleepTime: 300, // Default time to sleep before giving up on external 3rd parties to respond
                    oop: true,
                    refreshoop: false
                };

                this.state = {
                    count: 0,
                    rendered: 0,
                    dfpId: '8484',
                    slots: [],
                    sleep: 0, // amount of sleep calls made.. if > 0 then we are in 'sleep' state, gets reset to 0 on wakeup
                    queue: [],
                    wewant: 'n"eNow',
                    sleepTimeout: null,
                    sleepRound: 0
                };

                if (window[this.config.globalVar] !== undefined && Array.isArray(window[this.config.globalVar])) {
                    queue = window[this.config.globalVar];
                    window[this.config.globalVar] = this;
                    for (i = 0; i < queue.length; i++) {
                        this.push(queue[i]);
                    }
                }
            };
            var p = time_dfp.prototype;

            p.init = function(config) {
                var dfp = this;

                this.log('init()');

                // Start loading GPT as soon as possible
                this.loadGPT();

                // extend internal config with global 'ti_dfp_config'
                dfpUtil.extend(this.config, config !== undefined ? config : {});

                this.fireEvent('beforeInit', this);

                this.updateAdsTargeting(this.config);

                if (this.config.enableSingleRequest === undefined || !this.config.enableSingleRequest) {

                    // Initiate Services
                    this.push(function() {
                        dfp.getGptCmd().push(function () {
                            dfp.log('enableSingleRequest not set.. so not in SRA mode');
                            googletag.enableServices();
                        });
                    });
                }
                else if (this.config.enableSingleRequest !== undefined || this.config.enableSingleRequest)  {

                    // Set single request architecture.
                    this.push(function() {
                        dfp.getGptCmd().push(
                            function () {
                                dfp.log('enableSingleRequest is set.. in SRA mode');
                                googletag.enableSingleRequest();
                            }
                        );
                    });
                }

                if (this.config.collapseEmptyDivs !== undefined)  {
                    var collapse = dfp.config.collapseEmptyDivs;
                    if (!collapse) {
                        collapse = undefined;
                    }
                    this.push(function() {
                        dfp.getGptCmd().push(
                            function () {
                                dfp.log('collapseEmptyDivs is set to: ' + dfp.config.collapseEmptyDivs);
                                googletag.pubads().collapseEmptyDivs(collapse);
                            }
                        );
                    });
                }

                // Setup Call back for 'slotRenderEnded'
                this.getGptCmd().push(
                    function(){
                        var _dfp = dfp;
                        googletag.pubads().addEventListener('slotRenderEnded', function(event) {
                            _dfp.eventSlotRendered(event);
                        });
                    }
                );
                // Setup Global Targeting
                this.push(function() {
                    dfp.getGptCmd().push(
                        function () {
                            dfp.log('googletag.pubads().setTargeting()..');
                            for (var i in dfp.config.setTargeting) {
                                if (dfp.config.setTargeting.hasOwnProperty(i)) {
                                    googletag.pubads().setTargeting(i, dfp.config.setTargeting[i]);
                                }
                            }

                        }
                    );
                });

                this.push(function() {
                    dfp.fireEvent('afterInit', dfp);
                });
                return this;
            };

            p.push = function (func) {
                if (func === undefined) {
                    this.log('Running Queued calls...');
                    // Wakeup
                    while(this.state.queue.length) {
                        try {
                            this.state.queue.shift().apply(this, []);
                        }
                        catch(e) {
                            this.log('Error trying to wake up running one of the queued function');
                            console.error(e);
                            break;
                        }
                    }
                    return;
                }

                // Otherwise call passed function
                if (this.state.sleep <= 0) {
                    func.apply(this, []);
                }
                else {
                    this.log('push().. in sleep mode.. queuing function');
                    this.state.queue.push(func);
                }
            };

            p.sleep = function (msg, ms) {
                var _this = this, _sleepRound = this.state.sleepRound;
                if (msg !== undefined) {
                    msg = ' - MSG: ' + msg;
                }
                else {
                    msg = "";
                }

                // only allow sleeping set once
                if (this.state.sleep > 0) {
                    this.state.sleep++;
                    this.log('sleep().. cannot sleep.. already sleeping' + msg);
                    return this.state.sleepRound;
                }

                this.state.sleep++;
                if (ms === undefined || ms === null) {
                    ms = this.config.sleepTime;
                }
                this.log('sleep() for ' + ms + ' milliseconds' + msg);

                this.state.sleepTimeout = setTimeout(function(){
                    _this.log('sleep() Timeout Over');
                    _this.wakeup('time_dfp - Sleep Timeout', _sleepRound, true); // force wakeup
                },ms);

                return this.state.sleepRound;
            };

            p.wakeup = function(msg, sleepRound, force) {
                if (msg !== undefined) {
                    msg = ' - MSG: ' + msg;
                }
                else {
                    msg = '';
                }

                if (sleepRound !== undefined && sleepRound !== this.state.sleepRound) {
                    inSleepRound = true;
                    this.log('wakeup() ' + msg + ' -- Not in sleep round');
                    return false;
                }


                this.state.sleep--;
                this.log('wakeup() ' + msg + ' -- Sleeps left: ' + this.state.sleep + ' -- ' + ((force !== undefined && force) ? ' - Forced' : ''));
                if (this.state.sleep <= 0 || (force !== undefined && force !== null && force)) {
                    this.state.sleep = 0;
                    window.clearTimeout(this.state.sleepTimeout);
                    this.state.sleepRound++;
                    this.push();
                }
            };

            p.loadGPT = function () {
                var gads, node;
                this.log('loading GPT async');
                window.googletag = window.googletag || {};
                window.googletag.cmd = window.googletag.cmd || [];

                gads = document.createElement('script');
                gads.async = true;
                gads.type = 'text/javascript';

                gads.src = '//www.googletagservices.com/tag/js/gpt.js';

                node = document.getElementsByTagName('script')[0];
                node.parentNode.insertBefore(gads, node);

            };

            p.eventSlotRendered = function (event) {
                this.fireEvent('slotRenderEnded', event);
            };

            /**
             * Update Ads targeting all Ads
             * @param Object dfpOptions options related to ad instantiation
             * @param jQuery $adCollection collection of ads
             * @return Array an array of ad units that have been created.
             */
            p.updateAdsTargeting = function(config) {
                // Display Test ads
                if (dfpUtil.isTestMode(config)) {
                    this.log('updateAdsTargeting() In Test Mode');

                    var urlParams = dfpUtil.getUrlTargeting().Query, value;
                    if (this.config.testads !== undefined) {
                        this.config.setGlobalTargeting.test = (isNaN(this.config.testads) ? 1 : this.config.testads);
                    }
                    for (var i = 0; i < urlParams.length; i++) {
                        if (urlParams[i].indexOf('testads') >= 0) {
                            value = urlParams[i].split(':')[1];
                            this.config.setGlobalTargeting.test = (isNaN(value) ? 1 : value);
                        }
                    }
                }
            };

            p.getGptCmd = function () {
                window.googletag = window.googletag || {'version': 'timeinc', cmd: []};
                return window.googletag.cmd;
            };

            p.adUnitPath = function (adUnit) {
                var zone = (adUnit !== undefined && adUnit.zone !== undefined) ? adUnit.zone : this.config.zone !== undefined ? this.config.zone : '';
                return '/' + this.state.dfpId + '/' + ((adUnit !== undefined && adUnit.sitename !== undefined) ? adUnit.sitename : this.config.sitename) + '/' + this.dfpUtil.sanitize(zone, {stripNonAlphaNumeric: true});
            };

            /**
             * Get the DFP adSlot object, based on the ID
             *
             * @param adId - leave undefined to get all dfp slots
             * @returns {*}
             */
            p.getAdSlot = function (adId, destroy) {
                // Find the ad slot in the array
                var len, i, slot = null, slots = [];
                for (i = 0, len = this.state.slots.length; i < len; i++) {
                    if (adId === undefined) {
                        slots.push(this.state.slots[i]);
                    }
                    else {
                        if (this.state.slots[i].id === adId) {
                            if (destroy !== undefined && destroy ) {
                                slot = this.state.slots.splice(i, 1);
                                slot = slot[0];
                            }
                            else {
                                slot = this.state.slots[i];
                            }
                            break;
                        }
                    }
                }
                if (adId === undefined) {
                    return slots;
                }
                return slot;
            };

            p.getAdIdBySlot = function (slot) {
                // Find the ad slot in the array
                var len, i, id;
                for (i = 0, len = this.state.slots.length; i < len; i++) {
                    if (this.state.slots[i].dfpSlot === slot) {
                        id = this.state.slots[i].id;
                        break;
                    }
                }
                return id;
            };

            /**
             * Sets the targeting for the 'slot', value are pulled globally defined targeting and on the 'adUnit'.
             *
             * @param slot
             * @param adUnit
             */
            p.setTargeting = function(slot, adUnit) {
                var i;
                // First set Global Targeting
                for (i in this.config.setGlobalTargeting) {
                    if (this.config.setGlobalTargeting.hasOwnProperty(i)) {
                        slot.setTargeting(i, this.config.setGlobalTargeting[i]);
                    }
                }

                // AdUnit Specific targeting
                if (adUnit.targeting !== undefined) {
                    for (i in adUnit.targeting) {
                        if (adUnit.targeting.hasOwnProperty(i)) {
                            slot.setTargeting(i, adUnit.targeting[i]);
                        }
                    }
                }
            };

            /**
             * Define an ad Slot user JSON objects
             *
             * @param adUnit
             */
            p.defineSlot = function(adUnit) {
                var _adUnit = adUnit, dfp = this, exists;
                if (this.getAdSlot(adUnit.id) !== null){
                    // We need to remove the existing ad slot or dfp will fail on duplicate IDs
                    this.getGptCmd().push(function(){
                        var slot = dfp.getAdSlot(_adUnit.id, true);
                        googletag.destroySlots([slot.dfpSlot]);
                    });
                }
                this.fireEvent('defineSlot', _adUnit);
                this.log('defineSlot() ' + adUnit.id);
                this.push(function() {
                    dfp.getGptCmd().push(function(){
                        var slot = {}, debugcode = [], size, sizemapping, i;
                        try {
                            dfp.fireEvent('slotBeforeDefine', _adUnit);
                            slot.id = _adUnit.id;
                            slot.adUnit = _adUnit;
                            // Standard Ad Declaration
                            size = _adUnit.size;
                            if (_adUnit.sizes !== undefined) {
                                // SizeMap construction for responsive ad - https://developers.google.com/doubleclick-gpt/reference#googletagsizemappingbuilder
                                sizemapping = googletag.sizeMapping();
                                for (i = 0; i < _adUnit.sizes.length; i++) {
                                    sizemapping.addSize(_adUnit.sizes[i][0], _adUnit.sizes[i][1]);
                                }
                                sizemapping = sizemapping.build();
                            }
                            if (_adUnit.oop !== undefined && _adUnit.oop) {
                                // define OutOfPage Slot - https://developers.google.com/doubleclick-gpt/reference#googletag.defineOutOfPageSlot
                                slot.dfpSlot = googletag.defineOutOfPageSlot(dfp.adUnitPath(_adUnit), _adUnit.id);
                                debugcode.push('googletag.defineOutOfPageSlot(\'' + dfp.adUnitPath(_adUnit) + '\', \'' + _adUnit.id + '\');');
                            }
                            else {
                                // Define standard AdSlot - https://developers.google.com/doubleclick-gpt/reference#googletag.ç
                                slot.dfpSlot = googletag.defineSlot(dfp.adUnitPath(_adUnit), size, _adUnit.id);
                                debugcode.push('googletag.defineSlot(\'' + dfp.adUnitPath(_adUnit) + '\', ' + JSON.stringify(_adUnit.size) + ', \'' + _adUnit.id + '\');');
                            }
                            if (sizemapping !== undefined) {
                                // DefineSizeMapping - https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_defineSizeMapping
                                slot.dfpSlot.defineSizeMapping(sizemapping);
                                debugcode.push('slot.defineSizeMapping(<sizemapping>); sizemapping = ' + JSON.stringify(_adUnit.sizes));
                            }
                            dfp.setTargeting(slot.dfpSlot, _adUnit);
                            debugcode.push(dfp.getSlotTargeting(slot.dfpSlot));


                            if (_adUnit.companion !== undefined && _adUnit.companion) {
                                // Companion Ad service - https://developers.google.com/doubleclick-gpt/reference#googletag.companionAds
                                slot.dfpSlot.addService(googletag.companionAds());
                                debugcode.push('.addService(googletag.companionAds();');

                            }

                            // Standard DFP service - https://developers.google.com/doubleclick-gpt/reference#googletag.Slot_addService
                            slot.dfpSlot.addService(googletag.pubads());
                            debugcode.push('.addService(googletag.pubads();');


                            dfp.state.slots.push(slot);

                            // For SRA .enableServices needs to be called after all the ads have been defined
                            if (dfp.config.enableSingleRequest === undefined || !dfp.config.enableSingleRequest) {
                                googletag.enableServices();
                                debugcode.push('googletag.enableServices();');
                            }

                            if (_adUnit.collapse !== undefined) {
                                if (Array.isArray(_adUnit.collapse)) {
                                    slot.dfpSlot.setCollapseEmptyDiv.apply(slot.dfpSlot, _adUnit.collapse);
                                }
                                else {
                                    slot.dfpSlot.setCollapseEmptyDiv(_adUnit.collapse);
                                }
                                debugcode.push('.setCollapseEmptyDiv(' + _adUnit.collapse + ')');
                            }
                            else {
                                slot.dfpSlot.setCollapseEmptyDiv();
                                debugcode.push('.setCollapseEmptyDiv();');
                            }
                            dfp.fireEvent('slotAfterDefine', slot);
                            slot.debugcode = debugcode;

                            // For SRA display slot is called later
                            if (dfp.config.enableSingleRequest === undefined || !dfp.config.enableSingleRequest) {
                                dfp.displaySlot(slot);
                            }
                        }
                        catch (e) {
                            console.error('error: defineSlot - ');
                            console.error(slot);
                            console.error(e);
                        }
                    });
                });
            };

            // Set a config value.. e.g. time_dfp.set('enableSingleRequest', false); // disables SRA
            p.set = function (key, value) {
                this.config[key] = value;
            };

            // Once all ads have been defined for SRA call this. then .display(<id>)
            p.fetchAdsSRA = function () {
                var dfp = this;
                this.push(function() {
                    dfp.getGptCmd().push(function () {
                        dfp.fireEvent('beforeFetchAdsSRA', dfp);
                        googletag.enableServices();
                        dfp.fireEvent('afterFetchAdsSRA', dfp);
                    });
                });
            };

            // Display Ad.. used for SRA
            p.display = function (id) {
                var slot, i;
                // display All slot
                if (id === undefined) {
                    slot = this.getAdSlot();
                    for (i = 0; i < slot.length; i++) {
                        this.displaySlot(slot[i]);
                    }
                }
                // Display Slot by ID. e.g id = 'slot_id'
                if (typeof id == 'string') {
                    slot = this.getAdSlot(id);
                    this.displaySlot(slot);

                }
                // Display Array of slots by ID ['id1', 'id2', 'id3']
                else if(Array.isArray(id)) {
                    for (i = 0; i < id.length; i++) {
                        slot = this.getAdSlot(id[i]);
                        this.displaySlot(slot);
                    }
                }
            };

            p.displaySlot = function (slot) {
                var dfp = this, _slot = slot;
                this.push(function () {
                    dfp.getGptCmd().push(function () {
                        dfp.fireEvent('slotBeforeDisplay', _slot.dfpSlot);
                        dfp.push(function () {
                            dfp.getGptCmd().push(function () {
                                googletag.display(slot.id);
                                _slot.debugcode.push('googletag.display(\'' + _slot.id + '\');');
                                dfp.fireEvent('slotAfterDisplay', _slot);
                            });
                        });
                    });
                });
            };

            p.getSlotTargeting = function (slot) {
                var targeting = {}, i;
                var keys = slot.getTargetingKeys(slot);
                var globalTargeting = {};
                var output = '';
                for (i = 0; i < keys.length; i++) {
                    targeting[keys[i]] = slot.getTargeting(keys[i]);
                }
                for (i in this.config.setTargeting) {
                    if (this.config.setTargeting.hasOwnProperty(i)) {
                        globalTargeting[i] = this.config.setTargeting[i];
                    }
                }
                output += "\nTargeting ---- \nGLOBAL: " + JSON.stringify(globalTargeting);
                output += "\nSLOT: " + JSON.stringify(targeting) + "\n ------ \n";

                return output;
            };

            /**
             * Refresh all or specific ad slots. Correlator updates unless specifies as 'false'.
             *
             * @param slots
             * @param updateCorrelator
             */
            p.refresh = function(slots, updateCorrelator) {

                var slot, refreshSlots = [], refreshOptions = {}, i, len, dfp = this;
                this.fireEvent('refresh', slots);


                if (updateCorrelator === undefined) {
                    updateCorrelator = true;
                }
                refreshOptions.updateCorrelator = updateCorrelator;

                if (slots === undefined) {
                    slots = null;
                    refreshSlots = slots;
                }

                this.log('refresh() slots: ' + slots);


                try {
                    // if 'slots' is just a string, it's a single slot ID
                    if (typeof slots === 'string') {
                        slot = this.getAdSlot(slots);
                        refreshSlots.push(slot.dfpSlot);
                    }

                    // If slots is an array of strings
                    if (Array.isArray(slots)) {
                        for (i = 0, len = slots.length; i < len; i++) {
                            if (typeof slots[i] === 'string') {
                                slot = this.getAdSlot(slots[i]);
                                refreshSlots.push(slot.dfpSlot);
                            }
                        }
                    }
                }
                catch(e) {
                    this.log('Error refreshing slots');
                    console.log(e);
                }

                this.push(function(){
                    dfp.getGptCmd().push(function(){
                        dfp.fireEvent('slotRefresh', refreshSlots);
                        googletag.pubads().refresh(refreshSlots, refreshOptions);
                    });
                });
            };

            /**
             * Manually update the DFP correlator value.
             */
            p.updateCorrelator = function () {
                var dfp = this;
                this.log('updateCorrelator()');

                // TODO: need to see if we should run this through dfp.push() in case of sleep or not?
                // Update DFP correlator - https://developers.google.com/doubleclick-gpt/reference#googletag.PubAdsService_updateCorrelator
                this.getGptCmd().push(function(){
                    dfp.fireEvent('updateCorrelator');
                    googletag.pubads().updateCorrelator();
                });
            };

            p.log = function(msg) {
                this.fireEvent('logMsg', msg);
            };

            /**
             * To fire off custom events.
             *
             * @param type
             * @param arg1
             */
            p.fireEvent = function(type, arg1) {
                var adUnit, slot, slots, dfp, customEvent;

                if (type === 'beforeInit') {
                    dfp = arg1;
                }

                if (type === 'afterInit') {
                    dfp = arg1;
                }

                if (type === 'updateCorrelator') {

                }

                if (type === 'defineSlot') {
                    adUnit = arg1;
                }

                if (type === 'slotBeforeDefine') {
                    adUnit = arg1;
                }

                if (type === 'slotAfterDefine') {
                    slot = arg1;
                }

                if (type === 'refresh') {
                    slots = arg1;
                }

                if (type === 'slotRefresh') {
                    slots = arg1;
                }

                if (type === 'slotRenderEnded') {

                }

                if (type === 'logMsg') {

                }

                if (typeof window.CustomEvent === 'function') {
                    customEvent = new CustomEvent('dfp.' + type, {detail: {arg: arg1, dfp: this}});
                } else {
                    customEvent = document.createEvent('CustomEvent');
                    customEvent.initCustomEvent('dfp.' + type, true, true, {arg: arg1, dfp: this});
                }
                window.dispatchEvent(customEvent);
            };

            dfp = new time_dfp();
            return dfp;
        })
);
