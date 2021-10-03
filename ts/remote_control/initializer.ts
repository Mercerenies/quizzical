
import { RemoteControlDisplayRegistrar, RemoteControlJoinedDisplay, RemoteControlInfoDisplay, RemoteControlFreeformDisplay, RemoteControlMultichoiceDisplay } from './display.js';

/**
 * Initializes the RemoteControlDisplayRegistrar singleton with the
 * default set of RC classes.
 */
export function initializeRCDisplays(): void {
  const registrar = RemoteControlDisplayRegistrar.get();

  registrar.register('joined', RemoteControlJoinedDisplay);
  registrar.register('info', RemoteControlInfoDisplay);
  registrar.register('freeform', RemoteControlFreeformDisplay);
  registrar.register('multichoice', RemoteControlMultichoiceDisplay);

}
