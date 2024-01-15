
import { Message } from "../shared_types/message";
import { _has } from "../shared_functions/shared_functions";
import { ErrorData } from "./error_data";
import { MessageDestinationHandler } from "./message_destination_handler";
import { MessageHandler } from "./message_handler";
import { Chat, ChatMessagesHistoryReply, ChatMessagesHistoryRequest, ChatsHistoryReply, ChatsHistoryRequest, MessageToSend, SendMessageRequest, SubscriptionMessage, UnSubscriptionMessage } from "../chat/chat";

export class ChatServicesHandler implements MessageHandler {
    private _chat: Chat
    private _messageDestinationHandler: MessageDestinationHandler

    constructor(chat: Chat, _messageDestinationHandler: MessageDestinationHandler) {
        this._chat = chat
        this._messageDestinationHandler = _messageDestinationHandler
        this._observerChat()
    }
    private _observerChat(): void {
        this._chat.on("MessageToSend", (messageToSend: MessageToSend) => {
            for (const socketId of messageToSend.sendToSocketIds) {
                
                let message: Message = {
                    data: {
                        event: "message",
                        messageId: messageToSend.messageId,
                        message: messageToSend.message,
                        senderPhoneNumber: messageToSend.senderPhoneNumber,
                        receiverPhoneNumber: messageToSend.receiverPhoneNumber,
                        time: messageToSend.time,
                        chatId: messageToSend.chatId,
                    } ,
                    socketId: socketId
                }
                this._messageDestinationHandler.handle(message)
            }
        })
    }
    public handle(message: Message): void {
        switch (message.data.event) {
            case 'chatSubscription':
                this._handleSubscription(message)
                break
            case "state":
            case 'chatUnSubscription':
                this._handleUnSubscription(message)
                break
            case 'getChatsHistory':
                this._handleGetChatsHistory(message)
                break
            case 'getMessagesHistory':
                this._handleGetMessagesHistory(message)
                break
            case 'sendMessage':
                this._handleSendMessage(message)
                break
        }
    }
    private async _handleSubscription(message: Message): Promise<void> {
        if (message.authenticationInfo === undefined) {
            let errorData: ErrorData = {
                event: message.data.event, error: "Unauthenticated.", successful: false
            }
            message.data = errorData
            return this._messageDestinationHandler.handle(message)
        }
        let subscriptionMessage: SubscriptionMessage = {
            socketId: message.socketId,
            authenticationInfo: message.authenticationInfo
        }
        let data: any = {}
        data.event = message.data.event
        data.successful = await this._chat.subscribe(subscriptionMessage)
        if (data.successful === false)
            data.error = "Unknown error."
        message.data = data
        this._messageDestinationHandler.handle(message)
    }
    private async _handleUnSubscription(message: Message): Promise<void> {
        if (message.authenticationInfo === undefined) {
            let errorData: ErrorData = {
                event: message.data.event, error: "Unauthenticated.", successful: false
            }
            message.data = errorData
            return this._messageDestinationHandler.handle(message)
        }
        let unSubscriptionMessage: UnSubscriptionMessage = {
            authenticationInfo: message.authenticationInfo,
            socketId: message.socketId
        }
        let data: any = {}
        data.event = message.data.event
        data.successful = await this._chat.unsubscribe(unSubscriptionMessage)
        message.data = data
        this._messageDestinationHandler.handle(message)
    }
    private async _handleGetMessagesHistory(message: Message): Promise<void> {
        if (message.authenticationInfo === undefined || message.data.chatId === undefined) {
            let errorData: ErrorData = {
                event: message.data.event, error: message.authenticationInfo === undefined ? "Unauthenticated." : "Missing chatId.", successful: false
            }
            message.data = errorData
            return this._messageDestinationHandler.handle(message)
        }
        let chatMessagesRequest: ChatMessagesHistoryRequest = {
            chatId: message.data.chatId,
            authenticationInfo: message.authenticationInfo
        }
        let reply: ChatMessagesHistoryReply = await this._chat.getChatMessagesHistory(chatMessagesRequest)
        if (!reply.successful) {
            let errorData: ErrorData = {
                event: message.data.event, error: reply.error!, successful: false
            }
            message.data = errorData
            return this._messageDestinationHandler.handle(message)
        }
        let data: any = {}
        data.event = message.data.event
        data.successful = true
        data.chatMessagesHistory = reply.chatMessagesHistory
        message.data = data
        return this._messageDestinationHandler.handle(message)
    }
    private async _handleGetChatsHistory(message: Message): Promise<void> {
        if (message.authenticationInfo === undefined) {
            let errorData: ErrorData = {
                event: message.data.event, error: "Unauthenticated.", successful: false
            }
            message.data = errorData
            return this._messageDestinationHandler.handle(message)
        }
        let request: ChatsHistoryRequest = {
            authenticationInfo: message.authenticationInfo
        }
        let reply: ChatsHistoryReply = await this._chat.getChatsHistory(request)
        if (!reply.successful) {
            let errorData: ErrorData = {
                event: message.data.event,
                error: reply.error!,
                successful: false
            }
            message.data = errorData
            return this._messageDestinationHandler.handle(message)
        }
        let data: any = {}
        data.event = message.data.event
        data.chatHistory = reply.chatHistory!
        data.successful = true
        message.data = data
        return this._messageDestinationHandler.handle(message)
    }
    private async _handleSendMessage(message: Message): Promise<void> {
        let sendMessageRequest: SendMessageRequest | undefined = this._toSendMessageRequest(message)
        if (sendMessageRequest === undefined) {
            let errorData: ErrorData = {
                event: message.data.event, error: "Unauthenticated or Missing message/sendToPhoneNumber.", successful: false
            }
            message.data = errorData
            return this._messageDestinationHandler.handle(message)
        }
        let data: any = {}
        data.event = message.data.event
        data.successful = await this._chat.sendMessage(sendMessageRequest)
        if (data.successful === false)
            data.error = "Unknown error."
        message.data = data
        this._messageDestinationHandler.handle(message)
    }
    private _toSendMessageRequest(message: Message): SendMessageRequest | undefined {
        if (_has(message.data, 'message') && _has(message.data, 'sendToPhoneNumber') && message.authenticationInfo !== undefined) {
            return {
                authenticationInfo: message.authenticationInfo,
                message: message.data.message,
                sendToPhoneNumber: message.data.sendToPhoneNumber
            }
        }
        return undefined
    }
}