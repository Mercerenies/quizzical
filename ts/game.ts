
import { HostLobby } from './lobby.js';
import { updateHeader } from './game_play_page.js';
import { ActiveScreen } from './active_screen.js';
import { ResponseCollector } from './question/response_collector.js';
import { Question, NullQuestion } from './question.js';
import { FreeformQuestion } from './question/freeform_question.js';

/**
 * The primary manager for the game, from the perspective of the host
 * of a lobby. Generally, this object is constructed after a
 * successful call to GameInitializer.startGame.
 *
 * Only one Game should ever exist for a given HostLobby.
 */
export class Game {
  readonly lobby: HostLobby;
  private activeScreen: ActiveScreen;
  private responseCollector: ResponseCollector;
  private activeQuestion: Question;

  /**
   * A Game is constructed from a lobby. The lobby should not have had
   * its game initiated yet (i.e. HostLobby.startGame should *not*
   * have been called yet).
   */
  constructor(params: GameParams) {
    this.lobby = params.lobby;
    this.activeScreen = params.activeScreen;
    this.responseCollector = new ResponseCollector(this.activeScreen);

    this.lobby.dispatcher.connect(this.responseCollector);

    this.activeQuestion = new NullQuestion();
    this.question = this.activeQuestion; // Update question data
  }

  get question(): Question {
    return this.activeQuestion;
  }

  set question(question: Question) {
    this.activeQuestion = question;

    // Display host-side info
    const displayable = question.getDisplayable();
    displayable.display($("#game-row"));

    // Send guest-side info
    const rcMessage = question.makeRCMessage();
    this.activeScreen.screen = rcMessage;

  }

  /**
   * This method should be called once on a Game to initialize the GUI
   * and the internal lobby parameters for the game.
   */
  async begin(): Promise<void> {
    this.lobby.startGame();

    const newPage = $(await $.get('/game/play'));
    $("main").replaceWith(newPage);
    updateHeader(this.lobby, $("main"));

    // DEBUG CODE
    this.question = new FreeformQuestion("Test question", "number");

  }

}

/**
 * Parameters to the constructor of Game.
 */
export interface GameParams {
  lobby: HostLobby;
  activeScreen: ActiveScreen;
}
