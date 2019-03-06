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
var dtc_1 = require('./core/dtc');
var obd_1 = require('./core/obd');
var pid_1 = require('./core/pid');
var ticker_1 = require('./core/ticker');
var device_1 = require('./device');
var serial_1 = require('./serial');
var debug = debug_1.default('OBD2.Main');
var OBD2 = /** @class */ (function(_super) {
  __extends(OBD2, _super);
  function OBD2(options) {
    var _this = _super.call(this) || this;
    debug('Initializing');
    _this.options = options;
    _this.DTC = new dtc_1.DTC();
    _this.PID = new pid_1.PID();
    _this.OBD = new obd_1.OBD(_this.PID.getListPID());
    _this.Ticker = new ticker_1.Ticker(_this.options.delay);
    _this.Device = new device_1.Device(_this.options.device);
    _this.Serial = new serial_1.Serial(
      _this.options.serial,
      _this.options.port,
      {
        baudrate: _this.options.baud,
      }
    ).getSerialInstance();
    debug('Ready');
    return _this;
  }
  OBD2.prototype.start = function(callBack) {
    var _this = this;
    this.Serial.on('data', function(data) {
      _this.OBD.parseDataStream(data, function(type, mess) {
        _this.emit(type, mess, data);
        _this.emit('dataParsed', type, mess, data);
      });
      _this.emit('dataReceived', data);
    });
    this.Serial.connect(function() {
      _this.Device.connect(_this, function() {
        callBack();
      });
    });
  };
  OBD2.prototype.sendAT = function(atCommand) {
    var _this = this;
    this.Ticker.addItem('AT', atCommand, false, function(next) {
      _this.Serial.drain(atCommand + '\r');
      _this.once('dataReceived', function(data) {
        // Wait a bit
        setTimeout(next, 100);
      });
    });
  };
  OBD2.prototype.listPID = function(callBack) {
    var _this = this;
    var pidSupportList = ['00', '20', '40', '60', '80', 'A0', 'C0'];
    if (this.PID.getList().length > 0) {
      callBack(this.PID.getList());
    } else {
      this.tickListPID(pidSupportList, function(a) {
        callBack(_this.PID.getList());
      });
    }
  };
  OBD2.prototype.listDTC = function(callBack) {
    this.tickListDTC(callBack);
  };
  /**
   * Writing PID
   *
   * @param replies
   * @param loop
   * @param pidNumber
   * @param pidMode
   * @param callBack
   */
  OBD2.prototype.writePID = function(
    replies,
    loop,
    pidNumber,
    pidMode,
    callBack
  ) {
    var _this = this;
    // Arguments
    if (typeof pidMode === 'function') {
      callBack = pidMode;
      pidMode = '01';
    } else {
      pidMode = !pidMode ? '01' : pidMode;
    }
    // Vars
    var pidData = this.PID.getByPid(pidNumber, pidMode);
    var sendData = '';
    replies = !replies ? '' : replies;
    // PID defined?
    if (pidData) {
      // MODE + PID + (send/read)
      if (pidData.pid !== 'undefined') {
        sendData = pidData.mode + pidData.pid + replies + '\r';
      } else {
        sendData = pidData.mode + replies + '\r';
      }
    } else {
      sendData = pidMode + pidNumber + replies + '\r';
    }
    // Add Ticker
    this.Ticker.addItem('PID', sendData, !!loop, function(next, elem) {
      // Timeout let for auto cleaning
      var itemSkip;
      // Send data
      if (elem.fail % 20 === 0) {
        _this.Serial.drain(sendData);
      }
      // Detected parsed PID data
      _this.once('pid', function(mess, data) {
        if (typeof callBack === 'function') {
          callBack(mess, data);
        }
        clearTimeout(itemSkip);
        itemSkip = undefined;
        next();
      });
      // Timeout timer
      itemSkip = setTimeout(function() {
        // Fail to remove
        elem.fail++;
        // Auto remover, 60 loop wait, 4 sending try
        if (_this.options.cleaner && elem.fail > 60) {
          _this.Ticker.delItem('PID', sendData);
        }
        next();
      }, _this.options.delay);
    });
  };
  /**
   * Sending PID code
   *
   * @param pidNumber
   * @param pidMode
   * @param callBack
   */
  OBD2.prototype.sendPID = function(pidNumber, pidMode, callBack) {
    this.writePID(undefined, false, pidNumber, pidMode, callBack);
  };
  /**
   * Reading PID code
   *
   * @param pidNumber
   * @param pidMode
   * @param callBack
   */
  OBD2.prototype.readPID = function(pidNumber, pidMode, callBack) {
    this.writePID('1', true, pidNumber, pidMode, callBack);
  };
  OBD2.prototype.tickListPID = function(pidList, callBack) {
    var _this = this;
    if (pidList.length <= 0) {
      callBack();
    }
    var cmdPid = pidList.shift();
    if (
      this.PID.getListECU().length > 0 &&
      this.PID.getListECU().indexOf(cmdPid) < 0
    ) {
      callBack();
    }
    this.sendPID(cmdPid, '01', function(mess) {
      if (_this.PID._loadPidEcuList(mess.name, mess.value)) {
        _this.tickListPID(pidList, callBack);
      } else {
        callBack();
      }
    });
  };
  OBD2.prototype.tickListDTC = function(callBack) {
    this.sendPID('', '03', function(mess, data) {
      debug_1.default('tick DTC callback');
    });
  };
  return OBD2;
})(events_1.EventEmitter);
exports.OBD2 = OBD2;
