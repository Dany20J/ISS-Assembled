import WebSocket from 'ws'
import { JsonState, JsonValidator } from '../json_validator'
import { Message } from '../shared_types/message'
import { ConsumedMsgs } from './consumed_msgs'
import { MsgBuffer } from './msg_buffer'
import { MsgModel } from './msg_model'
import {v4 as uuidv4} from 'uuid';
import { privateEncrypt } from 'crypto'

export class WebsocketConnection {

    private _client: WebSocket.WebSocket
    private _socketId: string = uuidv4()
    private _handleMessage: (message: Message) => void
    private _disconnectionCallback: (socketId: string) => void
    private _msgBuffer: MsgBuffer = new MsgBuffer()
    private _consumedMsgs: ConsumedMsgs = new ConsumedMsgs()

    static acknowledged: string = "acknowledged"
    constructor(client: WebSocket.WebSocket, handleMessage: (message: Message) => void, disconnectionCallback: (socketId: string) => void) {
        this._client = client
        this._handleMessage = handleMessage
        this._disconnectionCallback = disconnectionCallback

        this._listenToSocketCloseEvent()
        this._listenToMessages()
        this._reTransferBuffer()
    }
    private _listenToSocketCloseEvent(): void {
        this._client.on('close', () => {
            this._disconnectionCallback(this._socketId)
        })
    }
    public disconnect(): void {
        this._client.close()
    }
    private _listenToMessages(): void {
        this._client.on('message', (msg: string) => this._onMessage(msg))
    }
    private _onMessage(msg: string): void {
        let jsonState: JsonState = JsonValidator.isJsonMsg(msg)
        console.log(jsonState.jsonObj)
        if (jsonState.isJson === true) {
            let msgModel: MsgModel = { id: jsonState.jsonObj.id, data: jsonState.jsonObj.data }

            if (msgModel.data === WebsocketConnection.acknowledged) {
                this._msgBuffer.deleteCopy(msgModel.id)
            }
            else if (!this._consumedMsgs.isMsgConsumed(msgModel.id)) {
                this._consumedMsgs.addConsumedMsg(msgModel.id)
                this._acknowledgeMsg(msgModel.id)
                this._handleMessage({ data: msgModel.data, socketId: this._socketId })

            }
            else if (this._consumedMsgs.isMsgConsumed(msgModel.id)) {
                this._acknowledgeMsg(msgModel.id)
            }
        }

        else {
            // TODO SEND ERROR MESSAGE
        }
    }
    private _acknowledgeMsg(id: string): void {
        this._transferMsg({ id: id, data: WebsocketConnection.acknowledged });
    }
    public send(data: string) {
        let msgModel: MsgModel = { data: data, id: uuidv4() }
        this._msgBuffer.saveCopy(msgModel)
        this._transferMsg(msgModel)

    }
    private _transferMsg(msgModel: MsgModel) {
        if (this._client.readyState == this._client.OPEN)
            this._client.send(JSON.stringify( msgModel ))
    }

    private _intervalId: NodeJS.Timer | undefined
    private _reTransferBuffer(): void {
        let periodicFunction: () => void = (): void => {

            let msgs: Array<MsgModel> = this._msgBuffer.getBufferContent()
            for (let msgModel of msgs)
                this._transferMsg(msgModel)
        }
        this._intervalId = setInterval(periodicFunction, 1000);

    }
    public releaseResources() {
        clearInterval(this._intervalId!)
    }

    public get socketId(): string { return this._socketId }
}