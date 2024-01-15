import { MsgModel } from "./msg_model";

export class MsgBuffer {

    private _buffer: Map<string, MsgModel> = new Map()
    public saveCopy(msgModel: MsgModel): void {
        this._buffer.set(msgModel.id, msgModel)
    }

    public deleteCopy(id: string): void {
        this._buffer.delete(id)
    }


    public getBufferContent(): Array<MsgModel> {
        return Array.from(this._buffer.values())
    }
}
