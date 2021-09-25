
import { SSE, DirectMessage, IncomingMessage } from './sse.js';

export const RTC_CONFIG = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

export const LOBBY_MESSAGE_TYPE = "Lobby.LOBBY_MESSAGE_TYPE";
export const ICE_MESSAGE_TYPE = "Lobby.ICE_MESSAGE_TYPE";

export const DATA_CHANNEL_LABEL = "Lobby.DATA_CHANNEL_LABEL";

export const PEER_DEBUG_LEVEL = 2;

export interface Lobby {
  readonly code: string;
}

class LobbyAsHost implements Lobby {
  readonly code: string;
  private peer: Peer;
  private sse: SSE; // TODO Get rid of this (it's a singleton)
  private connections: Map<string, DataConnection>;

  constructor(code: string, sse: SSE) {
    this.code = code;
    this.peer = new Peer(undefined, { debug: PEER_DEBUG_LEVEL });
    this.sse = sse;
    this.connections = new Map();

    this.sse.addListener(LOBBY_MESSAGE_TYPE, (message) => this.handleMessage(message));

    this.peer.on('open', () => {
      console.log("Peer setup at " + this.getPeerId());
      this.peer.on('connection', (conn) => {
        console.log("Got connection from " + conn.metadata.uuid);
        this.connections.set(conn.metadata.uuid, conn);
        conn.on('data', (data) => {
          console.log(`Received ${data}`);
        });
        setTimeout(() => conn.send("Pong"), 3000);
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
  private conn: DataConnection | undefined;

  constructor(code: string, sse: SSE, host: string) {
    this.code = code;
    this.sse = sse;
    this.host = host;
    this.peer = new Peer(undefined, { debug: PEER_DEBUG_LEVEL });
    this.conn = undefined;

    this.sse.addListener(LOBBY_MESSAGE_TYPE, (message) => this.handleMessage(message));
    this.peer.on("open", async () => await this.tryToConnect());

  }

  async tryToConnect(): Promise<void> {
    await this.sse.sendMessage(new DirectMessage(this.host, LOBBY_MESSAGE_TYPE, { type: 'get-peer-id' }));
  }

  async handleMessage(message: IncomingMessage): Promise<void> {
    switch (message.message.type) {
      case "response-peer-id":
        const selfId = await $.get('/whoami');
        const peerId = message.message.id;
        console.log("Got peer ID " + peerId);
        const metadata = { uuid: selfId };
        const conn = this.peer.connect(peerId, { metadata: metadata });
        conn.on('open', () => {
          console.log("Got connection");
          this.conn = conn;
          conn.on('data', (data) => {
            console.log(`Received ${data}`);
          });
          setTimeout(() => conn.send("Ping"), 3000);
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

  return lobby;
}
