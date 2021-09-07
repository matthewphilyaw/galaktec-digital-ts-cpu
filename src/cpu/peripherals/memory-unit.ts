import { Clocked } from '../../core/discrete';
import { MemoryCommandBus } from './memory-bus';
import { ThirtyTwoBitBus } from '../../binary-bus/standard-buses';

export class MemoryUnit implements Clocked {
  private memoryCommandBus: MemoryCommandBus;
  private dataBus: ThirtyTwoBitBus;
  private readonly memoryBank: number[];

  constructor(
    initialSate: number[],
    memoryCommandBus: MemoryCommandBus
  ) {
    this.memoryBank = initialSate.slice(0);
    this.memoryCommandBus = memoryCommandBus;
  }

  tick(): void {
    const cmd = this.memoryCommandBus.read();


    if (cmd.type === 'READ') {
      const wordOfMemory = this.memoryBank[cmd.address];
      this.dataBus.write(wordOfMemory);
    } else if (cmd.type === 'WRITE') {
      this.memoryBank[cmd.address] = this.dataBus.read();
    }
  }
}