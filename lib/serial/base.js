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
var debug_1 = __importDefault(require('debug'));
var events_1 = require('events');
var debug = debug_1.default('OBD2.Serial.Base');
var SerialBase = /** @class */ (function(_super) {
  __extends(SerialBase, _super);
  /**
   * Constructor
   */
  function SerialBase() {
    var _this = _super.call(this) || this;
    _this.opened = false;
    _this.emit('ready');
    return _this;
  }
  SerialBase.prototype.onData = function(callBack) {
    this.Serial.on('data', callBack);
  };
  /**
   * Serial port connect
   */
  SerialBase.prototype.connect = function(callBack) {
    var _this = this;
    this.Serial.open(function(error) {
      _this.opened = !!(typeof _this.Serial.isOpen === 'function'
        ? _this.Serial.isOpen()
        : _this.Serial.isOpen);
      if (typeof callBack === 'function') {
        callBack();
      }
    });
  };
  /**
   * Serial port disconnect
   */
  SerialBase.prototype.disconnect = function(callBack) {
    var _this = this;
    this.Serial.close(function(error) {
      _this.opened = !!(typeof _this.Serial.isOpen === 'function'
        ? _this.Serial.isOpen()
        : _this.Serial.isOpen);
      if (typeof callBack === 'function') {
        callBack();
      }
    });
  };
  /**
   *
   * Serial data drain
   *
   * @param data
   * @param callBack
   */
  SerialBase.prototype.drain = function(data, callBack) {
    var _this = this;
    // Serial is opened
    if (this.opened) {
      // Try write data
      try {
        this.emit('write', data);
        this.Serial.write(data, function(error) {
          if (typeof callBack === 'function') {
            _this.Serial.drain(callBack);
          }
        });
      } catch (exceptionError) {
        debug('Error while writing, connection is probably lost.');
        debug(exceptionError);
      }
    }
  };
  /**
   * Serial data write
   *
   * @param data
   * @param callBack
   */
  SerialBase.prototype.write = function(data, callBack) {
    // Serial is opened
    if (this.opened) {
      // Try write data
      try {
        this.emit('write', data);
        this.Serial.write(data, function(error) {
          if (typeof callBack === 'function') {
            callBack();
          }
        });
      } catch (exceptionError) {
        debug('Error while writing, connection is probably lost.');
        debug(exceptionError);
      }
    }
  };
  /**
   * Serial port instance set
   *
   * @param serial
   */
  SerialBase.prototype.setSerial = function(serial) {
    this.Serial = serial;
    this._eventHandlers();
  };
  /**
   * Serial port instance get
   *
   * @returns {any}
   */
  SerialBase.prototype.getSerial = function() {
    return this.Serial;
  };
  /**
   * Set serial port
   *
   * @param port
   */
  SerialBase.prototype.setPort = function(port) {
    this.port = port;
  };
  /**
   * Get serial port
   *
   * @returns {string}
   */
  SerialBase.prototype.getPort = function() {
    return this.port;
  };
  /**
   * Set serial options
   *
   * @param options
   */
  SerialBase.prototype.setOptions = function(options) {
    this.options = options;
  };
  /**
   * Get serial options
   *
   * @returns {any}
   */
  SerialBase.prototype.getOptions = function() {
    return this.options;
  };
  /**
   * Get serial port is opened
   *
   * @returns {boolean}
   */
  SerialBase.prototype.isOpen = function() {
    return this.opened;
  };
  /**
   * Shared events handling
   *
   * @private
   */
  SerialBase.prototype._eventHandlers = function() {
    var _this = this;
    this.Serial.on('ready', function() {
      debug('Serial port ready');
    });
    this.Serial.on('open', function(port) {
      debug('Serial port open : ' + port);
    });
    this.Serial.on('close', function(port) {
      debug('Serial port close: ' + port);
    });
    this.Serial.on('error', function(error, port) {
      debug('Serial port error: ' + port);
    });
    this.Serial.on('data', function(data) {
      _this.emit('data', data);
      data = String(data).replace(/(?:\r\n|\r|\n)/g, '');
      debug('Serial port data : ' + data);
    });
    this.on('write', function(data) {
      data = String(data).replace(/(?:\r\n|\r|\n)/g, '');
      debug('Serial port write: ' + data);
    });
  };
  return SerialBase;
})(events_1.EventEmitter);
exports.SerialBase = SerialBase;
