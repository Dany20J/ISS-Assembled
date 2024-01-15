"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonValidator = void 0;
class JsonValidator {
    static isJsonMsg(msg) {
        try {
            return { isJson: true, jsonObj: JSON.parse(msg) };
        }
        catch (error) {
            return { isJson: false, error: 'malformed JSON message' };
        }
    }
    static isMsgModelType(msg) {
        return msg.hasOwnProperty('data') && msg.hasOwnProperty('id');
    }
}
exports.JsonValidator = JsonValidator;
