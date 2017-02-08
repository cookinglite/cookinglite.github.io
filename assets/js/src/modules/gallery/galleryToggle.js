'use strict';

var $ = require('jquery');
var listicle;
var state = 'gallery';


function toggleAttach() {
    $(document).ready(function (){
        var html;
        if ($('.gallery')) {
            listicle = $('.gallery-listicle').detach();
            html = $.parseHTML($('#gallery-header-bottom', listicle).text());
            $(listicle).prepend(html);
            $('.gallery__view').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleGallery();
            });
        }
    });
}

function toggleGallery(){
    var svg_url = "";
    if ($('.gallery__view svg use').attr("xlink:href").indexOf('assets') > -1) {
        svg_url = "/assets/img/symbols.svg";
    }
    if (state === 'gallery') {

        $('.gallery__view svg use').attr("xlink:href", svg_url + "#icon-grid");
        $('.gallery__view .gallery__view-text').text('View Gallery');
        $('.gallery').hide();
        $('.gallery').after(listicle);
        $('.page-container').removeClass('page-container--narrow');
        state = 'listicle';
    }
    else if(state === 'listicle') {
        $('.gallery__view svg use').attr("xlink:href", svg_url + "#icon-list");
        $('.gallery__view .gallery__view-text').text('View List');
        $('.gallery-listicle').detach();
        $('.page-container').addClass('page-container--narrow');
        $('.gallery').show();
        state = 'gallery';
    }
}

module.exports = toggleAttach;

