'use strict';

var $ = require('jquery');

module.exports = function () {
    var ads = null;
    var delayedStart = false;
    var initialized = false;
    var uat = function () {
      var _this = this;
      tgx_ad_slots.push(function(ti_ads) {
          _this.init();
          _this.inView = 0;
          ads = ti_ads;
          // Delayed start
          if  ($('.node-type-gallery').length) {
            window.addEventListener('pl.gallery-toggle', function(e) {
              delayedStart = true;
              _this.init();
              delayedStart = false;

              initialized = true;
            });
          }
        }
      );
    };

         uat.prototype.init = function () {
            var pbr_nodes;
            var startPosition, card_amount;
             var _this = this;
            // determine the placement for Universal Ad Call
            if ($('.node-type-article .article__body').length) {
                pbr_nodes = $('.article__body > p, .article__body > br, .article__body > div, .article__body > blockquote');
                startPosition = $('.article__body').offset();
                this.initProcessUAL(pbr_nodes, startPosition);
            }
            else if ($('.node-type-recipe .recipe-instructions').length) {
                pbr_nodes = $('.recipe-instructions > ol li, .recipe-instructions > br, .recipe-instructions > div, .recipe-instructions > blockquote');
                startPosition = $('.recipe-instructions').offset();
                this.initProcessUAL(pbr_nodes, startPosition);
            }
            else if ($('.node-type-gallery .gallery__header--list-view').length) {
              if (window.location.href.indexOf("view-all") != -1 || delayedStart) {
                pbr_nodes = $('.pane-node-field-slides .field-slides .gallery-listicle__item');
                startPosition = $('.pane-node-field-slides').offset();
                this.initProcessUAL(pbr_nodes, startPosition);
              }
            }

             // Pattern Specific UAL

             // Two Up Story Cards
             if ($('.story-card-two-up').length) {
                 card_amount = 2;
                 $('.story-card-two-up').each(function(index, story_group){
                     pbr_nodes = $('.story-card-wrap', story_group);
                     _this.initProcessUALStorycards(pbr_nodes, card_amount);

                 });
             }

         };

        uat.prototype.initProcessUALStorycards = function(pbr_nodes, amount) {
            var i, processed = 0, adDiv, adDef, adamount = Date.now();

            for(i = 0; i < pbr_nodes.length; i++) {
                if (processed === (amount -1)) {
                    adamount++;
                    adDef = this.ad_728x90_desktop_300x250_mobile(adamount);
                    adDiv = this.adDiv(adDef.id);
                    $(pbr_nodes[i]).after(adDiv);
                    this.defineAd(adDef);
                    processed = 0;
                }
                else {
                    processed++;
                }
            }
        };

        // Initalize the library. Looks for <p> and <br> tags.. and calculates where to place the Ad
        uat.prototype.initProcessUAL = function (pbr_nodes, articlePos) {
            var pos = null;
            var lastNodePos = null;
            var spacing = 600; // Minimum spacing between ads
            var nodeForSpacing = [];
            var adDiv, adDef;
            var adAmount = 0;
            var positionList = [];
            var postitionListMap = {};
            var a;
            var trackViewStatus = false;

            if (initialized) {
              return;
            }

            if (window.utilities.inBreakPoint('sm')) {
                trackViewStatus = true;
            }

            for (var i = 0; i < pbr_nodes.length; i++) {
                pos = $(pbr_nodes[i]).offset();
                if (pos.top === 0) {
                    continue;
                }
                positionList.push([pos.top, $(pbr_nodes[i])]);

                a = 1;
            }

            positionList.sort(function(a, b) {
                return a[0] - b[0];
            });

            for (i = 0; i < positionList.length; i++) {

                 if (lastNodePos === null) {
                    lastNodePos = articlePos.top;
                 }
                 if ((positionList[i][0] > lastNodePos) && positionList[i][0] - lastNodePos > spacing) {
                    lastNodePos = positionList[i][0];
                 // If near outbrain don't load that ad
                 if (this.nearOutbrain(lastNodePos)) {
                    continue;
                 }
                 nodeForSpacing.push(positionList[i][1]);
                 }

            }
            for (i = 0; i < nodeForSpacing.length; i++) {

                adAmount++;
                if(adAmount === 3) {
                    adDef = this.ad_5x5(adAmount);
                    adDiv = this.adDiv(adDef.id);
                }
                else if (adAmount === 4 && (window.utilities.inBreakPoint('lg') || window.utilities.inBreakPoint('xl'))) {
                    adDef = this.ad_728x90(adAmount, trackViewStatus);
                    adDiv = this.adDiv(adDef.id);
                }
                else {
                  adDef = this.ad(adAmount, trackViewStatus);
                  adDiv = this.adDiv(adDef.id);
                }

                $(nodeForSpacing[i]).before(adDiv);
                this.defineAd(adDef);
            }

        };

        //Add into ad slot
        uat.prototype.defineAd = function (adDef) {
            var _adDef = adDef;
            tgx_ad_slots.push(function(ads) {
                ads.addSlot(_adDef);
            });
        };

        //Check ads viewability to make true or false
        uat.prototype.adCallback = function(event, slot) {
            var i;
            if (event === 'inView') {
                this.inView++;
                for (i = 0; i < ads.exclusive.length; i++) {
                    ads.hide(ads.exclusive[i]);
                }
            }
            if (event === 'outOfView') {
                this.inView--;
                if (this.inView <= 0) {
                    for (i = 0; i < ads.exclusive.length; i++) {
                        ads.show(ads.exclusive[i], true);
                    }
                }
            }
        };

        //Define - 300x250 ad size to loads only for mobile
        uat.prototype.ad = function (adAmount, trackViewStatus) {
            var id = 'universal-ad-call_' + adAmount;
            var _this = this;
            var adDefinition = {
                'id': id,
                responsive: {
                    sm: {sizes: ['300x250'], callback: function(e){_this.adCallback(e, this)}},
                    md: {sizes: ['300x250'], callback: function(e){_this.adCallback(e, this)}},
                    lg: {sizes: ['300x250'], callback: function(e){_this.adCallback(e, this)}},
                    xl: {sizes: ['300x250'], callback: function(e){_this.adCallback(e, this)}}
                },
                defer: 100,
                trackView: trackViewStatus,
                updateCorrelator: true
            };
            return adDefinition;
        };

        //Define - 728x90 to loads as 4rd position for desktop
        uat.prototype.ad_728x90 = function (adAmount, trackViewStatus) {
            var id = 'universal-ad-call_' + adAmount;
            var _this = this;
            var adDefinition = {
                'id': id,
                responsive: {
                    sm: {sizes: ['728x90', '970x250'], callback: function(e){_this.adCallback(e, this)}},
                    md: {sizes: ['728x90', '970x250'], callback: function(e){_this.adCallback(e, this)}},
                    lg: {sizes: ['728x90', '970x250'], callback: function(e){_this.adCallback(e, this)}},
                    xl: {sizes: ['728x90', '970x250'], callback: function(e){_this.adCallback(e, this)}}
                },
                defer: 100,
                trackView: trackViewStatus,
                updateCorrelator: true
            };
            return adDefinition;
        };
         //Define - Teads ad 5x5 to loads as 3rd position
        uat.prototype.ad_5x5 = function (adAmount) {
            var id = 'universal-ad-call_' + adAmount;
            var _this = this;
            var adDefinition = {
                'id': id,
                responsive: {
                    sm: {sizes: ['5x5'], callback: function(e){_this.adCallback(e, this)}},
                    md: {sizes: ['5x5'], callback: function(e){_this.adCallback(e, this)}},
                    lg: {sizes: ['5x5'], callback: function(e){_this.adCallback(e, this)}},
                    xl: {sizes: ['5x5'], callback: function(e){_this.adCallback(e, this)}}
                },
                priority: '3'
            };
            return adDefinition;
        };

        //Define - 728x90 to loads as 4rd position for desktop
        uat.prototype.ad_728x90 = function (adAmount, trackViewStatus) {
            var id = 'universal-ad-call_' + adAmount;
            var _this = this;
            var adDefinition = {
                'id': id,
                responsive: {
                    sm: {sizes: ['728x90', '970x250'], callback: function(e){_this.adCallback(e, this)}},
                    md: {sizes: ['728x90', '970x250'], callback: function(e){_this.adCallback(e, this)}},
                    lg: {sizes: ['728x90', '970x250'], callback: function(e){_this.adCallback(e, this)}},
                    xl: {sizes: ['728x90', '970x250'], callback: function(e){_this.adCallback(e, this)}}
                },
                defer: 100,
                trackView: trackViewStatus
            };
            return adDefinition;
        };

        //Define - 728x90 to loads as 4rd position for desktop
        uat.prototype.ad_728x90_desktop_300x250_mobile = function (adAmount, trackViewStatus) {
            var id = 'universal-ad-call_' + adAmount;
            var _this = this;
            var adDefinition = {
                'id': id,
                responsive: {
                    sm: {sizes: ['300x250', '300x50'], callback: function(e){_this.adCallback(e, this)}},
                    md: {sizes: ['728x90', '970x250'], callback: function(e){_this.adCallback(e, this)}},
                    lg: {sizes: ['728x90', '970x250'], callback: function(e){_this.adCallback(e, this)}},
                    xl: {sizes: ['728x90', '970x250'], callback: function(e){_this.adCallback(e, this)}}
                },
                defer: 100,
                trackView: trackViewStatus
            };
            return adDefinition;
        };

        //Define - Teads ad 5x5 to loads as 3rd position
        uat.prototype.ad_5x5 = function (adAmount) {
            var id = 'universal-ad-call_' + adAmount;
            var _this = this;
            var adDefinition = {
                'id': id,
                responsive: {
                    sm: {sizes: ['5x5'], callback: function(e){_this.adCallback(e, this)}},
                    md: {sizes: ['5x5'], callback: function(e){_this.adCallback(e, this)}},
                    lg: {sizes: ['5x5'], callback: function(e){_this.adCallback(e, this)}},
                    xl: {sizes: ['5x5'], callback: function(e){_this.adCallback(e, this)}}
                },
                priority: '3'
            };
            return adDefinition;
        };


        //Apply 350x250 ad stye attributes
        uat.prototype.adDiv = function (id) {
            var divEl = document.createElement('div');
            divEl.setAttribute('id', id);
            divEl.setAttribute('style', 'display:block;padding-bottom:20px; margin:0 auto; text-align:center;');
            divEl.setAttribute('class', 'ad-350x250');

            return divEl;
        };

        //check outbrain is near by in the given position
        uat.prototype.nearOutbrain = function (pos) {
            var limit = 1000;
            var footerpos = $('.ad-outbrain').offset();
            if (footerpos.top > pos && footerpos.top - pos < limit) {
                return true;
            }
            return false;
        };

        return new uat();
    };
