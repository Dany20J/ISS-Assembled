"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsgBuffer = void 0;
class MsgBuffer {
    constructor() {
        this._buffer = new Map();
    }
    saveCopy(msgModel) {
        this._buffer.set(msgModel.id, msgModel);
    }
    deleteCopy(id) {
        this._buffer.delete(id);
    }
    getBufferContent() {
        return Array.from(this._buffer.values());
    }
}
exports.MsgBuffer = MsgBuffer;
