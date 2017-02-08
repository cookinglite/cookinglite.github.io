'use strict'

var $ = require('jquery'),
    _ = require('lodash');

module.exports = function(el) {
  var $el = $(el),
      $navTarget = $($el.data('nav-target')),
      $scrollTarget = $($el.data('scroll-target')),
      offsetValue = $scrollTarget.height(),
      isActive = false,
      activeClass = 'is-active',
      hiddenClass = 'is-hidden',
      mediaWidth = $el.data('init-width') || '1024px',
      media = window.matchMedia('(min-width: ' + mediaWidth + ')'),
      DEBOUNCE_INTERVAL = 100;

  if (media.matches) {
    initScrollListener();
  }

  media.addListener(function(data) {
    if (data.matches) {
      initScrollListener();
    } else {
      destroyScrollListener();
    }
  });


  function initScrollListener() {
    $(window).on('scroll.navTransition', _.throttle(function() {
      var scroll = $(window).scrollTop();

      if (scroll >= offsetValue ){
        displaySecondaryNav();
      } else {
        hideSecondaryNav();
      }
    }, DEBOUNCE_INTERVAL));
  }

  function destroyScrollListener() {
    $(window).off('scroll.navTransition');
    hideSecondaryNav();
  }

  function displaySecondaryNav() {
    isActive = true;
    $navTarget.removeClass(hiddenClass);
    $navTarget.addClass(activeClass);
  }

  function hideSecondaryNav() {
    isActive = false;
    $navTarget.addClass(hiddenClass);
    $navTarget.removeClass(activeClass);
  }
};