import { MemoryCommandBus } from './memory-bus';
import { ThirtyTwoBitBus } from '../../binary-bus/standard-buses';

export interface MemoryMapping {
  // Can split larger memories into blocks
  // and use the offset to index correctly
  offset: number;
  memoryCommandBus: MemoryCommandBus;
  dataBus: ThirtyTwoBitBus;
}


export class MemoryController {
  private readonly blockMask: number;
  private readonly memoryMap: Map<number, MemoryMapping>;

  constructor(blockMask: number, memoryMap: Map<number, MemoryMapping>) {
    this.blockMask = blockMask;
    this.memoryMap = memoryMap;
  }

  readResponse(address: number): number {
    const [ map ] = this.getMemoryMapAndComputedAddress(address);
    return map.dataBus.read();
  }

  readRequest(address: number): void {
    const [ map, computedAddress ] = this.getMemoryMapAndComputedAddress(address);

    map.memoryCommandBus.write({
      type: 'READ',
      address: computedAddress
    });
  }

  write(address: number, data: number): void {
    const [ map, computedAddress ] = this.getMemoryMapAndComputedAddress(address);

    map.memoryCommandBus.write({
      type: 'WRITE',
      address: computedAddress
    });

    map.dataBus.write(data);
  }

  private getAddressBlock(address: number): number {
    return address & this.blockMask;
  }

  private getMemoryMapAndComputedAddress(address: number): [MemoryMapping, number] {
    const addressBlock = this.getAddressBlock(address);
    const map = this.memoryMap.get(addressBlock);

    if (!map) {
      throw 'Invalid address';
    }

    const computedAddress = (address - addressBlock) + map.offset;
    return [map, computedAddress];
  }
}