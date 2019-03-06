'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var debug_1 = __importDefault(require('debug'));
var debug = debug_1.default('OBD2.Core.OBD');
var OBD = /** @class */ (function() {
  // https://www.scantool.net/forum/index.php?topic=6927.0
  function OBD(pidList) {
    this.pidList = pidList;
    this.dataReceived = '';
    this.deviceCommands = [
      '?',
      'OK',
      'SEARCHING',
      'SEARCHING...',
      'UNABLE TO CONNECT',
      'STOPPED',
      'NO DATA',
      'CAN ERROR',
      'ERROR',
      'BUS INIT',
    ];
    debug('Ready');
  }
  /**
   * Parse Serial data stream to PID details
   *
   * @param data
   * @param cb
   */
  OBD.prototype.parseDataStream = function(data, cb) {
    var currentString;
    var arrayOfCommands;
    // making sure it's a utf8 string
    currentString = this.dataReceived + data.toString('utf8');
    arrayOfCommands = currentString.split('>');
    if (arrayOfCommands.length < 2) {
      if (this.deviceCommands.indexOf(this.dataReceived.split('\r')[0]) > -1) {
        cb('ecu', arrayOfCommands, this.dataReceived);
        this.dataReceived = '';
      }
    } else {
      for (
        var _i = 0, arrayOfCommands_1 = arrayOfCommands;
        _i < arrayOfCommands_1.length;
        _i++
      ) {
        var forString = arrayOfCommands_1[_i];
        if (forString === '') {
          continue;
        }
        var multipleMessages = forString.split('\r');
        for (
          var _a = 0, multipleMessages_1 = multipleMessages;
          _a < multipleMessages_1.length;
          _a++
        ) {
          var messageString = multipleMessages_1[_a];
          if (messageString === '') {
            continue;
          }
          var reply = this.parseCommand(messageString);
          if (this.deviceCommands.indexOf(messageString) > -1) {
            cb('ecu', reply, messageString);
          } else {
            if (!reply.value || !reply.name || (!reply.mode && !reply.pid)) {
              cb('bug', reply, messageString);
            } else if (reply.mode === '41') {
              cb('pid', reply, messageString);
            } else if (reply.mode === '43') {
              cb('dtc', reply, messageString);
            }
          }
        }
      }
    }
  };
  /**
   * Parses a hexadecimal string to a reply object. Uses PIDS.
   *
   * @param {string} hexString Hexadecimal value in string that is received over the serialport.
   * @return {Object} reply - The reply.
   * @return {string} reply.value - The value that is already converted. This can be a PID converted answer or "OK" or "NO DATA".
   * @return {string} reply.name - The name. --! Only if the reply is a PID.
   * @return {string} reply.mode - The mode of the PID. --! Only if the reply is a PID.
   * @return {string} reply.pid - The PID. --! Only if the reply is a PID.
   */
  OBD.prototype.parseCommand = function(hexString) {
    var valueArray = [];
    var reply = {
      value: undefined,
      name: undefined,
      mode: undefined,
      pid: undefined,
      min: undefined,
      max: undefined,
      unit: undefined,
    };
    // No data or OK is the response.
    if (hexString === 'NO DATA' || hexString === 'OK' || hexString === '?') {
      reply.value = hexString;
      return reply;
    }
    // Whitespace trimming
    // Probably not needed anymore?
    hexString = hexString.replace(/ /g, '');
    for (var byteNumber = 0; byteNumber < hexString.length; byteNumber += 2) {
      valueArray.push(hexString.substr(byteNumber, 2));
    }
    // PID mode
    if (valueArray[0] === '41') {
      reply.mode = valueArray[0];
      reply.pid = valueArray[1];
      for (var _i = 0, _a = this.pidList; _i < _a.length; _i++) {
        var pidItem = _a[_i];
        if (pidItem.pid === reply.pid) {
          var numberOfBytes = pidItem.bytes;
          reply.name = pidItem.name;
          reply.min = pidItem.min;
          reply.max = pidItem.max;
          reply.unit = pidItem.unit;
          // Use static parameter (performance up, usually)
          switch (numberOfBytes) {
            case 1:
              reply.value = pidItem.convertToUseful(valueArray[2]);
              break;
            case 2:
              reply.value = pidItem.convertToUseful(
                valueArray[2],
                valueArray[3]
              );
              break;
            case 4:
              reply.value = pidItem.convertToUseful(
                valueArray[2],
                valueArray[3],
                valueArray[4],
                valueArray[5]
              );
              break;
            case 8:
              reply.value = pidItem.convertToUseful(
                valueArray[2],
                valueArray[3],
                valueArray[4],
                valueArray[5],
                valueArray[6],
                valueArray[7],
                valueArray[8],
                valueArray[9]
              );
              break;
            // Special length, dynamic parameters
            default:
              reply.value = pidItem.convertToUseful.apply(
                this,
                valueArray.slice(2, 2 + parseInt(numberOfBytes, 10))
              );
              break;
          }
          // Value is converted, break out the for loop.
          break;
        }
      }
    } else if (valueArray[0] === '43') {
      reply.mode = valueArray[0];
      for (var _b = 0, _c = this.pidList; _b < _c.length; _b++) {
        var pidItem = _c[_b];
        if (pidItem.mode === '03') {
          reply.name = pidItem.name;
          reply.value = pidItem.convertToUseful(
            valueArray[1],
            valueArray[2],
            valueArray[3],
            valueArray[4],
            valueArray[5],
            valueArray[6]
          );
        }
      }
    }
    return reply;
  };
  return OBD;
})();
exports.OBD = OBD;
