
import * as _Peer from 'peerjs';
import * as _marked from 'marked';
import * as _DOMPurify from 'dompurify';

declare global {

  type Peer = _Peer;
  type DataConnection = _Peer.DataConnection;
  const Peer: typeof _Peer;

  const marked: typeof _marked;
  const DOMPurify: typeof _DOMPurify;

}
