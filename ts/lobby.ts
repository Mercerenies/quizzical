
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

  addListener(listener: PeerListener): void;

  removeListener(listener: PeerListener): boolean;

}

export interface HostLobby extends Lobby {
  readonly maxPlayers: number;

  peerExists(uuid: string): boolean | "disconnected";

  players(): Iterable<string>;

}

class LobbyAsHost implements HostLobby {
  readonly code: string;
  readonly maxPlayers: number;
  private peer: Peer;
  private connections: Map<string, DataConnection | null>;
  private host: string;
  private listeners: PeerListener[];

  constructor(code: string, maxPlayers: number, host: string) {
    this.code = code;
    this.peer = new Peer(undefined, { debug: PEER_DEBUG_LEVEL });
    this.connections = new Map();
    this.host = host;
    this.listeners = [];
    this.maxPlayers = maxPlayers;

    SSE.get().addListener(LOBBY_MESSAGE_TYPE, (message) => this.handleMessage(message));

    this.peer.on('open', () => {
      console.log("Peer setup at " + this.getPeerId());
      this.peer.on('connection', (conn) => this.onConnection(conn));
    });

  }

  getPeerId(): string {
    return this.peer.id;
  }

  getHostId(): string {
    return this.host;
  }

  players(): Iterable<string> {
    return this.connections.keys();
  }

  peerExists(uuid: string): boolean | "disconnected" {
    const conn = this.connections.get(uuid);
    if (conn === undefined) {
      // No peer exists
      return false;
    } else if (conn === null) {
      // Peer exists but is disconnected
      return "disconnected";
    } else {
      // Peer exists and is working correctly
      return true;
    }
  }

  private onConnection(conn: DataConnection): void {
    const uuid: string = conn.metadata.uuid;
    console.log("Got connection from " + uuid);
    this.connections.set(uuid, conn);
    conn.on('data', (data) => this.onMessage(uuid, data));
    conn.on('close', () => this.onConnectionClosed(conn));
  }

  private onConnectionClosed(conn: DataConnection): void {
    const uuid: string = conn.metadata.uuid;
    console.log("Closed connection (" + uuid + ")");
    this.connections.set(uuid, null);
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
    this.listeners.forEach((listener) => listener(message, source));
  }

  sendMessageTo(target: string, message: any): void {
    const conn = this.connections.get(target);
    if (conn === undefined) {
      // There is no one with that UUID, so it's an error.
      throw `Invalid message target ${target}`;
    }
    if (conn === null) {
      // There is someone with that UUID, but they've disconnected.
      // Just suppress the message for now.
      return;
    }
    conn.send(message);
  }

  addListener(listener: PeerListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: PeerListener): boolean {
    let index = this.listeners.findIndex(function(x) { return x == listener; });
    if (index >= 0) {
      this.listeners.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

}

class LobbyAsGuest implements Lobby {
  readonly code: string;
  private host: string;
  private peer: Peer;
  private conn: DataConnection | undefined;
  private listeners: PeerListener[];

  constructor(code: string, host: string) {
    this.code = code;
    this.host = host;
    this.peer = new Peer(undefined, { debug: PEER_DEBUG_LEVEL });
    this.conn = undefined;
    this.listeners = [];

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
    this.listeners.forEach((listener) => listener(message, this.host));
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

  addListener(listener: PeerListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: PeerListener): boolean {
    let index = this.listeners.findIndex(function(x) { return x == listener; });
    if (index >= 0) {
      this.listeners.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

}

export interface PeerListener {
  (message: any, source: string): void;
}

export async function hostLobby(maxPlayers: number): Promise<HostLobby> {
  const listenResult = await $.get('/listen');
  const host = await $.get('/whoami');
  const code = listenResult.code;
  const lobby = new LobbyAsHost(code, maxPlayers, host);

  return lobby;
}

export async function joinLobby(code: string): Promise<Lobby> {
  const pingResult = await $.get(`/ping?code=${code}`);
  const lobby = new LobbyAsGuest(code, pingResult.target);

  return lobby;
}
