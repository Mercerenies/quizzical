
/**
 * Signal is a basic implementation of the pub/sub pattern. Any number
 * of callbacks can subscribe to a given signal. Then, when that
 * signal is dispatched, all subscribers are called in an unspecified
 * order.
 */
export class Signal<T> {
  private subscribers: SignalHandler<T>[];

  constructor() {
    this.subscribers = [];
  }

  connect(handler: SignalHandler<T>): void {
    this.subscribers.push(handler);
  }

  disconnect(handler: SignalHandler<T>): boolean {
    const index = this.subscribers.findIndex(function(x) { return x == handler; });
    if (index >= 0) {
      this.subscribers.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

  dispatch(param: T): void {
    this.subscribers.forEach((handler) => handler.handle(param));
  }

}

export interface SignalHandler<T> {
  handle(param: T): void;
}

export function SignalHandler<T>(handle: (param: T) => void): SignalHandler<T> {
  return { handle };
}
