
/**
 * Provides the {@link SSE} class for managing SSE communication.
 *
 * @module sse
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
 */

import { PlayerUUID } from './uuid.js';
import { SignalMap } from './signal/map.js';

let _sseSingleton: SSE | null = null;

/**
 * SSE is a singleton class for managing server-sent events which can
 * be sent to and from peers.
 *
 * Every client which connects to the server receives (via a browser
 * cookie) a unique player identifier. Using this class, a client can
 * send a message to any other client simply by knowing their unique
 * identifier. All such messages go through the central server, so
 * this mechanism should only be used to negotiate and establish a
 * direct peer-to-peer communication, not to run the entire game.
 */
export class SSE {
  readonly signals: SignalMap<string, IncomingMessage>;
  private sse: EventSource;

  constructor() {
    this.signals = new SignalMap();
    this.sse = new EventSource('/sse/listen');
    this.sse.addEventListener('message', (event) => {
      const data = IncomingMessage.fromJSON(JSON.parse(event.data));
      this.onMessage(data);
    });
  }

  private onMessage(data: IncomingMessage): void {
    this.signals.dispatch(data.messageType, data);
  }

  /**
   * Sends a message to a peer, or to all connected peers, depending
   * on the type of message.
   */
  async sendMessage(message: OutgoingMessage): Promise<void> {
    const target = message.postTarget();
    await $.post(target, JSON.stringify(message));
  }

  /**
   * Gets the singleton instance of SSE.
   */
  static get(): SSE {
    if (!_sseSingleton) {
      _sseSingleton = new SSE();
    }
    return _sseSingleton;
  }

}

/**
 * An outgoing message. Instances of this interface should generally
 * not be constructed directly. Instead, the implementing classes
 * provided in this module should be used.
 */
export interface OutgoingMessage {

  /**
   * Returns a JSON representation of the message, for serialization
   * purposes.
   */
  toJSON(): unknown;

  /**
   * The URL to send the message to. The HTTP POST method will always
   * be used to do so.
   */
  postTarget(): string;

}

/**
 * A direct message is a message intended for a single peer.
 */
export class DirectMessage implements OutgoingMessage {
  readonly target: PlayerUUID;
  readonly messageType: string;
  readonly message: unknown;

  /**
   * @param target the ID of the client to send the message to
   * @param messageType the type of message
   * @param message the payload, a JSON-serializable object
   */
  constructor(target: PlayerUUID, messageType: string, message: unknown) {
    this.target = target;
    this.messageType = messageType;
    this.message = message;
  }

  toJSON(): unknown {
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

/**
 * A broadcast message, to be sent to all connected peers.
 */
export class BroadcastMessage implements OutgoingMessage { // TODO Disable this functionality on the prod server
  readonly messageType: string;
  readonly message: unknown;

  /**
   * @param messageType the type of message
   * @param message the payload, a JSON-serializable object
   */
  constructor(messageType: string, message: unknown) {
    this.messageType = messageType;
    this.message = message;
  }

  toJSON(): unknown {
    return {
      messageType: this.messageType,
      message: this.message,
    };
  }

  postTarget(): string {
    return "/sse/broadcast";
  }

}

/**
 * The minimal interface implemented by {@link IncomingMessage}.
 */
export interface IncomingMessageBase {
  readonly source: PlayerUUID;
  readonly messageType: string;
  readonly message: unknown;
}

export class IncomingMessage implements IncomingMessageBase {
  readonly source: PlayerUUID;
  readonly messageType: string;
  readonly message: unknown;

  constructor(source: PlayerUUID, messageType: string, message: unknown) {
    this.source = source;
    this.messageType = messageType;
    this.message = message;
  }

  static fromJSON(json: IncomingMessageBase): IncomingMessage {
    return new IncomingMessage(json.source, json.messageType, json.message);
  }

}
