
import { RCID } from './uuid.js';
import { RemoteControlMessage, RCPageGenerator } from './remote_control.js';
import { Displayable, ConstantDisplayable } from './displayable.js';

export const QUESTION_RESPONSE_MESSAGE_TYPE = "Question.QUESTION_RESPONSE_MESSAGE_TYPE";

export interface QuestionResponse {
  readonly rcId: RCID;
  readonly responseType: string;
}

export interface FreeformResponse extends QuestionResponse {
  readonly responseType: "freeform";
  readonly body: string;
}

export abstract class Question {
  abstract getDisplayable(): Displayable;
  abstract makeRCMessage(): RemoteControlMessage;
}

export class NullQuestion extends Question {

  getDisplayable(): Displayable {
    return new ConstantDisplayable(`<div class="col-md-12"></div>`);
  }

  makeRCMessage(): RemoteControlMessage {
    return RCPageGenerator.get().joinedPage();
  }

}
