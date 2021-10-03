
import { LFSR } from '../lfsr.js';
import { RCID } from '../uuid.js';
import { RemoteControlMessage, RemoteControlJoinedMessage, RemoteControlInfoMessage } from '../remote_control.js';

let _pageGenerator: RCPageGenerator | null = null;

/**
 * A singleton helper for constructing RemoteControlMessage objects
 * (or subtypes thereof).
 */
export class RCPageGenerator {
  private lfsr: LFSR;
  private joinedID: RCID;

  constructor() {
    this.lfsr = new LFSR();
    this.joinedID = this.generateID();
  }

  generateID(): RCID {
    return this.lfsr.generate() as RCID;
  }

  createPage<T extends RemoteControlMessage>(builder: RemoteControlMessageBuilder<T>): T {
    const id = this.generateID();
    return builder(id);
  }

  joinedPage(): RemoteControlJoinedMessage {
    // Note: The joined page gets a unique ID globally, since it will
    // never require any feedback and is generated in several
    // different places in the code.
    return {
      rcType: "joined",
      rcId: this.joinedID,
      rcParams: {},
    };
  }

  static get(): RCPageGenerator {
    if (!_pageGenerator) {
      _pageGenerator = new RCPageGenerator();
    }
    return _pageGenerator;
  }

}

/**
 * A RemoteControlMessageBuilder is a RemoteControlMessage which is
 * missing its RCID. RCPageGenerator uses this interface to construct
 * instances of RemoteControlMessage.
 */
export interface RemoteControlMessageBuilder<T extends RemoteControlMessage> {
  (rcid: RCID): T;
}

export function infoPage(info: string): RemoteControlMessageBuilder<RemoteControlInfoMessage> {
  return (rcid: RCID) => ({
    rcType: "info",
    rcId: rcid,
    rcParams: { info },
  });
}
