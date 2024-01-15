"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketsStateHandler = void 0;
class SocketsStateHandler {
    constructor() {
        this._listeners = [];
    }
    handle(socketStateHandler) {
        let message = {
            authenticationInfo: socketStateHandler.authenticationInfo,
            socketId: socketStateHandler.socketId,
            data: {
                "event": "state",
                "state": socketStateHandler.state
            }
        };
        for (const listener of this._listeners) {
            listener.handle(message);
        }
    }
    addListener(listener) {
        this._listeners.push(listener);
    }
}
exports.SocketsStateHandler = SocketsStateHandler;
