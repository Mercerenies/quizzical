
import { Question } from '../question.js';

// Very simple for now; this interface will get more complicated as we
// allow config data to pass back and forth between the generator and
// the game. Possible config options: difficulty of question, type of
// question, etc.
export abstract class QuestionGenerator {

  abstract generate(): Question;

  /**
   * Can be called once on a given QuestionGenerator to free any
   * resources allocated by the generator. After this call, the
   * generator should never be used again.
   */
  close(): void {
    // Default implementation is empty.
  }

}

export class ConstantGenerator extends QuestionGenerator {
  readonly question: Question;

  constructor(question: Question) {
    super();
    this.question = question;
  }

  generate(): Question {
    return this.question;
  }

}
