
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

export abstract class Lobby {
  private code: string;
  private listeners: LobbyListener[];

  constructor(code: string) {
    this.code = code;
    this.listeners = [];
  }

  getCode(): string {
    return this.code;
  }

  abstract getPeerId(): PeerUUID;
  abstract getHostId(): PlayerUUID;
  abstract getSelfId(): PlayerUUID;

  abstract sendMessageTo(target: PlayerUUID, message: LobbyMessage): void;

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

  protected dispatchOnListeners(func: (listener: LobbyListener) => void): void {
    this.listeners.forEach(func);
  }

}

export interface LobbyMessage {
  readonly source: PlayerUUID;
  readonly messageType: string;
  readonly message: any;
}

export class HostLobby extends Lobby {
  private maxPlayersCount: number;
  private peer: Peer;
  private connections: Map<PlayerUUID, DataConnection | null>;
  private host: PlayerUUID;
  private gameStarted: boolean;

  constructor(code: string, maxPlayers: number, host: PlayerUUID) {
    super(code);
    this.peer = new Peer(undefined, { debug: PEER_DEBUG_LEVEL });
    this.connections = new Map();
    this.host = host;
    this.maxPlayersCount = maxPlayers;
    this.gameStarted = false;

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

  getSelfId(): PlayerUUID {
    return this.host;
  }

  players(): Iterable<PlayerUUID> {
    return this.connections.keys();
  }

  playerCount(): number {
    return [...this.players()].length
  }

  maxPlayers(): number {
    return this.maxPlayersCount;
  }

  hasGameStarted(): boolean {
    return this.gameStarted;
  }

  startGame(): void {
    this.gameStarted = true;
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
    } else if ((this.playerCount() < this.maxPlayers()) && (!this.hasGameStarted())) {
      // There's room for a new player and the game hasn't started
      // yet, so allow it. (TODO Some games might allow late arrivals?)
      return true;
    } else {
      return false;
    }
  }

  private onConnection(conn: DataConnection): void {
    const uuid: PlayerUUID = conn.metadata.uuid;

    // Make sure we have room for the player
    if (!this.canPlayerJoin(uuid)) {
      console.log("Blocking connection (not enough room)");
      conn.send({ type: META_ERROR_MESSAGE_TYPE, error: LobbyErrorCode.TOO_MANY_PLAYERS }); ////
      conn.close();
    }

    const isReconnect = this.peerExists(uuid);

    this.connections.set(uuid, conn);
    conn.on('data', (data) => this.onMessage(uuid, data));
    conn.on('close', () => this.onConnectionClosed(conn));

    if (isReconnect) {
      this.dispatchOnListeners((listener) => listener.onReconnect(uuid));
    } else {
      this.dispatchOnListeners((listener) => listener.onConnect(uuid));
    }

  }

  private onConnectionClosed(conn: DataConnection): void {
    const uuid: PlayerUUID = conn.metadata.uuid;
    console.log("Closed connection (" + uuid + ")");
    if (this.hasGameStarted()) {
      // Persist the connection so the client can reconnect
      this.connections.set(uuid, null);
    } else {
      // Remove them from the system
      this.connections.delete(uuid);
    }
    this.dispatchOnListeners((listener) => listener.onDisconnect(uuid));
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
    this.dispatchOnListeners((listener) => listener.onMessage(message, source));
  }

  sendMessageTo(target: PlayerUUID, message: LobbyMessage): void {
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

}

export class GuestLobby extends Lobby {
  private host: PlayerUUID;
  private selfId: PlayerUUID;
  private peer: Peer;
  private conn: DataConnection | undefined;

  constructor(code: string, host: PlayerUUID, selfId: PlayerUUID) {
    super(code);
    this.host = host;
    this.selfId = selfId;
    this.peer = new Peer(undefined, { debug: PEER_DEBUG_LEVEL });
    this.conn = undefined;

    SSE.get().addListener(LOBBY_MESSAGE_TYPE, (message) => this.handleMessage(message));
    this.peer.on("open", async () => await this.tryToConnect());

  }

  getPeerId(): PeerUUID {
    return this.peer.id as PeerUUID;
  }

  getHostId(): PlayerUUID {
    return this.host;
  }

  getSelfId(): PlayerUUID {
    return this.selfId;
  }

  private async tryToConnect(): Promise<void> {
    await SSE.get().sendMessage(new DirectMessage(this.host, LOBBY_MESSAGE_TYPE, { type: 'get-peer-id' }));
  }

  private async handleMessage(message: IncomingMessage): Promise<void> {
    switch (message.message.type) {
      case "response-peer-id":
        const selfId = this.selfId;
        const peerId = message.message.id;
        console.log("Got peer ID " + peerId);
        const metadata = { uuid: selfId };
        const conn = this.peer.connect(peerId, { metadata: metadata });
        conn.on('open', () => {
          console.log("Got connection");
          this.conn = conn;
          conn.on('data', (data) => this.onMessage(data));
          this.dispatchOnListeners((listener) => listener.onConnect(this.getHostId()));
        });
        break;
    }
  }

  private onMessage(message: any): void {
    this.dispatchOnListeners((listener) => listener.onMessage(message, this.host));
  }

  sendMessageTo(target: PlayerUUID, message: LobbyMessage): void {
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

export interface LobbyListener {

  // This event fires on all lobby types
  onMessage(message: LobbyMessage, source: PlayerUUID): void;
  onConnect(player: PlayerUUID): void;

  // These events only fire for the host of the lobby
  onDisconnect(player: PlayerUUID): void;
  onReconnect(player: PlayerUUID): void;

}

export class AbstractLobbyListener implements LobbyListener {
  onMessage(message: LobbyMessage, source: PlayerUUID): void {}
  onConnect(player: PlayerUUID): void {}
  onDisconnect(player: PlayerUUID): void {}
  onReconnect(player: PlayerUUID): void {}
}

export async function hostLobby(maxPlayers: number): Promise<HostLobby> {
  const listenResult = await $.get('/listen');
  const host = await $.get('/whoami');
  const code = listenResult.code;
  const lobby = new HostLobby(code, maxPlayers, host);

  return lobby;
}

export async function joinLobby(code: string): Promise<GuestLobby> {
  const pingResult = await $.get(`/ping?code=${code}`);
  const selfId = await $.get('/whoami');
  const lobby = new GuestLobby(code, pingResult.target, selfId);

  return lobby;
}
