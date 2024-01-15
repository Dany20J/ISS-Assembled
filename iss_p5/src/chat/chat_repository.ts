import { _handleError, _handleErrorFalse } from "../shared_functions/shared_functions"

import { Message, PrismaClient } from "@prisma/client"
import { ChatHistory } from "../shared_types/chat_history"
import { ChatMessagesHistory } from "../shared_types/chat_messages_history"


export class ChatRepository {
    private _prisma: PrismaClient = new PrismaClient()
    public async getChatHistoryOfPhoneNumber(phoneNumber: string): Promise<ChatHistory | undefined> {

        let chatInfoList = await this._prisma.chat.findMany({
            where: {
                OR: [{
                    User_1: {
                        phoneNumber: phoneNumber
                    },
                },
                {
                    User_2: {
                        phoneNumber: phoneNumber
                    }
                }
                ]
            },
            select: {
                chatId: true,

                User_1: {
                    select: {
                        phoneNumber: true
                    }
                },
                User_2: {
                    select: {
                        phoneNumber: true
                    }
                }
            }
        })
        if (chatInfoList === undefined)
            return undefined
        return {
            chatInfoList: chatInfoList.map((v) => {
                let mapped = {
                    chatId: v.chatId,
                    User_1: {
                        phoneNumber: v.User_1.phoneNumber

                    },
                    User_2: {
                        phoneNumber: v.User_2.phoneNumber

                    },
                    User_You: {
                        phoneNumber: phoneNumber
                    }
                }
                return mapped
            })
        }
    }
    public async getChatMessages(chatId: number): Promise<ChatMessagesHistory | undefined> {
        let messageInfoList = await this._prisma.message.findMany({
            where: {
                chatId: chatId
            },
            select: {
                messageId: true,
                message: true,
                time: true,
                chatId: true,
                User: {
                    select: {
                        phoneNumber: true
                    }
                }
            },
            orderBy: {
                time: 'asc'
            }
        })
        if (messageInfoList === undefined)
            return undefined
        return {
            messageInfoList: messageInfoList.map((v) => {
                let mapped = {
                    time: v.time.toDateString(),
                    User: {
                        phoneNumber: v.User.phoneNumber
                    },
                    message: v.message,
                    messageId: v.messageId,
                    chatId: v.chatId,
                }
                return mapped
            })
        }

    }
    public async doesPhoneNumberExist(sendToPhoneNumber: string): Promise<boolean> {
        return (await this._prisma.user.count({
            where: {
                phoneNumber: sendToPhoneNumber
            }
        })) !== undefined
    }
    public async saveMessage(sendFromPhoneNumber: string, sendToPhoneNumber: string, message: string): Promise<Message | undefined> {
        let fromUser = await this._prisma.user.findUnique({ where: { phoneNumber: sendFromPhoneNumber }, select: { userId: true } })
        let toUser = await this._prisma.user.findUnique({ where: { phoneNumber: sendToPhoneNumber }, select: { userId: true } })
        if (fromUser === null || toUser === null)
            return undefined

        let chat = await this._prisma.chat.findFirst({
            where: {
                OR: [{
                    User_1: {
                        phoneNumber: sendFromPhoneNumber
                    },
                    User_2: {
                        phoneNumber: sendToPhoneNumber
                    }
                },
                {
                    User_2: {
                        phoneNumber: sendFromPhoneNumber
                    },
                    User_1: {
                        phoneNumber: sendToPhoneNumber
                    }
                }
                ]
            }
        })
        if (chat == null) {
            chat = await this._prisma.chat.create({
                data: {
                    userId_1: fromUser.userId,
                    userId_2: toUser.userId
                }
            })
        }
        return await this._prisma.message.create({
            data: {
                message: message,
                senderUserId: fromUser.userId,
                chatId: chat.chatId
            }
        })
    }
}