var ko = require('knockout');

exports.create = function() {
  return new AdTimer();
};

function AdTimer() {
  this.isActive = ko.observable(false);

  this.timeOut = null;

  this.secondsElapsed = ko.observable(0);
}

AdTimer.prototype.start = function(duration, callback) {
    this.isActive(true);

    this.secondsElapsed(duration / 1000);

    // call once to get in-sync with timeOut method.
    this.countdownDisplayInt = setInterval(this.countdown.bind(this), 1000);

    this.timeOut = setTimeout(function() {
      this.isActive(false);

      if ( typeof callback == 'function' ) callback();
    }.bind(this), duration);
};

AdTimer.prototype.stop = function() {
  this.isActive(false);

  clearTimeout(this.timeOut);

  clearInterval(this.countdownDisplayInt);
}

AdTimer.prototype.countdown = function() {
  if (this.secondsElapsed() <= 0) {
    this.secondsElapsed(0);
    clearInterval(this.countdownDisplayInt);
  } else {
    this.secondsElapsed(this.secondsElapsed() - 1);
  }
}