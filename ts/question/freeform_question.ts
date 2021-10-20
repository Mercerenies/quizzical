
import { RemoteControlMessage } from '../remote_control.js';
import { RemoteControlDisplay } from '../remote_control/display.js';
import { RCPageGenerator, RemoteControlMessageBuilder } from '../remote_control/page_generator.js';
import { Question, QuestionResponse, QUESTION_RESPONSE_MESSAGE_TYPE } from '../question.js';
import { Answer } from './answer.js';
import { Displayable, HTTPGetDisplayable } from '../displayable.js';
import { render } from '../renderer.js';
import { RCID } from '../uuid.js';
import { GuestLobby } from '../lobby.js';
import * as Util from '../util.js';

export type InputType = "number" | "text";

export class FreeformQuestion extends Question {
  readonly questionText: string;
  readonly answerType: InputType;

  constructor(questionText: string, answerType: InputType, answer: Answer) {
    super(answer);
    this.questionText = questionText;
    this.answerType = answerType;
  }

  getDisplayable(): Displayable {
    return new FreeformQuestionDisplayable(this);
  }

  makeRCMessage(): RemoteControlMessage {
    return RCPageGenerator.get().createPage(freeformPage(this.questionText, this.answerType));
  }

}

export class FreeformQuestionDisplayable extends HTTPGetDisplayable {
  private question: FreeformQuestion;

  constructor(question: FreeformQuestion) {
    super("/display/freeform");
    this.question = question;
  }

  async callback(element: JQuery<HTMLElement>): Promise<void> {
    const questionText = await render(this.question.questionText);
    element.find("#question-text").html(questionText);
  }

}

export function freeformPage(questionText: string, answerType: InputType): RemoteControlMessageBuilder<RemoteControlFreeformMessage> {
  return (rcid: RCID) => ({
    rcType: "freeform",
    rcId: rcid,
    rcParams: { questionText, answerType },
  });
}

/**
 * A RemoteControlDisplay for the "freeform" RC type.
 */
export class RemoteControlFreeformDisplay extends RemoteControlDisplay {
  readonly rcType: string = "freeform";
  readonly httpGetTarget: string = "/rc/freeform";

  async initialize(lobby: GuestLobby, page: JQuery<HTMLElement>): Promise<void> {
    await super.initialize(lobby, page);

    const payload = this.payload as RemoteControlFreeformMessage;
    validateAnswerType(payload);

    const manager = new FreeformResponseManager(lobby, payload, page);

    const questionText = payload.rcParams.questionText;
    const mdQuestionText = await render(questionText);
    page.find("#question-text").html(mdQuestionText);
    page.find("#question-answer").attr("type", payload.rcParams.answerType);
    Util.enterToButton(page.find("#question-answer"), page.find("#question-submit"));

    page.find("#question-submit").click(() => manager.sendAnswer());

  }

}

function validateAnswerType(payload: RemoteControlFreeformMessage): void {
  // Validate that the answerType is what it's supposed to be
  // (before blindly storing it in the HTML).
  if (!["number", "text"].includes(payload.rcParams.answerType)) {
    throw `Invalid answerType in RemoteControlFreeformDisplay: ${payload.rcParams.answerType}`;
  }
}

class FreeformResponseManager {
  private lobby: GuestLobby;
  private payload: RemoteControlFreeformMessage;
  private page: JQuery<HTMLElement>;

  constructor(lobby: GuestLobby, payload: RemoteControlFreeformMessage, page: JQuery<HTMLElement>) {
    this.lobby = lobby;
    this.payload = payload;
    this.page = page;
  }

  sendAnswer(): void {
    const answer = this.page.find("#question-answer").val() as string;
    const response: QuestionResponse = {
      rcId: this.payload.rcId,
      responseType: "freeform",
      body: answer,
    };
    const message = this.lobby.newMessage(QUESTION_RESPONSE_MESSAGE_TYPE, response);
    this.lobby.sendMessageTo(this.lobby.hostId, message);
  }

}

/**
 * A message for a "freeform" display.
 */
export interface RemoteControlFreeformMessage extends RemoteControlMessage {
  rcType: "freeform";
  rcParams: {
    questionText: string,
    answerType: InputType,
  };
}
