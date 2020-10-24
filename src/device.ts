export interface Activate {
  activate(): void;
}

export interface Settle {
  settle(): void;
}

export interface Deactivate {
  deactivate(): void;
}

export interface Observable<State> {
  state(): State;
}

export interface Reactive<Event> {
  react(event: Event): void;
}

export type DiscreteDevice = Activate & Settle & Deactivate;
export type ReactiveDevice<Event, State> = Reactive<Event> & Observable<State>;
