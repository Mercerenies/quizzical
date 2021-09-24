
export class SSE {

  constructor() {
    this.listeners = []
    this.sse = new EventSource('/sse/listen');
    this.sse.addEventListener('message', (event) => {
      const data = IncomingMessage.fromJSON(JSON.parse(event.data));
      this.onMessage(data);
    });
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  onMessage(data) {
    this.listeners.forEach(function(listener) { listener(data) });
  }

  async sendMessage(message) {
    const target = message.postTarget();
    await $.post(target, JSON.stringify(message));
  }

}

export class DirectMessage {

  constructor(target, message) {
    this.target = target;
    this.message = message;
  }

  toJSON() {
    return {
      target: this.target,
      message: this.message,
    };
  }

  postTarget() {
    return "/sse/send";
  }

}

export class BroadcastMessage {

  constructor(message) {
    this.message = message;
  }

  toJSON() {
    return {
      message: this.message,
    };
  }

  postTarget() {
    return "/sse/broadcast";
  }

}

export class IncomingMessage {

  constructor(source, message) {
    this.source = source;
    this.message = message;
  }

  static fromJSON(json) {
    return new IncomingMessage(json.source, json.message);
  }

}
