export interface Acknowledgeable {
  queueAck(eventId: number): void;
}

export class Event {
  private readonly eventId: number;
  private readonly ackInterface: Acknowledgeable;

  constructor(eventId: number, ackInterface: Acknowledgeable) {
    this.ackInterface = ackInterface;
    this.eventId = eventId;
  }

  ack(): void {
    this.ackInterface.queueAck(this.eventId);
  }
}

export interface Eventable<E extends Event> {
  queueEvent(event: E): void;
}

export interface Observable<State> {
  state(): State;
}

export type Device<E extends Event, State> = Eventable<E> & Observable<State>;
export interface Discrete {
  activate(): void;
  processEvents(): void;
  deactivate(): void;
}

export abstract class Unit<E extends Event, State>
  implements Discrete, Eventable<E>, Acknowledgeable, Observable<State> {
  private events: E[] = [];
  private acks: number[] = [];

  abstract activate(): void;
  abstract processEvents(): void;
  abstract deactivate(): void;
  abstract state(): State;

  queueAck(eventId: number): void {
    this.acks.push(eventId);
  }

  queueEvent(event: E): void {
    this.events.push(event);
  }
}
