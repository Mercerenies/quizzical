var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SSE, DirectMessage } from './sse.js';
import { RTC_CONFIG } from './lobby.js';
export function setupNewGame() {
    return __awaiter(this, void 0, void 0, function* () {
        const newGameResult = yield $.get('/listen');
        const code = newGameResult.code;
        $("#code").text(code);
        const gameSSE = SSE.get();
        gameSSE.addListener('TMP', function (message) {
            return __awaiter(this, void 0, void 0, function* () {
                const data = message.message;
                switch (data.type) {
                    case 'sdp':
                        console.log("Got SDP offer");
                        let sdp = data.offer;
                        const newRTC = new RTCPeerConnection(RTC_CONFIG);
                        newRTC.setRemoteDescription(sdp);
                        const answer = yield newRTC.createAnswer();
                        yield newRTC.setLocalDescription(answer);
                        const response = new DirectMessage(message.source, 'TMP', { answer: answer });
                        yield gameSSE.sendMessage(response);
                        break;
                }
            });
        });
    });
}
export function pingWithCode() {
    return __awaiter(this, void 0, void 0, function* () {
        const text = $("#code").val();
        const result = yield $.get(`/ping?code=${text}`);
        console.log(result);
        const peerConnection = new RTCPeerConnection(RTC_CONFIG);
        const clientSSE = SSE.get();
        clientSSE.addListener('TMP', function (message) {
            return __awaiter(this, void 0, void 0, function* () {
                const data = message.message;
                console.log("Got SDP answer");
                yield peerConnection.setRemoteDescription(data.answer);
            });
        });
        const offer = yield peerConnection.createOffer();
        yield peerConnection.setLocalDescription(offer);
        const response = new DirectMessage(result.target, 'TMP', { type: 'sdp', offer: offer });
        yield clientSSE.sendMessage(response);
    });
}
export function setupConnectPage() {
    $("#submit").click(pingWithCode);
}
$(function () {
    console.log("Ready!");
});
