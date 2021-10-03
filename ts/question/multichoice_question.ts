
import { RemoteControlMessage } from '../remote_control.js';
import { RemoteControlDisplay } from '../remote_control/display.js';
import { RCPageGenerator, RemoteControlMessageBuilder } from '../remote_control/page_generator.js';
import { Question, QuestionResponse, QUESTION_RESPONSE_MESSAGE_TYPE } from '../question.js';
import { ExactAnswer } from './answer.js';
import { Displayable, HTTPGetDisplayable } from '../displayable.js';
import { render } from '../renderer.js';
import { RCID } from '../uuid.js';
import { GuestLobby } from '../lobby.js';

export class MultichoiceQuestion extends Question {
  readonly questionText: string;
  readonly answerChoices: string[];

  constructor(questionText: string, answerChoices: string[], correctAnswer: number) {
    super(new ExactAnswer('' + correctAnswer));
    this.questionText = questionText;
    this.answerChoices = answerChoices;
  }

  getDisplayable(): Displayable {
    return new MultichoiceQuestionDisplayable(this);
  }

  makeRCMessage(): RemoteControlMessage {
    return RCPageGenerator.get().createPage(multichoicePage(this.questionText, this.answerChoices));
  }

}

export class MultichoiceQuestionDisplayable extends HTTPGetDisplayable {
  private question: MultichoiceQuestion;

  constructor(question: MultichoiceQuestion) {
    super("/display/multichoice");
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

export function multichoicePage(questionText: string, answerChoices: string[]): RemoteControlMessageBuilder<RemoteControlMultichoiceMessage> {
  return (rcid: RCID) => ({
    rcType: "multichoice",
    rcId: rcid,
    rcParams: { questionText, answerChoices },
  });
}

/**
 * A RemoteControlDisplay for the "multichoice" RC type.
 */
export class RemoteControlMultichoiceDisplay extends RemoteControlDisplay {
  readonly rcType: string = "multichoice";
  readonly httpGetTarget: string = "/rc/multichoice";

  initialize(lobby: GuestLobby, page: JQuery<HTMLElement>): void { //// initialize should be async
    super.initialize(lobby, page);

    const payload = this.payload as RemoteControlMultichoiceMessage;
    const questionText = payload.rcParams.questionText;
    render(questionText).then((mdQuestionText) => {
      page.find("#question-text").html(mdQuestionText);
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
      page.find("#question-answer").html(answerText);

      page.find(".multichoice-answer").click((event) => {
        console.log(event.currentTarget);
        this.setAnswer($(event.currentTarget), page);
        return false;
      });

    })();

    page.find("#question-submit").click(() => this.sendAnswer(lobby, page));

  }

  // TODO Move these private guys to a new class that has page (and the same for the other RCDisplay instances)
  private setAnswer(selection: JQuery<HTMLElement>, page: JQuery<HTMLElement>) {
    const options = page.find(".multichoice-answer");
    options.removeClass("active");
    selection.addClass("active");
  }

  private getAnswerIndex(page: JQuery<HTMLElement>): number | undefined {
    let index = 0;
    for (const opt of page.find(".multichoice-answer")) {
      if ($(opt).hasClass("active")) {
        return index;
      }
      index += 1;
    }
    return undefined;
  }

  private sendAnswer(lobby: GuestLobby, page: JQuery<HTMLElement>): void {
    // TODO Feedback on bad answer (also on Freeform as well)
    const answerIndex = this.getAnswerIndex(page);
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
