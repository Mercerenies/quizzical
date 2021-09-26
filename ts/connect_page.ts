
import { MessageListener } from './message_dispatcher.js';
import { DebugLobbyListener } from './debug_lobby_listener.js';
import { LobbyMessage } from './lobby/listener.js';
import { META_MESSAGE_TYPE, GuestLobby, joinLobby, MetaMessage } from './lobby.js';
import { RemoteControlListener } from './remote_control.js';

class ConnectStatusUpdater implements MessageListener {
  readonly messageType: string = META_MESSAGE_TYPE;
  private statusField: JQuery<HTMLElement>;
  private lobby: GuestLobby;

  constructor(statusField: JQuery<HTMLElement>, lobby: GuestLobby) {
    this.statusField = statusField;
    this.lobby = lobby;
  }

  onMessage(message: LobbyMessage): void {
    const payload: MetaMessage = message.message;
    if (payload.result == 'error') {
      alert(`Error connecting: ${payload.error}`);
    }
  }

}

class PingError {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

}

async function pingWithCode(): Promise<void> {
  try {
    const code = $("#code").val() as string;
    const playerName = $("#player-name").val() as string;
    if (code.length != 4) {
      throw new PingError(`Malformed lobby code ${code.toUpperCase()}`);
    }
    if (playerName.length < 1) {
      throw new PingError("Please enter your name");
    }
    const lobby = await joinLobby(code.toUpperCase(), playerName);
    if (lobby === undefined) {
      throw new PingError(`There is no lobby with code ${code.toUpperCase()}`);
    }
    initListeners(lobby);
  } catch (e) {
    if (e instanceof PingError) {
      alert(e.message);
    } else {
      throw e;
    }
  }
}

function initListeners(lobby: GuestLobby): void {
  lobby.addListener(new DebugLobbyListener());
  lobby.dispatcher.addListener(new ConnectStatusUpdater($("#connection-status"), lobby));
  lobby.dispatcher.addListener(new RemoteControlListener(lobby));
}

export function setupConnectPage(): void {
  $("#submit").click(pingWithCode);
  $("#connection-status").html("Not connected");
  $("#code, #player-name").keypress(function(e) {
    if(e.which == 13) {
      $("#submit").trigger('click');
    }
  });
}
