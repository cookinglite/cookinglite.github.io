'use strict';

var $ = require('jquery'),
    _ = require('underscore'),
    ee = require('event-emitter');

module.exports = HeightToggle;

ee(HeightToggle.prototype);

function HeightToggle(el, closeHeight) {
  this.$el = $(el);
  this.isOpen = false;
  this.activeClass = 'is-open';
  this.CLOSED_HEIGHT = closeHeight;
  this.initialHeight = this.$el.outerHeight();

}

HeightToggle.prototype.open = function() {
  this.isOpen = true;
  this.$el.addClass(this.activeClass);

  if (this.CLOSED_HEIGHT !== false) {
    this.$el.height(this.initialHeight);
  }

  this.emit('open', this);
};

HeightToggle.prototype.close = function() {
  this.isOpen = false;
  this.$el.removeClass(this.activeClass);

  if (this.CLOSED_HEIGHT !== false) {
    this.$el.height(this.CLOSED_HEIGHT);
  }

  this.emit('close', this);
};

HeightToggle.prototype.toggle = function() {
  if (this.isOpen) {
    this.close();
  } else {
    this.open();
  }
};

HeightToggle.prototype.getEl = function() {
  return this.$el.get(0);
};