
import { RemoteControlDisplayRegistrar, RemoteControlJoinedDisplay } from './display.js';
import { RemoteControlInfoDisplay } from '../question/info_question.js';
import { RemoteControlFreeformDisplay } from '../question/freeform_question.js';
import { RemoteControlMultichoiceDisplay } from '../question/multichoice_question.js';

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
