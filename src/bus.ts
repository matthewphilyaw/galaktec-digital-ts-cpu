import { AddressMappedDevice } from './address-mapped-device';

export enum BusWidth {
  Byte,
  HalfWord,
  Word,
}

export class BusValue {
  readonly width: BusWidth;
  readonly value: number;

  constructor(width: BusWidth, value: number) {
    this.value = value;
    this.width = width;
  }

  static word(value: number): BusValue {
    return new BusValue(BusWidth.Word, value);
  }

  static halfWord(value: number): BusValue {
    return new BusValue(BusWidth.HalfWord, value);
  }

  static byte(value: number): BusValue {
    return new BusValue(BusWidth.HalfWord, value);
  }
}

export interface BusDevice {
  write(address: BusValue, data: BusValue): Promise<void>;
  read(address: BusValue, dataWidth: BusWidth): Promise<BusValue>;
}

export class Bus implements BusDevice {
  private devices: AddressMappedDevice[];
  private busy: boolean;

  constructor(devices: AddressMappedDevice[]) {
    this.devices = devices;
  }

  private acquireBus<T>(
    address: BusValue,
    operation: (device: AddressMappedDevice) => Promise<T>,
  ): Promise<T> {
    if (this.busy) {
      return Promise.reject('Bus busy');
    }

    const device = this.devices.find((p) => p.addressInRange(address));
    if (!device) {
      return Promise.reject('No device at address');
    }

    this.busy = true;
    return operation(device).finally(() => (this.busy = false));
  }

  read(address: BusValue, dataWidth: BusWidth): Promise<BusValue> {
    return this.acquireBus(address, (device) => {
      return device.read(address, dataWidth);
    });
  }

  write(address: BusValue, data: BusValue): Promise<void> {
    return this.acquireBus(address, (device) => {
      return device.write(address, data);
    });
  }
}
