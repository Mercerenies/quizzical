
// Manages the interfaces that can appear on screen on a client, as
// instructed by the server.

import { GuestLobby } from './lobby.js';

export class RemoteControlDisplay {
  readonly page: JQuery<HTMLElement>;

  constructor(page: JQuery<HTMLElement>) {
    this.page = page;
  }

  // Set up the parameters on the page from the lobby.
  initialize(lobby: GuestLobby) {
    this.page.find("#player-name").text(lobby.playerName);
    this.page.find("#game-code").text(lobby.code);
  }

}
