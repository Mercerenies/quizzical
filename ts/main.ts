
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
import { ExactAnswer } from './question/answer.js';

/**
 * Set up the game page. Should be called once after the page is
 * loaded.
 */
export function setupNewGame(): void {

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
    const answer = Math.floor(Math.random() * 1000);
    return new FreeformQuestion(`Test question (the answer is ${answer})`, "number", new ExactAnswer(''+answer));
  }
};
