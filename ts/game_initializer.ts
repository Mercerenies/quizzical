
import { HostLobby } from './lobby.js';
import { PlayerListUpdater } from './game_initializer/player_list_updater.js';
import { ActiveScreen } from './active_screen.js';
import { updateHeader } from './game_play_page.js';

export const DEFAULT_MAX_PLAYERS = 4;

/**
 * An instance of this class manages the initial setup of a new game,
 * from the host's perspective.
 */
export class GameInitializer {
  readonly lobby: HostLobby;
  private updater: PlayerListUpdater;
  private activeScreen: ActiveScreen;

  constructor(params: GameInitializerParams) {
    this.lobby = params.lobby;
    this.updater = new PlayerListUpdater(this.lobby, params.playerListDOM);
    this.activeScreen = new ActiveScreen(this.lobby);

    this.lobby.addListener(this.updater);
    this.updater.update();

  }

  /**
   * @return whether or not the parameters are right to start the game
   */
  canStartGame(): boolean {
    return (this.lobby.playerCount > 0);
  }

  /**
   * Starts the game proper.
   */
  async startGame(): Promise<void> {
    if (!this.canStartGame()) {
      return;
    }

    this.lobby.startGame();
    console.log("Starting game...");

    const newPage = $(await $.get('/game/play'));
    $("main").replaceWith(newPage);
    updateHeader(this.lobby, $("main"));

  }

}

/**
 * Type of argument to GameInitializer constructor.
 */
export interface GameInitializerParams {
  lobby: HostLobby;
  playerListDOM: JQuery<HTMLElement>;
}
