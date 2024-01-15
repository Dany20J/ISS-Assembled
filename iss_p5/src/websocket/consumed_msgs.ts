import { Queue } from "../queue"

export class ConsumedMsgs {
    private msgsId: Map<string, null> = new Map()
    private _queue: Queue<string> = new Queue(1000)

    public addConsumedMsg(id: string): void {
        this.msgsId.set(id, null)
        try {
            this._queue.enqueue(id)
        } catch (error) {
            this._deleteConsumedMsg(this._queue.dequeue()!)
            this._queue.enqueue(id)
        }
    }
    private _deleteConsumedMsg(id: string): void {
        this.msgsId.delete(id)
    }
    public isMsgConsumed(id: string): boolean {
        return this.msgsId.has(id)
    }
}