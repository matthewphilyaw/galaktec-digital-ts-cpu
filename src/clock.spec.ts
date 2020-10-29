import { Discrete } from './discrete-unit';
import { Clock } from './clock';

class DeviceTester implements Discrete {
  activated: boolean;
  settled: boolean;
  deactivated: boolean;

  activate(): void {
    this.activated = true;
  }

  deactivate(): void {
    this.deactivated = true;
  }

  processEvents(): void {
    this.settled = true;
  }
}

test('Clock will activate all devices, then settle, then deactivate', () => {
  const dev1 = new DeviceTester();
  const dev2 = new DeviceTester();

  const clock = new Clock([dev1, dev2]);

  clock.tick();

  expect(dev1.activated).toBe(true);
  expect(dev1.settled).toBe(true);
  expect(dev1.deactivated).toBe(true);

  expect(dev2.activated).toBe(true);
  expect(dev2.settled).toBe(true);
  expect(dev2.deactivated).toBe(true);
});
