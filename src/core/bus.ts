import { Clocked } from './discrete';

export interface BusWriter<DataType> {
  write(data: DataType): void;
}

export interface BusReader<DataType> {
  read(): DataType;
}

export interface BusReaderWriter<DataType> extends BusWriter<DataType>, BusReader<DataType> {}
export interface Bus<DataType> extends BusReaderWriter<DataType>, Clocked {}

export class GenericBus<T> implements Bus<T> {
  private nextValue?: T;
  private currentValue: T;

  read(): T {
    return this.currentValue;
  }

  tick(): void {
    if (!this.nextValue) {
      return;
    }

    this.currentValue = this.nextValue;
    this.nextValue = undefined;
  }

  write(data: T): void {
    this.nextValue = data;
  }
}