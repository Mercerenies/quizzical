
import { Question } from '../question.js';

// Very simple for now; this interface will get more complicated as we
// allow config data to pass back and forth between the generator and
// the game. Possible config options: difficulty of question, type of
// question, etc.
export interface QuestionGenerator {
  generate(): Question;
}

export class ConstantGenerator implements QuestionGenerator {
  readonly question: Question;

  constructor(question: Question) {
    this.question = question;
  }

  generate(): Question {
    return this.question;
  }

}
