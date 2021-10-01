
/**
 * Setup behavior for the "new game" page.
 * @module main
 */

import { SSE, DirectMessage } from './sse.js';
import { RTC_CONFIG, LOBBY_MESSAGE_TYPE,
         hostLobby, HostLobby } from './lobby.js';
import { LobbyListener, AbstractLobbyListener, LobbyMessage } from './lobby/listener.js';
import { DebugLobbyListener } from './lobby/debug_listener.js';
import { REMOTE_CONTROL_MESSAGE_TYPE, RCPageGenerator, RemoteControlMessage } from './remote_control.js';
import { PlayerUUID } from './uuid.js';

const DEFAULT_MAX_PLAYERS = 4;

let _rc: RemoteControlMessage = RCPageGenerator.get().joinedPage();

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
  }

}

class RCInitialSender extends AbstractLobbyListener {
  private lobby: HostLobby;

  constructor(lobby: HostLobby) {
    super();
    this.lobby = lobby;
  }

  onConnect(player: PlayerUUID): void {
    this.sendUpdateTo(player);
  }

  onReconnect(player: PlayerUUID): void {
    this.sendUpdateTo(player);
  }

  sendUpdateTo(player: PlayerUUID): void {
    const message = this.lobby.newMessage(REMOTE_CONTROL_MESSAGE_TYPE, _rc);
    this.lobby.sendMessageTo(player, message);
  }

}

function setRC(lobby: HostLobby, payload: RemoteControlMessage): void {
  _rc = payload;
  lobby.sendMessageToAll(lobby.newMessage(REMOTE_CONTROL_MESSAGE_TYPE, payload));
}

/**
 * Set up the game page. Should be called once after the page is
 * loaded.
 */
export async function setupNewGame(): Promise<void> {
  const lobby = await hostLobby(DEFAULT_MAX_PLAYERS);
  const updater = new PlayerListUpdater(lobby, $("#player-list"));
  const initSender = new RCInitialSender(lobby);

  lobby.addListener(new DebugLobbyListener());
  lobby.addListener(updater);
  lobby.addListener(initSender);

  updater.update();
  $("#code").text(lobby.code);

  $("#send-info-message").click(() => {
    const info = $("#info-message").val() as string;
    const payload = RCPageGenerator.get().infoPage(info);
    setRC(lobby, payload);
  });

}

$(function() {
  console.log("Ready!");
})
