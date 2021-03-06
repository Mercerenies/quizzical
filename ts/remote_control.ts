
/**
 * Manages the interfaces that can appear on screen on a client, as
 * instructed by the server.
 *
 * @module remote_control
 */

import { GuestLobby } from './lobby.js';
import { SignalHandler } from './signal.js';
import { LobbyMessage } from './lobby/listener.js';
import { RCID } from './uuid.js';
import { RemoteControlDisplayRegistrar } from './remote_control/display.js';

export const REMOTE_CONTROL_MESSAGE_TYPE = "RemoteControl.REMOTE_CONTROL_MESSAGE_TYPE";

/**
 * A SignalHandler which displays remote control screens, based on
 * received messages of type REMOTE_CONTROL_MESSAGE_TYPE.
 */
export class RemoteControlListener implements SignalHandler<LobbyMessage> {
  readonly messageType: string = REMOTE_CONTROL_MESSAGE_TYPE;
  private lobby: GuestLobby;

  constructor(lobby: GuestLobby) {
    this.lobby = lobby;
  }

  handle(message: LobbyMessage): void {
    const payload = asRCMessage(message.message);

    if (payload === undefined) {
      console.error(`Got invalid payload ${payload} in RemoteControlListener.onMessage`);
      return;
    }

    const display = RemoteControlDisplayRegistrar.get().createDisplay(payload);
    const pageURL = display.httpGetTarget;

    $.get(pageURL).then((page) => {
      const jPage = $(page);
      display.initialize(this.lobby, jPage).then(() => {
        $("main").replaceWith(jPage);
      });
    });

  }

}

/**
 * The payload of a lobby message whose message type is
 * REMOTE_CONTROL_MESSAGE_TYPE.
 */
export interface RemoteControlMessage {
  rcType: string;
  rcId: RCID;
  rcParams: unknown;
}

/**
 * A message for a "joined" display.
 */
export interface RemoteControlJoinedMessage extends RemoteControlMessage {
  rcType: "joined";
}

// Some basic validation
function asRCMessage(message: unknown): RemoteControlMessage | undefined {
  if ((typeof message !== 'object') || (message === null)) {
    console.warn(`Got invalid RC message ${message}`);
    return undefined;
  }

  // TODO Better validation
  const rcMessage = message as RemoteControlMessage;

  return rcMessage;
}
