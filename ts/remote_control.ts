
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
import { RemoteControlDisplay } from './remote_control/display.js';

const hasOwnProperty = Object.prototype.hasOwnProperty;

export const REMOTE_CONTROL_MESSAGE_TYPE = "RemoteControl.REMOTE_CONTROL_MESSAGE_TYPE";

/**
 * The translation table, which translates rcType fields to HTTP GET
 * request targets. The valid rcType field values are defined to be
 * the keys of this object (i.e. keyof RC_TRANSLATION).
 */
export const RC_TRANSLATION = {
  'joined': '/rc/joined',
  'info': '/rc/info',
  'freeform': '/rc/freeform',
  'multichoice': '/rc/multichoice',
};

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

    const pageURL = RC_TRANSLATION[payload.rcType];

    $.get(pageURL).then((page) => {
      const display = RemoteControlDisplay.createFrom(payload, $(page));
      display.initialize(this.lobby);
      $("main").replaceWith(display.page);
    });

  }

}

/**
 * The payload of a lobby message whose message type is
 * REMOTE_CONTROL_MESSAGE_TYPE.
 */
export interface RemoteControlMessage {
  rcType: keyof typeof RC_TRANSLATION;
  rcId: RCID;
  rcParams: unknown;
}

/**
 * A message for a "joined" display.
 */
export interface RemoteControlJoinedMessage extends RemoteControlMessage {
  rcType: "joined";
}

/**
 * A message for an "info" display.
 */
export interface RemoteControlInfoMessage extends RemoteControlMessage {
  rcType: "info";
  rcParams: { info: string };
}

/**
 * A message for a "freeform" display.
 */
export interface RemoteControlFreeformMessage extends RemoteControlMessage {
  rcType: "freeform";
  rcParams: {
    questionText: string,
    answerType: "number" | "text",
  };
}

/**
 * A message for a "multichoice" display.
 */
export interface RemoteControlMultichoiceMessage extends RemoteControlMessage {
  rcType: "multichoice";
  rcParams: {
    questionText: string,
    answerChoices: string[],
  };
}

// Some basic validation
function asRCMessage(message: unknown): RemoteControlMessage | undefined {
  if ((typeof message !== 'object') || (message === null)) {
    console.warn(`Got invalid RC message ${message}`);
    return undefined;
  }

  // TODO Better validation
  const rcMessage = message as RemoteControlMessage;

  if (!hasOwnProperty.call(RC_TRANSLATION, rcMessage.rcType)) {
    console.warn(`Got invalid rcType ${rcMessage.rcType}`);
    return undefined;
  }

  return rcMessage;
}
