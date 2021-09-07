import { BusReader, BusReaderWriter, BusWriter, Clocked } from '../core';
import { EightBitBus } from '../binary-bus';


class SimplePeripheral implements Clocked {
  private dataBus: BusReaderWriter<number>;
  private addressBus: BusReader<number>

  constructor(
    dataBus: BusReaderWriter<number>,
    addressBus: BusReader<number>
  ) {
    this.dataBus = dataBus;

    this.addressBus = addressBus;
  }

  tick(): void {
    const addr = this.addressBus.read();

    if (addr === 16) {
      this.dataBus.write(128);
    }

    if (addr === 32) {
      let busData = this.dataBus.read();

      busData *= 2;

      this.dataBus.write(busData);
    }
  }
}

class Clock {
  private readonly clockedHighComponents: Clocked[];
  private readonly clockedLowComponents: Clocked[];
  private readonly clockedBusComponents: Clocked[];

  constructor(
    clockedHighComponents: Clocked[],
    clockedLowComponents: Clocked[],
    clockedBusComponents: Clocked[]
  ) {
    this.clockedHighComponents = clockedHighComponents;
    this.clockedLowComponents = clockedLowComponents;
    this.clockedBusComponents = clockedBusComponents;
  }

  step(): void {
    this.clockedHighComponents.forEach(c => c.tick());
    this.clockedBusComponents.forEach(c => c.tick());
    this.clockedLowComponents.forEach(c => c.tick());
    this.clockedBusComponents.forEach(c => c.tick());
  }
}

class Driver implements Clocked {
  private dataBus: BusReaderWriter<number>;
  private addressBus: BusWriter<number>;
  private mode: 'ping' | 'double' = 'ping';

  private cycle: number;

  constructor(
    dataBus: BusReaderWriter<number>,
    addressBus: BusWriter<number>
  ) {
    this.dataBus = dataBus;
    this.addressBus = addressBus;
    this.cycle = 0;
  }

  tick(): void {

    if (this.mode === 'ping') {
      if (this.cycle === 0) {
        console.log(this.mode);
        this.addressBus.write(16);
      }

      if (this.cycle === 1) {
        const resp = this.dataBus.read();
        console.log('read:', resp);

        this.cycle = -1;

        this.mode = 'double';
      }
    }

    if (this.mode === 'double') {
      if (this.cycle === 0) {
        console.log(this.mode);
        this.addressBus.write(32);
        this.dataBus.write(8);
      }

      if (this.cycle === 1) {
        const resp = this.dataBus.read();
        console.log('read:', resp);

        this.cycle = -1;

        this.mode = 'ping';
      }
    }

    this.cycle++;
  }
}

const dBus = new EightBitBus();
const aBus = new EightBitBus();
const sp = new SimplePeripheral(dBus, aBus);
const dr = new Driver(dBus, aBus);

const clock = new Clock([dr], [sp], [dBus, aBus]);

const steps = 16;

for (let i = 0; i < steps; i++) {
  clock.step();
}

/*
- fetch from memory
- fetch unit does read on PC
- Next cycle stores read value in Decode register
- also reads next PC


 */