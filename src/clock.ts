import { Discrete } from './discrete-unit';

export class Clock {
  devices: Discrete[];

  constructor(devices: Discrete[]) {
    this.devices = devices;
  }

  tick(): void {
    for (const dev of this.devices) {
      dev.activate();
    }

    for (const dev of this.devices) {
      dev.processEvents();
    }

    for (const dev of this.devices) {
      dev.deactivate();
    }
  }
}
