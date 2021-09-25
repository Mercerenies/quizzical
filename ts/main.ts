
import { SSE, DirectMessage } from './sse.js';
import { RTC_CONFIG, LOBBY_MESSAGE_TYPE, hostLobby, joinLobby } from './lobby.js';

const DEFAULT_MAX_PLAYERS = 4;

export async function setupNewGame(): Promise<void> {
  const lobby = await hostLobby(DEFAULT_MAX_PLAYERS);
  $("#code").text(lobby.code);
}

export async function pingWithCode(): Promise<void> {
  const code = $("#code").val();
  if ((!(typeof(code) === 'string')) || (code.length != 4)) {
    throw `Bad lobby code ${code}`;
  }
  const lobby = await joinLobby(code.toUpperCase());
}

export function setupConnectPage(): void {
  $("#submit").click(pingWithCode);
}

$(function() {
  console.log("Ready!");
})
