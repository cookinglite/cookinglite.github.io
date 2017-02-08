'use strict';

var $ = require('jquery');

module.exports = function (el) {
  var $el = $(el),
    $html = $('html'),
    $menu = $($el.data('menu-target')),
    $overlay = $('<div>').addClass($el.data('menu-overlay-class')),
    isMenuOpen = false;

  function menuTrigger() {
    menuToggle();
  }

  function menuToggle() {
    isMenuOpen = !isMenuOpen;
    $html.toggleClass('has-fixed-overlay');
    $menu.toggleClass('is-open');

    toggleOverlay();

    if (isMenuOpen) {
      $($el.data('close-trigger')).on('click', menuToggle);
    } else {
      $($el.data('close-trigger')).off('click', menuToggle);
    }
  }

  function toggleOverlay() {
    if (isMenuOpen) {
      $('body').append($overlay);
      addOverlayClass();
    } else {
      $overlay.remove();
    }
  }

  function addOverlayClass() {
    setTimeout(function(){
      $overlay.addClass('is-open');
    }, 0);
  }

  $el.on('click', menuTrigger);
}