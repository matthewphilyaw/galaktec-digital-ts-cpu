import { BusDevice, BusValue, BusWidth } from './bus';

export class AddressMappedDevice implements BusDevice {
  private readonly startAddress: number;
  private readonly endAddress: number;

  private readonly busDevice: BusDevice;

  constructor(startAddress: number, range: number, busDevice: BusDevice) {
    this.startAddress = startAddress;
    this.endAddress = startAddress + range;

    this.busDevice = busDevice;
  }

  private withRelativeAddress<T>(
    address: BusValue,
    operation: (relativeAddress: BusValue) => Promise<T>,
  ): Promise<T> {
    if (!this.addressInRange(address)) {
      return Promise.reject('Address not within range of this device');
    }

    return operation(
      new BusValue(address.width, address.value - this.startAddress),
    );
  }

  read(address: BusValue, dataWidth: BusWidth): Promise<BusValue> {
    return this.withRelativeAddress(address, (relativeAddress) =>
      this.busDevice.read(relativeAddress, dataWidth),
    );
  }

  write(address: BusValue, data: BusValue): Promise<void> {
    return this.withRelativeAddress(address, (relativeAddress) =>
      this.busDevice.write(relativeAddress, data),
    );
  }

  addressInRange(address: BusValue): boolean {
    return (
      this.startAddress <= address.value && address.value < this.endAddress
    );
  }
}
