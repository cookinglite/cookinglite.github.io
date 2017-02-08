'use strict';

var $ = require('jquery'),
    _ = require('underscore'),
    ee = require('event-emitter'),
    HeightToggle = require('./heightToggle');

module.exports.createAccordion = function(el, options) {
  return new Accordion(el, options);
};

ee(Accordion.prototype);

var defaults = {
  contentClosedHeight: 0,
  accordionPanel: '.accordion__panel',
  accordionTrigger: '.accordion__trigger',
  accordionContent: '.accordion__content'
};

function Accordion(el, options) {
  this.opts = $.extend({}, defaults, options || {});
  this.$el = $(el);
  this.accordionTrigger = this.$el.data('accordion-trigger') || this.opts.accordionTrigger;
  this.accordionPanel = this.$el.data('accordion-panel') || this.opts.accordionPanel;
  this.accordionContent = this.$el.data('accordion-content') || this.opts.accordionContent;
  this.currentActiveMenuItem = null;
  this.heightToggles = [];

  var _this = this,
      options = options,
      $accordionContentItems = this.$el.find(this.accordionContent);

  $accordionContentItems.each(function() {
    var $this = $(this),
        height;

    if (typeof _this.opts.contentClosedHeight === 'function') {
      height = _this.opts.contentClosedHeight(this);
    } else {
      height = _this.opts.contentClosedHeight;
    }

    var heightToggle = new HeightToggle(this, height);

    heightToggle.close();

    heightToggle.on('open', _this.handleItemOpen.bind(_this));
    heightToggle.on('close', _this.handleItemClose.bind(_this));

    _this.heightToggles.push(heightToggle);
  });

  this.attachEvents();
}

Accordion.prototype.attachEvents = function() {
  var _this = this;

  this.$el.on('click', _this.accordionTrigger, function() {
    _this.findHeightToggle($(this).closest(_this.accordionPanel).find(_this.accordionContent).get(0)).toggle();
  });
};

Accordion.prototype.findHeightToggle = function(contentEl) {
  var heightToggle = _.find(this.heightToggles, function(heightToggle) {

    return heightToggle.getEl() == contentEl;
  })

  return heightToggle;
};

Accordion.prototype.handleItemOpen = function(menuItem) {
  if (this.currentActiveMenuItem && this.currentActiveMenuItem != menuItem) {
    this.currentActiveMenuItem.close();
  }

  this.emit('open', menuItem);

  this.currentActiveMenuItem = menuItem;
}

Accordion.prototype.handleItemClose = function(menuItem) {
  this.emit('close', menuItem);
}