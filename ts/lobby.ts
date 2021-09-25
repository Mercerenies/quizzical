
import { SSE, DirectMessage, IncomingMessage } from './sse.js';
import { PlayerUUID, PeerUUID } from './uuid.js';

export const RTC_CONFIG = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

export const LOBBY_MESSAGE_TYPE = "Lobby.LOBBY_MESSAGE_TYPE";
export const ICE_MESSAGE_TYPE = "Lobby.ICE_MESSAGE_TYPE";
export const META_ERROR_MESSAGE_TYPE = "Lobby.META_ERROR_MESSAGE_TYPE";

export const DATA_CHANNEL_LABEL = "Lobby.DATA_CHANNEL_LABEL";

export enum LobbyErrorCode {
  TOO_MANY_PLAYERS = "TOO_MANY_PLAYERS",
}

export const PEER_DEBUG_LEVEL = 2;

export interface Lobby {
  readonly code: string;

  getPeerId(): PeerUUID;

  getHostId(): PlayerUUID;

  sendMessageTo(target: PlayerUUID, message: any): void;

  addListener(listener: LobbyListener): void;

  removeListener(listener: LobbyListener): boolean;

}

export interface HostLobby extends Lobby {
  readonly maxPlayers: number;

  peerExists(uuid: PlayerUUID): boolean | "disconnected";

  players(): Iterable<PlayerUUID>;

}

class LobbyAsHost implements HostLobby {
  readonly code: string;
  readonly maxPlayers: number;
  private peer: Peer;
  private connections: Map<PlayerUUID, DataConnection | null>;
  private host: PlayerUUID;
  private listeners: LobbyListener[];

  constructor(code: string, maxPlayers: number, host: PlayerUUID) {
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

  getPeerId(): PeerUUID {
    return this.peer.id as PeerUUID;
  }

  getHostId(): PlayerUUID {
    return this.host;
  }

  players(): Iterable<PlayerUUID> {
    return this.connections.keys();
  }

  playerCount(): number {
    return [...this.players()].length
  }

  peerExists(uuid: PlayerUUID): boolean | "disconnected" {
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

  private canPlayerJoin(uuid: PlayerUUID): boolean {
    if (this.peerExists(uuid)) {
      // The player had already connected at some point before. This
      // is a reconnect, so allow it.
      return true;
    } else if (this.playerCount() < this.maxPlayers) {
      // There's room for another player, so allow it.
      return true;
    } else {
      return false;
    }
  }

  private onConnection(conn: DataConnection): void {
    const uuid: PlayerUUID = conn.metadata.uuid;
    console.log("Got connection from " + uuid);

    // Make sure we have room for the player
    if (!this.canPlayerJoin(uuid)) {
      console.log("Blocking connection (not enough room)");
      conn.send({ type: META_ERROR_MESSAGE_TYPE, error: LobbyErrorCode.TOO_MANY_PLAYERS });
      conn.close();
    }

    const isReconnect = this.peerExists(uuid);

    this.connections.set(uuid, conn);
    conn.on('data', (data) => this.onMessage(uuid, data));
    conn.on('close', () => this.onConnectionClosed(conn));

    if (isReconnect) {
      this.listeners.forEach((listener) => listener.onReconnect(uuid));
    } else {
      this.listeners.forEach((listener) => listener.onConnect(uuid));
    }

  }

  private onConnectionClosed(conn: DataConnection): void {
    const uuid: PlayerUUID = conn.metadata.uuid;
    console.log("Closed connection (" + uuid + ")");
    this.connections.set(uuid, null);
    this.listeners.forEach((listener) => listener.onDisconnect(uuid));
  }

  private async handleMessage(message: IncomingMessage): Promise<void> {
    switch (message.message.type) {
      case "get-peer-id":
        const response = new DirectMessage(message.source, LOBBY_MESSAGE_TYPE, { type: "response-peer-id", id: this.getPeerId() });
        SSE.get().sendMessage(response);
        break;
    }
  }

  private onMessage(source: PlayerUUID, message: any): void {
    this.listeners.forEach((listener) => listener.onMessage(message, source));
  }

  sendMessageTo(target: PlayerUUID, message: any): void {
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

  addListener(listener: LobbyListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: LobbyListener): boolean {
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
  private host: PlayerUUID;
  private peer: Peer;
  private conn: DataConnection | undefined;
  private listeners: LobbyListener[];

  constructor(code: string, host: PlayerUUID) {
    this.code = code;
    this.host = host;
    this.peer = new Peer(undefined, { debug: PEER_DEBUG_LEVEL });
    this.conn = undefined;
    this.listeners = [];

    SSE.get().addListener(LOBBY_MESSAGE_TYPE, (message) => this.handleMessage(message));
    this.peer.on("open", async () => await this.tryToConnect());

  }

  getPeerId(): PeerUUID {
    return this.peer.id as PeerUUID;
  }

  getHostId(): PlayerUUID {
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
    this.listeners.forEach((listener) => listener.onMessage(message, this.host));
  }

  sendMessageTo(target: PlayerUUID, message: any): void {
    if (target != this.getHostId()) {
      // There is only one valid target ID: the host
      throw `Invalid message target ${target}`;
    }
    if (this.conn === undefined) {
      throw "Attempt to send message before connection is established";
    }
    this.conn.send(message);
  }

  addListener(listener: LobbyListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: LobbyListener): boolean {
    let index = this.listeners.findIndex(function(x) { return x == listener; });
    if (index >= 0) {
      this.listeners.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

}

export interface LobbyListener {

  // This event fires on all lobby types
  onMessage(message: any, source: PlayerUUID): void;

  // These events only fire for the host of the lobby
  onConnect(player: PlayerUUID): void;
  onDisconnect(player: PlayerUUID): void;
  onReconnect(player: PlayerUUID): void;

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
