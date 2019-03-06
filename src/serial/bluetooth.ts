import SerialPort from 'serialport';
import { SerialBase } from './base';

export class SerialBluetooth extends SerialBase {
  /**
   * Constructor
   *
   * @param port
   * @param options
   */
  constructor(port: string, options?: any) {
    super();

    this.setPort(port);
    this.setOptions(options);
    this.setSerial(new SerialPort(port, options));
  }
}
