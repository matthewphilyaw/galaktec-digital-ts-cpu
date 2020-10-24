import { DiscreteDevice, Activate, Settle, Deactivate } from './device';

export class Clock {
  devices: DiscreteDevice[];

  constructor(devices: DiscreteDevice[]) {
    this.devices = devices;
  }

  tick() {
    for (const dev of this.devices as Activate[]) {
      dev.activate();
    }

    for (const dev of this.devices as Settle[]) {
      dev.settle();
    }

    for (const dev of this.devices as Deactivate[]) {
      dev.deactivate();
    }
  }
}
