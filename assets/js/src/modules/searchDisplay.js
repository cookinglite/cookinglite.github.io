'use strict'

var $ = require('jquery');
require('waypoints');

module.exports = function(el) {
  var $el = $(el),
      visibleClass = 'is-visible',
      activeClass = 'is-active',
      $searchTrigger = $('.menu-bar__search--trigger'),
      $searchBar = $('.search-bar--in-site-header');

  var waypoint = new Waypoint({
    element: $el[0],
    handler: function(direction) {
      // if (direction === 'up') {
      //   hideSearchIcon()
      // } else {
      //   displaySearchIcon();
      // }
    }
  });

  function displaySearchIcon() {
    $searchTrigger.addClass(visibleClass);
  }

  function hideSearchIcon() {
    $searchTrigger.removeClass(visibleClass);
    $searchBar.removeClass(activeClass);
  }
};