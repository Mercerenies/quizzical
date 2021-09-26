
// Higher-level interface to use on top of an existing Lobby object.

import { PlayerUUID } from './uuid.js';
import { AbstractLobbyListener, LobbyMessage } from './lobby/listener.js';

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

  addListener(listener: MessageListener): void {
    const messageType = listener.messageType;
    let listenerList = this.listeners.get(messageType);
    if (listenerList === undefined) {
      listenerList = [];
      this.listeners.set(messageType, listenerList);
    }
    listenerList.push(listener);
  }

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

export interface MessageListener {
  readonly messageType: string;
  onMessage(message: LobbyMessage): void;
}

export function MessageListener(messageType: string, func: (message: LobbyMessage) => void): MessageListener {
  return {
    messageType: messageType,
    onMessage: func,
  };
}
