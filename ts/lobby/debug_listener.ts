
/**
 * Provides the {@link DebugLobbyListener} type.
 *
 * @module
 */

import { LobbyListener, LobbyMessage } from './listener.js';
import { PlayerUUID } from '../uuid.js';

/**
 * {@link LobbyListener} which simply prints debug messages to console
 * whenever it receives any event.
 */
export class DebugLobbyListener implements LobbyListener {

  onMessage(message: LobbyMessage): void {
    console.log("MESSAGE: " + JSON.stringify(message.message));
  }

  onConnect(player: PlayerUUID): void {
    console.log(`New player ${player} joined`);
  }

  onDisconnect(player: PlayerUUID): void {
    console.log(`Disconnected (${player})`);
  }

  onReconnect(player: PlayerUUID): void {
    console.log(`Rejoined (${player})`);
  }

}
