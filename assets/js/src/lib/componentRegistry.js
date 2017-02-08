'use strict';

var $ = require('jquery');
/*-------------------------------------------- */
/** Exports */
/*-------------------------------------------- */

module.exports = new ComponentRegistry();

// EXPOSE GLOBALLY //
window.componentRegistry = module.exports;

/*-------------------------------------------- */
/** Functions */
/*-------------------------------------------- */

var INITIALIZED_KEY = 'js-component-initialized';

function ComponentRegistry() {
  this.registeredComponents = {};
}

$.extend(ComponentRegistry.prototype, {

  registerComponent: function (key, fn) {
    this.registeredComponents[key] = fn;
  },

  initComponents: function (context) {
    context = context || 'body';

    var _this = this,
        $components = $(context).find('[data-js-component]');

    $components.each(function(i, el) {
      var $el = $(el),
          key = $el.data('js-component');

      if (typeof _this.registeredComponents[key] == 'function' && !$el.data(INITIALIZED_KEY)) {
        _this.registeredComponents[key](el);
        $el.data(INITIALIZED_KEY, true);
      }

    });
  }
});