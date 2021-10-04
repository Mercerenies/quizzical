
/**
 * Setup behavior for the "new game" page.
 *
 * @module main
 */

import { hostLobby } from './lobby.js';
import { setupDebugListener } from './lobby/debug_listener.js';
import { DEFAULT_MAX_PLAYERS } from './game_initializer.js';
import { GameInitializer } from './game_initializer.js';
import { Question } from './question.js';
import { QuestionGenerator } from './question/generator.js';
import { FreeformQuestion } from './question/freeform_question.js';
import { MultichoiceQuestion } from './question/multichoice_question.js';
import { SelectallQuestion } from './question/selectall_question.js';
import { ExactAnswer } from './question/answer.js';
import { initializeRCDisplays } from './remote_control/initializer.js';
import * as Util from './util.js';

/**
 * Set up the game page. Should be called once after the page is
 * loaded.
 */
export function setupNewGame(): void {

  initializeRCDisplays();

  hostLobby(DEFAULT_MAX_PLAYERS).then((lobby) => {
    const gameInitializer = new GameInitializer({
      lobby: lobby,
      playerListDOM: $("#player-list"),
      generator: DebugGenerator,
    });
    setupDebugListener(gameInitializer.lobby);
    $("#code").text(lobby.code);
    $("#start-game").click(() => gameInitializer.startGame());
  });

}

// DEBUG CODE
const DebugGenerator: QuestionGenerator = {
  generate(): Question {
    switch (Math.floor(Math.random() * 3)) {
    case 0: {
      const answer = Math.floor(Math.random() * 1000);
      return new FreeformQuestion(`Test question (the answer is ${answer})`, "number", new ExactAnswer(''+answer));
    }
    case 1: {
      const answer = Math.floor(Math.random() * 4);
      const options = ['A', 'B', 'C', 'D'];
      return new MultichoiceQuestion(`Test question (the answer is ${options[answer]})`, options, answer);
    }
    case 2: {
      const answer = Util.randomSublist([0, 1, 2, 3]);
      const options = ['A', 'B', 'C', 'D'];
      let optionsDisplay = answer.map((x) => options[x]).join(', ');
      if (optionsDisplay === '') {
        optionsDisplay = '(none)';
      }
      return new SelectallQuestion(`Select all that apply (the answer is ${optionsDisplay})`, options, answer);
    }
    }
    throw "Unreachable?";
  }
};
