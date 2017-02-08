'use strict';

var $ = require('jquery'),
    createAccordion = require('./accordion').createAccordion;

module.exports = function(el) {
  var accordion = createAccordion(el, {
      contentClosedHeight: false
  });

  accordion.on('open', function(menuItem) {
    toggleTriggerText(menuItem.$el, accordion.accordionTrigger, 'Less');
  });

  accordion.on('close', function(menuItem) {
    toggleTriggerText(menuItem.$el, accordion.accordionTrigger, 'More');
  });

  function toggleTriggerText(menuItem, trigger, text) {
    menuItem.parent().find(trigger).text(text);
  }
};

