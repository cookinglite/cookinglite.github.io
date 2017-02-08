'use strict'

var $ = require('jquery'),
    slick = require('slick');

module.exports = function() {
    var el = $('.ad-outbrain');
    $( window ).load(function() {
    	if (el.find('.outbrain_widget_container').get(0)) {
			var outbrainContainer = el.find('.outbrain_widget_container');
			var outbraindDataSrc = outbrainContainer.attr('hidden-src');
			var outbraindDataWidgetId = outbrainContainer.attr('hidden-widget-id');
			var outbraindDataObTemplate = outbrainContainer.attr('hidden-ob-template');
			if (window.matchMedia("(min-width: 728px)").matches == false) {
		      /* the viewport is 728 pixels wide or less */
		      var outbraindDataWidgetId = "MB_3";
		    }
			outbrainContainer.html(
			'<div class="OUTBRAIN" data-src="'
			+ outbraindDataSrc + '" data-widget-id="'
			+ outbraindDataWidgetId + '" data-ob-template="'
			+ outbraindDataObTemplate + '"></div>');
			outbrainContainer.removeAttr('hidden-src').removeAttr('hidden-widget-id')
			.removeAttr('hidden-ob-template').removeClass('outbrain_widget_container').removeAttr('class');
		}
		/* the viewport is 1024 pixels wide or more */
		if (el.find('.outbrain_widget_sidebar').get(0)) {
			var outbrainSideContainer = el.find('.outbrain_widget_sidebar');
			var outbraindSideDataSrc = outbrainSideContainer.attr('hidden-src');
			var outbraindSideDataWidgetId = outbrainSideContainer.attr('hidden-widget-id');
			var outbraindSideDataObTemplate = outbrainSideContainer.attr('hidden-ob-template');
			console.log(window.matchMedia("(min-width: 1024px)").matches);
			if (window.matchMedia("(min-width: 1024px)").matches == true) {
				outbrainSideContainer.html(
				'<div class="OUTBRAIN" data-src="'
				+ outbraindSideDataSrc + '" data-widget-id="'
				+ outbraindSideDataWidgetId + '" data-ob-template="'
				+ outbraindSideDataObTemplate + '"></div>');
				outbrainSideContainer.removeAttr('hidden-src').removeAttr('hidden-widget-id')
				.removeAttr('hidden-ob-template').removeClass('outbrain_widget_sidebar').removeAttr('class');
			}
		}
  });

 var validateEmail = function(elementValue) {
     var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
     return emailPattern.test(elementValue);
 }
 var validateZipcode = function(zipValue) {
     var zippattern = /^[0-9]{5}(?:-[0-9]{4})?$/;
     return zippattern.test(zipValue);
 }

 /* To do move this code out from here */
 $("#btn_newsletter").on("click", function(e) {
     e.preventDefault();
     var email = $('#email_address').val();
     var zip = $('#zip').val();
     var emailvalid = validateEmail(email);
     var zipvalid = validateZipcode(zip);
     if (!emailvalid) {
         alert("Please enter a valid email");
         return false;
     }
     if (!zipvalid) {
         alert("Please enter a valid zip code");
         return false;
     }
     $(".newsletter__form").submit();
 });
};
