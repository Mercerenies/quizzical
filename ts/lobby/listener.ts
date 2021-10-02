
// TODO Rename this module to lobby/message.ts

import { PlayerUUID } from '../uuid.js';

/**
 * A message from a peer in the lobby.
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
  readonly message: unknown;

}
