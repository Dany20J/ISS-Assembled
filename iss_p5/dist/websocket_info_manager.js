"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketInfoManager = void 0;
const websocket_connection_1 = require("./websocket/websocket_connection");
class WebsocketInfoManager {
    constructor(messageHandler, socketStateHandler) {
        this._socketIdToWebsocketConnection = new Map();
        this._socketIdToAuthenticator = new Map();
        this._messageHandler = messageHandler;
        this._socketStateHandler = socketStateHandler;
    }
    static getInstance() {
        if (!WebsocketInfoManager._instance)
            throw new Error("[WebsocketInfoManager] is not initialized.");
        return WebsocketInfoManager._instance;
    }
    static initialize(messageHandler, socketStateHandler) {
        if (!WebsocketInfoManager._instance)
            WebsocketInfoManager._instance = new WebsocketInfoManager(messageHandler, socketStateHandler);
        return WebsocketInfoManager._instance;
    }
    createWebsocketConnection(client, authenticator) {
        let websocketConnection = new websocket_connection_1.WebsocketConnection(client, (msg) => this._handleMessage(msg), (socketId) => this._disconnectionCallback(socketId));
        this._socketIdToWebsocketConnection.set(websocketConnection.socketId, websocketConnection);
        this._socketIdToAuthenticator.set(websocketConnection.socketId, authenticator);
    }
    getAuthenticatorBySocketId(socketId) {
        return this._socketIdToAuthenticator.get(socketId);
    }
    getWebsocketConnectionBySocketId(socketId) {
        return this._socketIdToWebsocketConnection.get(socketId);
    }
    disconnectWebsocketConnectionByUsername(username) {
        // for(const [socketId, authenticator] of this._socketIdToAuthenticator) {
        //     if(authenticator.authenticationInfo.phoneNumber === username) {
        //         this._socketIdToWebsocketConnection.get(socketId)!.disconnect()
        //     }
        // }
    }
    _handleMessage(message) {
        this._socketIdToAuthenticator.get(message.socketId)?.addExistingAuthenticationInfo(message);
        this._messageHandler.handle(message);
    }
    _disconnectionCallback(socketId) {
        this._socketStateHandler.handle({
            authenticationInfo: this._socketIdToAuthenticator.get(socketId)?.authenticationInfo,
            socketId: socketId, state: 'offline'
        });
        this._socketIdToAuthenticator.delete(socketId);
        this._socketIdToWebsocketConnection.delete(socketId);
    }
}
exports.WebsocketInfoManager = WebsocketInfoManager;
