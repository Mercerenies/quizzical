
import { SSE, DirectMessage, IncomingMessage } from './sse.js';

export const RTC_CONFIG = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]};

export const LOBBY_MESSAGE_TYPE = "Lobby.LOBBY_MESSAGE_TYPE";
export const ICE_MESSAGE_TYPE = "Lobby.ICE_MESSAGE_TYPE";

export const DATA_CHANNEL_LABEL = "Lobby.DATA_CHANNEL_LABEL";

export interface Lobby {
  readonly code: string;
}

class LobbyAsHost implements Lobby {
  readonly code: string;
  private sse: SSE;
  private rtcConnections: Map<string, RTCPeerConnection>;

  constructor(code: string, sse: SSE) {
    this.code = code;
    this.sse = sse;
    this.rtcConnections = new Map();
  }

  async handleMessage(message: IncomingMessage): Promise<void> {
    const data = message.message;
    switch (data.type) {
      case 'sdp':
        console.log("Got SDP offer");
        const sdp = data.offer;

        const newRTC = new RTCPeerConnection(RTC_CONFIG);
        await newRTC.setRemoteDescription(sdp);
        const answer = await newRTC.createAnswer();
        await newRTC.setLocalDescription(answer);

        this.rtcConnections.set(message.source, newRTC);
        setupIceListener(message.source, this.sse, newRTC, true);

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
  private host: string;

  constructor(code: string, sse: SSE, host: string) {
    this.code = code;
    this.sse = sse;
    this.rtc = new RTCPeerConnection(RTC_CONFIG);
    this.host = host;
  }

  async tryToConnect(): Promise<void> {

    const offer = await this.rtc.createOffer();
    await this.rtc.setLocalDescription(offer);

    const offerMessage = new DirectMessage(this.host, LOBBY_MESSAGE_TYPE, { type: 'sdp', offer: offer });
    await this.sse.sendMessage(offerMessage);

    setupIceListener(this.host, this.sse, this.rtc, false);

  }

  async handleMessage(message: IncomingMessage): Promise<void> {
    const data = message.message;
    console.log("Got SDP answer");
    await this.rtc.setRemoteDescription(data.answer);
  }

}

async function setupIceListener(target: string, sse: SSE, rtc: RTCPeerConnection, isHost: boolean): Promise<void> {
  rtc.addEventListener('datachannel', (event) => {
    console.log("Got data channel");
  });
  if (isHost) {
    const channel = rtc.createDataChannel(DATA_CHANNEL_LABEL);
    console.log(channel);
  }

  rtc.addEventListener('icecandidate', function(event) {
    console.log(event);
    if (event.candidate) {
      const message = new DirectMessage(target, ICE_MESSAGE_TYPE, event.candidate);
      sse.sendMessage(message);
    }
  });

  sse.addListener(ICE_MESSAGE_TYPE, async function(message) {
    console.log(`Got ICE candidate ${message.message}`);
    try {
      await rtc.addIceCandidate(message.message);
    } catch (e) {
      console.log(`Error adding received ICE candidate: ${e}`);
    }
  });

  rtc.addEventListener('connectionstatechange', (event) => {
    if (rtc.connectionState === 'connected') {
      console.log("Connected!");
    }
  });
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
  const pingResult = await $.get(`/ping?code=${code}`);

  const sse = SSE.get();
  const lobby = new LobbyAsGuest(code, sse, pingResult.target);

  sse.addListener(LOBBY_MESSAGE_TYPE, (message) => lobby.handleMessage(message));
  await lobby.tryToConnect();

  return lobby;
}
