import Debug from 'debug';
import { EventEmitter } from 'events';
import { DTC } from './core/dtc';
import { OBD } from './core/obd';
import { PID } from './core/pid';
import { Ticker } from './core/ticker';
import { Device } from './device';
import { Serial } from './serial';

const debug = Debug('OBD2.Main');

interface IOptions {
  delay: number;
  device: string;
  serial: string;
  port: string;
  baud: number;
  cleaner: boolean;
}

export class OBD2 extends EventEmitter {
  public DTC: DTC;
  public PID: PID;
  public OBD: OBD;
  public Ticker: Ticker;
  public Device: Device;
  public Serial: any;
  private options: IOptions;

  public constructor(options: any) {
    super();

    debug('Initializing');

    this.options = options;

    this.DTC = new DTC();
    this.PID = new PID();
    this.OBD = new OBD(this.PID.getListPID());
    this.Ticker = new Ticker(this.options.delay);
    this.Device = new Device(this.options.device);
    this.Serial = new Serial(this.options.serial, this.options.port, {
      baudrate: this.options.baud,
    }).getSerialInstance();

    debug('Ready');
  }

  public start(callBack: any) {
    this.Serial.on('data', data => {
      this.OBD.parseDataStream(data, (type, mess) => {
        this.emit(type, mess, data);
        this.emit('dataParsed', type, mess, data);
      });

      this.emit('dataReceived', data);
    });

    this.Serial.connect(() => {
      this.Device.connect(this, () => {
        callBack();
      });
    });
  }

  public sendAT(atCommand: string) {
    this.Ticker.addItem('AT', atCommand, false, next => {
      this.Serial.drain(atCommand + '\r');
      this.once('dataReceived', data => {
        // Wait a bit
        setTimeout(next, 100);
      });
    });
  }

  public listPID(callBack: any): void {
    const pidSupportList = ['00', '20', '40', '60', '80', 'A0', 'C0'];

    if (this.PID.getList().length > 0) {
      callBack(this.PID.getList());
    } else {
      this.tickListPID(pidSupportList, a => {
        callBack(this.PID.getList());
      });
    }
  }

  public listDTC(callBack: any): void {
    this.tickListDTC(callBack);
  }

  /**
   * Writing PID
   *
   * @param replies
   * @param loop
   * @param pidNumber
   * @param pidMode
   * @param callBack
   */
  public writePID(
    replies: string,
    loop: boolean,
    pidNumber: string,
    pidMode?: string,
    callBack?: any
  ): void {
    // Arguments
    if (typeof pidMode === 'function') {
      callBack = pidMode;
      pidMode = '01';
    } else {
      pidMode = !pidMode ? '01' : pidMode;
    }

    // Vars
    const pidData: any = this.PID.getByPid(pidNumber, pidMode);
    let sendData: string = '';
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
    this.Ticker.addItem('PID', sendData, !!loop, (next, elem) => {
      // Timeout let for auto cleaning
      let itemSkip: any;

      // Send data
      if (elem.fail % 20 === 0) {
        this.Serial.drain(sendData);
      }

      // Detected parsed PID data
      this.once('pid', (mess, data) => {
        if (typeof callBack === 'function') {
          callBack(mess, data);
        }

        clearTimeout(itemSkip);
        itemSkip = undefined;

        next();
      });

      // Timeout timer
      itemSkip = setTimeout(() => {
        // Fail to remove
        elem.fail++;

        // Auto remover, 60 loop wait, 4 sending try
        if (this.options.cleaner && elem.fail > 60) {
          this.Ticker.delItem('PID', sendData);
        }

        next();
      }, this.options.delay);
    });
  }

  /**
   * Sending PID code
   *
   * @param pidNumber
   * @param pidMode
   * @param callBack
   */
  public sendPID(pidNumber: string, pidMode?: string, callBack?: any): void {
    this.writePID(undefined, false, pidNumber, pidMode, callBack);
  }

  /**
   * Reading PID code
   *
   * @param pidNumber
   * @param pidMode
   * @param callBack
   */
  public readPID(pidNumber: string, pidMode?: string, callBack?: any): void {
    this.writePID('1', true, pidNumber, pidMode, callBack);
  }

  private tickListPID(pidList: any, callBack: any): void {
    if (pidList.length <= 0) {
      callBack();
    }

    const cmdPid = pidList.shift();

    if (
      this.PID.getListECU().length > 0 &&
      this.PID.getListECU().indexOf(cmdPid) < 0
    ) {
      callBack();
    }

    this.sendPID(cmdPid, '01', mess => {
      if (this.PID._loadPidEcuList(mess.name, mess.value)) {
        this.tickListPID(pidList, callBack);
      } else {
        callBack();
      }
    });
  }

  private tickListDTC(callBack: any): void {
    this.sendPID('', '03', (mess, data) => {
      Debug('tick DTC callback');
    });
  }
}
