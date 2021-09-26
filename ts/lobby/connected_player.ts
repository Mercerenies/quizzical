
// Class representing a player currently connected to the game.

import { PlayerUUID } from '../uuid.js';

export class ConnectedPlayer {
  readonly uuid: PlayerUUID;
  readonly playerName: string;
  readonly conn: DataConnection;

  constructor(uuid: PlayerUUID, playerName: string, conn: DataConnection) {
    this.uuid = uuid;
    this.playerName = playerName;
    this.conn = conn;
  }

}
