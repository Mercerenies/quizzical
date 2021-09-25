
import { SSE, DirectMessage } from './sse.js';
import { RTC_CONFIG, LOBBY_MESSAGE_TYPE, hostLobby, joinLobby } from './lobby.js';

export async function setupNewGame(): Promise<void> {
  const lobby = await hostLobby();
  $("#code").text(lobby.code);
}

export async function pingWithCode(): Promise<void> {
  const code = $("#code").val();
  if (!(typeof(code) === 'string')) {
    throw `Bad lobby code ${code}`;
  }
  const lobby = await joinLobby(code);
}

export function setupConnectPage(): void {
  $("#submit").click(pingWithCode);
}

$(function() {
  console.log("Ready!");
})
