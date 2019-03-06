import Debug from 'debug';
import { SerialBluetooth } from './bluetooth';
import { SerialUsb } from './usb';
import { SerialBase } from './base';

const debug = Debug('OBD2.Serial.Main');

export class Serial {
  private Serial: SerialBase;

  /**
   * Serial declare
   *
   * @param type
   * @returns {any}
   */
  constructor(type: string, port: string, options: any) {
    debug('Serial type: ' + type);
    debug('Serial port: ' + port);

    this.Serial = this.selectSerial(type, port, options);

    if (!this.Serial) {
      throw new Error('Unknown connection type: ' + type);
    }
  }

  public getSerialInstance(): any {
    return this.Serial;
  }

  /**
   * Connection class selector
   *
   * @param type
   * @param port
   * @param options
   * @returns {any}
   */
  private selectSerial(type: string, port: string, options: any) {
    switch (type.toLowerCase()) {
      case 'bt':
      case 'bluetooth':
        return new SerialBluetooth(port, options);
        break;

      case 'usb':
      case 'serial':
        return new SerialUsb(port, options);

        break;

      default:
        return undefined;
    }
  }
}
