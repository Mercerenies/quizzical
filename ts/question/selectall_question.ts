
import { RemoteControlMessage } from '../remote_control.js';
import { RemoteControlDisplay } from '../remote_control/display.js';
import { RCPageGenerator, RemoteControlMessageBuilder } from '../remote_control/page_generator.js';
import { Question, QuestionResponse, QUESTION_RESPONSE_MESSAGE_TYPE } from '../question.js';
import { ExactAnswer } from './answer.js';
import { Displayable, HTTPGetDisplayable } from '../displayable.js';
import { render } from '../renderer.js';
import { RCID } from '../uuid.js';
import { GuestLobby } from '../lobby.js';

export class SelectallQuestion extends Question {
  readonly questionText: string;
  readonly answerChoices: string[];

  constructor(questionText: string, answerChoices: string[], correctAnswers: number[]) {
    super(new ExactAnswer(constructAnswer(correctAnswers)));
    this.questionText = questionText;
    this.answerChoices = answerChoices.slice().sort();
  }

  getDisplayable(): Displayable {
    return new SelectallQuestionDisplayable(this);
  }

  makeRCMessage(): RemoteControlMessage {
    return RCPageGenerator.get().createPage(selectallPage(this.questionText, this.answerChoices));
  }

}

export class SelectallQuestionDisplayable extends HTTPGetDisplayable {
  private question: SelectallQuestion;

  constructor(question: SelectallQuestion) {
    super("/display/selectall");
    this.question = question;
  }

  async callback(element: JQuery<HTMLElement>): Promise<void> {
    const questionText = await render(this.question.questionText);
    element.find("#question-text").html(questionText);

    const options = [];
    for (const answer of this.question.answerChoices) {
      const mdAnswer = await render(answer);
      options.push(`
        <li class="list-group-item">${mdAnswer}</li>
      `);
    }
    const answerText = `<ul class="list-group">${options.join('')}</ul>`;
    element.find("#question-answer").html(answerText);

  }

}

export function selectallPage(questionText: string, answerChoices: string[]): RemoteControlMessageBuilder<RemoteControlSelectallMessage> {
  return (rcid: RCID) => ({
    rcType: "selectall",
    rcId: rcid,
    rcParams: { questionText, answerChoices },
  });
}

/**
 * A RemoteControlDisplay for the "selectall" RC type.
 */
export class RemoteControlSelectallDisplay extends RemoteControlDisplay {
  readonly rcType: string = "selectall";
  readonly httpGetTarget: string = "/rc/selectall";

  async initialize(lobby: GuestLobby, page: JQuery<HTMLElement>): Promise<void> {
    await super.initialize(lobby, page);

    const payload = this.payload as RemoteControlSelectallMessage;
    const manager = new SelectallResponseManager(lobby, payload, page);

    const questionText = payload.rcParams.questionText;
    const mdQuestionText = await render(questionText);
    page.find("#question-text").html(mdQuestionText);

    // Initialize the answer choices
    const options = [];
    for (const answer of payload.rcParams.answerChoices) {
      const mdAnswer = await render(answer);
      options.push(`
        <a href="#" class="list-group-item list-group-item-action selectall-answer">${mdAnswer}</a>
      `);
    }
    const answerText = `<div class="list-group">${options.join('')}</div>`;
    page.find("#question-answer").html(answerText);

    page.find(".selectall-answer").click((event) => {
      manager.setAnswer($(event.currentTarget));
      return false;
    });

    page.find("#question-submit").click(() => manager.sendAnswer());

  }

}

class SelectallResponseManager {
  private lobby: GuestLobby;
  private payload: RemoteControlSelectallMessage;
  private page: JQuery<HTMLElement>;

  constructor(lobby: GuestLobby, payload: RemoteControlSelectallMessage, page: JQuery<HTMLElement>) {
    this.lobby = lobby;
    this.payload = payload;
    this.page = page;
  }

  setAnswer(selection: JQuery<HTMLElement>) {
    if (selection.hasClass("active")) {
      selection.removeClass("active");
    } else {
      selection.addClass("active");
    }
  }

  getAnswerIndices(): number[] { //// Do we want to forbid answers that have no selections?
    const indices = [];
    let index = 0;
    for (const opt of this.page.find(".selectall-answer")) {
      if ($(opt).hasClass("active")) {
        indices.push(index);
      }
      index += 1;
    }
    return indices;
  }

  sendAnswer(): void {
    // TODO Feedback on bad answer (also on Freeform as well)
    const answerIndices = this.getAnswerIndices();

    const response: QuestionResponse = {
      rcId: this.payload.rcId,
      responseType: "selectall",
      body: constructAnswer(answerIndices),
    };

    const message = this.lobby.newMessage(QUESTION_RESPONSE_MESSAGE_TYPE, response);
    this.lobby.sendMessageTo(this.lobby.hostId, message);

  }

}

/**
 * A message for a "selectall" display.
 */
export interface RemoteControlSelectallMessage extends RemoteControlMessage {
  rcType: "selectall";
  rcParams: {
    questionText: string,
    answerChoices: string[],
  };
}

function constructAnswer(indices: number[]) {
  return indices.join(',');
}
