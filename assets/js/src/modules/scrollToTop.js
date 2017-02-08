'use strict';

module.exports = function(el) {
    var $el = $(el),
        target = $el.data('scroll-target'),
        $target = $(target),
        siteHeaderHeight = $('.site-header__bar').outerHeight(true);

    $el.on('click', function(e) {
      e.preventDefault();

      $('html, body').animate({
          scrollTop: $target.offset().top - siteHeaderHeight
      }, 500);

      if ($target.find('input').length) {
        $target.find('input').focus();
      }
    });
}