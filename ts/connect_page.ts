
import { MessageListener } from './message_dispatcher.js';
import { DebugLobbyListener } from './debug_lobby_listener.js';
import { LobbyMessage } from './lobby/listener.js';
import { META_MESSAGE_TYPE, joinLobby, MetaMessage } from './lobby.js';

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

class PingError {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

}

async function pingWithCode(): Promise<void> {
  try {
    const code = $("#code").val();
    if (!(typeof(code) === 'string')) {
      throw new PingError(`Malformed lobby code ${code}`);
    }
    if (code.length != 4) {
      throw new PingError(`Malformed lobby code ${code.toUpperCase()}`);
    }
    const lobby = await joinLobby(code.toUpperCase());
    if (lobby === undefined) {
      throw new PingError(`There is no lobby with code ${code.toUpperCase()}`);
    }
    lobby.addListener(new DebugLobbyListener());
    lobby.dispatcher.addListener(new ConnectStatusUpdater($("#connection-status")));
  } catch (e) {
    if (e instanceof PingError) {
      alert(e.message);
    } else {
      throw e;
    }
  }
}

export function setupConnectPage(): void {
  $("#submit").click(pingWithCode);
  $("#connection-status").html("Not connected");
}
