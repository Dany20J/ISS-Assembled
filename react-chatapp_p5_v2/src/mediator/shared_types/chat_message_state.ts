export type AllChatState = {
    chatList: Array<Chat>
}

export type Chat = {
    chatMessagesList: Array<ChatMessage>,
    yourPhoneNumber: string
    otherPhoneNumber: string
    chatId: number
}

export type ChatMessage = {
    message: string,
    messageId: number,
    time: string,
    senderPhoneNumber: string,
    receiverPhoneNumber: string
}