
/**
 * Setup behavior for the "new game" page.
 *
 * @module main
 */

import { SSE, DirectMessage } from './sse.js';
import { RTC_CONFIG, LOBBY_MESSAGE_TYPE,
         hostLobby, HostLobby } from './lobby.js';
import { LobbyListener, AbstractLobbyListener, LobbyMessage } from './lobby/listener.js';
import { DebugLobbyListener } from './lobby/debug_listener.js';
import { REMOTE_CONTROL_MESSAGE_TYPE, RCPageGenerator, RemoteControlMessage } from './remote_control.js';
import { PlayerUUID } from './uuid.js';
import * as Util from './util.js';
import { updateHeader } from './game_play_page.js';
import { ActiveScreen } from './active_screen.js';

const DEFAULT_MAX_PLAYERS = 4;

class PlayerListUpdater extends AbstractLobbyListener {
  private lobby: HostLobby;
  private playerList: JQuery<HTMLElement>

  constructor(lobby: HostLobby, playerList: JQuery<HTMLElement>) {
    super();
    this.lobby = lobby;
    this.playerList = playerList;
  }

  onConnect(): void {
    this.update();
  }

  onDisconnect(): void {
    this.update();
  }

  onReconnect(): void {
    this.update();
  }

  update(): void {
    this.playerList.empty();
    const players = this.lobby.players;
    for (let index = 0; index < this.lobby.maxPlayers; index++) {
      let child: JQuery<HTMLElement>;
      if (index < players.length) {
        child = $(`<li class="list-group-item">${players[index].playerName}</li>`);
      } else {
        child = $('<li class="list-group-item">(Empty)</li>');
      }
      this.playerList.append(child);
    }
    Util.setButtonEnabled($("#start-game"), players.length > 0);
  }

}

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
    const activeScreen = new ActiveScreen(lobby);

    lobby.addListener(new DebugLobbyListener());
    lobby.addListener(updater);

    updater.update();
    $("#code").text(lobby.code);

    $("#start-game").click(() => startGame(lobby));

  });

}
