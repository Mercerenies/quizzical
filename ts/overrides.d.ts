
import * as _Peer from 'peerjs';

declare global {
  type Peer = _Peer;
  type DataConnection = _Peer.DataConnection;
  const Peer: typeof _Peer;
}
