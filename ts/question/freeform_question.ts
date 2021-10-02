
import { RemoteControlMessage, RCPageGenerator } from '../remote_control.js';
import { Question } from '../question.js';
import { Displayable } from '../displayable.js';

export class FreeformQuestion extends Question {
  readonly questionText: string;
  readonly answerType: "number" | "text"; // TODO Make this a named type

  constructor(questionText: string, answerType: "number" | "text") {
    super();
    this.questionText = questionText;
    this.answerType = answerType;
  }

  getDisplayable(): Displayable {
    /////
    throw "Not implemented yet";
  }

  makeRCMessage(): RemoteControlMessage {
    return RCPageGenerator.get().freeformPage(this.questionText, this.answerType);
  }

}
