
/**
 * Manages the interfaces that can appear on screen on a client, as
 * instructed by the server.
 *
 * @module remote_control
 */

import { GuestLobby } from './lobby.js';
import { MessageListener } from './message_dispatcher.js';
import { LobbyMessage } from './lobby/listener.js';
import { RCID } from './uuid.js';
import { LFSR } from './lfsr.js';
import { render } from './renderer.js';
import { QUESTION_RESPONSE_MESSAGE_TYPE, FreeformResponse } from './question.js';
import * as Util from './util.js';

export const REMOTE_CONTROL_MESSAGE_TYPE = "RemoteControl.REMOTE_CONTROL_MESSAGE_TYPE";

export const RC_TRANSLATION = {
  'joined': '/rc/joined',
  'info': '/rc/info',
  'freeform': '/rc/freeform',
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
  initialize(lobby: GuestLobby): void {
    this.page.find("#player-name").text(lobby.playerName);
    this.page.find("#game-code").text(lobby.code);
    this.page.data("rcid", this.payload.rcId);
  }

  static createFrom(payload: RemoteControlMessage, page: JQuery<HTMLElement>): RemoteControlDisplay {
    switch (payload.rcType) {
    case 'joined':
      return new RemoteControlJoinedDisplay(payload, page);
    case 'info':
      return new RemoteControlInfoDisplay(payload, page);
    case 'freeform':
      return new RemoteControlFreeformDisplay(payload, page);
    }
  }

}

export class RemoteControlJoinedDisplay extends RemoteControlDisplay {
  readonly rcType: keyof typeof RC_TRANSLATION = "joined";
}

export class RemoteControlInfoDisplay extends RemoteControlDisplay {
  readonly rcType: keyof typeof RC_TRANSLATION = "info";

  initialize(lobby: GuestLobby): void {
    super.initialize(lobby);
    const payload = this.payload as RemoteControlInfoMessage;
    const info = payload.rcParams.info;
    render(info).then((mdInfo) => {
      this.page.find("#informational-message").html(mdInfo);
    });
  }

}

export class RemoteControlFreeformDisplay extends RemoteControlDisplay {
  readonly rcType: keyof typeof RC_TRANSLATION = "freeform";

  initialize(lobby: GuestLobby): void {
    super.initialize(lobby);
    this.validateAnswerType();

    const payload = this.payload as RemoteControlFreeformMessage;
    const questionText = payload.rcParams.questionText;
    render(questionText).then((mdQuestionText) => {
      this.page.find("#question-text").html(mdQuestionText);
    });
    this.page.find("#question-answer").attr("type", payload.rcParams.answerType);
    Util.enterToButton(this.page.find("#question-answer"), this.page.find("#question-submit"));

    this.page.find("#question-submit").click(() => this.sendAnswer(lobby));

  }

  private validateAnswerType(): void {
    // Validate that the answerType is what it's supposed to be
    // (before blindly storing it in the HTML).
    const payload = this.payload as RemoteControlFreeformMessage;
    if (!["number", "text"].includes(payload.rcParams.answerType)) {
      throw `Invalid answerType in RemoteControlFreeformDisplay: ${payload.rcParams.answerType}`;
    }
  }

  private sendAnswer(lobby: GuestLobby): void {
    const answer = $("#question-answer").val() as string;
    const response: FreeformResponse = {
      rcId: this.payload.rcId,
      responseType: "freeform",
      body: answer,
    };
    const message = lobby.newMessage(QUESTION_RESPONSE_MESSAGE_TYPE, response);
    lobby.sendMessageTo(lobby.hostId, message);
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
      const display = RemoteControlDisplay.createFrom(payload, $(page));
      display.initialize(this.lobby);
      $("main").replaceWith(display.page);
    });

  }

}

export interface RemoteControlMessage {
  rcType: keyof typeof RC_TRANSLATION;
  rcId: RCID;
  rcParams: Record<string, unknown>;
}

export interface RemoteControlJoinedMessage extends RemoteControlMessage {
  rcType: "joined";
}

export interface RemoteControlInfoMessage extends RemoteControlMessage {
  rcType: "info";
  rcParams: { info: string };
}

export interface RemoteControlFreeformMessage extends RemoteControlMessage {
  rcType: "freeform";
  rcParams: {
    questionText: string,
    answerType: "number" | "text",
  };
}

let _pageGenerator: RCPageGenerator | null = null;

// Singleton class
export class RCPageGenerator {
  private lfsr: LFSR;
  private joinedID: RCID;

  constructor() {
    this.lfsr = new LFSR();
    this.joinedID = this.generateID();
  }

  generateID(): RCID {
    return this.lfsr.generate() as RCID;
  }

  joinedPage(): RemoteControlJoinedMessage {
    // Note: The joined page gets a unique ID globally, since it will
    // never require any feedback and is generated in several
    // different places in the code.
    return {
      rcType: "joined",
      rcId: this.joinedID,
      rcParams: {},
    };
  }

  infoPage(info: string): RemoteControlInfoMessage {
    return {
      rcType: "info",
      rcId: this.generateID(),
      rcParams: { info: info },
    };
  }

  freeformPage(questionText: string, answerType: "number" | "text"): RemoteControlFreeformMessage {
    return {
      rcType: "freeform",
      rcId: this.generateID(),
      rcParams: { questionText, answerType },
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
