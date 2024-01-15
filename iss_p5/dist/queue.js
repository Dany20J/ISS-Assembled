"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
class Queue {
    constructor(capacity) {
        this._storage = [];
        this._capacity = Infinity;
        this._capacity = capacity;
    }
    enqueue(item) {
        if (this.size() === this._capacity) {
            throw Error("Queue has reached max capacity, you cannot add more items");
        }
        this._storage.push(item);
    }
    dequeue() {
        return this._storage.shift();
    }
    size() {
        return this._storage.length;
    }
}
exports.Queue = Queue;
