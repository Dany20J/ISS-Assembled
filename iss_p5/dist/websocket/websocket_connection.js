"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketConnection = void 0;
const json_validator_1 = require("../json_validator");
const consumed_msgs_1 = require("./consumed_msgs");
const msg_buffer_1 = require("./msg_buffer");
const uuid_1 = require("uuid");
class WebsocketConnection {
    constructor(client, handleMessage, disconnectionCallback) {
        this._socketId = (0, uuid_1.v4)();
        this._msgBuffer = new msg_buffer_1.MsgBuffer();
        this._consumedMsgs = new consumed_msgs_1.ConsumedMsgs();
        this._client = client;
        this._handleMessage = handleMessage;
        this._disconnectionCallback = disconnectionCallback;
        this._listenToSocketCloseEvent();
        this._listenToMessages();
        this._reTransferBuffer();
    }
    _listenToSocketCloseEvent() {
        this._client.on('close', () => {
            this._disconnectionCallback(this._socketId);
        });
    }
    disconnect() {
        this._client.close();
    }
    _listenToMessages() {
        this._client.on('message', (msg) => this._onMessage(msg));
    }
    _onMessage(msg) {
        let jsonState = json_validator_1.JsonValidator.isJsonMsg(msg);
        console.log(jsonState.jsonObj);
        if (jsonState.isJson === true) {
            let msgModel = { id: jsonState.jsonObj.id, data: jsonState.jsonObj.data };
            if (msgModel.data === WebsocketConnection.acknowledged) {
                this._msgBuffer.deleteCopy(msgModel.id);
            }
            else if (!this._consumedMsgs.isMsgConsumed(msgModel.id)) {
                this._consumedMsgs.addConsumedMsg(msgModel.id);
                this._acknowledgeMsg(msgModel.id);
                this._handleMessage({ data: msgModel.data, socketId: this._socketId });
            }
            else if (this._consumedMsgs.isMsgConsumed(msgModel.id)) {
                this._acknowledgeMsg(msgModel.id);
            }
        }
        else {
            // TODO SEND ERROR MESSAGE
        }
    }
    _acknowledgeMsg(id) {
        this._transferMsg({ id: id, data: WebsocketConnection.acknowledged });
    }
    send(data) {
        let msgModel = { data: data, id: (0, uuid_1.v4)() };
        this._msgBuffer.saveCopy(msgModel);
        this._transferMsg(msgModel);
    }
    _transferMsg(msgModel) {
        if (this._client.readyState == this._client.OPEN)
            this._client.send(JSON.stringify(msgModel));
    }
    _reTransferBuffer() {
        let periodicFunction = () => {
            let msgs = this._msgBuffer.getBufferContent();
            for (let msgModel of msgs)
                this._transferMsg(msgModel);
        };
        this._intervalId = setInterval(periodicFunction, 1000);
    }
    releaseResources() {
        clearInterval(this._intervalId);
    }
    get socketId() { return this._socketId; }
}
exports.WebsocketConnection = WebsocketConnection;
WebsocketConnection.acknowledged = "acknowledged";
