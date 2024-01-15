"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsumedMsgs = void 0;
const queue_1 = require("../queue");
class ConsumedMsgs {
    constructor() {
        this.msgsId = new Map();
        this._queue = new queue_1.Queue(1000);
    }
    addConsumedMsg(id) {
        this.msgsId.set(id, null);
        try {
            this._queue.enqueue(id);
        }
        catch (error) {
            this._deleteConsumedMsg(this._queue.dequeue());
            this._queue.enqueue(id);
        }
    }
    _deleteConsumedMsg(id) {
        this.msgsId.delete(id);
    }
    isMsgConsumed(id) {
        return this.msgsId.has(id);
    }
}
exports.ConsumedMsgs = ConsumedMsgs;
