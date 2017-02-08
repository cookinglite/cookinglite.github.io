'use strict';

var $ = require('jquery'),
    autocomplete = require('devbridge-autocomplete');

module.exports = function(el) {
  var $el = $(el),
      $searchBar = $('.search-bar--in-site-header'),
      $searchForm = $('.search-form'),
      $container = $el.closest($searchForm).find('.autocomplete-container'),
      $html = $('html'),
      openClass = 'is-open',
      fixedClass = 'is-fixed',
      mql = window.matchMedia("(min-width: 1024px)"),
      isMobile = $(window).width() < 1024;

  mql.addListener(function(data) {
    if (data.matches) {
      isMobile = false;
    } else {
      isMobile = true;
    }
  });

  $el.addClass('has-autocomplete');

  var url = '/data/dummy-search-data.json';

  $el.autocomplete({
    serviceUrl: url,
    dataType: 'json',
    groupBy: 'type',
    beforeRender: function() {
      $container.addClass(openClass);

      if (isMobile === true) {
        $html.addClass(fixedClass);
      }
    },
    appendTo: $('.autocomplete-container'),
    onHide: function() {
      $container.removeClass(openClass);
      $html.removeClass(fixedClass);
    },
    transformResult: function(response, originalQuery) {
      return {
        suggestions: $.map(response.results, function(dataItem) {
             return { value: dataItem.title, data: dataItem, type: dataItem.type };
         })
      }
    },

    formatResult: function (suggestion, currentValue, i) {
      if (suggestion.type == 'suggested') {
        return getFeaturedTemplate({
          img: suggestion.data.img.src,
          alt: suggestion.data.img.alt,
          url: suggestion.data.url,
          title: $.Autocomplete.formatResult(suggestion, currentValue)
        });

      } else {
        return getTermTemplate({
          title: $.Autocomplete.formatResult(suggestion, currentValue)
        });
      }
    },

    onSelect: function (suggestion) {
      // take user to url if they select featured
      // content from the search results
      if (suggestion.type === 'suggested') {
        window.location.href = suggestion.data.url;
      }
    }
  });



  $(window).on('resize', function() {
    if ($container.hasClass(openClass)) {
      $container.removeClass(openClass);
      $el.autocomplete().hide();
      $el.val('');
      $html.removeClass(fixedClass);
    }
  });
}

function getTermTemplate(args) {
  return (
    '<div class="basic-suggestion suggestion-title">' +
        args.title +
    '</div>'
  );
}

function getFeaturedTemplate(args) {
  return (
    '<div class="featured-suggestion">' +
      '<a href="' +  args.url + '">' +
        '<img class="featured-suggestion__img" src="' + args.img + '" alt="' +  args.alt +'">' +
      '</a>'+
      '<a class="featured-suggestion__title" href="' +  args.url + '">' +
        args.title +
      '</a>'+
    '</div>'
  );
}