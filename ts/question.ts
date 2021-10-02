
import { RCID } from './uuid.js';
import { RemoteControlMessage } from './remote_control.js';
import { Displayable } from './displayable.js';

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
