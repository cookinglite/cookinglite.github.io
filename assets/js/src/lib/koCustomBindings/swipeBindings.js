'use strict';

var ko = require('knockout'),
  Hammer = require('hammerjs');

makeSwipeBinding('swipe');
makeSwipeBinding('swipeLeft');
makeSwipeBinding('swipeRight');

function makeSwipeBinding(swipeEvent) {
  ko.bindingHandlers[swipeEvent] = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
      bindHammerEvent(element, swipeEvent.toLowerCase(), valueAccessor(), bindingContext.$data);
    }
  };
}

function bindHammerEvent(element, event, handler, viewModel) {
  delete Hammer.defaults.cssProps.userSelect;
  var hammer = new Hammer(element);
  hammer.on(event, function(e) {
    handler.call(viewModel, e);
  });
};
