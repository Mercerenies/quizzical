
/**
 * Helper functions for manage /game/play, the page shown in-game by
 * the host of the lobby.
 *
 * @module game_play_page
 */

import { PlayerData } from './game/player_data.js';
import { Game } from './game.js';

/**
 * Updates the header bar containing the players' information.
 */
export function updateHeader(game: Game, page: JQuery<HTMLElement>): void {
  const header = page.find("#player-status-header");

  header.html('');

  const cells = [...game.players].map(playerHeader);
  header.html(cells.join(''));

}

export function playerHeader(player: PlayerData): string {
  return `
    <div class="col-sm">
      <div class="card">
        <div class="card-body">
          <h4 class="card-title">${player.name}</h4>
          <p class="card-text">${player.score}</p>
        </div>
      </div>
    </div>
  `;
}
