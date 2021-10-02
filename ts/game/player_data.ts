
import { PlayerUUID } from '../uuid.js';
import { Signal, SignalHandler } from '../signal.js';

export class PlayerDataMap {
  private map: Map<PlayerUUID, PlayerData>;
  readonly updated: Signal<PlayerData> = new Signal();

  constructor(players: Iterable<[PlayerUUID, string]>) {
    this.map = new Map();

    for (const [uuid, name] of players) {
      const data = new PlayerData(uuid, name);
      this.map.set(uuid, data);
      data.updated.connect(SignalHandler(() => this.updated.dispatch(data)));
    }

  }

  get(player: PlayerUUID): PlayerData {
    const data = this.map.get(player);
    if (data === undefined) {
      throw `Invalid player UUID ${player}`;
    }
    return data;
  }

  [Symbol.iterator](): Iterator<PlayerData> {
    return this.map.values()[Symbol.iterator]();
  }

}

export class PlayerData {
  readonly uuid: PlayerUUID;
  readonly name: string;
  readonly updated: Signal<undefined> = new Signal();
  private _score: number = 0;

  constructor(uuid: PlayerUUID, name: string) {
    this.uuid = uuid;
    this.name = name;
  }

  get score(): number {
    return this._score;
  }

  set score(value: number) {
    this._score = value;
    this.updated.dispatch(undefined);
  }

}
