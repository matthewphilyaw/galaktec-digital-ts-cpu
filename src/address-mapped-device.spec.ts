import { mock, MockProxy } from 'jest-mock-extended';
import { BusDevice, BusValue, BusWidth } from './bus';
import { AddressMappedDevice } from './address-mapped-device';

describe('Relative addressing', function () {
  let device: BusDevice;
  let addrMappedDevice: AddressMappedDevice;

  beforeEach(() => {
    device = mock<BusDevice>();
    addrMappedDevice = new AddressMappedDevice(1024, 2, device);
  });

  test('write called with relative address', () => {
    addrMappedDevice.write(BusValue.word(1025), BusValue.word(1));
    expect(device.write).toHaveBeenCalledWith(
      BusValue.word(1),
      BusValue.word(1),
    );
  });

  test('read called with relative address', () => {
    addrMappedDevice.read(BusValue.word(1025), BusWidth.Word);
    expect(device.read).toHaveBeenCalledWith(BusValue.word(1), BusWidth.Word);
  });
});

describe('Address validation', () => {
  const startAddr = 0;
  const range = 2;

  let device: MockProxy<BusDevice> & BusDevice;
  let addrMappedDevice: AddressMappedDevice;

  beforeEach(() => {
    device = mock<BusDevice>();
    addrMappedDevice = new AddressMappedDevice(startAddr, range, device);
  });

  test('Address within range returns true', () => {
    for (let i = startAddr; i < startAddr + range; i++) {
      const result = addrMappedDevice.addressInRange(BusValue.word(i));
      expect(result).toBe(true);
    }
  });

  test('Address outside of range returns false', () => {
    expect(
      addrMappedDevice.addressInRange(BusValue.word(startAddr + range)),
    ).toBe(false);
    expect(addrMappedDevice.addressInRange(BusValue.word(-1))).toBe(false);
  });

  test('Promise rejected on read if address out of range', async () => {
    device.read.mockResolvedValue(Promise.resolve(BusValue.word(0)));

    await expect(
      addrMappedDevice.read(BusValue.word(startAddr + range), BusWidth.Word),
    ).rejects.toEqual('Address not within range of this device');
  });

  test('Promise rejected on write if address out of range', async () => {
    device.read.mockResolvedValue(Promise.resolve(BusValue.word(0)));

    await expect(
      addrMappedDevice.write(
        BusValue.word(startAddr + range),
        BusValue.word(0),
      ),
    ).rejects.toEqual('Address not within range of this device');
  });
});
