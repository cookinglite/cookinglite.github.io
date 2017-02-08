'use strict';

var $ = require('jquery'),
    articleDetailBar = require('./articleDetailBar');

require('waypoints');
require('waypointsSticky');

var sticky;

module.exports = function(el) {
  var $el = $(el),
      $win = $(window),
      $header = $('.article__header'),
      $body = $('.article__body'),
      $description = $("meta[property='og:description']").attr("content"),
      mql = window.matchMedia("(min-width: 768px) and (max-width: 1024px)");

  // initialize the article detail bar
  articleDetailBar(el);

  if ($el.hasClass('site-header--alt') && window.matchMedia("(min-width: 1024px)").matches) return false;

  sticky = createStickyHeader(el);

  // Need to re-initialize Wapoints Sticky
  // when resizing browser in either directon (min/max width)
  // so it recalculates the height of the fixed position
  // element with or without an ad unit
  mql.addListener(function(mql) {
    module.exports.recalcSticky(el);
  });
};

module.exports.recalcSticky = function(el) {
  sticky.destroy();
  sticky = createStickyHeader(el);
};

function createStickyHeader(el) {
  return new Waypoint.Sticky({
    element: el,
    stuckClass: 'is-fixed'
  });
}