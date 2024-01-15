export class JsonValidator {
    static isJsonMsg(msg: string): JsonState {
        try {
            return { isJson: true, jsonObj: JSON.parse(msg) }

        } catch (error) {
            return { isJson: false, error: 'malformed JSON message' };

        }
    }
    static isMsgModelType(msg: any): boolean {
        return msg.hasOwnProperty('data') && msg.hasOwnProperty('id')
    }
}
export type JsonState = {
    isJson: boolean,
    jsonObj?: any,
    error?: string
}
