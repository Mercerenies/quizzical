
import { SSE, DirectMessage, IncomingMessage } from './sse.js';
import { PlayerUUID, PeerUUID } from './uuid.js';
import { MessageDispatcher } from './message_dispatcher.js';
import { LobbyListener, LobbyMessage } from './lobby/listener.js';
import { ConnectedPlayer } from './lobby/connected_player.js';
import { RemoteControlMessage, RCPageGenerator, REMOTE_CONTROL_MESSAGE_TYPE } from './remote_control.js';

export const RTC_CONFIG = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

export const LOBBY_MESSAGE_TYPE = "Lobby.LOBBY_MESSAGE_TYPE";
export const ICE_MESSAGE_TYPE = "Lobby.ICE_MESSAGE_TYPE";
export const META_MESSAGE_TYPE = "Lobby.META_MESSAGE_TYPE";

export const DATA_CHANNEL_LABEL = "Lobby.DATA_CHANNEL_LABEL";

export enum LobbyErrorCode {
  OK = "OK",
  TOO_MANY_PLAYERS = "TOO_MANY_PLAYERS",
  INVALID_NAME = "INVALID_NAME",
}

export const PEER_DEBUG_LEVEL = 2;

export abstract class Lobby {
  protected peer: Peer;
  readonly code: string;
  readonly hostId: PlayerUUID;
  abstract readonly selfId: PlayerUUID;
  private listeners: LobbyListener[];
  readonly dispatcher: MessageDispatcher;

  constructor(code: string, host: PlayerUUID) {
    this.code = code;
    this.hostId = host;
    this.listeners = [];
    this.dispatcher = new MessageDispatcher();
    this.peer = new Peer(undefined, { debug: PEER_DEBUG_LEVEL });
    this.addListener(this.dispatcher);
  }

  get peerId(): PeerUUID {
    return this.peer.id as PeerUUID;
  }

  newMessage(messageType: string, payload: any): LobbyMessage {
    return {
      source: this.selfId,
      messageType: messageType,
      message: payload,
    };
  }

  abstract sendMessageTo(target: PlayerUUID, message: LobbyMessage): void;
  abstract sendMessageToAll(message: LobbyMessage): void;

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

export class HostLobby extends Lobby {
  readonly maxPlayers: number;
  private connections: Map<PlayerUUID, ConnectedPlayer | null>;
  private gameStarted: boolean;

  constructor(code: string, maxPlayers: number, host: PlayerUUID) {
    super(code, host);
    this.connections = new Map();
    this.maxPlayers = maxPlayers;
    this.gameStarted = false;

    SSE.get().addListener(LOBBY_MESSAGE_TYPE, (message) => this.handleMessage(message));

    this.peer.on('open', () => {
      console.log("Peer setup at " + this.peerId);
      this.peer.on('connection', (conn) => this.onConnection(conn));
    });

  }

  get selfId(): PlayerUUID {
    return this.hostId;
  }

  get players(): ConnectedPlayer[] {
    const players = [];
    for (const playerInfo of this.connections.values()) {
      if (playerInfo !== null) {
        players.push(playerInfo);
      }
    }
    return players;
  }

  get playerCount(): number {
    return [...this.players].length
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
    } else if ((this.playerCount < this.maxPlayers) && (!this.hasGameStarted())) {
      // There's room for a new player and the game hasn't started
      // yet, so allow it. (TODO Some games might allow late arrivals?)
      return true;
    } else {
      return false;
    }
  }

  private onConnection(conn: DataConnection): void {
    const metadata: InitMetadata = conn.metadata;
    const uuid: PlayerUUID = metadata.uuid;

    // Validate the player's parameters
    if ((metadata.playerName.length < 1) || (metadata.playerName.length > 15)) {
      console.log("Player attempted to join with invalid name (blocking)");
      this.destroyConnectionWithError(conn, LobbyErrorCode.INVALID_NAME);
      return;
    }

    // Make sure we have room for the player
    if (!this.canPlayerJoin(uuid)) {
      console.log("Blocking connection (not enough room)");
      this.destroyConnectionWithError(conn, LobbyErrorCode.TOO_MANY_PLAYERS);
      return;
    }

    const isReconnect = this.peerExists(uuid);

    this.connections.set(uuid, new ConnectedPlayer(uuid, metadata.playerName, conn));
    conn.on('data', (data) => this.onMessage(uuid, data));
    conn.on('close', () => this.onConnectionClosed(conn));

    // Give the other side a second to set up comms
    window.setTimeout(() => {
      if (isReconnect) {
        this.dispatchOnListeners((listener) => listener.onReconnect(uuid));
      } else {
        this.dispatchOnListeners((listener) => listener.onConnect(uuid));
      }

      conn.send(this.newMessage(META_MESSAGE_TYPE, new MetaMessage('success', LobbyErrorCode.OK)));

      const joinedDisplay: RemoteControlMessage = RCPageGenerator.get().joinedPage();
      conn.send(this.newMessage(REMOTE_CONTROL_MESSAGE_TYPE, joinedDisplay));

    }, 0);

  }

  private destroyConnectionWithError(conn: DataConnection, error: LobbyErrorCode) {
    // Give the other side a second to set up comms
    window.setTimeout(() => {
      conn.send(this.newMessage(META_MESSAGE_TYPE, new MetaMessage('error', error)));
      window.setTimeout(() => {
        conn.close();
      }, 0);
    }, 0);
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
        const response = new DirectMessage(message.source, LOBBY_MESSAGE_TYPE, { type: "response-peer-id", id: this.peerId });
        SSE.get().sendMessage(response);
        break;
    }
  }

  private onMessage(source: PlayerUUID, message: LobbyMessage): void {
    // Ensure that the source attribute is correct.
    let newMessage = {
      source: source,
      messageType: message.messageType,
      message: message.message,
    };
    this.dispatchOnListeners((listener) => listener.onMessage(newMessage));
  }

  sendMessageTo(target: PlayerUUID, message: LobbyMessage): void {
    const player = this.connections.get(target);
    if (player === undefined) {
      // There is no one with that UUID, so it's an error.
      throw `Invalid message target ${target}`;
    }
    if (player === null) {
      // There is someone with that UUID, but they've disconnected.
      // Just suppress the message for now.
      return;
    }
    player.conn.send(message);
  }

  sendMessageToAll(message: LobbyMessage): void {
    for (const player of this.players) {
      this.sendMessageTo(player.uuid, message);
    }
  }

}

export class GuestLobby extends Lobby {
  readonly selfId: PlayerUUID;
  private conn: DataConnection | undefined;
  readonly playerName: string;

  constructor(code: string, host: PlayerUUID, selfId: PlayerUUID, playerName: string) {
    super(code, host);
    this.conn = undefined;
    this.selfId = selfId;
    this.playerName = playerName;

    SSE.get().addListener(LOBBY_MESSAGE_TYPE, (message) => this.handleMessage(message));
    this.peer.on('open', async () => await this.tryToConnect());

  }

  private async tryToConnect(): Promise<void> {
    await SSE.get().sendMessage(new DirectMessage(this.hostId, LOBBY_MESSAGE_TYPE, { type: 'get-peer-id' }));
  }

  private async handleMessage(message: IncomingMessage): Promise<void> {
    switch (message.message.type) {
      case "response-peer-id":
        const selfId = this.selfId;
        const peerId = message.message.id;
        console.log("Got peer ID " + peerId);
        const metadata: InitMetadata = { uuid: selfId, playerName: this.playerName };
        const conn = this.peer.connect(peerId, { metadata: metadata });
        conn.on('open', () => {
          console.log("Got connection");
          this.conn = conn;
          conn.on('data', (data) => this.onMessage(data));
          this.dispatchOnListeners((listener) => listener.onConnect(this.hostId));
        });
        break;
    }
  }

  private onMessage(message: LobbyMessage): void {
    // Ensure that the source attribute is correct.
    let newMessage = {
      source: this.hostId,
      messageType: message.messageType,
      message: message.message,
    };
    this.dispatchOnListeners((listener) => listener.onMessage(newMessage));
  }

  sendMessageTo(target: PlayerUUID, message: LobbyMessage): void {
    if (target != this.hostId) {
      // There is only one valid target ID: the host
      throw `Invalid message target ${target}`;
    }
    if (this.conn === undefined) {
      throw "Attempt to send message before connection is established";
    }
    this.conn.send(message);
  }

  sendMessageToAll(message: LobbyMessage): void {
    this.sendMessageTo(this.hostId, message);
  }

}

// The type of LobbyMessages with messageType META_MESSAGE_TYPE.
export class MetaMessage {
  result: 'success' | 'error';
  error: LobbyErrorCode;

  constructor(result: 'success' | 'error', error: LobbyErrorCode) {
    this.result = result;
    this.error = error;
  }

}

// The initial metadata sent when establishing a peerjs connection.
export interface InitMetadata {
  uuid: PlayerUUID,
  playerName: string,
}

export async function hostLobby(maxPlayers: number): Promise<HostLobby> {
  const listenResult = await $.get('/listen');
  const host = await $.get('/whoami');
  const code = listenResult.code;
  const lobby = new HostLobby(code, maxPlayers, host);

  return lobby;
}

export async function joinLobby(code: string, playerName: string): Promise<GuestLobby | undefined> {
  const target = await tryPing(code);
  if (target === undefined) {
    return undefined;
  }

  const selfId = await $.get('/whoami');
  const lobby = new GuestLobby(code, target, selfId, playerName);

  return lobby;
}

async function tryPing(code: string): Promise<PlayerUUID | undefined> {
  let pingResult: any;
  try {
    pingResult = await $.get(`/ping?code=${code}`);
  } catch {
    return undefined;
  }
  return pingResult.target;
}
