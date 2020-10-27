
export interface FutureSink<T> {
  value(): T | undefined;
}

export interface FutureSource<T> {
  set(value: T): void;
}

export class Future<T> implements FutureSink<T>, FutureSource<T> {
  private futureValue?: T;

  set(value: T): void {
    this.futureValue = value;
  }

  value(): T | undefined {
    return this.futureValue;
  }
}