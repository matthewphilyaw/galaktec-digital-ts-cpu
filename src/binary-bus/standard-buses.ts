import { NBitBus } from './n-bit-bus';
import { EIGHT_BIT_MASK, SIXTEEN_BIT_MASK, THIRTY_TWO_BIT_MASK } from './standard-bus-widths';

export class EightBitBus extends NBitBus {
  constructor() {
    super(EIGHT_BIT_MASK);
  }
}

export class SixteenBitBus extends NBitBus {
  constructor() {
    super(SIXTEEN_BIT_MASK);
  }
}

export class ThirtyTwoBitBus extends NBitBus {
  constructor() {
    super(THIRTY_TWO_BIT_MASK);
  }
}
