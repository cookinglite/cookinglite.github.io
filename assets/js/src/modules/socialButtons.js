'use strict';

var $ = require('jquery');

var socialButtons = function () {
    var og_title = $("meta[property='og:title']").attr("content");
    var og_image = $("meta[property='og:image']").attr("content");
    var og_url = $("meta[property='og:url']").attr("content");
    var og_description = $("meta[property='og:description']").attr("content");
    var pin_url = 'https://www.pinterest.com/pin/create/button/?';
    var twitter_endpoint = 'https://twitter.com/share?';

    var pin_brand_url = 'https://www.pinterest.com/myrecipes/';
    var fb_brand_url = 'https://www.facebook.com/MyRecipes';
    var email_brand_url = 'http://www.myrecipes.com/contact-us';
    var tw_brand_url = 'https://twitter.com/My_Recipes';

    // Load Facebook
    var src = 'https://connect.facebook.net/en_US/all.js';
    var head = document.head || document.getElementsByTagName('head')[0];
    var a = document.createElement('script');
    a.type = 'text/javascript';
    a.onload = function() {
        inititalizeFacebookButtons();
    };
    a.async = true;
    a.src = src;
    //Redesign Social Tools Omniture Tracking.
    $(".social-share").find("a").click(function() {
         var social_network = "";
         var social_share = "";
         var sc_link_class = $(this).attr("class");

         if (sc_link_class.toLowerCase().indexOf("social-share__item--facebook") >= 0) {
             social_network = "facebook";
             social_share = 'sharebar|facebook';
         }
         if (sc_link_class.toLowerCase().indexOf("social-share__item--twitter") >= 0) {
             social_network = "twitter";
             social_share = 'sharebar|twitter';
         }
         if (sc_link_class.toLowerCase().indexOf("social-share__item--pinterest") >= 0) {
             social_network = "pinterest";
             social_share = 'sharebar|pinterest';
         }
         if (sc_link_class.toLowerCase().indexOf("social-share__item--email") >= 0) {
             social_network = "email";
             social_share = 'sharebar|email';
         }

         if (social_network) {
             utag.link({
                 "event_name": "social_share",
                 "social_network": social_network,
                 "click_id": social_share
            });
         }
    });

    $(".action-bar .action-bar__next").find("a").click(function() {
        utag.link({
          "event_name": 'next-content',
          "click_id": "nextarticle"
       });
    });

    $(".recipe-utility-links__link").find("a.social-share__item--print").click(function() {
        utag.link({
          "event_name": 'print',
          "click_id": "sharebar|print"
       });
    });

    $(".newsletter__content").find("#btn_newsletter").click(function() {
      utag.link({
        "event_name": 'sign-up',
        "click_id": "newsletter-content|sign-up"
      });
    });

    // Format Pinterest Buttons
    $('.social-share__item--pinterest').each(function(index){
        var t = this;
        if($(this).parent('.brand-social').length > 0) {
          $(this).attr('href', pin_brand_url);
          $(this).attr('target', '_blank');
        }
        else {
            var img_url = $(this).data("img-src");
            if (img_url === undefined) {
                img_url = og_image;
            }
            var pinterst_url = 'url=' + encodeURIComponent(og_url);
            var pinterst_img = 'media=' + encodeURIComponent(img_url);
            var pinterst_description = 'description=' + encodeURIComponent(og_description);
            var pinterest_uri = pin_url + pinterst_url + '&' + pinterst_img + '&' + pinterst_description;

            $(this).attr('href', pinterest_uri);
            $(this).attr('target', '_blank');
        }
    });

    // Format Twitter Buttons
    $('.social-share__item--twitter').each(function(index){
        var t = this;
        if($(this).parent('.brand-social').length > 0) {
          $(this).attr('href', tw_brand_url);
          $(this).attr('target', '_blank');
        }
        else {
            var twitter_url = 'url=' + encodeURIComponent(og_url);
            var twitter_text = 'text=' + encodeURIComponent(og_title) + '@My_Recipes';
            var twitter_uri = twitter_endpoint + twitter_url + '&' + twitter_text;

            $(this).attr('href', twitter_uri);
            $(this).attr('target', '_blank');
        }
    });

    // Format Email Buttons
    $('.social-share__item--email').each(function(index){
        var t = this;
        if($(this).parent('.brand-social').length > 0) {
          $(this).attr('href', email_brand_url);
          $(this).attr('target', '_blank');
        }
        else {
            var ctype = $("meta[name='ctype']").attr("content");
            var email_body = "I think you'll like this " + ctype + " from MyRecipes.com";
            email_body += "\n\n";
            email_body += og_title + "\n";
            email_body += og_url + "\n\n";
            email_body += "Follow MyRecipes on Facebook, Twitter, YouTube, and Pinterest.\n\n";
            email_body += "Follow MyRecipes:\n";
            email_body += "Facebook: http://www.facebook.com/MyRecipes\n";
            email_body += "Pinterest: http://www.pinterest.com/myrecipes/\n";
            email_body += "Twitter: https://twitter.com/MyRecipes\n";
            email_body += "YouTube: https://www.youtube.com/MyRecipes\n";

            var email_subject = 'subject=' + encodeURIComponent(og_title);
            var email_body = 'body=' + encodeURIComponent(email_body);
            var email_url = 'mailto:?' + email_subject + '&' + email_body;

            $(this).attr('href', email_url);
            //$(this).attr('target', '_blank');
        }
    });

    // Format SMS Buttons
    $('.social-share__item--sms').each(function(index){
        var t = this;
        var sms_body = "I think you'll like this link from MyRecipes.com";
        sms_body += "\n\n";
        sms_body += og_title + "\n";
        sms_body += og_url + "\n\n";
        var sms_body = 'body=' + encodeURIComponent(sms_body);
        var sms_url = 'sms:;' + sms_body;
        if ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ) {
            sms_url = 'sms:&' + sms_body;
        }
        else if ( navigator.userAgent.match(/(Android)/g) ) {
            sms_url = 'sms:?' + sms_body;
        }
        $(this).attr('href', sms_url);
    });

    // Format Facebook Buttons
    $('.social-share__item--facebook').each(function(index){
        var t = this;
        var facebook_share = 'https://www.facebook.com/sharer/sharer.php?u=' + og_url;
        if($(this).parent('.brand-social').length > 0) {
            $(this).attr('href', fb_brand_url);
            $(this).attr('target', '_blank');
        }
        else {
            $(this).attr('href', facebook_share);
            $(this).attr('target', '_blank');
        }
    });

};


var inititalizeFacebookButtons = function () {
    // Initialize the Facebook SDK.
    return;
    var og_title = $("meta[property='og:title']").attr("content");
    var og_image = $("meta[property='og:image']").attr("content");
    var og_url = $("meta[property='og:url']").attr("content");
    var og_description = $("meta[property='og:description']").attr("content");


    FB.init({
        appId: '966242223397117',
        version: 'v2.0',
        status: true,
        cookie: true
    });



    // Facebook
    $('.social-share__item--facebook').on('click', function (e) {
        if($(this).parent('.brand-social').length == 0) {
            var img_url = $(this).data("img-src");
            if (img_url === undefined) {
                img_url = og_image;
            }
            e.preventDefault();

            FB.ui(
                {
                    method: 'feed',
                    name: og_title,
                    link: og_url,
                    picture: img_url,
                    description: og_description
                },
                function(response) {}
            );
        }
        //Omni.omniActionTrack('share toolbar|facebook');
    });
};





module.exports = function () {
    socialButtons();

};
