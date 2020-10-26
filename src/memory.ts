import { DiscreteDevice, Reactive } from './device';
import { BusValue, BusWidth, BusDevice } from './bus';

export type WriteEvent = {
  kind: 'write';
  address: BusValue;
  data: BusValue;

  resolve: () => void;
  reject: (message: string) => void;
};

export type ReadEvent = {
  kind: 'read';
  address: BusValue;
  dataWidth: BusWidth;

  resolve: (value: number) => void;
  reject: (message: string) => void;
};

export type MemoryEvent = WriteEvent | ReadEvent;

interface CurrentOperation {
  memoryEvent: MemoryEvent;
  latencyCountDown: number;
}

export class Memory
  implements DiscreteDevice, Reactive<MemoryEvent>, BusDevice {
  private readonly buffer: DataView;
  private readonly latencyInCycles: number;
  private readonly eventQueue: MemoryEvent[];
  private readonly littleEndian: boolean;

  private currentOperation?: CurrentOperation;
  private lastRead: number;

  constructor(
    sizeInBytes: number,
    latencyInCycles: number,
    littleEndian: boolean = true,
  ) {
    this.buffer = new DataView(new ArrayBuffer(sizeInBytes));
    this.latencyInCycles = latencyInCycles;

    this.currentOperation = undefined;
    this.eventQueue = [];
    this.lastRead = 0;
    this.littleEndian = littleEndian;
  }

  doOperation(): void {
    const memoryEvent = this.currentOperation!.memoryEvent;
    const address = memoryEvent.address.value;

    if (memoryEvent.kind === 'write') {
      const valueToWrite = memoryEvent.data.value;

      switch (memoryEvent.data.width) {
        case BusWidth.Word:
          this.buffer.setUint32(address, valueToWrite, this.littleEndian);
          break;

        case BusWidth.HalfWord:
          this.buffer.setUint16(address, valueToWrite, this.littleEndian);
          break;

        case BusWidth.Byte:
          this.buffer.setUint8(address, valueToWrite);
          break;
      }

      memoryEvent.resolve();
    } else if (memoryEvent.kind === 'read') {
      switch (memoryEvent.dataWidth) {
        case BusWidth.Word:
          this.lastRead = this.buffer.getUint32(address, this.littleEndian);
          break;

        case BusWidth.HalfWord:
          this.lastRead = this.buffer.getUint16(address, this.littleEndian);
          break;

        case BusWidth.Byte:
          this.lastRead = this.buffer.getUint8(address);
          break;
      }

      memoryEvent.resolve(this.lastRead);
    }
  }

  activate(): void {
    if (!this.currentOperation) {
      return;
    }

    if (this.currentOperation.latencyCountDown > 0) {
      this.currentOperation.latencyCountDown--;
      return;
    }
  }

  deactivate(): void {
    if (this.currentOperation && this.currentOperation.latencyCountDown === 0) {
      this.doOperation();
      this.currentOperation = undefined;
    }
  }

  react(event: MemoryEvent): void {
    this.eventQueue.push(event);
  }

  settle(): void {
    for (const e of this.eventQueue) {
      if (!this.currentOperation) {
        this.currentOperation = {
          memoryEvent: e,
          latencyCountDown: this.latencyInCycles,
        };
      }
    }
  }

  state(): number {
    return this.lastRead;
  }

  read(address: BusValue, dataWidth: BusWidth): Promise<BusValue> {
    return new Promise<BusValue>((res, rej) => {
      const resolve = (value: number): void =>
        void res(new BusValue(dataWidth, value));
      const reject = (reason: string): void => void rej(reason);

      const readEvent: ReadEvent = {
        kind: 'read',
        address,
        dataWidth,
        resolve,
        reject,
      };

      this.eventQueue.push(readEvent);
    });
  }

  write(address: BusValue, data: BusValue): Promise<void> {
    return new Promise<void>((res, rej) => {
      const resolve = (): void => void res();
      const reject = (reason: string): void => void rej(reason);

      const writeEvent: WriteEvent = {
        kind: 'write',
        address,
        data,
        resolve,
        reject,
      };

      this.eventQueue.push(writeEvent);
    });
  }
}
