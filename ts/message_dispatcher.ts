
// Higher-level interface to use on top of an existing Lobby object.

import { PlayerUUID } from './uuid.js';
import { AbstractLobbyListener, LobbyMessage } from './lobby.js';

export class MessageDispatcher extends AbstractLobbyListener {


  onMessage(message: LobbyMessage, source: PlayerUUID): void {
    
  }

}



/////
