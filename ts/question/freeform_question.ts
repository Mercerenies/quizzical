
import { RemoteControlMessage } from '../remote_control.js';
import { RCPageGenerator } from '../remote_control/page_generator.js';
import { Question } from '../question.js';
import { Answer } from './answer.js';
import { Displayable, HTTPGetDisplayable } from '../displayable.js';
import { render } from '../renderer.js';

export class FreeformQuestion extends Question {
  readonly questionText: string;
  readonly answerType: "number" | "text"; // TODO Make this a named type

  constructor(questionText: string, answerType: "number" | "text", answer: Answer) {
    super(answer);
    this.questionText = questionText;
    this.answerType = answerType;
  }

  getDisplayable(): Displayable {
    return new FreeformQuestionDisplayable(this);
  }

  makeRCMessage(): RemoteControlMessage {
    return RCPageGenerator.get().freeformPage(this.questionText, this.answerType);
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
