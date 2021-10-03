
import { GuestLobby } from '../lobby.js';
import { QUESTION_RESPONSE_MESSAGE_TYPE, QuestionResponse } from '../question.js';
import { render } from '../renderer.js';
import { RemoteControlMessage, RemoteControlInfoMessage, RemoteControlFreeformMessage, RemoteControlMultichoiceMessage, RC_TRANSLATION } from '../remote_control.js';
import * as Util from '../util.js';

/**
 * Any DOM element intended as the root of a remote control display
 * can be wrapped in this class, which initializes it with properties
 * specific to this game.
 */
export class RemoteControlDisplay {
  readonly payload: RemoteControlMessage;
  readonly page: JQuery<HTMLElement>;

  /**
   * Constructs a raw RemoteControlDisplay.
   *
   * Note: You probably meant to use RemoteControlDisplay.createFrom,
   * which will intelligently construct an instance of a smarter
   * subclass.
   */
  constructor(payload: RemoteControlMessage, page: JQuery<HTMLElement>) {
    this.payload = payload;
    this.page = page;
  }

  /**
   * Set up the parameters on the page from the lobby. Subclasses
   * frequently extend this method's functionality to provide
   * form-specific initialization.
   */
  initialize(lobby: GuestLobby): void {
    this.page.find("#player-name").text(lobby.playerName);
    this.page.find("#game-code").text(lobby.code);
    this.page.data("rcid", this.payload.rcId);
  }

  /**
   * Constructs a RemoteControlDisplay subclass most appropriate to
   * the payload's rcType field.
   *
   * @param payload the message
   * @param page the <main> page to augment
   */
  static createFrom(payload: RemoteControlMessage, page: JQuery<HTMLElement>): RemoteControlDisplay {
    switch (payload.rcType) {
    case 'joined':
      return new RemoteControlJoinedDisplay(payload, page);
    case 'info':
      return new RemoteControlInfoDisplay(payload, page);
    case 'freeform':
      return new RemoteControlFreeformDisplay(payload, page);
    case 'multichoice':
      return new RemoteControlMultichoiceDisplay(payload, page);
    }
  }

}

/**
 * A RemoteControlDisplay for the "joined" RC type.
 */
export class RemoteControlJoinedDisplay extends RemoteControlDisplay {
  readonly rcType: keyof typeof RC_TRANSLATION = "joined";
}

/**
 * A RemoteControlDisplay for the "info" RC type.
 */
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

/**
 * A RemoteControlDisplay for the "freeform" RC type.
 */
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
    const response: QuestionResponse = {
      rcId: this.payload.rcId,
      responseType: "freeform",
      body: answer,
    };
    const message = lobby.newMessage(QUESTION_RESPONSE_MESSAGE_TYPE, response);
    lobby.sendMessageTo(lobby.hostId, message);
  }

}

// TODO Feedback when question is answered

/**
 * A RemoteControlDisplay for the "multichoice" RC type.
 */
export class RemoteControlMultichoiceDisplay extends RemoteControlDisplay {
  readonly rcType: keyof typeof RC_TRANSLATION = "multichoice";

  initialize(lobby: GuestLobby): void { //// initialize should be async
    super.initialize(lobby);

    const payload = this.payload as RemoteControlMultichoiceMessage;
    const questionText = payload.rcParams.questionText;
    render(questionText).then((mdQuestionText) => {
      this.page.find("#question-text").html(mdQuestionText);
    });

    // Initialize the answer choices
    (async () => {

      const options = [];
      for (const answer of payload.rcParams.answerChoices) {
        const mdAnswer = await render(answer);
        options.push(`
          <a href="#" class="list-group-item list-group-item-action multichoice-answer">${mdAnswer}</a>
        `);
      }
      const answerText = `<div class="list-group">${options.join('')}</div>`;
      this.page.find("#question-answer").html(answerText);

      this.page.find(".multichoice-answer").click((event) => {
        console.log(event.currentTarget);
        this.setAnswer($(event.currentTarget));
        return false;
      });

    })();

    this.page.find("#question-submit").click(() => this.sendAnswer(lobby));

  }

  private setAnswer(selection: JQuery<HTMLElement>) {
    const options = this.page.find(".multichoice-answer");
    options.removeClass("active");
    selection.addClass("active");
  }

  private getAnswerIndex(): number | undefined {
    let index = 0;
    for (const opt of this.page.find(".multichoice-answer")) {
      if ($(opt).hasClass("active")) {
        return index;
      }
      index += 1;
    }
    return undefined;
  }

  private sendAnswer(lobby: GuestLobby): void {
    // TODO Feedback on bad answer (also on Freeform as well)
    const answerIndex = this.getAnswerIndex();
    if (answerIndex !== undefined) {

      const response: QuestionResponse = {
        rcId: this.payload.rcId,
        responseType: "multichoice",
        body: '' + answerIndex,
      };

      const message = lobby.newMessage(QUESTION_RESPONSE_MESSAGE_TYPE, response);
      lobby.sendMessageTo(lobby.hostId, message);

    }
  }

}
