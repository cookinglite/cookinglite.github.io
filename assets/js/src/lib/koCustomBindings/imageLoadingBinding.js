'use strict';

var ko = require('knockout');

ko.bindingHandlers.imageLoading = (function() {
  var loadedImages = {};
  
  return {
    init: function(el, valueAccessor) {
      var onImageLoaded = function() {
        // set bound observable to false once image is loaded
        valueAccessor()(false);
        loadedImages[el.src] = true;
      };

      el.addEventListener('load', onImageLoaded);

      ko.utils.domNodeDisposal.addDisposeCallback(el, function() {
        el.removeEventListener('load', onImageLoaded);
      });
    },
    
    update: function(el, valueAccessor, allBindings) {
      // create dependency on imageLoadingSrc observable
      allBindings().imageLoadingSrc;
      
      // if image hasn't been loaded yet, set bound observable to true
      if (loadedImages[el.src] || el.__imageLoaded) return;
      
      valueAccessor()(true);
    }
  };
  
})();
