import { Message } from "../shared_types/message";
import { WebsocketConnection } from "../websocket/websocket_connection";
import { Authenticator } from "../websocket_manager/authenticator";
import { WebsocketInfoManager } from "../websocket_manager/websocket_info_manager";

import { MessageHandler } from "./message_handler";

export class MessageDestinationHandler implements MessageHandler {

    public async handle(message: Message) {
        let websocketConnection: WebsocketConnection | undefined =
            WebsocketInfoManager.getInstance().getWebsocketConnectionBySocketId(message.socketId)
        let authenticator: Authenticator | undefined = WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId)

        console.log("before signing", message.data)

        await authenticator?.handleOnGoing(message)
       
        console.log("after signing", message.data)
        websocketConnection?.send(message.data)
    }

}