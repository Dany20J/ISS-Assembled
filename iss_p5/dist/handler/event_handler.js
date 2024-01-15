"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventHandler = void 0;
class EventHandler {
    constructor(messageToHandler) {
        this._messageToHandler = messageToHandler;
    }
    handle(message) {
        if (message.data.hasOwnProperty('event')) {
            if (this._messageToHandler.has(message.data.event))
                for (const messageHandler of this._messageToHandler.get(message.data.event))
                    messageHandler.handle(message);
        }
    }
}
exports.EventHandler = EventHandler;
