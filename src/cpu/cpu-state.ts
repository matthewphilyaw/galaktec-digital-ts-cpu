import { GenericBus } from '../core/bus';

export interface CpuState {
  programCounter: number;
}

export class CpuStateBus extends GenericBus<CpuState> { }

