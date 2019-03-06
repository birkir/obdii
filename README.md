# obdii

> WORK IN PROGRESS

Based on [https://github.com/sipimokus/node-obd2](node-obd2)

## WHY?

- Leverage typescript better.
- Extendability, allow more transportation layers.
- Detach PID detection for separate library
- Testability with can-utils

## INSTALLATION

```
$ yarn add obdii
```

## EXAMPLES

### REACT NATIVE BLUETOOTH EXAMPLE

Bluetooth react native

```ts
import BluetoothSerial from 'react-native-bluetooth-serial-next';
import { Connection } from 'obdii/connection/react-native-bluetooth';
import { ELM327 } from 'obdii/transport/elm327';
import { OBD2 } from 'obdii';

// first pair then connect to device
const device = BluetoothSerial.device('obd2-dongle');
await device.connect();

const connection = new Connection(device);
const transport = new ELM327();
const obd = new OBD2({ connection, transport });

await obd.start();
await obd.listDTC();
```

Also bluetooth on linux/windows with nodejs:

```ts
import bluetooth from 'node-bluetooth';
import { BluetoothConnection } from 'obdii/connection/bluetooth';

const device = await bluetooth.connect('obd2-dongle', 'channel');
const connection = new Connection(device);
```

### USB/SERIAL NODEJS EXAMPLE

USB or Serial Port dongles

```ts
import SerialPort from 'serialport';
import { Connection } from 'obdii/connection/serialport';
import { OBD2 } from 'obdii';

const port = new SerialPort('/dev/tty-usbserial1');
const connection = new Connection(port);
const obd = new OBD2({ connection });

await obd.start();
await obd.listDTC();
```

### TCP/NET EXAMPLE

Wifi dongles

Should also work with `import net from 'react-native-tcp'`

```ts
import net from 'net';
import { Connection } from 'obdii/connection/net';
import { OBD2 } from 'obdii';

const client = net.createConnection({ host: '127.0.0.1', port: 27300 });

const connection = new Connection(client);
const obd = new OBD2({ connection });

await obd.start();
await obd.listDTC();
```
