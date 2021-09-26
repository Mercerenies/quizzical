
// Class representing a player currently connected to the game.

import { PlayerUUID } from '../uuid.js';

export class ConnectedPlayer {
  readonly uuid: PlayerUUID;
  readonly conn: DataConnection;

  constructor(uuid: PlayerUUID, conn: DataConnection) {
    this.uuid = uuid;
    this.conn = conn;
  }

}
