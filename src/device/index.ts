import Debug from 'debug';
import path from 'path';

const debug = Debug('OBD2.Device.Main');

export class Device {
  private Device: any;
  private name: string;

  constructor(deviceName?: string) {
    if (deviceName) {
      this.loadDevice(deviceName);
    }

    debug('Ready');
  }

  public connect(Serial: any, cb?: any) {
    debug('Connecting');

    this.Device.connect(Serial, () => {
      debug('Connected');

      // Callback
      cb();
    });
  }

  public disconnect(Serial: any) {
    //
  }

  public loadDevice(deviceName: string) {
    this.name = deviceName.toLowerCase();
    this.Device = new (require(path.join(
      __dirname,
      this.name,
      'index'
    ))).OBD2.Device.ELM327();

    debug('Loaded device: ' + this.name);
  }

  public getDevice(): any {
    return this.Device;
  }

  public getDeviceName(): string {
    return this.name;
  }

  public setDevice(deviceObject: any): void {
    this.Device = deviceObject;
  }
}
