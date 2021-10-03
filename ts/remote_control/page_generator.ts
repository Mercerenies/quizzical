
import { LFSR } from '../lfsr.js';
import { RCID } from '../uuid.js';
import { RemoteControlJoinedMessage, RemoteControlInfoMessage, RemoteControlFreeformMessage, RemoteControlMultichoiceMessage } from '../remote_control.js';

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

  infoPage(info: string): RemoteControlInfoMessage {
    return {
      rcType: "info",
      rcId: this.generateID(),
      rcParams: { info: info },
    };
  }

  freeformPage(questionText: string, answerType: "number" | "text"): RemoteControlFreeformMessage {
    return {
      rcType: "freeform",
      rcId: this.generateID(),
      rcParams: { questionText, answerType },
    };
  }

  multichoicePage(questionText: string, answerChoices: string[]): RemoteControlMultichoiceMessage {
    return {
      rcType: "multichoice",
      rcId: this.generateID(),
      rcParams: { questionText, answerChoices },
    };
  }

  static get(): RCPageGenerator {
    if (!_pageGenerator) {
      _pageGenerator = new RCPageGenerator();
    }
    return _pageGenerator;
  }

}
