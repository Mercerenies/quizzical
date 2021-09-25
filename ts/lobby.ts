
import { SSE, DirectMessage, IncomingMessage } from './sse.js';

export const RTC_CONFIG = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

export const LOBBY_MESSAGE_TYPE = "Lobby.LOBBY_MESSAGE_TYPE";
export const ICE_MESSAGE_TYPE = "Lobby.ICE_MESSAGE_TYPE";

export const DATA_CHANNEL_LABEL = "Lobby.DATA_CHANNEL_LABEL";

export interface Lobby {
  readonly code: string;
}

class LobbyAsHost implements Lobby {
  readonly code: string;
  private peer: Peer;
  private sse: SSE; // TODO Get rid of this (it's a singleton)

  constructor(code: string, sse: SSE) {
    this.code = code;
    this.peer = new Peer();
    this.sse = sse;

    this.sse.addListener(LOBBY_MESSAGE_TYPE, (message) => this.handleMessage(message));

    this.peer.on('open', () => {
      console.log("Peer setup at " + this.getPeerId());
      this.peer.on('connection', function(conn) {
        console.log("Got connection");
      });
    });

  }

  getPeerId(): string {
    return this.peer.id;
  }

  async handleMessage(message: IncomingMessage): Promise<void> {
    switch (message.message.type) {
      case "get-peer-id":
        const response = new DirectMessage(message.source, LOBBY_MESSAGE_TYPE, { type: "response-peer-id", id: this.getPeerId() });
        this.sse.sendMessage(response);
        break;
    }
  }

}

class LobbyAsGuest implements Lobby {
  readonly code: string;
  private sse: SSE;
  private host: string;
  private peer: Peer;

  constructor(code: string, sse: SSE, host: string) {
    this.code = code;
    this.sse = sse;
    this.host = host;
    this.peer = new Peer();

    this.sse.addListener(LOBBY_MESSAGE_TYPE, (message) => this.handleMessage(message));

  }

  async tryToConnect(): Promise<void> {
    await this.sse.sendMessage(new DirectMessage(this.host, LOBBY_MESSAGE_TYPE, { type: 'get-peer-id' }));
  }

  async handleMessage(message: IncomingMessage): Promise<void> {
    switch (message.message.type) {
      case "response-peer-id":
        const peerId = message.message.id;
        console.log("Got peer ID " + peerId);
        const conn = this.peer.connect(peerId);
        conn.on('open', function() {
          console.log("Got connection");
        });
        break;
    }
  }

}

export async function hostLobby(): Promise<Lobby> {
  const listenResult = await $.get('/listen');
  const code = listenResult.code;
  const lobby = new LobbyAsHost(code, SSE.get());

  return lobby;
}

export async function joinLobby(code: string): Promise<Lobby> {
  const pingResult = await $.get(`/ping?code=${code}`);
  const sse = SSE.get();
  const lobby = new LobbyAsGuest(code, sse, pingResult.target);
  await lobby.tryToConnect();

  return lobby;
}
