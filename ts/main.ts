
/**
 * Setup behavior for the "new game" page.
 *
 * @module main
 */

import { hostLobby } from './lobby.js';
import { setupDebugListener } from './lobby/debug_listener.js';
import { DEFAULT_MAX_PLAYERS } from './game_initializer.js';
import { GameInitializer } from './game_initializer.js';

/**
 * Set up the game page. Should be called once after the page is
 * loaded.
 */
export function setupNewGame(): void {

  hostLobby(DEFAULT_MAX_PLAYERS).then((lobby) => {
    const gameInitializer = new GameInitializer({
      lobby: lobby,
      playerListDOM: $("#player-list"),
    });
    setupDebugListener(gameInitializer.lobby);
    $("#code").text(lobby.code);
    $("#start-game").click(() => gameInitializer.startGame());
  });

}
