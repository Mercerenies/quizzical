var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let _sseSingleton = null;
export class SSE {
    constructor() {
        this.listeners = new Map();
        this.sse = new EventSource('/sse/listen');
        this.sse.addEventListener('message', (event) => {
            const data = IncomingMessage.fromJSON(JSON.parse(event.data));
            this.onMessage(data);
        });
    }
    addListener(messageType, listener) {
        let listenerList = this.listeners.get(messageType);
        if (listenerList === undefined) {
            listenerList = [];
            this.listeners.set(messageType, listenerList);
        }
        listenerList.push(listener);
    }
    onMessage(data) {
        (this.listeners.get(data.messageType) || []).forEach(function (listener) { listener(data); });
    }
    sendMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const target = message.postTarget();
            yield $.post(target, JSON.stringify(message));
        });
    }
    static get() {
        if (!_sseSingleton) {
            _sseSingleton = new SSE();
        }
        return _sseSingleton;
    }
}
export class DirectMessage {
    constructor(target, messageType, message) {
        this.target = target;
        this.messageType = messageType;
        this.message = message;
    }
    toJSON() {
        return {
            target: this.target,
            messageType: this.messageType,
            message: this.message,
        };
    }
    postTarget() {
        return "/sse/send";
    }
}
export class BroadcastMessage {
    constructor(messageType, message) {
        this.messageType = messageType;
        this.message = message;
    }
    toJSON() {
        return {
            messageType: this.messageType,
            message: this.message,
        };
    }
    postTarget() {
        return "/sse/broadcast";
    }
}
export class IncomingMessage {
    constructor(source, messageType, message) {
        this.source = source;
        this.messageType = messageType;
        this.message = message;
    }
    static fromJSON(json) {
        return new IncomingMessage(json.source, json.messageType, json.message);
    }
}
