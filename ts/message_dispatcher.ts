
/**
 * Higher-level interface to use on top of an existing Lobby object.
 *
 * @module message_dispatcher
 */

import { LobbyMessage } from './lobby/listener.js';
import { SignalHandler } from './signal.js';
import { SignalMap } from './signal/map.js';

/**
 * MessageDispatcher is a signal handler which handles messages from
 * peers. Specifically, MessageDispatcher allows listeners to handle
 * messages of a particular messageType efficiently. Every {@link
 * Lobby} automatically provides a message dispatcher that can be used
 * to efficiently handle messages. This approach should be preferred
 * to writing a direct signal handler for every message type in Lobby,
 * for efficiency reasons.
 */
export class MessageDispatcher implements SignalHandler<LobbyMessage> {
  readonly signals: SignalMap<string, LobbyMessage> = new SignalMap();

  connect(name: string, handler: SignalHandler<LobbyMessage>): void;
  connect(handler: SignalHandler<LobbyMessage> & { readonly messageType: string }): void;
  connect(arg1: string | (SignalHandler<LobbyMessage> & { readonly messageType: string }), arg2?: SignalHandler<LobbyMessage>): void {
    if (typeof arg1 === 'object') {
      const name = arg1.messageType;
      const handler = arg1;
      this.signals.connect(name, handler);
    } else if (arg2 !== undefined) {
      const name = arg1;
      const handler = arg2;
      this.signals.connect(name, handler);
    } else {
      // Should be impossible from the overload signatures!
      throw "Invalid arguments to MessageDispatcher.connect";
    }
  }

  handle(message: LobbyMessage): void {
    this.signals.dispatch(message.messageType, message);
  }

}
