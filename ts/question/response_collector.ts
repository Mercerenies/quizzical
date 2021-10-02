
import { QuestionResponse, QUESTION_RESPONSE_MESSAGE_TYPE } from '../question.js';
import { SignalHandler } from '../signal.js';
import { LobbyMessage } from '../lobby/listener.js';
import { PlayerUUID, RCID } from '../uuid.js';

/**
 * A ResponseCollector collects question responses (messages of type
 * QUESTION_RESPONSE_MESSAGE_TYPE) from lobby guests. This class
 * manages all of the checks to make sure the guest is sending an
 * up-to-date response (for the current question) and for purging old
 * responses when they become outdated.
 */
export class ResponseCollector implements SignalHandler<LobbyMessage> {
  readonly messageType: string = QUESTION_RESPONSE_MESSAGE_TYPE;
  private collectedResponses: Map<PlayerUUID, QuestionResponse>;
  private screen: HasActiveRCID;
  private lastKnownRCID: RCID;

  /**
   * Constructs a ResponseCollector, which will query the given screen
   * object for the current RCID. Only responses whose RCID matches
   * the currently active RCID will be accepted.
   */
  constructor(screen: HasActiveRCID) {
    this.collectedResponses = new Map();
    this.screen = screen;
    this.lastKnownRCID = screen.getActiveRCID();
  }

  private purgeIfNeeded() {
    const currentRCID = this.screen.getActiveRCID();
    if (this.lastKnownRCID != currentRCID) {
      this.lastKnownRCID = currentRCID;
      this.collectedResponses.clear();
    }
  }

  handle(message: LobbyMessage): void {
    this.purgeIfNeeded();

    const player = message.source;
    const response = message.message as QuestionResponse;

    if (response.rcId == this.lastKnownRCID) {
      this.collectedResponses.set(player, response);
    } else {
      console.warn(`Got invalid question response ${response}, expecting RCID ${this.lastKnownRCID}`);
    }
  }

}

/**
 * A type that can provide RCID identifiers to ResponseCollector. Note
 * that {@link ActiveScreen} is a good common implementor for this
 * interface.
 */
export interface HasActiveRCID {
  getActiveRCID(): RCID;
}
