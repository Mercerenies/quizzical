
/**
 * Provides {@link ConnectedPlayer}.
 *
 * @module
 */

import { PlayerUUID } from '../uuid.js';

/**
 * Represents a player currently connected to the game.
 */
export class ConnectedPlayer {
  /** The player's unique identifier. */
  readonly uuid: PlayerUUID;
  /** The player's name. */
  readonly playerName: string;
  /** The player's peerjs data connection. */
  readonly conn: DataConnection;

  constructor(uuid: PlayerUUID, playerName: string, conn: DataConnection) {
    this.uuid = uuid;
    this.playerName = playerName;
    this.conn = conn;
  }

}
