"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatServicesHandler = void 0;
const shared_functions_1 = require("../shared_functions/shared_functions");
class ChatServicesHandler {
    constructor(chat, _messageDestinationHandler) {
        this._chat = chat;
        this._messageDestinationHandler = _messageDestinationHandler;
        this._observerChat();
    }
    _observerChat() {
        this._chat.on("MessageToSend", (messageToSend) => {
            for (const socketId of messageToSend.sendToSocketIds) {
                let message = {
                    data: {
                        event: "message",
                        messageId: messageToSend.messageId,
                        message: messageToSend.message,
                        senderPhoneNumber: messageToSend.senderPhoneNumber,
                        receiverPhoneNumber: messageToSend.receiverPhoneNumber,
                        time: messageToSend.time,
                        chatId: messageToSend.chatId,
                    },
                    socketId: socketId
                };
                this._messageDestinationHandler.handle(message);
            }
        });
    }
    handle(message) {
        switch (message.data.event) {
            case 'chatSubscription':
                this._handleSubscription(message);
                break;
            case "state":
            case 'chatUnSubscription':
                this._handleUnSubscription(message);
                break;
            case 'getChatsHistory':
                this._handleGetChatsHistory(message);
                break;
            case 'getMessagesHistory':
                this._handleGetMessagesHistory(message);
                break;
            case 'sendMessage':
                this._handleSendMessage(message);
                break;
        }
    }
    async _handleSubscription(message) {
        if (message.authenticationInfo === undefined) {
            let errorData = {
                event: message.data.event, error: "Unauthenticated.", successful: false
            };
            message.data = errorData;
            return this._messageDestinationHandler.handle(message);
        }
        let subscriptionMessage = {
            socketId: message.socketId,
            authenticationInfo: message.authenticationInfo
        };
        let data = {};
        data.event = message.data.event;
        data.successful = await this._chat.subscribe(subscriptionMessage);
        if (data.successful === false)
            data.error = "Unknown error.";
        message.data = data;
        this._messageDestinationHandler.handle(message);
    }
    async _handleUnSubscription(message) {
        if (message.authenticationInfo === undefined) {
            let errorData = {
                event: message.data.event, error: "Unauthenticated.", successful: false
            };
            message.data = errorData;
            return this._messageDestinationHandler.handle(message);
        }
        let unSubscriptionMessage = {
            authenticationInfo: message.authenticationInfo,
            socketId: message.socketId
        };
        let data = {};
        data.event = message.data.event;
        data.successful = await this._chat.unsubscribe(unSubscriptionMessage);
        message.data = data;
        this._messageDestinationHandler.handle(message);
    }
    async _handleGetMessagesHistory(message) {
        if (message.authenticationInfo === undefined || message.data.chatId === undefined) {
            let errorData = {
                event: message.data.event, error: message.authenticationInfo === undefined ? "Unauthenticated." : "Missing chatId.", successful: false
            };
            message.data = errorData;
            return this._messageDestinationHandler.handle(message);
        }
        let chatMessagesRequest = {
            chatId: message.data.chatId,
            authenticationInfo: message.authenticationInfo
        };
        let reply = await this._chat.getChatMessagesHistory(chatMessagesRequest);
        if (!reply.successful) {
            let errorData = {
                event: message.data.event, error: reply.error, successful: false
            };
            message.data = errorData;
            return this._messageDestinationHandler.handle(message);
        }
        let data = {};
        data.event = message.data.event;
        data.successful = true;
        data.chatMessagesHistory = reply.chatMessagesHistory;
        message.data = data;
        return this._messageDestinationHandler.handle(message);
    }
    async _handleGetChatsHistory(message) {
        if (message.authenticationInfo === undefined) {
            let errorData = {
                event: message.data.event, error: "Unauthenticated.", successful: false
            };
            message.data = errorData;
            return this._messageDestinationHandler.handle(message);
        }
        let request = {
            authenticationInfo: message.authenticationInfo
        };
        let reply = await this._chat.getChatsHistory(request);
        if (!reply.successful) {
            let errorData = {
                event: message.data.event,
                error: reply.error,
                successful: false
            };
            message.data = errorData;
            return this._messageDestinationHandler.handle(message);
        }
        let data = {};
        data.event = message.data.event;
        data.chatHistory = reply.chatHistory;
        data.successful = true;
        message.data = data;
        return this._messageDestinationHandler.handle(message);
    }
    async _handleSendMessage(message) {
        let sendMessageRequest = this._toSendMessageRequest(message);
        if (sendMessageRequest === undefined) {
            let errorData = {
                event: message.data.event, error: "Unauthenticated or Missing message/sendToPhoneNumber.", successful: false
            };
            message.data = errorData;
            return this._messageDestinationHandler.handle(message);
        }
        let data = {};
        data.event = message.data.event;
        data.successful = await this._chat.sendMessage(sendMessageRequest);
        if (data.successful === false)
            data.error = "Unknown error.";
        message.data = data;
        this._messageDestinationHandler.handle(message);
    }
    _toSendMessageRequest(message) {
        if ((0, shared_functions_1._has)(message.data, 'message') && (0, shared_functions_1._has)(message.data, 'sendToPhoneNumber') && message.authenticationInfo !== undefined) {
            return {
                authenticationInfo: message.authenticationInfo,
                message: message.data.message,
                sendToPhoneNumber: message.data.sendToPhoneNumber
            };
        }
        return undefined;
    }
}
exports.ChatServicesHandler = ChatServicesHandler;
