'use strict';

var $ = require('jquery');

module.exports = function(el) {
  var $el = $(el),
      btn = $el.data('panel-submit'),
      closeIcon = $el.data('panel-close'),
      $form = $el.closest('.filter-panel__form'),
      $btn = $form.find(btn),
      $close = $el.find(closeIcon),
      mql = window.matchMedia("(min-width: 1024px)");

      listenForFormSelections();

      // Checks if any checkboxes have been selected in the form
      // if so, then we toggle the display of the submit button and close button
      //
      // We immediately add visibility to button as we want the close icon display
      // whent his function initially runs.
      function listenForFormSelections() {
        $btn.addClass('is-hidden');

        $form.on('change', function(){
          if ($('.custom-checkbox__input:checked').length > 0) {
            enableSubmissionFromHeader();
          } else {
            disableSubmissionFromHeader();
          }
        });
      }

      function enableSubmissionFromHeader() {
        $close.addClass('is-hidden');
        $btn.removeClass('is-hidden');
      }

      function disableSubmissionFromHeader() {
        $close.removeClass('is-hidden');
        $btn.addClass('is-hidden');
      }
}