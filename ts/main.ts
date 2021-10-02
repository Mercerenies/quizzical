
/**
 * Setup behavior for the "new game" page.
 *
 * @module main
 */

import { hostLobby, HostLobby } from './lobby.js';
import { DebugLobbyListener } from './lobby/debug_listener.js';
import { updateHeader } from './game_play_page.js';
import { ActiveScreen } from './active_screen.js';
import { DEFAULT_MAX_PLAYERS } from './game_initializer.js';
import { PlayerListUpdater } from './game_initializer/player_list_updater.js';

async function startGame(lobby: HostLobby): Promise<void> {
  if (lobby.playerCount > 0) {
    lobby.startGame();
    console.log("Starting game...");

    const newPage = $(await $.get('/game/play'));
    $("main").replaceWith(newPage);
    updateHeader(lobby, $("main"));

  }
}

/**
 * Set up the game page. Should be called once after the page is
 * loaded.
 */
export function setupNewGame(): void {

  hostLobby(DEFAULT_MAX_PLAYERS).then((lobby) => {
    const updater = new PlayerListUpdater(lobby, $("#player-list"));
    const _activeScreen = new ActiveScreen(lobby);

    lobby.addListener(new DebugLobbyListener());
    lobby.addListener(updater);

    updater.update();
    $("#code").text(lobby.code);

    $("#start-game").click(() => startGame(lobby));

  });

}
