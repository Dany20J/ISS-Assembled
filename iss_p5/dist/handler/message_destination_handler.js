"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageDestinationHandler = void 0;
const websocket_info_manager_1 = require("../websocket_manager/websocket_info_manager");
class MessageDestinationHandler {
    async handle(message) {
        let websocketConnection = websocket_info_manager_1.WebsocketInfoManager.getInstance().getWebsocketConnectionBySocketId(message.socketId);
        let authenticator = websocket_info_manager_1.WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId);
        console.log("before signing", message.data);
        await authenticator?.handleOnGoing(message);
        console.log("after signing", message.data);
        websocketConnection?.send(message.data);
    }
}
exports.MessageDestinationHandler = MessageDestinationHandler;
