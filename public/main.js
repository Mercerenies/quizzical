
import { SSE, DirectMessage } from '/sse.js';

export const RTC_CONFIG = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}

export async function setupNewGame() {
  const newGameResult = await $.get('/listen');
  const code = newGameResult.code;
  $("#code").text(code);

  window.gameSSE = new SSE();
  window.gameSSE.addListener(async function(message) {
    const data = message.message;
    switch (data.type) {
    case 'sdp':
      console.log("Got SDP offer");
      let sdp = data.offer;

      window.newRTC = new RTCPeerConnection(RTC_CONFIG);
      window.newRTC.setRemoteDescription(sdp);
      const answer = await window.newRTC.createAnswer();
      await window.newRTC.setLocalDescription(answer);

      const response = new DirectMessage(message.source, { answer: answer });
      await window.gameSSE.sendMessage(response);

      break;
    }
  });
}

export async function pingWithCode() {
  const text = $("#code").val();
  const result = await $.get(`/ping?code=${text}`);
  console.log(result);

  const peerConnection = new RTCPeerConnection(RTC_CONFIG);
  window.clientSSE = new SSE();
  window.clientSSE.addListener(async function(message) {
    const data = message.message;
    console.log("Got SDP answer");
    await peerConnection.setRemoteDescription(data.answer);
  });
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  const response = new DirectMessage(result.target, { type: 'sdp', offer: offer });
  await window.clientSSE.sendMessage(response);
}

export function setupConnectPage() {
  $("#submit").click(pingWithCode);
}

$(function() {
  console.log("Ready!");
})
