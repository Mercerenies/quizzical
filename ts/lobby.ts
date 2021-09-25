
import { SSE, DirectMessage, IncomingMessage } from './sse.js';

export const RTC_CONFIG = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

export const LOBBY_MESSAGE_TYPE = "Lobby.LOBBY_MESSAGE_TYPE";

export interface Lobby {
  readonly code: string;
}

class LobbyAsHost implements Lobby {
  readonly code: string;
  private sse: SSE;

  constructor(code: string, sse: SSE) {
    this.code = code;
    this.sse = sse;
  }

  async handleMessage(message: IncomingMessage): Promise<void> {
    const data = message.message;
    switch (data.type) {
      case 'sdp':
        console.log("Got SDP offer");
        const sdp = data.offer;

        const newRTC = new RTCPeerConnection(RTC_CONFIG);
        newRTC.setRemoteDescription(sdp);
        const answer = await newRTC.createAnswer();
        await newRTC.setLocalDescription(answer);

        const response = new DirectMessage(message.source, LOBBY_MESSAGE_TYPE, { answer: answer });
        await this.sse.sendMessage(response);

        break;
    }
  }

}

class LobbyAsGuest implements Lobby {
  readonly code: string;
  private sse: SSE;
  private rtc: RTCPeerConnection;

  constructor(code: string, sse: SSE) {
    this.code = code;
    this.sse = sse;
    this.rtc = new RTCPeerConnection(RTC_CONFIG);
  }

  async tryToConnect(): Promise<void> {
    const pingResult = await $.get(`/ping?code=${this.code}`);

    const offer = await this.rtc.createOffer();
    await this.rtc.setLocalDescription(offer);

    const offerMessage = new DirectMessage(pingResult.target, LOBBY_MESSAGE_TYPE, { type: 'sdp', offer: offer });
    await this.sse.sendMessage(offerMessage);
  }

  async handleMessage(message: IncomingMessage): Promise<void> {
    const data = message.message;
    console.log("Got SDP answer");
    await this.rtc.setRemoteDescription(data.answer);
  }

}

export async function hostLobby(): Promise<Lobby> {
  const listenResult = await $.get('/listen');
  const code = listenResult.code;
  const sse = SSE.get();
  const lobby = new LobbyAsHost(code, SSE.get());

  sse.addListener(LOBBY_MESSAGE_TYPE, (message) => lobby.handleMessage(message));

  return lobby;
}

export async function joinLobby(code: string): Promise<Lobby> {
  const sse = SSE.get();
  const lobby = new LobbyAsGuest(code, sse);

  sse.addListener(LOBBY_MESSAGE_TYPE, (message) => lobby.handleMessage(message));
  await lobby.tryToConnect();

  return lobby;
}
