'use strict';

var $ = require('jquery');
require('waypoints');
require('waypointsSticky');
var smallNavSticky;

module.exports = function(el) {
  var $el = $(el),
    smallMedia = window.matchMedia("(min-width: 1024px)"),
    mql = window.matchMedia("(min-width: 768px) and (max-width: 1024px)");

  if (!smallMedia.matches) {
    intitalizeStickyNav();
  } else {
  }

  smallMedia.addListener(function(data) {
    if (data.matches) {
      smallNavSticky.destroy();
    } else {
      intitalizeStickyNav();
    }
  });

  mql.addListener(function(mql) {
    module.exports.recalcSticky(el);
  });

  function intitalizeStickyNav() {
    smallNavSticky = createStickyHeader(el);
  }
};

module.exports.recalcSticky = function(el) {
  smallNavSticky.destroy();
  smallNavSticky = createStickyHeader(el);
};

function createStickyHeader(el) {
  return new Waypoint.Sticky({
    element: el,
    stuckClass: 'is-fixed'
  });
}