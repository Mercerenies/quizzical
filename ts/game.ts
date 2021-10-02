
import { HostLobby } from './lobby.js';
import { updateHeader } from './game_play_page.js';
import { ActiveScreen } from './active_screen.js';
import { RCPageGenerator } from './remote_control.js';
import { ResponseCollector } from './question/response_collector.js';
import { Question } from './question.js';

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
  private activeQuestion: Question | undefined;

  /**
   * A Game is constructed from a lobby. The lobby should not have had
   * its game initiated yet (i.e. HostLobby.startGame should *not*
   * have been called yet).
   */
  constructor(params: GameParams) {
    this.lobby = params.lobby;
    this.activeScreen = params.activeScreen;
    this.responseCollector = new ResponseCollector(this.activeScreen);

    this.lobby.dispatcher.addListener(this.responseCollector);

  }

  get question(): Question | undefined {
    return this.activeQuestion;
  }

  set question(question: Question | undefined) {
    /////
    // TODO Not implemented yet
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
    this.activeScreen.screen = RCPageGenerator.get().freeformPage("Test question", "number");

  }

}

/**
 * Parameters to the constructor of Game.
 */
export interface GameParams {
  lobby: HostLobby;
  activeScreen: ActiveScreen;
}
