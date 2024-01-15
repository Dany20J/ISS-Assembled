"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationHandler = void 0;
const websocket_info_manager_1 = require("../websocket_manager/websocket_info_manager");
class AuthenticationHandler {
    constructor(_messageDestinationHandler) {
        this._messageDestinationHandler = _messageDestinationHandler;
    }
    async handle(message) {
        switch (message.data.event) {
            case 'signOut': {
                let authenticator = websocket_info_manager_1.WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId);
                if (authenticator !== undefined) {
                    authenticator.disableAuthentication();
                }
                let data = {};
                data.successful = true;
                data.event = message.data.event;
                this._messageDestinationHandler.handle({ data: data, socketId: message.socketId });
                break;
            }
        }
    }
}
exports.AuthenticationHandler = AuthenticationHandler;
