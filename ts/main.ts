
import { SSE, DirectMessage } from './sse.js';
import { RTC_CONFIG, LOBBY_MESSAGE_TYPE,
         hostLobby, HostLobby } from './lobby.js';
import { LobbyListener, AbstractLobbyListener, LobbyMessage } from './lobby/listener.js';
import { DebugLobbyListener } from './debug_lobby_listener.js';
import { REMOTE_CONTROL_MESSAGE_TYPE, RCPageGenerator } from './remote_control.js';

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
  }

}

export async function setupNewGame(): Promise<void> {
  const lobby = await hostLobby(DEFAULT_MAX_PLAYERS);
  const updater = new PlayerListUpdater(lobby, $("#player-list"));

  lobby.addListener(new DebugLobbyListener());
  lobby.addListener(updater);

  updater.update();
  $("#code").text(lobby.code);

  $("#send-info-message").click(() => {
    const info = $("#info-message").val() as string;
    const payload = RCPageGenerator.get().infoPage(info);
    lobby.sendMessageToAll(lobby.newMessage(REMOTE_CONTROL_MESSAGE_TYPE, payload));
  });

}

$(function() {
  console.log("Ready!");
})
