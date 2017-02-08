'use strict'

var $ = require('jquery');

module.exports = function(el) {
    var $el = $(el),
        $html = $('html'),
        panel = $el.data('filter'),
        $panel = $(panel),
        $closeBtn = $(panel).find('.icon-close'),
        isOpen = false,
        fixedClass = 'is-fixed',
        mql = window.matchMedia("(min-width: 1024px)"),
        isMobile = $(window).width() < 1024;


    $el.on('click', toggleDisplay);

    mql.addListener(function(data) {
      if (data.matches) {
        isMobile = false;
      } else {
        isMobile = true;
      }
    });

    $closeBtn.on('click', closeToggle);

    function toggleDisplay() {
      if (isOpen) {
        closeToggle();
      } else {
        openToggle();
      }
    }

    function openToggle() {
      $panel.addClass('is-open');
      $el.addClass('is-open');
      isOpen = true;

      if (isMobile === true) {
        $html.addClass(fixedClass);
      }

      $(document).on('click', closeFilterPanelOnBGClick);
    }

    function closeToggle() {
      $panel.removeClass('is-open');
      $el.removeClass('is-open');
      isOpen = false;

      if (isMobile === true) {
        $html.removeClass(fixedClass);
      }

      $(document).off('click', closeFilterPanelOnBGClick);
    }

    function closeFilterPanelOnBGClick(e) {
      if ( e.target === $el[0] ) return;
      if ( $(e.target).hasClass(panel) ) return;
      if ( $(e.target).closest(panel).length > 0) return;

      closeToggle();
    }

    $(window).on('resize', closeToggle);
};