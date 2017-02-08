'use strict';
require('history');
var ko = require('knockout'),
    _ = require('underscore');

module.exports = function() {
  var _this = this;
  this.setSlideBySlug = function(slug) {
    var slideIndex = _.findIndex(this.slides(), {url: slug});
    if (slideIndex == -1) return;

    this.currentSlideIndex(slideIndex);
  };


  History.Adapter.bind(window, 'statechange', function() { // Note: We are using statechange instead of popstate
    var state = History.getState(); // Note: We are using History.getState() instead of event.state
    this.setSlideBySlug(state.data.slug);
  }.bind(this));  

  // update browser history/url when current slide changes (and when title card
  // is removed which sets url to url of first slide)
  ko.computed(function() {
    var url = "#";
    var slideUrl = this.currentSlide().url;
    var gallery_seo = this.config.galleryUrl;
    var title = this.currentSlide().browserTitle;
    var hash = "";
    var state = History.getState();
    if (gallery_seo.lastIndexOf('/') > -1) {
      gallery_seo = gallery_seo.substring(gallery_seo.lastIndexOf('/'));
    }
    if (this.config.isLegacy !== undefined && this.config.isLegacy) {
      url = gallery_seo + '/';
    }
    hash = url + slideUrl;
    if (this.currentSlide() && this.currentSlide().url && !this.isTitleCardVisible()) {

      history.pushState({
        slug: slideUrl},
        title,
          hash);
      url = ";asdfsdf";
    }
  }, this);
};