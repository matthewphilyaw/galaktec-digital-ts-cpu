import { GenericBus } from '../../core/bus';
import { THIRTY_TWO_BIT_MASK } from '../../binary-bus/standard-bus-widths';

export interface MemoryCommand {
  type: 'READ' | 'WRITE';
  address: number;
}

export class MemoryCommandBus extends GenericBus<MemoryCommand> {
  write(data: MemoryCommand): void {
    data.address &= THIRTY_TWO_BIT_MASK;
    super.write(data);
  }
}