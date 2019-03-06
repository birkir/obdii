'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var debug_1 = __importDefault(require('debug'));
var bluetooth_1 = require('./bluetooth');
var usb_1 = require('./usb');
var debug = debug_1.default('OBD2.Serial.Main');
var Serial = /** @class */ (function() {
  /**
   * Serial declare
   *
   * @param type
   * @returns {any}
   */
  function Serial(type, port, options) {
    debug('Serial type: ' + type);
    debug('Serial port: ' + port);
    this.Serial = this.selectSerial(type, port, options);
    if (!this.Serial) {
      throw new Error('Unknown connection type: ' + type);
    }
  }
  Serial.prototype.getSerialInstance = function() {
    return this.Serial;
  };
  /**
   * Connection class selector
   *
   * @param type
   * @param port
   * @param options
   * @returns {any}
   */
  Serial.prototype.selectSerial = function(type, port, options) {
    switch (type.toLowerCase()) {
      case 'bt':
      case 'bluetooth':
        return new bluetooth_1.SerialBluetooth(port, options);
        break;
      case 'usb':
      case 'serial':
        return new usb_1.SerialUsb(port, options);
        break;
      default:
        return undefined;
    }
  };
  return Serial;
})();
exports.Serial = Serial;
