var ko = require('knockout');
var $ = require('jquery');
require('../../lib/koCustomBindings/swipeBindings');
require('../../lib/koCustomBindings/arrowPressBindings');

module.exports = BaseGalleryViewModel;

function BaseGalleryViewModel(slides) {
  this.slides = ko.observableArray(slides || []);

  this.totalSlideCount = ko.observable();

  this.currentSlideIndex = ko.observable(0);

  this.currentSlide = ko.computed(function() {
    return this.slides()[this.currentSlideIndex()];
  }, this);

  this.currentSlideNum = ko.computed(function() {
    return this.currentSlideIndex() + 1;
  }, this);
}

BaseGalleryViewModel.prototype.isFirstSlide = function() {
  return this.currentSlideIndex() == 0;
}

BaseGalleryViewModel.prototype.gotoPrevSlide = function() {
  if (this.isFirstSlide()) return;

  this.currentSlideIndex( this.currentSlideIndex() - 1 );
  this.announceSlideBecameVisible();
}

BaseGalleryViewModel.prototype.isLastSlide = function() {
  return this.currentSlideIndex() == this.slides().length - 1;
}

BaseGalleryViewModel.prototype.gotoNextSlide = function() {
  if (this.isLastSlide()) {
    return
  };
  this.currentSlideIndex ( this.currentSlideIndex() + 1 );
  this.announceSlideBecameVisible();
}

BaseGalleryViewModel.prototype.announceSlideBecameVisible = function() {
  $(document).trigger('slGallery:slideView', [this]);
}
