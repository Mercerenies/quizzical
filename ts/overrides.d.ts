
import * as _Peer from 'peerjs';

declare global {
  type Peer = _Peer;
  const Peer: typeof _Peer;
}
