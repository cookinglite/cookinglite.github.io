'use strict';

/**
 * Keeps track of images that have been prefetched already
 * @type {Object}
 */
var prefetchedImages = {};

/**
 * Prefetches an image from the provided imageUrl
 *
 * @param  {string...} The URL of the image to prefetch. Multiple paths
 *                     can be provided as separate arguments.
 */
module.exports = function() {
  var urls = arguments,
  url;

  for (var i = 0, len = urls.length; i < len; i++) {
    url = urls[i];

    if ( !url || hasImageBeenPrefetched(url) ) {
      continue;
    }

    prefetchImage(url);
  }
};

function prefetchImage(url) {
  (new Image()).src = url;
  markAsPrefetched(url);
}

function markAsPrefetched(url) {
  prefetchedImages[url] = true;
}

function hasImageBeenPrefetched(url) {
  return prefetchedImages[url];
}
