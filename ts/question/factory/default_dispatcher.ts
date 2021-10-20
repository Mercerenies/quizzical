
import { QuestionFactoryDispatcher } from '../factory.js';
import { Question } from '../../question.js';
import { FreeformQuestionFactory } from '../freeform_question.js';

export class DefaultFactoryDispatcher extends QuestionFactoryDispatcher<Question> {

  constructor() {
    super();

    this.register(new FreeformQuestionFactory());

  }

}
