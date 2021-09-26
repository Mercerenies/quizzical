
import { SSE, DirectMessage } from './sse.js';
import { PlayerUUID } from './uuid.js';
import { RTC_CONFIG, LOBBY_MESSAGE_TYPE, META_MESSAGE_TYPE,
         MetaMessage,
         hostLobby, joinLobby,
         HostLobby } from './lobby.js';
import { LobbyListener, AbstractLobbyListener, LobbyMessage } from './lobby/listener.js';
import { MessageListener } from './message_dispatcher.js';

const DEFAULT_MAX_PLAYERS = 4;

class DebugLobbyListener implements LobbyListener {

  onMessage(message: LobbyMessage): void {
    console.log("MESSAGE: " + JSON.stringify(message.message));
  }

  onConnect(player: PlayerUUID): void {
    console.log(`New player ${player} joined`);
  }

  onDisconnect(player: PlayerUUID): void {
    console.log(`Disconnected (${player})`);
  }

  onReconnect(player: PlayerUUID): void {
    console.log(`Rejoined (${player})`);
  }

}

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

class ConnectStatusUpdater implements MessageListener {
  readonly messageType: string = META_MESSAGE_TYPE;
  private statusField: JQuery<HTMLElement>;

  constructor(statusField: JQuery<HTMLElement>) {
    this.statusField = statusField;
  }

  onMessage(message: LobbyMessage): void {
    const payload: MetaMessage = message.message;

    if (payload.result == 'success') {
      this.statusField.html("Connected");
    } else {
      alert(`Error connecting: ${payload.error}`);
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

export async function pingWithCode(): Promise<void> {
  const code = $("#code").val();
  if ((!(typeof(code) === 'string')) || (code.length != 4)) {
    throw `Bad lobby code ${code}`;
  }
  const lobby = await joinLobby(code.toUpperCase());
  lobby.addListener(new DebugLobbyListener());
  lobby.dispatcher.addListener(new ConnectStatusUpdater($("#connection-status")));
}

export function setupConnectPage(): void {
  $("#submit").click(pingWithCode);
  $("#connection-status").html("Not connected");
}

$(function() {
  console.log("Ready!");
})
