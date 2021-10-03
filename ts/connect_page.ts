
/**
 * Setup behavior for the "connect to game" page.
 * @module connect_page
 */

import { setupDebugListener } from './lobby/debug_listener.js';
import { LobbyMessage } from './lobby/listener.js';
import { META_MESSAGE_TYPE, GuestLobby, joinLobby, MetaMessage } from './lobby.js';
import { RemoteControlListener } from './remote_control.js';
import * as Util from './util.js';
import { SignalHandler } from './signal.js';
import { initializeRCDisplays } from './remote_control/initializer.js';

class ConnectStatusUpdater implements SignalHandler<LobbyMessage> {
  readonly messageType: string = META_MESSAGE_TYPE;
  private statusField: JQuery<HTMLElement>;
  private lobby: GuestLobby;

  constructor(statusField: JQuery<HTMLElement>, lobby: GuestLobby) {
    this.statusField = statusField;
    this.lobby = lobby;
  }

  handle(message: LobbyMessage): void {
    const payload = message.message as MetaMessage;
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

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function unsetFeedbackMessage(): void {
  $("#alert-feedback").html('');
}

function setFeedbackMessage(alertClass: string, message: string): void {
  $("#alert-feedback").html(`
    <div class="alert ${alertClass}">${message}</div>
  `);
}

// TODO Put a timeout on connection attempt, or find some other way to
// make sure the error message gets from host to guest when attempting
// connection.
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
    setFeedbackMessage('alert-info', "Connecting...");
    const lobby = await joinLobby(code.toUpperCase(), playerName);
    if (lobby === undefined) {
      throw new PingError(`There is no lobby with code ${code.toUpperCase()}`);
    }
    initListeners(lobby);
  } catch (e) {
    if (e instanceof PingError) {
      setFeedbackMessage('alert-danger', e.message);
    } else {
      throw e;
    }
  }
}

function initListeners(lobby: GuestLobby): void {
  setupDebugListener(lobby);
  lobby.dispatcher.connect(new ConnectStatusUpdater($("#connection-status"), lobby)); // TODO Remove this
  lobby.dispatcher.connect(new RemoteControlListener(lobby));
}

/**
 * Set up the connect page. Should be called once after the page is
 * loaded.
 */
export function setupConnectPage(): void {
  initializeRCDisplays();
  $("#submit").click(pingWithCode);
  $("#connection-status").html("Not connected");
  Util.enterToButton($("#code, #player-name"), $("#submit"));
}
