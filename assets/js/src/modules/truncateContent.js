'use strict';
var $ = require('jquery'),
    _ = require('underscore');

module.exports = function(el) {
  var $el = $(el),
      elHeight = $el.height(),
      options = $el.data('options'),
      maxHeight = options.maxHeight || 150,
      containerClass = options.containerClass || 'truncateContent__container',
      containerSel = '.' + options.containerClass || '.truncateContent__container',
      btnClass = options.btnClass || 'truncateContent__btn',
      btnText = options.btnText || 'view more',
      btnSel = '.' + options.btnClass || '.truncateContent__btn',
      $btn = buildBtn(),
      isOpen = false,
      closedClass = 'is-closed';

  if (elHeight > maxHeight) {
    initTruncatedContent();
  }

  $(window).on('resize', function(el) {
    elHeight = $el[0].scrollHeight;

    closeContentContainer();
  });

  function initTruncatedContent() {
    $el.addClass(closedClass);
    $el.height(maxHeight);
    $el.append($btn);

    $btn.on('click', 'a', function(e) {
      e.preventDefault();
      toggleTruncatedContent();
    });
  }

  function toggleTruncatedContent() {

    if (isOpen) {
      closeContentContainer();
    } else {
      openContentContainer();
    }
  }

  function buildBtn() {
    var btn = $('<div>')
              .addClass('truncateContent__container is-closed')
              .append(
                $('<a>').attr('href', '#')
                        .addClass(btnClass)
                        .text(btnText)
              );

    return btn;
  }

  function closeContentContainer() {
    isOpen = false;
    $el.addClass(closedClass);
    $el.height(maxHeight);
    $(btnSel).text(btnText);
    $(containerSel).addClass(closedClass);
  }

  function openContentContainer() {
    isOpen = true;
    $el.removeClass(closedClass);
    $(containerSel).removeClass(closedClass);
    // do this to set some space between
    // button and text when opened.
    $el.height(elHeight + 35);
    $(btnSel).text('view less');
  }
};