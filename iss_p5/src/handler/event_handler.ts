

import { MessageHandler } from "../handler/message_handler";
import { Message } from "../shared_types/message";


export class EventHandler implements MessageHandler {
    private _messageToHandler: Map<string, Array<MessageHandler>>
    constructor(messageToHandler: Map<string, Array<MessageHandler>>) {
        this._messageToHandler = messageToHandler
    }
    public handle(message: Message): void {
        if (message.data.hasOwnProperty('event')) {
            if (this._messageToHandler.has(message.data.event))
                for (const messageHandler of this._messageToHandler.get(message.data.event)!)
                    messageHandler.handle(message)

        }
    }
}