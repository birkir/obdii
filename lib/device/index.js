'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var debug_1 = __importDefault(require('debug'));
var path_1 = __importDefault(require('path'));
var debug = debug_1.default('OBD2.Device.Main');
var Device = /** @class */ (function() {
  function Device(deviceName) {
    if (deviceName) {
      this.loadDevice(deviceName);
    }
    debug('Ready');
  }
  Device.prototype.connect = function(Serial, cb) {
    debug('Connecting');
    this.Device.connect(Serial, function() {
      debug('Connected');
      // Callback
      cb();
    });
  };
  Device.prototype.disconnect = function(Serial) {
    //
  };
  Device.prototype.loadDevice = function(deviceName) {
    this.name = deviceName.toLowerCase();
    this.Device = new (require(path_1.default.join(
      __dirname,
      this.name,
      'index'
    ))).OBD2.Device.ELM327();
    debug('Loaded device: ' + this.name);
  };
  Device.prototype.getDevice = function() {
    return this.Device;
  };
  Device.prototype.getDeviceName = function() {
    return this.name;
  };
  Device.prototype.setDevice = function(deviceObject) {
    this.Device = deviceObject;
  };
  return Device;
})();
exports.Device = Device;
