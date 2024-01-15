"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const Collections = __importStar(require("typescript-collections"));
const events_1 = __importDefault(require("events"));
class Chat extends events_1.default.EventEmitter {
    constructor(_chatRepository) {
        super();
        this._chatRepository = _chatRepository;
        this._subscribersInfos = new Collections.Dictionary();
    }
    subscribe(subscriptionMessage) {
        let subId = { phoneNumber: subscriptionMessage.authenticationInfo.phoneNumber };
        if (this._subscribersInfos.containsKey(subId.phoneNumber)) {
            let subInfo = this._subscribersInfos.getValue(subId.phoneNumber);
            if (subInfo?.sockets.includes(subscriptionMessage.socketId))
                return false;
            subInfo?.sockets.push(subscriptionMessage.socketId);
        }
        else {
            let subInfo = {
                sockets: [subscriptionMessage.socketId]
            };
            this._subscribersInfos.setValue(subId.phoneNumber, subInfo);
        }
        return true;
    }
    unsubscribe(unSubscriptionMessage) {
        let subId = { phoneNumber: unSubscriptionMessage.authenticationInfo.phoneNumber };
        if (this._subscribersInfos.containsKey(subId.phoneNumber)) {
            let subInfo = this._subscribersInfos.getValue(subId.phoneNumber);
            let sockets = [];
            for (var i = 0; i < subInfo?.sockets.length; i++) {
                if (subInfo?.sockets[i] == unSubscriptionMessage.socketId)
                    continue;
                sockets.push(subInfo?.sockets[i]);
            }
            subInfo = {
                sockets: sockets
            };
            this._subscribersInfos.setValue(subId.phoneNumber, subInfo);
        }
        return true;
    }
    async getChatsHistory(chatsRequest) {
        let chatHistory = await this._chatRepository.getChatHistoryOfPhoneNumber(chatsRequest.authenticationInfo.phoneNumber);
        if (chatHistory === undefined) {
            return {
                successful: false,
                error: "Unknown error.",
            };
        }
        return { successful: true, error: '', chatHistory: chatHistory };
    }
    async getChatMessagesHistory(chatMessagesRequest) {
        let chatMessagesHistory = await this._chatRepository.getChatMessages(chatMessagesRequest.chatId);
        let chatMessagesReply;
        if (chatMessagesHistory === undefined) {
            chatMessagesReply = {
                successful: false,
                error: 'Unknown error.'
            };
            return chatMessagesReply;
        }
        chatMessagesReply = {
            chatMessagesHistory: chatMessagesHistory,
            successful: true,
            error: ''
        };
        return chatMessagesReply;
    }
    async sendMessage(sendMessageRequest) {
        if (!(await this._chatRepository.doesPhoneNumberExist(sendMessageRequest.sendToPhoneNumber)))
            return false;
        if (sendMessageRequest.sendToPhoneNumber == sendMessageRequest.authenticationInfo.phoneNumber)
            return false;
        let message = await this._chatRepository.saveMessage(sendMessageRequest.authenticationInfo.phoneNumber, sendMessageRequest.sendToPhoneNumber, sendMessageRequest.message);
        if (message == undefined)
            return false;
        this._emitMessageToSend(sendMessageRequest, message);
        return true;
    }
    async _emitMessageToSend(sendMessageRequest, message) {
        let messageToSend = {
            messageId: message.messageId,
            message: message.message,
            senderPhoneNumber: sendMessageRequest.authenticationInfo.phoneNumber,
            receiverPhoneNumber: sendMessageRequest.sendToPhoneNumber,
            time: message.time?.toDateString(),
            chatId: message.chatId,
            sendToSocketIds: this._getSocketIds([sendMessageRequest.sendToPhoneNumber, sendMessageRequest.authenticationInfo.phoneNumber])
        };
        this.emit("MessageToSend", messageToSend);
    }
    _getSocketIds(phoneNumbers) {
        let sendToSocketIds = [];
        for (const phoneNumber of phoneNumbers) {
            let subId = { phoneNumber: phoneNumber };
            if (this._subscribersInfos.containsKey(subId.phoneNumber)) {
                for (const socketId of this._subscribersInfos.getValue(subId.phoneNumber)?.sockets)
                    sendToSocketIds.push(socketId);
            }
        }
        return sendToSocketIds;
    }
}
exports.Chat = Chat;
