
/**
 * Higher-level interface to use on top of an existing Lobby object.
 *
 * @module message_dispatcher
 */

import { AbstractLobbyListener, LobbyMessage } from './lobby/listener.js';

/**
 * MessageDispatcher is a {@link LobbyListener} which handles messages
 * from peers. Specifically, MessageDispatcher allows {@link
 * MessageListener} listeners to handle messages of a particular
 * messageType efficiently. Every {@link Lobby} automatically provides
 * a message dispatcher that can be used to efficiently handle
 * messages. This approach should be preferred to writing a {@link
 * LobbyListener} for every message type, for efficiency reasons.
 */
export class MessageDispatcher extends AbstractLobbyListener {
  private listeners: Map<string, MessageListener[]>;

  constructor() {
    super();
    this.listeners = new Map();
  }

  onMessage(message: LobbyMessage): void {
    (this.listeners.get(message.messageType) ?? []).forEach(function(listener) {
      listener.onMessage(message);
    });
  }

  /**
   * Adds a message listener.
   */
  addListener(listener: MessageListener): void {
    const messageType = listener.messageType;
    let listenerList = this.listeners.get(messageType);
    if (listenerList === undefined) {
      listenerList = [];
      this.listeners.set(messageType, listenerList);
    }
    listenerList.push(listener);
  }

  /**
   * Removes a message listener.
   *
   * @return whether the listener was found in the handler list
   */
  removeListener(listener: MessageListener): boolean {
    const messageType = listener.messageType;
    const listenerList = (this.listeners.get(messageType) ?? []);
    const index = listenerList.findIndex(function(x) { return x == listener; });
    if (index >= 0) {
      listenerList.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

}

/**
 * A message listener can respond to messages of a particular type.
 */
export interface MessageListener {

  /**
   * The type of message that can be responded to.
   */
  readonly messageType: string;

  /**
   * The handler method.
   */
  onMessage(message: LobbyMessage): void;

}

/**
 * Constructs a MessageListener from a message type and a function.
 *
 * Any object which satisfies the MessageListener interface is a valid
 * listener. This function is merely a convenient helper for
 * constructing such objects, but it is by no means mandatory to use
 * this function to do so.
 */
export function MessageListener(messageType: string, func: (message: LobbyMessage) => void): MessageListener {
  return {
    messageType: messageType,
    onMessage: func,
  };
}
