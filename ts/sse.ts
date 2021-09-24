
let _sseSingleton: SSE | null = null;

export class SSE {
  private listeners: SSEListener[];
  private sse: EventSource;

  constructor() {
    this.listeners = []
    this.sse = new EventSource('/sse/listen');
    this.sse.addEventListener('message', (event) => {
      const data = IncomingMessage.fromJSON(JSON.parse(event.data));
      this.onMessage(data);
    });
  }

  addListener(listener: SSEListener): void {
    this.listeners.push(listener);
  }

  private onMessage(data: IncomingMessage): void {
    this.listeners.forEach(function(listener) { listener(data) });
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
  target: string;
  message: object;

  constructor(target: string, message: object) {
    this.target = target;
    this.message = message;
  }

  toJSON(): object {
    return {
      target: this.target,
      message: this.message,
    };
  }

  postTarget(): string {
    return "/sse/send";
  }

}

export class BroadcastMessage implements OutgoingMessage {
  message: object;

  constructor(message: object) {
    this.message = message;
  }

  toJSON(): object {
    return {
      message: this.message,
    };
  }

  postTarget(): string {
    return "/sse/broadcast";
  }

}

export interface IncomingMessageBase {
  source: string;
  message: string;
}

export class IncomingMessage {
  source: string;
  message: any; // TODO: Generic? Make this not 'any' at least

  constructor(source: string, message: any) {
    this.source = source;
    this.message = message;
  }

  static fromJSON(json: IncomingMessageBase): IncomingMessage {
    return new IncomingMessage(json.source, json.message);
  }

}
