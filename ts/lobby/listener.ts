
import { PlayerUUID } from '../uuid.js';

/**
 * A listener which responds to events sent by the game's lobby.
 *
 * Some of the listener's messages only fire on specific peers. In
 * particular, some messages will fire on both host and guest peers,
 * while some only fire on host peers. The documentation for the
 * particular function indicates which peer types an event will fire
 * for.
 */
export interface LobbyListener {

  /**
   * Fires whenever a message is received from a peer. This event
   * type fires on all peers.
   */
  onMessage(message: LobbyMessage): void;

  /**
   * Fires when a new peer connects for the first time this session.
   * For the host, this implies that a player has just connected. For
   * a guest, this implies that the connection to the lobby host has
   * just been established successfully. This event fires on all
   * peers.
   */
  onConnect(player: PlayerUUID): void;

  /**
   * Fires when a peer disconnects. This event only fires on the host
   * of the lobby.
   */
  onDisconnect(player: PlayerUUID): void;

  /**
   * Fires when a peer who was already connected before reconnects to
   * the lobby. This event only fires on the host of the lobby.
   */
  onReconnect(player: PlayerUUID): void;

}

/**
 * A minimal implementation of {@link LobbyListener} with blank method
 * bodies for all required methods.
 */
export class AbstractLobbyListener implements LobbyListener {
  onMessage(message: LobbyMessage): void {}
  onConnect(player: PlayerUUID): void {}
  onDisconnect(player: PlayerUUID): void {}
  onReconnect(player: PlayerUUID): void {}
}

/**
 * A message from the lobby, to be passed to {@link
 * LobbyListener.onMessage}.
 */
export interface LobbyMessage {

  /**
   * The sender of the message. If the receiver is a lobby guest, then
   * this UUID will always be the UUID of the lobby host.
   */
  readonly source: PlayerUUID;

  /**
   * The type of message. Used to determine dispatching behavior in
   * {@link MessageDispatcher}.
   */
  readonly messageType: string;

  /**
   * The message payload itself. This value can consist of any
   * JSON-serializable data.
   */
  readonly message: any;

}
