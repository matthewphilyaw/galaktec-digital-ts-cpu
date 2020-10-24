export enum BusWidth {
  Byte,
  HalfWord,
  Word,
}

interface BusValue {
  width: BusWidth;
  value: number;
}

export interface BusDevice {
  write(address: BusValue, data: BusValue): Promise<void>;
  read(address: BusValue): Promise<BusValue>;
}

export class AddressMappedDevice implements BusDevice {
  private readonly startAddress: number;
  private readonly endAddress: number;

  private readonly busDevice: BusDevice;

  constructor(startAddress: number, range: number, busDevice: BusDevice) {
    this.startAddress = startAddress;
    this.endAddress = startAddress + range;

    this.busDevice = busDevice;
  }

  private relativeAddress(address: BusValue): BusValue {
    return {
      width: address.width,
      value: address.value - this.startAddress,
    };
  }

  read(address: BusValue): Promise<BusValue> {
    return this.busDevice.read(this.relativeAddress(address));
  }

  write(address: BusValue, data: BusValue): Promise<void> {
    return this.busDevice.write(this.relativeAddress(address), data);
  }

  addressInRange(address: BusValue): boolean {
    return (
      this.startAddress <= address.value && address.value < this.endAddress
    );
  }
}

export class Bus implements BusDevice {
  private devices: AddressMappedDevice[];
  private busy: boolean;

  constructor(devices: AddressMappedDevice[]) {
    this.devices = devices;
  }

  acquireBus<T>(
    address: BusValue,
    operation: (device: AddressMappedDevice) => Promise<T>,
  ): Promise<T> {
    if (this.busy) {
      return Promise.reject('Busy busy');
    }

    const device = this.devices.find((p) => p.addressInRange(address));
    if (!device) {
      return Promise.reject('No device at address');
    }

    this.busy = true;
    return operation(device).finally(() => (this.busy = false));
  }

  read(address: BusValue): Promise<BusValue> {
    return this.acquireBus(address, (device) => {
      return device.read(address);
    });
  }

  write(address: BusValue, data: BusValue): Promise<void> {
    return this.acquireBus(address, (device) => {
      return device.write(address, data);
    });
  }
}
