'use strict'

require('./adContainerBinding');
require('history');
var $ = require('jquery'),
    ko = require('knockout'),
    _ = require('underscore'),
    hammer = require('hammerjs'),
    prefetchImages = require('../../lib/prefetchImages');

var BaseGalleryViewModel = require('../../modules/_baseGallery/baseGalleryViewModel');

module.exports = GalleryViewModel;

function GalleryViewModel(config) {
  BaseGalleryViewModel.call(this);

  // Sets slides from gallery Config in template
  this.config = config;

  this.slides(config.slides);

  this.totalSlideCount(config.galleryTotalSlideCount);

  this.currentSlideIndex(config.initialSlideIndex || 0);

  this.galleryUrl = ko.observable(config.galleryUrl);

  this.title = ko.observable(config.galleryTitle);

  this.description = ko.observable(config.galleryDescription);

  this.isNextButtonActive = ko.observable(true);

  this.pauseGallery = ko.observable(false);

  // Includes adTimer module for use
  // when an ad slide is present
  this.adTimer = require('./adTimer').create();

  this.skipAdWaitDuration = 2000;

  // create array of slides without ads
  // so we can track current slide number
  // to display in gallery without
  // it including ad slides.
  this.slidesWithoutAds = _.reject(this.slides(), {type: 'ad'});

  this.currentSlideNum = ko.pureComputed(function () {
      return _.indexOf(this.slidesWithoutAds, this.currentSlide()) + 1;
  }, this);

  // prefetch the next slide image
  this.currentSlide.subscribe(function(newSlide) {
    if (!this.isLastSlide()) {
      prefetchImages(this.slides()[this.currentSlideIndex() + 1].image);
    }
  }, this);

  // Title Card
  // Just a representation of the gallery
  // Uses the first image of the gallery
  // and a "start" text
  this.isTitleCardVisible = ko.observable(this.config.isTitleCard);
  this.isTitleCardVisible.subscribe(function(newValue) {
    if (newValue && config.updateHistory) {
      History.pushState(null, null, config.galleryUrl);
    }
  }, this);


  this.removeTitleCard = function() {
    this.isTitleCardVisible(false);
  }.bind(this);


  // Subscribe to the `isActive` variable
  // changing within the adTimer module
  this.adTimer.isActive.subscribe(function(newValue) {
    this.isNextButtonActive(!newValue);
    this.pauseGallery(newValue);
  }, this);

  // checks if current slide is or isn't
  // an ad. Not the best name but works currently.
  this.isNotAdSlide = ko.pureComputed(function () {
      return this.currentSlide().type != 'ad';
  }, this);

  this.isNotOutroSlide = ko.pureComputed(function() {
    return this.currentSlide().type != 'outro';
  }, this);

  // When it is an ad
  // if initiaties adTimer, passes duration to run
  // ad module
  this.isNotAdSlide.subscribe(function(newValue) {
    if (newValue) return;

    this.adTimer.start(this.skipAdWaitDuration);
  }, this);


  // Captures value of logic when the gallery is being viewed.
  // Encapsulates a state we toggle visibility for
  // EX: social share and gallery caption
  this.isGalleryActive = ko.computed(function() {
    return this.isNotAdSlide() && !this.isTitleCardVisible();
  }, this);

  this.isGalleryContentSlide = ko.computed(function() {
    return this.isNotAdSlide() && !this.isTitleCardVisible() && this.isNotOutroSlide();
  }, this);



  // Adds class to slide wrapper
  // with appropriate media type class
  // these classes may adjust appearance
  // for particular media. EX: video includes video
  // wrapper styles for responsive videos
  this.slideMediaType = ko.pureComputed(function() {
    if (!this.currentSlide()) return;

    if (this.currentSlide().type == 'video') {
      return 'gallery__media--video';
    } else if (this.currentSlide().type == 'image') {
      return 'gallery__media--image'
    } else if (this.currentSlide().type == 'ad') {
      return 'gallery__media--ad'
    } else {
      return 'gallery__media--outro';
    }

  }, this);

  // update template based on slide type
  this.templateType = function(slide) {
    if (slide.type == 'image') {
      return 'image-slide-template';
    } else if (slide.type == 'video') {
      return 'video-slide-template';
    } else if (slide.type == 'ad') {
      return 'ad-slide-template';
    } else if (slide.type == 'outro') {
      return 'outro-slide-template';
    }
  };

  // Add to the base method to
  // check if the gallery is paused
  // due to adTimer running
  this.gotoPrevSlide = function() {
    if (this.pauseGallery()) return;

    if (this.isFirstSlide()) {
      this.isTitleCardVisible(true);
    } else {
      BaseGalleryViewModel.prototype.gotoPrevSlide.call(this);
    }

    this.reloadOutBrainModules();
    this.tealiumRefresh();
    // Canonical link refresh.
    this.canonicalLinkRefresh('prev');
    // Refresh rel=prev and rel=next.
    this.refreshPrevNextLinks();
    // Refresh ad while user navigate to previous slide.
    this.adRefresh();
  }

  this.gotoNextSlide = function() {
    // LSUNIFY-159 Scroll top to show slide image
    /*if ($('.btn--start').length) {
      var site_header = '';
      if ($(".ad-leaderboard").height() <= 90) {
        site_header = $(".pane-ut-standard-site-header").height() - 10;
      }
      $('html,body').animate({
        scrollTop: $(".pane-node-field-headline").offset().top - site_header},
      'slow');
    }*/

    if (this.isTitleCardVisible()) {
      this.removeTitleCard();
      this.reloadOutBrainModules();
      this.tealiumRefresh();
      // Canonical link refresh.
      this.canonicalLinkRefresh('next');
      // Refresh rel=prev and rel=next.
      this.refreshPrevNextLinks();
      this.adRefresh();

      return;
    }

    // remove title card if it is displayed when user goes to next slide
    if (this.isLastSlide() && config.nextContentUrl) {
      // navigate to next gallery url
      window.location = config.nextContentUrl;
    } else {
      // this checks state of next button
      // should only be 'false' when an ad is present
      if (this.pauseGallery()) return;
      BaseGalleryViewModel.prototype.gotoNextSlide.call(this);
    }

    this.reloadOutBrainModules();
    this.tealiumRefresh();
    // Canonical link refresh.
    this.canonicalLinkRefresh('next');
    // Refresh rel=prev and rel=next.
    this.refreshPrevNextLinks();
    // Refresh ad while user navigate to Next slide.
    this.adRefresh();
  };

  this.imageCredit = function() {
    if (this.currentSlide.imageCredit == '' || this.currentSlide.imageCredit == null || this.currentSlide.imageCredit == 'undefined') return false;

    return this.currentSlide().imageCredit;
  }

  // Tealium refresh.
  this.tealiumRefresh = function() {
    if (typeof window.Ti !="undefined" && typeof window.Ti.udo_metadata !="undefined") {
      window.Ti.udo_metadata.friendly_url = window.location.href;
      window.Ti.udo_metadata.page_number = this.currentSlideNum();
      this.currSlideNum = this.currentSlideNum();
      var slideTitle = config.slides[this.currSlideNum - 1].title;
      window.Ti.udo_metadata.slide_title = slideTitle;
      window.utag.view(window.Ti.udo_metadata);
    }
  }

  this.adRefresh = function() {
    var adSlots = new Array();

    if ($('div#ad-728x90_970x250_970x90_101x1_320x50_ATF:has(*)').length > 0) {
      adSlots.push("ad-728x90_970x250_970x90_101x1_320x50_ATF");
    }
    if ($('div#ad-300x50-1:has(*)').length > 0) {
        adSlots.push("ad-300x50-1");
    }
    if (window.innerWidth >= 1024) {
      if ($('div#ad-300x250_300x600_ATF:has(*)').length > 0) {
          adSlots.push("ad-300x250_300x600_ATF");
      }
    }
    if ($('div#ad-sponsor:has(*)').length > 0) {
        adSlots.push("ad-sponsor");
    }
    if ($('div#ad-gum-gum:has(*)').length > 0) {
      adSlots.push("ad-gum-gum");
    }

    tgx_ad_slots.push(function(ads){
      ads.refreshSlots(adSlots);
    });
  }

  // Canonical link refresh.
  this.canonicalLinkRefresh = function() {
    var current_page_url = window.location.href;
    $("link[rel='canonical']").attr('href', current_page_url);
  }

  // Refresh rel="prev" and rel="next".
  this.refreshPrevNextLinks = function(prevOrNext) {
    if (!this.isGalleryContentSlide()) {
      $('link[rel=prev]').remove();
    }
    else if (this.currentSlideIndex() == 0) {
      if ($('link[rel=prev]').length <= 0) {
        $('head').append('<link rel="prev" href="' + config.galleryUrl + '"/>');
      }
      else {
        $('link[rel=prev]').attr("href", config.galleryUrl);
      }
    }
    else if (this.currentSlideIndex() > 0) {
      if ($('link[rel=prev]').length <= 0) {
        $('head').append('<link rel="prev" href="' + this.slides()[this.currentSlideIndex() - 1].url + '"/>');
      }
      else {
        $('link[rel=prev]').attr("href", this.slides()[this.currentSlideIndex() - 1].url);
      }
    }


    if (this.currentSlideIndex() == this.totalSlideCount() - 1 || this.currentSlideIndex() == this.totalSlideCount() - 2) {
      $('link[rel=next]').remove();
    }
    else if (!this.isGalleryContentSlide()) {
      if ($('link[rel=next]').length <= 0) {
        $('head').append('<link rel="next" href="' + this.slides()[0].url + '"/>');
      }
      else {
        $('link[rel=next]').attr("href", this.slides()[0].url);
      }
    }
    else {
      if ($('link[rel=next]').length <= 0) {
        $('head').append('<link rel="next" href="' + this.slides()[this.currentSlideIndex() + 1].url + '"/>');
      }
      else {
        $('link[rel=next]').attr("href", this.slides()[this.currentSlideIndex() + 1].url);
      }
    }
  }

  this.reloadOutBrainModules = function() {
    var el = $('.ad-outbrain');
    if (el.find('.outbrain_widget_endslate').get(0)) {
      var hash = window.location.hash.replace('#', '');
      var outbrainEndslateContainer = el.find('.outbrain_widget_endslate');
      var outbraindDataSrc = outbrainEndslateContainer.attr('hidden-src');
      var outbraindDataWidgetId = outbrainEndslateContainer.attr('hidden-widget-id');
      var outbraindDataObTemplate = outbrainEndslateContainer.attr('hidden-ob-template');
      outbrainEndslateContainer.html(
        '<div class="OUTBRAIN" data-src="'
        + outbraindDataSrc + '" data-widget-id="'
        + outbraindDataWidgetId + '" data-ob-template="'
        + outbraindDataObTemplate + '"></div>');
      outbrainEndslateContainer.removeAttr('hidden-src').removeAttr('hidden-widget-id')
        .removeAttr('hidden-ob-template').removeClass('outbrain_widget_endslate').removeAttr('class');
    }

    if (typeof(OBR) !== "undefined" && typeof(OBR.extern) !== "undefined" && typeof(OBR.extern.refreshWidget) !== "undefined") {
      OBR.extern.refreshWidget()
    }
  }

  if (config.updateHistory) {
    require('./updateHistoryBehavior').call(this);
  }
}

GalleryViewModel.prototype = Object.create(BaseGalleryViewModel.prototype);

// For both legacy gallery and new gallery (List view / Gallery view).
$("a.btn--start, a.gallery__view").click(function() {
  utag.link({
    'event_name': 'gallery-view-toggle',
    'click_id': 'gallery-view-toggle'
  });
});

$(window).load(function() {
  // If leaderboard ad size is greater than 728 header should not be sticky.
  var width = $( "#ad-728x90_970x250_970x90_101x1_320x50_ATF" ).contents().find("iframe").width();
  if (width > 728) {
    $('.site-header__bar').addClass('ad-relative');
    $('.site-header__bar').parent().css({"display":"inline"})
  }

  var height = $("#ad-728x90_970x250_970x90_101x1_320x50_ATF").contents().find("iframe").height();
  if (height > 50 && height <= 90) {
    $('.sticky-wrapper').css({'height': '186px'});
    $('#ad-728x90_970x250_970x90_101x1_320x50_ATF').css({'max-height': '90px'})
  }
  else{
    $('#ad-728x90_970x250_970x90_101x1_320x50_ATF').css({'height': 'auto'})
  }
});

/* Will use exclusive true for hide 320x50 ad */
/*
$(window).scroll(function() {
    //If 300x250 ad is in view hide 320x50 ad and make a new call
    if ($('body').find('#ad-300x250_300x600_ATF').length != 0) {
        var bottomOfElement = Math.round($('#ad-300x50-0000001').offset().top);
        var windowScrollTop = Math.round(jQuery(window).scrollTop());
        var elementbottomOfElement = Math.round($('#ad-300x250_300x600_ATF').offset().top + $('#ad-300x250_300x600_ATF').outerHeight(true));
        var scrollTopPosition = Math.round(jQuery(window).scrollTop() + jQuery(window).height());
        var topOfElement = Math.round($('#ad-300x250_300x600_ATF').offset().top);

        if (bottomOfElement > topOfElement && scrollTopPosition < elementbottomOfElement) {
            $('#ad-300x50-0000001').hide();
            $('#ad-300x50-0000001').addClass('adflex');

        } else if (scrollTopPosition > elementbottomOfElement || scrollTopPosition < topOfElement) {
            if ($('#ad-300x50-0000001').hasClass('adflex')) {
                var adSlots = new Array();
                if (jQuery('div#ad-300x50-0000001').length > 0) {
                    adSlots.push("ad-300x50-0000001");
                }
                window.time_dfp.refresh(adSlots);
                $('#ad-300x50-0000001').removeClass('adflex');

            }
        }

    }

});
*/
