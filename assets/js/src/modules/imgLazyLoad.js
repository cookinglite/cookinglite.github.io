'use strict'

var $ = require('jquery');
require('jquery-lazyload');

module.exports = function(el) {
    $(el).lazyload({
      threshold : 200,
      effect : 'fadeIn'
    });
};