
import { PlayerUUID } from './uuid.js';

let _sseSingleton: SSE | null = null;

export class SSE {
  private listeners: Map<string, SSEListener[]>;
  private sse: EventSource;

  constructor() {
    this.listeners = new Map();
    this.sse = new EventSource('/sse/listen');
    this.sse.addEventListener('message', (event) => {
      const data = IncomingMessage.fromJSON(JSON.parse(event.data));
      this.onMessage(data);
    });
  }

  addListener(messageType: string, listener: SSEListener): void {
    let listenerList = this.listeners.get(messageType);
    if (listenerList === undefined) {
      listenerList = [];
      this.listeners.set(messageType, listenerList);
    }
    listenerList.push(listener);
  }

  removeListener(messageType: string, listener: SSEListener): boolean {
    const listenerList = (this.listeners.get(messageType) ?? []);
    const index = listenerList.findIndex(function(x) { return x == listener; });
    if (index >= 0) {
      listenerList.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

  private onMessage(data: IncomingMessage): void {
    (this.listeners.get(data.messageType) ?? []).forEach(function(listener) { listener(data) });
  }

  async sendMessage(message: OutgoingMessage): Promise<void> {
    const target = message.postTarget();
    await $.post(target, JSON.stringify(message));
  }

  static get(): SSE {
    if (!_sseSingleton) {
      _sseSingleton = new SSE();
    }
    return _sseSingleton;
  }

}

export interface SSEListener {
  (message: IncomingMessage): void;
}

export interface OutgoingMessage {
  toJSON(): object;
  postTarget(): string;
}

export class DirectMessage implements OutgoingMessage {
  readonly target: PlayerUUID;
  readonly messageType: string;
  readonly message: object;

  constructor(target: PlayerUUID, messageType: string, message: object) {
    this.target = target;
    this.messageType = messageType;
    this.message = message;
  }

  toJSON(): object {
    return {
      target: this.target,
      messageType: this.messageType,
      message: this.message,
    };
  }

  postTarget(): string {
    return "/sse/send";
  }

}

export class BroadcastMessage implements OutgoingMessage {
  readonly messageType: string;
  readonly message: object;

  constructor(messageType: string, message: object) {
    this.messageType = messageType;
    this.message = message;
  }

  toJSON(): object {
    return {
      messageType: this.messageType,
      message: this.message,
    };
  }

  postTarget(): string {
    return "/sse/broadcast";
  }

}

export interface IncomingMessageBase {
  readonly source: PlayerUUID;
  readonly messageType: string;
  readonly message: any;
}

export class IncomingMessage {
  readonly source: PlayerUUID;
  readonly messageType: string;
  readonly message: any; // TODO: Generic? Make this not 'any' at least

  constructor(source: PlayerUUID, messageType: string, message: any) {
    this.source = source;
    this.messageType = messageType;
    this.message = message;
  }

  static fromJSON(json: IncomingMessageBase): IncomingMessage {
    return new IncomingMessage(json.source, json.messageType, json.message);
  }

}
