import { GenericBus } from '../core/bus';

export class NBitBus extends GenericBus<number> {
  private readonly bitMask: number;

  constructor(bitMask: number) {
    super();
    this.bitMask = bitMask;
  }

  write(data: number): void {
    super.write(data & this.bitMask);
  }
}
