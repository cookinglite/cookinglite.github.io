'use strict'

var $ = require('jquery'),
    slick = require('slick');

module.exports = function(el) {
    var $el = $(el),
        slickTarget = $el.find($el.data('slider-target')),
        $slickTarget = $(slickTarget),
        slickOptions = {
          prevArrow: $el.find('.content-slider__btn--prev'),
          nextArrow: $el.find('.content-slider__btn--next'),
          slidesToShow: 4,
          speed: 275,
          responsive: [
              {
                breakpoint: 1024,
                settings: {
                  slidesToShow: 4,
                  slidesToScroll: 4,
                }
              },
              {
                breakpoint: 768,
                settings: {
                  slidesToShow: 1,
                  slidesToScroll: 1
                }
              }
            ]
        }

  $slickTarget.slick(slickOptions);
};