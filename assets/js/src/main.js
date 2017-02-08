var componentRegistry = require('./lib/componentRegistry'),
    svg4everybody = require('svg4everybody');


// Expose jQuery Globally for non-bundled scripts to access if needed.
// Use current jQuery if one already exists on page
var $ = window.jQuery = window.$ = window.jQuery || require('jquery');
/*-------------------------------------------- */
/** Instantiate Modules */
/*-------------------------------------------- */


/*
    data-js-component="moduleName" goes on your module's markup
    componentRegistry.registerComponent('moduleName', require('./modules/moduleName'));
*/

componentRegistry.registerComponent('contentSlider', require('./modules/contentSlider'));
componentRegistry.registerComponent('responsiveContentSlider', require('./modules/responsiveContentSlider'));
componentRegistry.registerComponent('menuAccordian', require('./modules/accordion').createAccordion);
componentRegistry.registerComponent('stickyNav', require('./modules/stickyNav'));
componentRegistry.registerComponent('smallScreenStickyNav', require('./modules/smallScreenStickyNav'));
componentRegistry.registerComponent('scrollingNav', require('./modules/scrollingNav'));
componentRegistry.registerComponent('toggleSearch', require('./modules/toggleSearch'));
componentRegistry.registerComponent('searchDisplay', require('./modules/searchDisplay'));
componentRegistry.registerComponent('sideMenuToggle', require('./modules/sideMenuToggle'));
componentRegistry.registerComponent('truncateContent', require('./modules/truncateContent'));
componentRegistry.registerComponent('imgLazyLoad', require('./modules/imgLazyLoad'));
componentRegistry.registerComponent('gallery', require('./modules/gallery'));
componentRegistry.registerComponent('nutritionList', require('./modules/accordion').createAccordion);
componentRegistry.registerComponent('filterAccordion', require('./modules/filterAccordion'));
componentRegistry.registerComponent('subscribeFlyout', require('./modules/subscribeFlyout'));
componentRegistry.registerComponent('toggleFilterDisplay', require('./modules/toggleFilterDisplay'));
componentRegistry.registerComponent('panelSubmitDisplay', require('./modules/panelSubmitDisplay'));
componentRegistry.registerComponent('autocomplete', require('./modules/autocomplete'));
componentRegistry.registerComponent('scrollToTop', require('./modules/scrollToTop'));




require('./modules/outbrainContent')();


componentRegistry.initComponents();

require('./modules/gallery/galleryToggle')();
require('./modules/socialButtons')();
require('./modules/universal-ad')();
/*-------------------------------------------- */
/** End Modules */
/*-------------------------------------------- */

svg4everybody();
