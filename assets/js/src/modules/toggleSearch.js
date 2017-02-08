'use strict'

var $ = require('jquery');
require('waypoints');
require('waypointsSticky');

module.exports = function(el) {

    var $el = $(el),
        $search = $($el.data('open-target')),
        $searchForm = $search.find('.form-control'),
        $openIcon = $($el.data('open-element')),
        $closeIcon = $($el.find($el.data('close-element'))),
        $autocompleteInput = $('#autocomplete'),
        activeClass = 'is-active',
        visibilityClass = 'is-hidden';

    $openIcon.on('click', openSearch);

    $closeIcon.on('click', closeSearch);

    function openSearch() {
      $search.addClass(activeClass)
        .on('transitionend', function onTransitionEnd() {
          $searchForm.focus();
          $search.off('transitionend', onTransitionEnd);
        });
      $closeIcon.removeClass(visibilityClass);
      $openIcon.addClass(visibilityClass);
    }

    function closeSearch() {
      $search.removeClass(activeClass);
      $search.blur();
      $closeIcon.addClass(visibilityClass);
      $openIcon.removeClass(visibilityClass);

      if ($autocompleteInput.length > 0 ) {
        closeAutoComplete();
      }
    }

    function closeAutoComplete() {
      $autocompleteInput.val('');
      $autocompleteInput.autocomplete().hide();
    }

    //Search button
    $(".search-bar__btn").on('click', function(e) {
      e.preventDefault();
      var $v = $(this).closest('form').find('.form-control').val();
      location.href=window.location.origin+'/search/site/'+$v;
    });

    $(window).on('orientationchange', closeSearch);

$(window).load(function() {
    $(".node-type-recipe .article__media--video").hide();
});

//display video on click of image in Recipe Page
if ($(".pane-entity-field").hasClass("pane-node-field-images")) {
    if ($('body').hasClass('node-type-recipe')) {
        $('.pane-node-field-images img').css('cursor', 'pointer');
    }
    if ($(".node-type-recipe .recipe__header .article__media").hasClass("article__media--video")) {
        $(".node-type-recipe .recipe__header .icon-video-overplay, .node-type-recipe .pane-node-field-images img").on('click', function(e) {
            e.preventDefault();
            $(".node-type-recipe .recipe__header").find(".pane-node-field-images").hide();
            $(".node-type-recipe .recipe__header .article__media--video").show();
            bcJumpstart.playVideoOrAd(bcJumpstart.players[0]);
            if ($("header").hasClass('recipe__header')) {
                var titleTop = $(".article-title").offset().top;
                var titleHeight = $(".article-title").outerHeight();
                var siteHeaderheight = $('.site-header__bar').outerHeight();
                var scroll = (titleTop + titleHeight) - siteHeaderheight;
                $('body').scrollTop(scroll);
            }
        });
    }
    $(".recipe-instructions .icon-video-overplay, .recipe-instructions .article__media--hero img").on('click', function(e) {
        e.preventDefault();
        $(".recipe-instructions").find(".article__media--hero").hide();
        $(".recipe-instructions .article__media--video").show();
        bcJumpstart.playVideoOrAd(bcJumpstart.players[1]);
    });
}
//YieldMo Module Script
if (window.matchMedia("(min-width: 728px)").matches == false) {
    (function(e, t) {
        if (t._ym === void 0) {
            t._ym = "";
            var m = e.createElement("script");
            m.type = "text/javascript", m.async = !0, m.src = "//static.yieldmo.com/ym.m4.js", (e.getElementsByTagName("head")[0] || e.getElementsByTagName("body")[0]).appendChild(m)
        } else t._ym instanceof String || void 0 === t._ym.chkPls || t._ym.chkPls()
    })(document, window);
}
$("#videoBelt").each(function(){
                var $this = $(this),
                    toutCount = $this.find('li').length;
                function initVideoBelt() {
                    if (toutCount > 1) {
                        $this.find('ul').before('<div class="prev disabled"><a href="#">&laquo;</a></div>').after('<div class="next"><a href="#">&raquo;</a></div>');
                        $this.find('li').each(function(index){
                            $(this).find(".related-videos__item-body").append('<span class="count"></span>');
                            $(this).find(".count").text((index+1) + "/" + toutCount);
                        }).eq(0).siblings().hide();
                    }
                    $this.find(".prev a").on("click", function(){
                        if ($(this).parent(".disabled").length === 0) {
                            moveBelt(-1);
                        }
                        return false;
                    });
                    $this.find(".next a").on("click", function(){
                        if ($(this).parent(".disabled").length === 0) {
                            moveBelt(1);
                        }
                        return false;
                    });
                }

                function moveBelt(steps){
                    var visiblePos = $this.find('li:visible').prevAll("li").length;
                    var newPos = visiblePos + steps;

                    //enable or disable arrows
                    $('div.prev').toggleClass('disabled', newPos === 0);
                    $('div.next').toggleClass('disabled', newPos+1 === toutCount);

                    //show current block; hide others
                    $this.find("li").eq(newPos).show().siblings().hide();
                }

                initVideoBelt();
                $this.show();
            });

};

