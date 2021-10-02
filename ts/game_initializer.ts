
import { HostLobby } from './lobby.js';
import { PlayerListUpdater } from './game_initializer/player_list_updater.js';
import { ActiveScreen } from './active_screen.js';
import { Game } from './game.js';

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
   * Starts the game proper. If canStartGame is false, this returns
   * undefined. If canStartGame is true, this initializes a Game
   * object, begins the game, and returns the Game object.
   *
   * After a successful call to this function, the GameInitializer
   * automatically unregisters all of its lobby listeners and should
   * generally no longer be used.
   */
  async startGame(): Promise<Game | undefined> {
    if (!this.canStartGame()) {
      return;
    }

    this.lobby.removeListener(this.updater);

    const game = new Game({
      lobby: this.lobby,
      activeScreen: this.activeScreen,
    });
    await game.begin();
    return game;

  }

}

/**
 * Type of argument to GameInitializer constructor.
 */
export interface GameInitializerParams {
  lobby: HostLobby;
  playerListDOM: JQuery<HTMLElement>;
}
