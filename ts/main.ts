
import { SSE, DirectMessage } from './sse.js';
import { RTC_CONFIG, LOBBY_MESSAGE_TYPE,
         hostLobby, HostLobby } from './lobby.js';
import { LobbyListener, AbstractLobbyListener, LobbyMessage } from './lobby/listener.js';
import { DebugLobbyListener } from './debug_lobby_listener.js';

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
    const players = [...this.lobby.players];
    for (let index = 0; index < this.lobby.maxPlayers; index++) {
      let child: JQuery<HTMLElement>;
      if (index < players.length) {
        child = $(`<li>${players[index]}</li>`);
      } else {
        child = $("<li>(Empty)</li>");
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
}

$(function() {
  console.log("Ready!");
})
