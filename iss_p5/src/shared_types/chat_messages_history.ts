

export type ChatMessagesHistory = {
    messageInfoList: Array<MessageInfo>
}

export type MessageInfo = {
    User: {
        phoneNumber: string;
    };
    message: string;
    time: string,
    messageId: number,
    chatId: number,
}