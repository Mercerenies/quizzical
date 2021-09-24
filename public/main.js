
export const RTC_CONFIG = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}

export function setupNewGame() {
  window.gameSSE = new EventSource('/listen');
  window.gameSSE.addEventListener('message', async function(event) {
    const data = JSON.parse(event.data);
    switch (data.type) {
    case 'code':
      $("#code").text(data.code);
      break;
    case 'message':
      console.log(data.message);
      break;
    case 'sdp':
      console.log("Got SDP offer");
      let sdp = JSON.parse(data.sdp);

      window.newRTC = new RTCPeerConnection(RTC_CONFIG);
      window.newRTC.setRemoteDescription(sdp);
      const answer = await window.newRTC.createAnswer();
      await window.newRTC.setLocalDescription(answer);
      await $.post('/response', JSON.stringify({ answer: answer, uuid: data.request_uuid }));

      break;
    }
  });
}

export async function pingWithCode() {
  const text = $("#code").val();
  const result = await $.get(`/ping?code=${text}`);
  console.log(result);

  const peerConnection = new RTCPeerConnection(RTC_CONFIG);
  window.clientSSE = new EventSource('/await');
  window.clientSSE.addEventListener('message', async function(event) {
    const data = JSON.parse(event.data);
    console.log("Got SDP answer");
    await peerConnection.setRemoteDescription(data.answer);
  });
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  await $.post('/offer', JSON.stringify(offer));
}

export function setupConnectPage() {
  $("#submit").click(pingWithCode);
}

$(function() {
  console.log("Ready!");
})
