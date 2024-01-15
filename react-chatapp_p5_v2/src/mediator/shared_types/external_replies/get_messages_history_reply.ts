import { Reply } from "./reply";

export type GetMessagesHistoryReply = Reply & {
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