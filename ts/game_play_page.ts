
/**
 * Helper functions for manage /game/play, the page shown in-game by
 * the host of the lobby.
 *
 * @module game_play_page
 */

import { HostLobby } from './lobby.js';
import { ConnectedPlayer } from './lobby/connected_player.js';

/**
 * Updates the header bar containing the players' information.
 */
export function updateHeader(lobby: HostLobby, page: JQuery<HTMLElement>): void {
  const header = page.find("#player-status-header");

  header.html('');

  const cells = lobby.players.map(playerHeader);
  header.html(cells.join(''));

}

export function playerHeader(player: ConnectedPlayer): string {
  return `
    <div class="col-sm">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">${player.playerName}</h5>
        </div>
      </div>
    </div>
  `;
}
