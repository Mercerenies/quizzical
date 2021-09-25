
import { SSE, DirectMessage } from './sse.js';
import { RTC_CONFIG } from './lobby.js';

export async function setupNewGame(): Promise<void> {
  const newGameResult = await $.get('/listen');
  const code = newGameResult.code;
  $("#code").text(code);

  const gameSSE = SSE.get();
  gameSSE.addListener('TMP', async function(message) {
    const data = message.message;
    switch (data.type) {
    case 'sdp':
      console.log("Got SDP offer");
      let sdp = data.offer;

      const newRTC = new RTCPeerConnection(RTC_CONFIG);
      newRTC.setRemoteDescription(sdp);
      const answer = await newRTC.createAnswer();
      await newRTC.setLocalDescription(answer);

      const response = new DirectMessage(message.source, 'TMP', { answer: answer });
      await gameSSE.sendMessage(response);

      break;
    }
  });
}

export async function pingWithCode(): Promise<void> {
  const text = $("#code").val();
  const result = await $.get(`/ping?code=${text}`);
  console.log(result);

  const peerConnection = new RTCPeerConnection(RTC_CONFIG);
  const clientSSE = SSE.get();
  clientSSE.addListener('TMP', async function(message) {
    const data = message.message;
    console.log("Got SDP answer");
    await peerConnection.setRemoteDescription(data.answer);
  });
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  const response = new DirectMessage(result.target, 'TMP', { type: 'sdp', offer: offer });
  await clientSSE.sendMessage(response);
}

export function setupConnectPage(): void {
  $("#submit").click(pingWithCode);
}

$(function() {
  console.log("Ready!");
})
