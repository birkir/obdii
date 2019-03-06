import Debug from 'debug';

const debug = Debug('OBD2.Core.Ticker');

export class Ticker {
  private Ticker: any;
  private commands: any = [];
  private counter: number = 0;
  private waiting: boolean = false;
  private stopped: boolean = true;

  constructor(private timeout: number) {
    debug('Ready');
  }

  public writeNext(): void {
    if (this.commands.length > 0) {
      this.waiting = true;

      const cmd = this.commands.shift();

      debug('Tick ' + String(cmd.type) + ' : ' + String(cmd.data));

      cmd.call(() => {
        this.waiting = false;
      }, cmd);

      if (cmd.loop) {
        this.commands.push(cmd);
      }
    }
  }

  public addItem(type: string, data: any, loop?: boolean, callBack?: any) {
    loop = loop ? loop : false;

    this.commands.push({
      type,
      data,
      loop,
      call: callBack,
      fail: 0,
    });

    this.autoTimer();
  }

  public delItem(type: string, data: any) {
    for (const index in this.commands) {
      if (this.commands.hasOwnProperty(index)) {
        const cmd = this.commands[index];
        if (cmd.type === type && cmd.data === data) {
          if (this.commands.length > 0) {
            this.commands.splice(index, 1);
          }

          break; // Loop break
        }
      }
    }

    this.autoTimer();
  }

  public start() {
    debug('Start', this.counter);

    this.counter = 0;
    this.stopped = false;
    this.Ticker = setInterval(() => {
      this.counter++;
      if (!this.waiting) {
        this.writeNext();
      }
    }, this.timeout);
  }

  public stop() {
    debug('Stop');

    clearInterval(this.Ticker);

    this.commands = [];
    this.counter = 0;
    this.stopped = true;
    this.waiting = false;
  }

  public pause() {
    debug('Pause');

    clearInterval(this.Ticker);
  }

  private autoTimer() {
    if (this.commands.length > 0) {
      if (this.stopped) {
        this.start();
      }
    } else {
      this.stop();
    }
  }
}
