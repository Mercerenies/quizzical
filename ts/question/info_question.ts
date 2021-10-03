
/**
 * An "info" page is not technically a "question" in the formal sense,
 * but in keeping with the symmetry of the other question modules, we
 * have a module representing the "info" page.
 *
 * @module question/info_question
 */

import { RemoteControlMessageBuilder } from '../remote_control/page_generator.js';
import { RemoteControlInfoMessage } from '../remote_control.js';
import { RCID } from '../uuid.js';

// TODO Displayable for info page

export function infoPage(info: string): RemoteControlMessageBuilder<RemoteControlInfoMessage> {
  return (rcid: RCID) => ({
    rcType: "info",
    rcId: rcid,
    rcParams: { info },
  });
}
