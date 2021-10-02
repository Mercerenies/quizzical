
import { RCID } from './uuid.js';
import { RemoteControlMessage, RCPageGenerator } from './remote_control.js';
import { Displayable, ConstantDisplayable } from './displayable.js';
import { Answer, NullAnswer } from './question/answer.js';

export const QUESTION_RESPONSE_MESSAGE_TYPE = "Question.QUESTION_RESPONSE_MESSAGE_TYPE";

export interface QuestionResponse {
  readonly rcId: RCID;
  readonly responseType: string;
  readonly body: string;
}

export abstract class Question {
  readonly correctAnswer: Answer;

  constructor(correctAnswer: Answer) {
    this.correctAnswer = correctAnswer;
  }

  abstract getDisplayable(): Displayable;
  abstract makeRCMessage(): RemoteControlMessage;
}

export class NullQuestion extends Question {

  constructor() {
    super(new NullAnswer());
  }

  getDisplayable(): Displayable {
    return new ConstantDisplayable(`<div class="col-md-12" id="game-row"></div>`);
  }

  makeRCMessage(): RemoteControlMessage {
    return RCPageGenerator.get().joinedPage();
  }

}
