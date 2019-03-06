'use strict';
var __extends =
  (this && this.__extends) ||
  (function() {
    var extendStatics = function(d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function(d, b) {
            d.__proto__ = b;
          }) ||
        function(d, b) {
          for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var serialport_1 = __importDefault(require('serialport'));
var base_1 = require('./base');
var SerialUsb = /** @class */ (function(_super) {
  __extends(SerialUsb, _super);
  /**
   * Constructor
   *
   * @param port
   * @param options
   */
  function SerialUsb(port, options) {
    var _this = _super.call(this) || this;
    _this.setPort(port);
    _this.setOptions(options);
    _this.setSerial(new serialport_1.default(port, options));
    return _this;
  }
  return SerialUsb;
})(base_1.SerialBase);
exports.SerialUsb = SerialUsb;
