'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var debug_1 = __importDefault(require('debug'));
var fs_1 = __importDefault(require('fs'));
var path_1 = __importDefault(require('path'));
var debug = debug_1.default('OBD2.Core.DTC');
var DTC = /** @class */ (function() {
  function DTC() {
    this.list = [];
    this.loadDtcList();
    debug('Ready');
  }
  DTC.prototype.loadDtcList = function(basePath) {
    var _this = this;
    debug('Loading list');
    basePath = basePath
      ? basePath
      : path_1.default.join(__dirname, '..', 'data', 'dtc');
    try {
      if (fs_1.default.statSync(basePath)) {
        fs_1.default.readdirSync(basePath).forEach(function(file) {
          _this.list.push(require(path_1.default.join(basePath, file)));
        });
      }
    } catch (e) {
      debug('[ERROR] Data directory not found!');
    }
    debug('Loaded count: ' + this.list.length);
  };
  DTC.prototype.getList = function() {
    return this.list;
  };
  DTC.prototype.getByName = function(slug) {
    //
  };
  DTC.prototype.getByPid = function(pid, mode) {
    //
  };
  return DTC;
})();
exports.DTC = DTC;
