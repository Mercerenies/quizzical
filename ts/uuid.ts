
// Newtype wrapper for strings which represent player UUIDs. This is
// the UUID constructed by the Rack cookie pool, NOT the peerjs UUID.
export type PlayerUUID = string & { readonly __tag: unique symbol };

// Newtype wrapper for peerjs UUIDs.
export type PeerUUID = string & { readonly __tag: unique symbol };
