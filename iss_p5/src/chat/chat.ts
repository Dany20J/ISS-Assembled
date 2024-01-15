

import { ChatRepository } from "./chat_repository";
import * as Collections from "typescript-collections"
import events from "events";
import { AuthenticationInfo } from "../shared_types/authentication_info";
import { ChatHistory } from "../shared_types/chat_history";
import { Reply } from "../shared_types/reply";
import { ChatMessagesHistory } from "../shared_types/chat_messages_history";
import { Message } from "@prisma/client";

export type SubscriptionMessage = {
    authenticationInfo: AuthenticationInfo,
    socketId: string
}
export type UnSubscriptionMessage = {
    authenticationInfo: AuthenticationInfo,
    socketId: string
}

export type ChatMessagesHistoryRequest = {
    chatId: number,
    authenticationInfo: AuthenticationInfo,
}
export type ChatMessagesHistoryReply = Reply & {
    chatMessagesHistory?: ChatMessagesHistory
}

export type ChatsHistoryRequest = {
    authenticationInfo: AuthenticationInfo
}
export type ChatsHistoryReply = Reply & {
    chatHistory?: ChatHistory
}

export type SendMessageRequest = {
    authenticationInfo: AuthenticationInfo,
    message: string,
    sendToPhoneNumber: string
}

type SubscriberInfo = {
    sockets: Array<string>
}
type SubscriberId = {
    phoneNumber: string
}

export type MessageToSend = {
    messageId: number,
    message: string,
    senderPhoneNumber: string,
    receiverPhoneNumber: string
    time: string,
    chatId: number,
    sendToSocketIds: Array<string>
}

export declare interface Chat {
    on(event: 'MessageToSend', listener: (messageToSend: MessageToSend) => void): this
}

export class Chat extends events.EventEmitter {
    private _subscribersInfos: Collections.Dictionary<string/* SubscriberId */, SubscriberInfo>

    constructor(private _chatRepository: ChatRepository) {
        super()
        this._subscribersInfos = new Collections.Dictionary<string/* SubscriberId */, SubscriberInfo>()
    }
    public subscribe(subscriptionMessage: SubscriptionMessage): boolean {
        let subId: SubscriberId = { phoneNumber: subscriptionMessage.authenticationInfo.phoneNumber }
        if (this._subscribersInfos.containsKey(subId.phoneNumber)) {
            let subInfo: SubscriberInfo | undefined = this._subscribersInfos.getValue(subId.phoneNumber)
            if (subInfo?.sockets.includes(subscriptionMessage.socketId))
                return false
            subInfo?.sockets.push(subscriptionMessage.socketId)
        }
        else {
            let subInfo: SubscriberInfo = {
                sockets: [subscriptionMessage.socketId]
            }
            this._subscribersInfos.setValue(subId.phoneNumber, subInfo)
        }
        return true
    }

    public unsubscribe(unSubscriptionMessage: UnSubscriptionMessage): boolean {
        let subId: SubscriberId = { phoneNumber: unSubscriptionMessage.authenticationInfo.phoneNumber }
        if (this._subscribersInfos.containsKey(subId.phoneNumber)) {
            let subInfo: SubscriberInfo | undefined = this._subscribersInfos.getValue(subId.phoneNumber)
            let sockets: Array<string> = []
            for (var i = 0; i < subInfo?.sockets.length!; i++) {
                if (subInfo?.sockets[i] == unSubscriptionMessage.socketId)
                    continue
                sockets.push(subInfo?.sockets[i]!)
            }
            subInfo = {
                sockets: sockets
            }
            this._subscribersInfos.setValue(subId.phoneNumber, subInfo)
        }
        return true
    }

    public async getChatsHistory(chatsRequest: ChatsHistoryRequest): Promise<ChatsHistoryReply> {

        let chatHistory: ChatHistory | undefined = await this._chatRepository.getChatHistoryOfPhoneNumber(chatsRequest.authenticationInfo.phoneNumber)
        if (chatHistory === undefined) {
            return {
                successful: false,
                error: "Unknown error.",
            }
        }
        return { successful: true, error: '', chatHistory: chatHistory }
    }
    public async getChatMessagesHistory(chatMessagesRequest: ChatMessagesHistoryRequest): Promise<ChatMessagesHistoryReply> {
        let chatMessagesHistory: ChatMessagesHistory | undefined = await this._chatRepository.getChatMessages(chatMessagesRequest.chatId)
        let chatMessagesReply: ChatMessagesHistoryReply
        if (chatMessagesHistory === undefined) {
            chatMessagesReply = {
                successful: false,
                error: 'Unknown error.'
            }
            return chatMessagesReply
        }
        chatMessagesReply = {
            chatMessagesHistory: chatMessagesHistory,
            successful: true,
            error: ''
        }
        return chatMessagesReply
    }
    public async sendMessage(sendMessageRequest: SendMessageRequest): Promise<boolean> {
        if (!(await this._chatRepository.doesPhoneNumberExist(sendMessageRequest.sendToPhoneNumber)))
            return false
        if (sendMessageRequest.sendToPhoneNumber == sendMessageRequest.authenticationInfo.phoneNumber)
            return false
        let message = await this._chatRepository.saveMessage(
            sendMessageRequest.authenticationInfo.phoneNumber,
            sendMessageRequest.sendToPhoneNumber, sendMessageRequest.message)
        if (message == undefined)
            return false
        this._emitMessageToSend(sendMessageRequest, message)
        return true
    }


    private async _emitMessageToSend(sendMessageRequest: SendMessageRequest, message: Message): Promise<void> {
        let messageToSend: MessageToSend = {
            messageId: message.messageId,
            message: message.message,
            senderPhoneNumber: sendMessageRequest.authenticationInfo.phoneNumber,
            receiverPhoneNumber: sendMessageRequest.sendToPhoneNumber,
            time: message.time?.toDateString(),
            chatId: message.chatId,
            sendToSocketIds: this._getSocketIds([sendMessageRequest.sendToPhoneNumber, sendMessageRequest.authenticationInfo.phoneNumber])
        }
        this.emit("MessageToSend", messageToSend)
    }
    private _getSocketIds(phoneNumbers: Array<string>): Array<string> {
        let sendToSocketIds: Array<string> = []
        for (const phoneNumber of phoneNumbers) {
            let subId: SubscriberId = { phoneNumber: phoneNumber }
            if (this._subscribersInfos.containsKey(subId.phoneNumber)) {
                for (const socketId of this._subscribersInfos.getValue(subId.phoneNumber)?.sockets!)
                    sendToSocketIds.push(socketId)
            }
        }
        return sendToSocketIds
    }
}