/// <reference path="../typings/tsd.d.ts"/>
var fs = require('fs');
var path = require('path');
var debug = require("debug")("OBD2.Core.OBD");
var OBD2;
(function (OBD2) {
    var Core;
    (function (Core) {
        var OBD = (function () {
            function OBD(pidList) {
                this._pidsList = [];
                this._dataReceived = "";
                this._deviceCommands = [
                    "OK",
                    "SEARCHING",
                    "SEARCHING...",
                    "UNABLE TO CONNECT",
                    "STOPPED",
                    "NO DATA",
                    "CAN ERROR",
                    "ERROR",
                    "BUS INIT"
                ]; // https://www.scantool.net/forum/index.php?topic=6927.0
                this._pidsList = pidList;
                debug("Ready");
            }
            OBD.prototype.dataToPid = function () {
            };
            OBD.prototype.parseDataStream = function (data, cb) {
                var currentString, forString, indexOfEnd, arrayOfCommands;
                // making sure it's a utf8 string
                currentString = this._dataReceived + data.toString('utf8');
                arrayOfCommands = currentString.split('>');
                //console.log(arrayOfCommands, currentString, arrayOfCommands[0] == "SEARCHING...\r\r", arrayOfCommands[0] == "SEARCHING...\\r\\r");
                if (arrayOfCommands.length < 2) {
                    this._dataReceived = arrayOfCommands[0];
                }
                else {
                    for (var commandNumber = 0; commandNumber < arrayOfCommands.length; commandNumber++) {
                        forString = arrayOfCommands[commandNumber];
                        if (forString === '') {
                            continue;
                        }
                        var multipleMessages = forString.split('\r');
                        for (var messageNumber = 0; messageNumber < multipleMessages.length; messageNumber++) {
                            var messageString = multipleMessages[messageNumber];
                            if (messageString === '') {
                                continue;
                            }
                            var reply;
                            if (this._deviceCommands.indexOf(messageString) > -1) {
                                cb("ecu", messageString);
                            }
                            else {
                                reply = this.parseCommand(messageString);
                                if (!reply.value || !reply.name || (!reply.mode && !reply.pid)) {
                                    cb("bug", reply);
                                }
                                else if (reply.mode == "41") {
                                    cb("pid", reply);
                                }
                                else if (reply.mode == "43") {
                                    cb("dct", reply);
                                }
                            }
                            this._dataReceived = "";
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
            OBD.prototype.parseCommand = function (hexString) {
                var reply = {
                    value: null,
                    name: null,
                    pid: null,
                    mode: null
                }, byteNumber, valueArray; //New object
                // No data or OK is the response.
                if (hexString === "NO DATA" || hexString === "OK" || hexString === "?") {
                    reply.value = hexString;
                    return reply;
                }
                hexString = hexString.replace(/ /g, ''); //Whitespace trimming //Probably not needed anymore?
                valueArray = [];
                for (byteNumber = 0; byteNumber < hexString.length; byteNumber += 2) {
                    valueArray.push(hexString.substr(byteNumber, 2));
                }
                // PID mode
                if (valueArray[0] === "41") {
                    reply.mode = valueArray[0];
                    reply.pid = valueArray[1];
                    for (var i = 0; i < this._pidsList.length; i++) {
                        if (this._pidsList[i].pid == reply.pid) {
                            var numberOfBytes = this._pidsList[i].bytes;
                            reply.name = this._pidsList[i].name;
                            // Use static parameter (performance up, usually)
                            switch (numberOfBytes) {
                                case 1:
                                    reply.value = this._pidsList[i].convertToUseful(valueArray[2]);
                                    break;
                                case 2:
                                    reply.value = this._pidsList[i].convertToUseful(valueArray[2], valueArray[3]);
                                    break;
                                case 4:
                                    reply.value = this._pidsList[i].convertToUseful(valueArray[2], valueArray[3], valueArray[4], valueArray[5]);
                                    break;
                                case 8:
                                    reply.value = this._pidsList[i].convertToUseful(valueArray[2], valueArray[3], valueArray[4], valueArray[5], valueArray[6], valueArray[7], valueArray[8], valueArray[9]);
                                    break;
                                // Special length, dynamic parameters
                                default:
                                    reply.value = this._pidsList[i].convertToUseful.apply(this, valueArray.slice(2, 2 + parseInt(numberOfBytes)));
                                    break;
                            }
                            //Value is converted, break out the for loop.
                            break;
                        }
                    }
                }
                else if (valueArray[0] === "43") {
                    reply.mode = valueArray[0];
                    for (var i_1 = 0; i_1 < this._pidsList.length; i_1++) {
                        if (this._pidsList[i_1].mode == "03") {
                            reply.name = this._pidsList[i_1].name;
                            reply.value = this._pidsList[i_1].convertToUseful(valueArray[1], valueArray[2], valueArray[3], valueArray[4], valueArray[5], valueArray[6]);
                        }
                    }
                }
                return reply;
            };
            return OBD;
        })();
        Core.OBD = OBD;
    })(Core = OBD2.Core || (OBD2.Core = {}));
})(OBD2 = exports.OBD2 || (exports.OBD2 = {}));