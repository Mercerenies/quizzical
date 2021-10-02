
import { HostLobby } from '../lobby.js';
import * as Util from '../util.js';
import { SignalHandler } from '../signal.js';

/**
 * This class manages a list in the DOM of players currently in the
 * game. A PlayerListUpdater hooked into the lobby's listener queue
 * will always update the player list whenever a player connects or
 * disconnects.
 */
export class PlayerListUpdater implements SignalHandler<unknown> {
  private lobby: HostLobby;
  private playerList: JQuery<HTMLElement>

  constructor(lobby: HostLobby, playerList: JQuery<HTMLElement>) {
    this.lobby = lobby;
    this.playerList = playerList;
  }

  handle(): void {
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
    Util.setButtonEnabled($("#start-game"), players.length > 0);
  }

}
