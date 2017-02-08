var $ = require('jquery'),
    Headroom = require('headroom.js'),
    autocomplete = require('devbridge-autocomplete');

module.exports = function(el) {
  var $el = $(el),
      $win = $(window),
      $scrollTarget,
      $header = $('.article__header'),
      $autocomplete = $('#autocomplete');

  if ($($el.data('scroll-target')).length){
    $scrollTarget = $($el.data('scroll-target')).height() + $($el.data('scroll-target')).offset().top;
  } else {
    $scrollTarget = $win.height() * .25;
  }

  // set height triggers after we've determined what
  // scroll target becomes, either the element offset or
  // 25% of the window height
  var smallHeightTrigger = $header.outerHeight(true),
      mediumHeightTrigger = $scrollTarget;

  $win.load(function() {
    // Hides search bar when
    // offset is met.
    var headroomOptions = {
      offset: smallHeightTrigger / 2,
      onUnpin: function() {
        var closeIcon = $el.find('.icon-close'),
            searchWrap = $el.find('.search-wrap'),
            hiddenClass = 'is-hidden';

        $el.find('.search-bar').removeClass('is-active');

        if (!closeIcon.hasClass(hiddenClass)) {
          closeIcon.addClass(hiddenClass);
          searchWrap.removeClass(hiddenClass);
        }
      }
    };

    // If viewport is widering than 400px,
    // we change the offest to be larger.
    if (window.matchMedia("(min-width: 400px)").matches) {
      $.extend(headroomOptions, {
          offset: mediumHeightTrigger - 75
      });
    }

    var headroom = new Headroom(document.querySelector('.site-header__menu-bar'), headroomOptions);

    headroom.init();

    var $article_title = $('.article__header-wrap .article-title').text();

    $('.site-header__title').html($article_title);
    
  });
}