import WebSocket from "ws"
import { Authenticator } from "./authenticator"


import { MessageHandler } from "../handler/message_handler"
import { SocketsStateHandler } from "../handler/sockets_state_handler"
import { AuthenticationInfo } from "../shared_types/authentication_info"
import { Message } from "../shared_types/message"
import { WebsocketConnection } from "../websocket/websocket_connection"


export type SocketStateInfo = {
    authenticationInfo?: AuthenticationInfo,
    socketId: string,
    state: string
}

export class WebsocketInfoManager {
    private static _instance: WebsocketInfoManager

    private _messageHandler: MessageHandler // Handle messages coming from internet to system
    private _socketStateHandler: SocketsStateHandler // Handle socket state of some socketId

    private constructor(messageHandler: MessageHandler, socketStateHandler: SocketsStateHandler) {
        this._messageHandler = messageHandler
        this._socketStateHandler = socketStateHandler
    }
    public static getInstance(): WebsocketInfoManager {
        if (!WebsocketInfoManager._instance)
            throw new Error("[WebsocketInfoManager] is not initialized.")
        return WebsocketInfoManager._instance
    }

    public static initialize(messageHandler: MessageHandler, socketStateHandler: SocketsStateHandler): WebsocketInfoManager {
        if (!WebsocketInfoManager._instance)
            WebsocketInfoManager._instance = new WebsocketInfoManager(messageHandler, socketStateHandler)
        return WebsocketInfoManager._instance

    }
    private _socketIdToWebsocketConnection: Map<string, WebsocketConnection> = new Map()
    private _socketIdToAuthenticator: Map<string, Authenticator> = new Map()

    public createWebsocketConnection(client: WebSocket.WebSocket, authenticator: Authenticator) {
        let websocketConnection: WebsocketConnection = new WebsocketConnection(client, (msg: Message) => this._handleMessage(msg), (socketId: string) => this._disconnectionCallback(socketId))
        this._socketIdToWebsocketConnection.set(websocketConnection.socketId, websocketConnection)
        this._socketIdToAuthenticator.set(websocketConnection.socketId, authenticator)
    }
    public getAuthenticatorBySocketId(socketId: string): Authenticator | undefined {
        return this._socketIdToAuthenticator.get(socketId)
    }
    public getWebsocketConnectionBySocketId(socketId: string): WebsocketConnection | undefined {
        return this._socketIdToWebsocketConnection.get(socketId)
    }

    public disconnectWebsocketConnectionByUsername(username: string) {
        // for(const [socketId, authenticator] of this._socketIdToAuthenticator) {
        //     if(authenticator.authenticationInfo.phoneNumber === username) {
        //         this._socketIdToWebsocketConnection.get(socketId)!.disconnect()
        //     }
        // }
    }
    private async _handleMessage(message: Message) {
        if(await this._socketIdToAuthenticator.get(message.socketId)?.handle(message) == false){
            console.log("INVALID DATA")
            return}
        this._messageHandler.handle(message)
    }
    private _disconnectionCallback(socketId: string) {
        this._socketStateHandler.handle({
            authenticationInfo: this._socketIdToAuthenticator.get(socketId)?.authenticationInfo,
            socketId: socketId, state: 'offline'
        })
        this._socketIdToAuthenticator.delete(socketId)
        this._socketIdToWebsocketConnection.delete(socketId)
    }



}