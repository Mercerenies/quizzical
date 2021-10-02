
/**
 * Provides the {@link DebugLobbyListener} type.
 *
 * @module lobby/debug_listener
 */

import { Lobby } from '../lobby.js';
import { SignalHandler } from '../signal.js';

/**
 * Signal handler which simply prints debug messages to console
 * whenever it receives any event.
 */
export class DebugLobbyListener implements SignalHandler<unknown> { // TODO Move this out of lobby/ subfolder

  handle(param: unknown): void {
    console.log(param);
  }

}

export function setupDebugListener(lobby: Lobby): DebugLobbyListener {
  const handler = new DebugLobbyListener();
  lobby.messaged.connect(handler);
  lobby.connected.connect(handler);
  lobby.reconnected.connect(handler);
  lobby.disconnected.connect(handler);
  return handler;
}
