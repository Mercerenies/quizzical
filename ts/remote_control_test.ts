
// Just a test file for temporary use.
//
// DEBUG CODE

import { RCPageGenerator } from './remote_control/page_generator.js';
import { RemoteControlDisplay, RemoteControlMessage, RC_TRANSLATION } from './remote_control.js';
import { GuestLobby } from './lobby.js';

export async function setupRCPage(): Promise<void> {
  await setupJoined();
  await setupInfo();
  await setupFreeform();
  await setupMultichoice();
}

async function setupJoined(): Promise<void> {
  const joinMessage = RCPageGenerator.get().joinedPage();
  await establishPage(joinMessage, $("#joined-banner"));
}

async function setupInfo(): Promise<void> {
  const infoMessage = RCPageGenerator.get().infoPage("**Bold test** and some $$latex^2$$");
  await establishPage(infoMessage, $("#info-banner"));
}

async function setupFreeform(): Promise<void> {
  const freeformMessage = RCPageGenerator.get().freeformPage("This is an example question: $x^2$", "text");
  await establishPage(freeformMessage, $("#freeform-banner"));
}

async function setupMultichoice(): Promise<void> {
  const multichoiceMessage = RCPageGenerator.get().multichoicePage("Multiple Choice *Example Question*", ["Answer 1", "Answer 2", "Answer 3"]);
  await establishPage(multichoiceMessage, $("#multichoice-banner"));
}

async function establishPage(payload: RemoteControlMessage, replacement: JQuery<HTMLElement>): Promise<void> {
  const page = await $.get(RC_TRANSLATION[payload.rcType]);
  const display = RemoteControlDisplay.createFrom(payload, $(page));
  display.initialize({ playerName: "Test Player Name", code: "XXXX" } as GuestLobby); // Just for testing :)
  replacement.replaceWith(display.page);
}
