
// Manages the interfaces that can appear on screen on a client, as
// instructed by the server.

import { GuestLobby } from './lobby.js';
import { MessageListener } from './message_dispatcher.js';
import { LobbyMessage } from './lobby/listener.js';

export const REMOTE_CONTROL_MESSAGE_TYPE = "RemoteControl.REMOTE_CONTROL_MESSAGE_TYPE";

export const RC_TRANSLATION = {
  'joined': '/rc/joined',
};

// Any DOM element intended as the root of a remote control display
// can be wrapped in this class, which initializes it with properties
// specific to this game.
export class RemoteControlDisplay {
  readonly page: JQuery<HTMLElement>;

  constructor(page: JQuery<HTMLElement>) {
    this.page = page;
  }

  // Set up the parameters on the page from the lobby.
  initialize(lobby: GuestLobby) {
    this.page.find("#player-name").text(lobby.playerName);
    this.page.find("#game-code").text(lobby.code);
  }

}

export class RemoteControlListener implements MessageListener {
  readonly messageType: string = REMOTE_CONTROL_MESSAGE_TYPE;
  private lobby: GuestLobby;

  constructor(lobby: GuestLobby) {
    this.lobby = lobby;
  }

  onMessage(message: LobbyMessage): void {
    const payload = asRCMessage(message.message);

    if (payload === undefined) {
      return;
    }

    const pageURL = RC_TRANSLATION[payload.rcType];

    $.get(pageURL).then((page) => {
      let display = new RemoteControlDisplay($(page));
      display.initialize(this.lobby);
      $("main").replaceWith(display.page);
    });

  }

}

export interface RemoteControlMessage {
  rcType: keyof typeof RC_TRANSLATION;
  rcParams: any;
}

// Some basic validation
function asRCMessage(message: any): RemoteControlMessage | undefined {
  if ((RC_TRANSLATION as any)[message.rcType] === undefined) {
    console.warn(`Got invalid rcType ${message.rcType}`);
    return undefined;
  }

  return message;
}
