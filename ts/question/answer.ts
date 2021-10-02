
/**
 * Type which describes the correct answer to a question.
 *
 * For some use cases, {@link ExactAnswer} will suffice. However,
 * isCorrect can be overridden separately to provide a system that
 * allows answers within a particular tolerance of the "real" answer,
 * or for instance to provide case-insensitive answers.
 */
export abstract class Answer {
  readonly answer: string;

  constructor(answer: string) {
    this.answer = answer;
  }

  abstract isCorrect(proposedAnswer: string): boolean;

}

/**
 * A nullary answer implementation which does not accept any answer.
 */
export class NullAnswer extends Answer {

  constructor() {
    super("(no answer)");
  }

  isCorrect(): boolean {
    return false;
  }

}

/**
 * An answer which must compare literally equal (as strings) to the
 * canonically correct answer.
 */
export class ExactAnswer extends Answer {

  isCorrect(proposedAnswer: string): boolean {
    return this.answer == proposedAnswer;
  }

}
