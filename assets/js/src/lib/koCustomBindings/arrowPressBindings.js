'use strict';

var ko = require('knockout');

makeKeyPressBinding('leftArrowPress', 37);
makeKeyPressBinding('rightArrowPress', 39);

function makeKeyPressBinding(bindingName, keyCode, context) {
  ko.bindingHandlers[bindingName] = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
      var handler = valueAccessor();

      (context || document).addEventListener('keyup', function(e) {
        if (e.keyCode != keyCode) return;

        handler.call(bindingContext.$data, e);
      });
    }
  }
}