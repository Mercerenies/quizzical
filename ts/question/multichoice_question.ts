
import { RemoteControlMessage, RemoteControlMultichoiceMessage } from '../remote_control.js';
import { RCPageGenerator, RemoteControlMessageBuilder } from '../remote_control/page_generator.js';
import { Question } from '../question.js';
import { ExactAnswer } from './answer.js';
import { Displayable, HTTPGetDisplayable } from '../displayable.js';
import { render } from '../renderer.js';
import { RCID } from '../uuid.js';

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
