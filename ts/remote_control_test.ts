
// Just a test file for temporary use.
//
// DEBUG CODE

import { RemoteControlDisplay, RCPageGenerator, RemoteControlMessage, RC_TRANSLATION } from './remote_control.js';

export async function setupRCPage(): Promise<void> {
  await setupJoined();
  await setupInfo();
  await setupFreeform();
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
  const freeformMessage = RCPageGenerator.get().freeformPage("This is an example question: $x^2$");
  await establishPage(freeformMessage, $("#freeform-banner"));
}

async function establishPage(payload: RemoteControlMessage, replacement: JQuery<HTMLElement>): Promise<void> {
  const page = await $.get(RC_TRANSLATION[payload.rcType]);
  const display = RemoteControlDisplay.createFrom(payload, $(page));
  display.initialize({ playerName: "Test Player Name", code: "XXXX" } as any); // Just for testing :)
  replacement.replaceWith(display.page);
}
