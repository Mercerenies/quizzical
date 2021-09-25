
import { SSE, DirectMessage, IncomingMessage } from './sse.js';

export const RTC_CONFIG = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

export const LOBBY_MESSAGE_TYPE = "Lobby.LOBBY_MESSAGE_TYPE";
export const ICE_MESSAGE_TYPE = "Lobby.ICE_MESSAGE_TYPE";

export const DATA_CHANNEL_LABEL = "Lobby.DATA_CHANNEL_LABEL";

export const PEER_DEBUG_LEVEL = 2;

export interface Lobby {
  readonly code: string;

  getPeerId(): string;

  getHostId(): string;

  sendMessageTo(target: string, message: any): void;

}

class LobbyAsHost implements Lobby {
  readonly code: string;
  private peer: Peer;
  private connections: Map<string, DataConnection>;
  private host: string;

  constructor(code: string, host: string) {
    this.code = code;
    this.peer = new Peer(undefined, { debug: PEER_DEBUG_LEVEL });
    this.connections = new Map();
    this.host = host;

    SSE.get().addListener(LOBBY_MESSAGE_TYPE, (message) => this.handleMessage(message));

    this.peer.on('open', () => {
      console.log("Peer setup at " + this.getPeerId());
      this.peer.on('connection', (conn) => {
        console.log("Got connection from " + conn.metadata.uuid);
        this.connections.set(conn.metadata.uuid, conn);
        conn.on('data', (data) => this.onMessage(conn.metadata.uuid, data));
      });
    });

  }

  getPeerId(): string {
    return this.peer.id;
  }

  getHostId(): string {
    return this.host;
  }

  private async handleMessage(message: IncomingMessage): Promise<void> {
    switch (message.message.type) {
      case "get-peer-id":
        const response = new DirectMessage(message.source, LOBBY_MESSAGE_TYPE, { type: "response-peer-id", id: this.getPeerId() });
        SSE.get().sendMessage(response);
        break;
    }
  }

  private onMessage(source: string, message: any): void {
    console.log(`Received ${message} from ${source}`);
  }

  sendMessageTo(target: string, message: any): void {
    const conn = this.connections.get(target);
    if (conn === undefined) {
      throw `Invalid message target ${target}`;
    }
    conn.send(message);
  }

}

class LobbyAsGuest implements Lobby {
  readonly code: string;
  private host: string;
  private peer: Peer;
  private conn: DataConnection | undefined;

  constructor(code: string, host: string) {
    this.code = code;
    this.host = host;
    this.peer = new Peer(undefined, { debug: PEER_DEBUG_LEVEL });
    this.conn = undefined;

    SSE.get().addListener(LOBBY_MESSAGE_TYPE, (message) => this.handleMessage(message));
    this.peer.on("open", async () => await this.tryToConnect());

  }

  getPeerId(): string {
    return this.peer.id;
  }

  getHostId(): string {
    return this.host;
  }

  private async tryToConnect(): Promise<void> {
    await SSE.get().sendMessage(new DirectMessage(this.host, LOBBY_MESSAGE_TYPE, { type: 'get-peer-id' }));
  }

  private async handleMessage(message: IncomingMessage): Promise<void> {
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
          conn.on('data', (data) => this.onMessage(data));
        });
        break;
    }
  }

  private onMessage(message: any): void {
    console.log(`Received ${message}`);
  }

  sendMessageTo(target: string, message: any): void {
    if (target != this.getHostId()) {
      // There is only one valid target ID: the host
      throw `Invalid message target ${target}`;
    }
    if (this.conn === undefined) {
      throw "Attempt to send message before connection is established";
    }
    this.conn.send(message);
  }

}

export async function hostLobby(): Promise<Lobby> {
  const listenResult = await $.get('/listen');
  const host = await $.get('/whoami');
  const code = listenResult.code;
  const lobby = new LobbyAsHost(code, host);

  return lobby;
}

export async function joinLobby(code: string): Promise<Lobby> {
  const pingResult = await $.get(`/ping?code=${code}`);
  const lobby = new LobbyAsGuest(code, pingResult.target);

  return lobby;
}
