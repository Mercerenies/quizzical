
// Manages the interfaces that can appear on screen on a client, as
// instructed by the server.

import { GuestLobby } from './lobby.js';
import { MessageListener } from './message_dispatcher.js';
import { LobbyMessage } from './lobby/listener.js';
import { RCID } from './uuid.js';
import { LFSR } from './lfsr.js';

export const REMOTE_CONTROL_MESSAGE_TYPE = "RemoteControl.REMOTE_CONTROL_MESSAGE_TYPE";

export const RC_TRANSLATION = {
  'joined': '/rc/joined',
  'info': '/rc/info',
};

// Any DOM element intended as the root of a remote control display
// can be wrapped in this class, which initializes it with properties
// specific to this game.
export class RemoteControlDisplay {
  readonly payload: RemoteControlMessage;
  readonly page: JQuery<HTMLElement>;

  // Note: You probably meant to use RemoteControlDisplay.createFrom,
  // which will intelligently construct an instance of a smarter
  // subclass.
  constructor(payload: RemoteControlMessage, page: JQuery<HTMLElement>) {
    this.payload = payload;
    this.page = page;
  }

  // Set up the parameters on the page from the lobby.
  initialize(lobby: GuestLobby) {
    this.page.find("#player-name").text(lobby.playerName);
    this.page.find("#game-code").text(lobby.code);
  }

  static createFrom(payload: RemoteControlMessage, page: JQuery<HTMLElement>): RemoteControlDisplay {
    switch (payload.rcType) {
      case 'joined':
        return new RemoteControlJoinedDisplay(payload, page);
      case 'info':
        return new RemoteControlInfoDisplay(payload, page);
    }
  }

}

export class RemoteControlJoinedDisplay extends RemoteControlDisplay {
  readonly rcType: keyof typeof RC_TRANSLATION = "joined";
}

export class RemoteControlInfoDisplay extends RemoteControlDisplay {
  readonly rcType: keyof typeof RC_TRANSLATION = "info";

  initialize(lobby: GuestLobby) {
    super.initialize(lobby);
    this.page.find("#informational-message").text(this.payload.rcParams.info);
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
      let display = RemoteControlDisplay.createFrom(payload, $(page));
      display.initialize(this.lobby);
      $("main").replaceWith(display.page);
    });

  }

}

export interface RemoteControlMessage {
  rcType: keyof typeof RC_TRANSLATION;
  rcId: RCID; ///// TODO Store this on client side
  rcParams: any;
}

let _pageGenerator: RCPageGenerator | null = null;

// Singleton class
export class RCPageGenerator {
  private lfsr: LFSR;

  constructor() {
    this.lfsr = new LFSR();
  }

  generateID(): RCID {
    return this.lfsr.generate() as RCID;
  }

  joinedPage(): RemoteControlMessage {
    return {
      rcType: "joined",
      rcId: this.generateID(),
      rcParams: {},
    };
  }

  infoPage(info: string): RemoteControlMessage {
    return {
      rcType: "info",
      rcId: this.generateID(),
      rcParams: { info: info },
    };
  }

  static get(): RCPageGenerator {
    if (!_pageGenerator) {
      _pageGenerator = new RCPageGenerator();
    }
    return _pageGenerator;
  }

}

// Some basic validation
function asRCMessage(message: any): RemoteControlMessage | undefined {
  if ((RC_TRANSLATION as any)[message.rcType] === undefined) {
    console.warn(`Got invalid rcType ${message.rcType}`);
    return undefined;
  }

  return message;
}
