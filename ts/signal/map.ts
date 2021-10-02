
import { Signal, SignalHandler } from '../signal.js';

/**
 * A collection of Signals organized in a Map. Signals in the map are
 * lazily constructed when requested, either by a publisher or a
 * subscriber.
 */
export class SignalMap<K, T> {
  private map: Map<K, Signal<T>>;

  constructor() {
    this.map = new Map();
  }

  /**
   * Gets the signal associated to the given name. If one does not
   * exist, a new, empty signal will be constructed and stored in the
   * map.
   */
  get(name: K): Signal<T> {
    const existingSignal = this.map.get(name);
    if (existingSignal) {
      return existingSignal;
    } else {
      const newSignal = new Signal();
      this.map.set(name, newSignal);
      return newSignal;
    }
  }

  /**
   * Convenience function. Delegates to Signal.connect.
   */
  connect(name: K, handler: SignalHandler<T>): void {
    return this.get(name).connect(handler);
  }

  /**
   * Convenience function. Delegates to Signal.disconnect.
   */
  disconnect(name: K, handler: SignalHandler<T>): boolean {
    return this.get(name).disconnect(handler);
  }

  /**
   * Convenience function. Delegates to Signal.dispatch.
   */
  dispatch(name: K, param: T): void {
    return this.get(name).dispatch(param);
  }

}
