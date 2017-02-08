'use strict';

module.exports = function safeMatchMedia(func, fallbackFunc) {
  // ensure matchMedia is supported before calling func
  if (typeof window.matchMedia != 'function') {
    fallbackFunc && fallbackFunc();
    return;
  }

  func();
}