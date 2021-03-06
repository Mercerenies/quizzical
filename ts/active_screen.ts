
import { HostLobby } from './lobby.js';
import { RemoteControlMessage, REMOTE_CONTROL_MESSAGE_TYPE } from './remote_control.js';
import { RCPageGenerator } from './remote_control/page_generator.js';
import { PlayerUUID, RCID } from './uuid.js';
import { HasActiveRCID } from './question/response_collector.js';
import { SignalHandler } from './signal.js';

/**
 * An instance of ActiveScreen keeps track of a RemoteControlMessage
 * object. Whenever a new guest connects to the lobby *or* an existing
 * guest reconnects, the active message will be sent to them.
 */
export class ActiveScreen implements HasActiveRCID {
  private listener: InitialSendListener;
  private _screen: RemoteControlMessage;
  private lobby: HostLobby;
  private enabled: boolean = false;

  /**
   * Constructs an ActiveScreen which listens on the given lobby. An
   * ActiveScreen starts out enabled, which means it registers the
   * necessary listeners in the lobby to be able to update clients
   * immediately.
   */
  constructor(lobby: HostLobby) {
    this.lobby = lobby;
    this.listener = new InitialSendListener(this);

    this.enable();

    this._screen = RCPageGenerator.get().joinedPage();
    this.sendUpdateToAll();

  }

  getActiveRCID(): RCID {
    return this.screen.rcId;
  }

  /**
   * Returns whether the ActiveScreen object is enabled. Only one
   * ActiveScreen should be enabled for a given lobby at a time.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enables the ActiveScreen.
   */
  enable(): void {
    if (!this.enabled) {
      this.lobby.connected.connect(this.listener);
      this.lobby.reconnected.connect(this.listener);
      this.enabled = true;
    }
  }

  /**
   * Disables the ActiveScreen.
   */
  disable(): void {
    if (this.enabled) {
      this.lobby.reconnected.disconnect(this.listener);
      this.lobby.reconnected.disconnect(this.listener);
      this.enabled = false;
    }
  }

  /**
   * Gets the currently displayed screen.
   */
  get screen(): RemoteControlMessage {
    return this._screen;
  }

  /**
   * Sets the currently displayed screen.
   */
  set screen(value: RemoteControlMessage) {
    this._screen = value;
    this.sendUpdateToAll();
  }

  /**
   * Sends the currently displayed screen to the player with the given
   * ID. This is called automatically when a player connects.
   */
  sendUpdateTo(player: PlayerUUID): void {
    const message = this.lobby.newMessage(REMOTE_CONTROL_MESSAGE_TYPE, this.screen);
    this.lobby.sendMessageTo(player, message);
  }

  /**
   * Sends the currently displayed screen to all connected players.
   * This is called automatically when the active screen changes.
   */
  sendUpdateToAll(): void {
    for (const player of this.lobby.players) {
      this.sendUpdateTo(player.uuid);
    }
  }

}

class InitialSendListener implements SignalHandler<PlayerUUID> {
  private updater: { sendUpdateTo(player: PlayerUUID): void };

  constructor(updater: { sendUpdateTo(player: PlayerUUID): void }) {
    this.updater = updater;
  }

  handle(player: PlayerUUID): void {
    this.updater.sendUpdateTo(player);
  }


}
