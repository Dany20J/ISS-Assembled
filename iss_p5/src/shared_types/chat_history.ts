

export type ChatHistory = {
    chatInfoList: Array<ChatInfo>
}

export type ChatInfo = {
    chatId: number,
    User_1: {
        phoneNumber: string
    },
    User_2: {
        phoneNumber: string
    },
    User_You: {
        phoneNumber: string
    }
}