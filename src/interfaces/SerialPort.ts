import SerialPortPackage from 'serialport';

type isOpen = () => void;
type Callback = (data?: any, port?: any) => void;

export type SerialPort = SerialPortPackage & {
  isOpen: boolean | isOpen;
  on(event: string, callback: Callback): void;
};
