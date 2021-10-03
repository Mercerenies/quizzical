
import { GuestLobby } from '../lobby.js';
import { RemoteControlMessage } from '../remote_control.js';

/**
 * Any DOM element intended as the root of a remote control display
 * can be wrapped in this class, which initializes it with properties
 * specific to this game.
 */
export abstract class RemoteControlDisplay {
  readonly payload: RemoteControlMessage;
  abstract readonly rcType: string;
  abstract readonly httpGetTarget: string;

  /**
   * Constructs a raw RemoteControlDisplay.
   */
  constructor(payload: RemoteControlMessage) {
    this.payload = payload;
  }

  /**
   * Set up the parameters on the page from the lobby. Subclasses
   * frequently extend this method's functionality to provide
   * form-specific initialization.
   */
  initialize(lobby: GuestLobby, page: JQuery<HTMLElement>): void {
    page.find("#player-name").text(lobby.playerName);
    page.find("#game-code").text(lobby.code);
    page.data("rcid", this.payload.rcId);
  }

}

/**
 * A RemoteControlDisplay for the "joined" RC type.
 */
export class RemoteControlJoinedDisplay extends RemoteControlDisplay {
  readonly rcType: string = "joined";
  readonly httpGetTarget: string = "/rc/joined";
}

// TODO Feedback when question is answered

/**
 * A singleton class which manages RemoteControlDisplay subclasses for
 * different message types.
 */
export class RemoteControlDisplayRegistrar {
  private map: Map<string, RemoteControlDisplayConstructor> = new Map();

  static get(): RemoteControlDisplayRegistrar {
    if (!_registrar) {
      _registrar = new RemoteControlDisplayRegistrar();
    }
    return _registrar;
  }

  get(rcType: string): RemoteControlDisplayConstructor {
    const result = this.map.get(rcType);
    if (result === undefined) {
      throw `Invalid rcType ${rcType}`;
    }
    return result;
  }

  createDisplay(payload: RemoteControlMessage): RemoteControlDisplay {
    const cls = this.get(payload.rcType);
    return new cls(payload);
  }

  register(rcType: string, cls: RemoteControlDisplayConstructor): void {
    if (this.map.has(rcType)) {
      throw `rcType ${rcType} is already registered`;
    }
    this.map.set(rcType, cls);
  }

}

let _registrar: RemoteControlDisplayRegistrar | null = null;

export interface RemoteControlDisplayConstructor {
  new (payload: RemoteControlMessage): RemoteControlDisplay;
}
