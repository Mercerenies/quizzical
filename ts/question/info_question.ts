
/**
 * An "info" page is not technically a "question" in the formal sense,
 * but in keeping with the symmetry of the other question modules, we
 * have a module representing the "info" page.
 *
 * @module question/info_question
 */

import { RemoteControlMessageBuilder } from '../remote_control/page_generator.js';
import { RemoteControlDisplay } from '../remote_control/display.js';
import { RemoteControlMessage } from '../remote_control.js';
import { RCID } from '../uuid.js';
import { GuestLobby } from '../lobby.js';
import { render } from '../renderer.js';

// TODO Displayable for info page

export function infoPage(info: string): RemoteControlMessageBuilder<RemoteControlInfoMessage> {
  return (rcid: RCID) => ({
    rcType: "info",
    rcId: rcid,
    rcParams: { info },
  });
}

/**
 * A RemoteControlDisplay for the "info" RC type.
 */
export class RemoteControlInfoDisplay extends RemoteControlDisplay {
  readonly rcType: string = "info";
  readonly httpGetTarget: string = "/rc/info";

  async initialize(lobby: GuestLobby, page: JQuery<HTMLElement>): Promise<void> {
    await super.initialize(lobby, page);
    const payload = this.payload as RemoteControlInfoMessage;
    const info = payload.rcParams.info;
    const mdInfo = await render(info);
    page.find("#informational-message").html(mdInfo);
  }

}

/**
 * A message for an "info" display.
 */
export interface RemoteControlInfoMessage extends RemoteControlMessage {
  rcType: "info";
  rcParams: { info: string };
}
