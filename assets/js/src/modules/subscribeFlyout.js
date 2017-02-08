'use strict'

var $ = require('jquery');

module.exports = function(el) {
  var $el = $(el),
      btn = $el.data('button-target'),
      $btn = $($el.find(btn)),
      $content = $el.find('.subscribe-button-flyout__content'),
      $close = $el.find('.subscribe-button-flyout__close');


      $btn.on('click', openContent);

      $close.on('click', closeContent);

      function openContent() {
        $el.toggleClass('is-open');
      }

      function closeContent() {
        $el.removeClass('is-open');
      }
}