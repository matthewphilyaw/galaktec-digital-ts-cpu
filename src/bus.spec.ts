import { mock, MockProxy } from 'jest-mock-extended';
import { AddressMappedDevice } from './address-mapped-device';
import { Bus, BusDevice, BusValue, BusWidth } from './bus';

describe('Acquire bus validation', () => {
  let device: MockProxy<BusDevice> & BusDevice;
  let addrDevice: AddressMappedDevice;
  let bus: Bus;

  beforeEach(() => {
    device = mock<BusDevice>();
    addrDevice = new AddressMappedDevice(0, 2, device);

    bus = new Bus([addrDevice]);
  });

  test('Bus locks for write', () => {
    device.write.mockResolvedValue();

    bus.write(BusValue.word(0), BusValue.word(0));
    expect(device.write).toHaveBeenCalledWith(
      BusValue.word(0),
      BusValue.word(0),
    );

    let writeAttempt = bus.write(BusValue.word(0), BusValue.word(0));
    expect(writeAttempt).rejects.toEqual('Bus busy');
  });

  test('Bus locks for read', () => {
    device.read.mockResolvedValue(BusValue.word(0));

    bus.read(BusValue.word(0), BusWidth.Word);
    expect(device.read).toHaveBeenCalledWith(BusValue.word(0), BusWidth.Word);

    let readAttempt = bus.read(BusValue.word(0), BusWidth.Word);
    expect(readAttempt).rejects.toEqual('Bus busy');
  });

  test('Bus is released when read resolves', async () => {
    device.read.mockResolvedValueOnce(BusValue.word(0));

    await bus.read(BusValue.word(0), BusWidth.Word);
    expect(device.read).toHaveBeenCalledWith(BusValue.word(0), BusWidth.Word);

    device.read.mockResolvedValueOnce(BusValue.word(1));
    let readAttempt = bus.read(BusValue.word(0), BusWidth.Word);
    expect(readAttempt).resolves.toEqual(BusValue.word(1));
  });

  test('Bus is released when read rejects', async () => {
    device.read.mockRejectedValue('');

    try {
      await bus.read(BusValue.word(0), BusWidth.Word);
    } catch {}

    expect(device.read).toHaveBeenCalledWith(BusValue.word(0), BusWidth.Word);
    device.read.mockResolvedValueOnce(BusValue.word(1));

    let readAttempt = bus.read(BusValue.word(0), BusWidth.Word);
    expect(readAttempt).resolves.toEqual(BusValue.word(1));
  });

  test('Bus is released when write resolves', async () => {
    device.write.mockResolvedValue();

    await bus.write(BusValue.word(0), BusValue.word(0));
    expect(device.write).toHaveBeenCalledWith(
      BusValue.word(0),
      BusValue.word(0),
    );

    let attempt = bus.write(BusValue.word(0), BusValue.word(0));
    expect(attempt).resolves.toBe(undefined);
  });

  test('Bus is released when write resolves', async () => {
    device.write.mockRejectedValueOnce('');

    try {
      await bus.write(BusValue.word(0), BusValue.word(0));
    } catch {}

    device.write.mockResolvedValueOnce();
    expect(device.write).toHaveBeenCalledWith(
      BusValue.word(0),
      BusValue.word(0),
    );
    let attempt = bus.write(BusValue.word(0), BusValue.word(0));
    expect(attempt).resolves.toBe(undefined);
  });
});

describe('Multiple devices on a bus', () => {
  const deviceAStartAddress = 0;
  const deviceARange = 2;
  const deviceBStartAddress = 4;
  const deviceBRange = 2;

  const emptyStartAddress = 2;
  const emptyRange = 2;

  let deviceA: MockProxy<BusDevice> & BusDevice;
  let addrDeviceA: AddressMappedDevice;
  let deviceB: MockProxy<BusDevice> & BusDevice;
  let addrDeviceB: AddressMappedDevice;

  let bus: Bus;

  beforeEach(() => {
    deviceA = mock<BusDevice>();
    deviceA.read.mockResolvedValue(BusValue.word(100));
    deviceA.write.mockResolvedValue();

    deviceB = mock<BusDevice>();
    deviceB.read.mockResolvedValue(BusValue.word(200));
    deviceB.write.mockResolvedValue();

    addrDeviceA = new AddressMappedDevice(
      deviceAStartAddress,
      deviceARange,
      deviceA,
    );

    addrDeviceB = new AddressMappedDevice(
      deviceBStartAddress,
      deviceBRange,
      deviceB,
    );

    bus = new Bus([addrDeviceA, addrDeviceB]);
  });

  test('No device at address rejects promise for read', () => {
    const result = bus.read(BusValue.word(100), BusWidth.Word);
    expect(result).rejects.toEqual('No device at address');
  });

  test('No device at address rejects promise for write', () => {
    const result = bus.write(BusValue.word(100), BusValue.word(0));
    expect(result).rejects.toEqual('No device at address');
  });

  test('Write for deviceA invokes write only on deviceA for its range', async () => {
    for (
      let i = deviceAStartAddress;
      i < deviceAStartAddress + deviceARange;
      i++
    ) {
      await bus.write(BusValue.word(i), BusValue.word(0));

      expect(deviceA.write).toHaveBeenCalled();
      expect(deviceA.read).toBeCalledTimes(0);
      expect(deviceB.write).toBeCalledTimes(0);
      expect(deviceB.read).toBeCalledTimes(0);
    }
  });

  test('Read for deviceA invokes read only on deviceA for its range', async () => {
    for (
      let i = deviceAStartAddress;
      i < deviceAStartAddress + deviceARange;
      i++
    ) {
      await bus.read(BusValue.word(i), BusWidth.Word);

      expect(deviceA.read).toHaveBeenCalled();
      expect(deviceA.write).toBeCalledTimes(0);
      expect(deviceB.write).toBeCalledTimes(0);
      expect(deviceB.read).toBeCalledTimes(0);
    }
  });

  test('Write for deviceB invokes write only on deviceB for its range', async () => {
    for (
      let i = deviceBStartAddress;
      i < deviceBStartAddress + deviceBRange;
      i++
    ) {
      await bus.write(BusValue.word(i), BusValue.word(0));

      expect(deviceB.write).toHaveBeenCalled();
      expect(deviceB.read).toBeCalledTimes(0);
      expect(deviceA.write).toBeCalledTimes(0);
      expect(deviceA.read).toBeCalledTimes(0);
    }
  });

  test('Read in between ranges result in device not found', async () => {
    for (let i = emptyStartAddress; i < emptyStartAddress + emptyRange; i++) {
      let error: string = '';
      try {
        await bus.read(BusValue.word(i), BusWidth.Word);
      } catch (e) {
        error = e;
      }

      expect(error).toEqual('No device at address');
      expect(deviceB.read).toBeCalledTimes(0);
      expect(deviceB.write).toBeCalledTimes(0);
      expect(deviceA.write).toBeCalledTimes(0);
      expect(deviceA.read).toBeCalledTimes(0);
    }
  });

  test('Write in between ranges result in device not found', async () => {
    for (let i = emptyStartAddress; i < emptyStartAddress + emptyRange; i++) {
      let error: string = '';
      try {
        await bus.write(BusValue.word(i), BusValue.word(0));
      } catch (e) {
        error = e;
      }

      expect(error).toEqual('No device at address');
      expect(deviceB.read).toBeCalledTimes(0);
      expect(deviceB.write).toBeCalledTimes(0);
      expect(deviceA.write).toBeCalledTimes(0);
      expect(deviceA.read).toBeCalledTimes(0);
    }
  });
});
