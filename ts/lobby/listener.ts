
import { PlayerUUID } from '../uuid.js';

export interface LobbyListener {

  // These events fire on all lobby types
  onMessage(message: LobbyMessage): void;
  onConnect(player: PlayerUUID): void;

  // These events only fire for the host of the lobby
  onDisconnect(player: PlayerUUID): void;
  onReconnect(player: PlayerUUID): void;

}

export class AbstractLobbyListener implements LobbyListener {
  onMessage(message: LobbyMessage): void {}
  onConnect(player: PlayerUUID): void {}
  onDisconnect(player: PlayerUUID): void {}
  onReconnect(player: PlayerUUID): void {}
}

export interface LobbyMessage {
  readonly source: PlayerUUID;
  readonly messageType: string;
  readonly message: any;
}
