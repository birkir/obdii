'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var debug_1 = __importDefault(require('debug'));
var debug = debug_1.default('OBD2.Core.Ticker');
var Ticker = /** @class */ (function() {
  function Ticker(timeout) {
    this.timeout = timeout;
    this.commands = [];
    this.counter = 0;
    this.waiting = false;
    this.stopped = true;
    debug('Ready');
  }
  Ticker.prototype.writeNext = function() {
    var _this = this;
    if (this.commands.length > 0) {
      this.waiting = true;
      var cmd = this.commands.shift();
      debug('Tick ' + String(cmd.type) + ' : ' + String(cmd.data));
      cmd.call(function() {
        _this.waiting = false;
      }, cmd);
      if (cmd.loop) {
        this.commands.push(cmd);
      }
    }
  };
  Ticker.prototype.addItem = function(type, data, loop, callBack) {
    loop = loop ? loop : false;
    this.commands.push({
      type: type,
      data: data,
      loop: loop,
      call: callBack,
      fail: 0,
    });
    this.autoTimer();
  };
  Ticker.prototype.delItem = function(type, data) {
    for (var index in this.commands) {
      if (this.commands.hasOwnProperty(index)) {
        var cmd = this.commands[index];
        if (cmd.type === type && cmd.data === data) {
          if (this.commands.length > 0) {
            this.commands.splice(index, 1);
          }
          break; // Loop break
        }
      }
    }
    this.autoTimer();
  };
  Ticker.prototype.start = function() {
    var _this = this;
    debug('Start', this.counter);
    this.counter = 0;
    this.stopped = false;
    this.Ticker = setInterval(function() {
      _this.counter++;
      if (!_this.waiting) {
        _this.writeNext();
      }
    }, this.timeout);
  };
  Ticker.prototype.stop = function() {
    debug('Stop');
    clearInterval(this.Ticker);
    this.commands = [];
    this.counter = 0;
    this.stopped = true;
    this.waiting = false;
  };
  Ticker.prototype.pause = function() {
    debug('Pause');
    clearInterval(this.Ticker);
  };
  Ticker.prototype.autoTimer = function() {
    if (this.commands.length > 0) {
      if (this.stopped) {
        this.start();
      }
    } else {
      this.stop();
    }
  };
  return Ticker;
})();
exports.Ticker = Ticker;
