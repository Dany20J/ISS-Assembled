export interface IQueue<T> {
    enqueue(item: T): void;
    dequeue(): T | undefined;
    size(): number;
}

export class Queue<T> implements IQueue<T> {
    private _storage: T[] = [];
    private _capacity: number = Infinity
    constructor(capacity: number) { this._capacity = capacity }

    enqueue(item: T): void {
        if (this.size() === this._capacity) {
            throw Error("Queue has reached max capacity, you cannot add more items");
        }
        this._storage.push(item);
    }
    dequeue(): T | undefined {
        return this._storage.shift();
    }
    size(): number {
        return this._storage.length;
    }
}
