
// Just a test file for temporary use.
//
// DEBUG CODE

import { RCPageGenerator } from './remote_control/page_generator.js';
import { RemoteControlMessage } from './remote_control.js';
import { RemoteControlDisplayRegistrar } from './remote_control/display.js';
import { initializeRCDisplays } from './remote_control/initializer.js';
import { GuestLobby } from './lobby.js';
import { infoPage } from './question/info_question.js';
import { freeformPage } from './question/freeform_question.js';
import { multichoicePage } from './question/multichoice_question.js';
import { selectallPage } from './question/selectall_question.js';

export async function setupRCPage(): Promise<void> {
  initializeRCDisplays();
  await setupJoined();
  await setupInfo();
  await setupFreeform();
  await setupMultichoice();
  await setupSelectall();
}

async function setupJoined(): Promise<void> {
  const joinMessage = RCPageGenerator.get().joinedPage();
  await establishPage(joinMessage, $("#joined-banner"));
}

async function setupInfo(): Promise<void> {
  const infoMessage = RCPageGenerator.get().createPage(infoPage("**Bold test** and some $$latex^2$$"));
  await establishPage(infoMessage, $("#info-banner"));
}

async function setupFreeform(): Promise<void> {
  const freeformMessage = RCPageGenerator.get().createPage(freeformPage("This is an example question: $x^2$", "text"));
  await establishPage(freeformMessage, $("#freeform-banner"));
}

async function setupMultichoice(): Promise<void> {
  const multichoiceMessage = RCPageGenerator.get().createPage(multichoicePage("Multiple Choice *Example Question*", ["Answer 1", "Answer 2", "Answer 3"]));
  await establishPage(multichoiceMessage, $("#multichoice-banner"));
}

async function setupSelectall(): Promise<void> {
  const selectallMessage = RCPageGenerator.get().createPage(selectallPage("*(Select all that apply)*", ["Answer 1", "Answer 2", "Answer 3"]));
  await establishPage(selectallMessage, $("#selectall-banner"));
}

async function establishPage(payload: RemoteControlMessage, replacement: JQuery<HTMLElement>): Promise<void> {
  const display = RemoteControlDisplayRegistrar.get().createDisplay(payload);
  const page = await $.get(display.httpGetTarget);
  const jPage = $(page);
  await display.initialize({ playerName: "Test Player Name", code: "XXXX" } as GuestLobby, jPage); // Just for testing :)
  replacement.replaceWith(jPage);
}
