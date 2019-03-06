import Debug from 'debug';

const debug = Debug('OBD2.Core.OBD');

export interface IReplyParseCommand {
  value: string;
  name: string;
  mode: string;
  pid: string;
  min: number;
  max: number;
  unit: string;
}

export class OBD {
  private dataReceived: string = '';
  private deviceCommands: string[] = [
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
  // https://www.scantool.net/forum/index.php?topic=6927.0

  constructor(private pidList: any) {
    debug('Ready');
  }

  /**
   * Parse Serial data stream to PID details
   *
   * @param data
   * @param cb
   */
  public parseDataStream(data: any, cb: any) {
    let currentString;
    let arrayOfCommands;

    // making sure it's a utf8 string
    currentString = this.dataReceived + data.toString('utf8');
    arrayOfCommands = currentString.split('>');

    if (arrayOfCommands.length < 2) {
      if (this.deviceCommands.indexOf(this.dataReceived.split('\r')[0]) > -1) {
        cb('ecu', arrayOfCommands, this.dataReceived);
        this.dataReceived = '';
      }
    } else {
      for (const forString of arrayOfCommands) {
        if (forString === '') {
          continue;
        }

        const multipleMessages = forString.split('\r');
        for (const messageString of multipleMessages) {
          if (messageString === '') {
            continue;
          }

          const reply = this.parseCommand(messageString);

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
  }

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
  public parseCommand(hexString: string) {
    const valueArray = [];
    const reply: IReplyParseCommand = {
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

    for (let byteNumber = 0; byteNumber < hexString.length; byteNumber += 2) {
      valueArray.push(hexString.substr(byteNumber, 2));
    }

    // PID mode
    if (valueArray[0] === '41') {
      reply.mode = valueArray[0];
      reply.pid = valueArray[1];

      for (const pidItem of this.pidList) {
        if (pidItem.pid === reply.pid) {
          const numberOfBytes = pidItem.bytes;

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
      for (const pidItem of this.pidList) {
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
  }
}
