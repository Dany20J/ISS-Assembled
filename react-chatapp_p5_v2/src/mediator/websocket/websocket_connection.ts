import { connection } from "websocket";
import { JsonState, JsonValidator } from "../json_validator";

import { ConsumedMsgs } from "./consumed_msgs";
import { MsgBuffer } from "./msg_buffer";
import { MsgModel } from "./msg_model";
import { v4 as uuidv4 } from "uuid";
import { SocketMessage } from "../shared_types/socket_message";

export class WebsocketConnection {
  private _serverConnection: WebSocket;
  private _handleMessage: (message: SocketMessage) => void;
  private _disconnectionCallback: () => void;
  private _msgBuffer: MsgBuffer = new MsgBuffer();
  private _consumedMsgs: ConsumedMsgs = new ConsumedMsgs();

  static acknowledged: string = "acknowledged";
  constructor(
    serverConnection: WebSocket,
    handleMessage: (message: SocketMessage) => void,
    disconnectionCallback: () => void
  ) {
    this._serverConnection = serverConnection;
    this._handleMessage = handleMessage;
    this._disconnectionCallback = disconnectionCallback;

    this._listenToSocketCloseEvent();
    this._listenToMessages();
    this._reTransferBuffer();
  }
  private _listenToSocketCloseEvent(): void {
    // this._serverConnection.
    this._serverConnection.onclose = () => {
      this._disconnectionCallback();
    };
  }
  public disconnect(): void {
    this._serverConnection.close();
  }
  private _listenToMessages(): void {
    this._serverConnection.onmessage = (msg: MessageEvent) =>
      this._onMessage(msg.data);
  }
  private _onMessage(msg: string): void {
    console.log(msg);
    let jsonState: JsonState = JsonValidator.isJsonMsg(msg);
    console.log(jsonState.jsonObj);
    if (jsonState.isJson === true) {
      let msgModel: MsgModel = {
        id: jsonState.jsonObj.id,
        data: jsonState.jsonObj.data,
      };

      if (msgModel.data === WebsocketConnection.acknowledged) {
        this._msgBuffer.deleteCopy(msgModel.id);
      } else if (!this._consumedMsgs.isMsgConsumed(msgModel.id)) {
        this._consumedMsgs.addConsumedMsg(msgModel.id);
        this._acknowledgeMsg(msgModel.id);
        this._handleMessage({ data: msgModel.data });
      } else if (this._consumedMsgs.isMsgConsumed(msgModel.id)) {
        this._acknowledgeMsg(msgModel.id);
      }
    } else {
      // TODO SEND ERROR MESSAGE
    }
  }
  private _acknowledgeMsg(id: string): void {
    this._transferMsg({ id: id, data: WebsocketConnection.acknowledged });
  }
  public send(data: string) {
    let msgModel: MsgModel = { data: data, id: uuidv4() };
    this._msgBuffer.saveCopy(msgModel);
    this._transferMsg(msgModel);
  }
  private _transferMsg(msgModel: MsgModel) {
    // if (this._serverConnection.CONNECTING)
    this._serverConnection.send(JSON.stringify(msgModel));
  }

  private _intervalId: NodeJS.Timer | undefined;
  private _reTransferBuffer(): void {
    let periodicFunction: () => void = (): void => {
      let msgs: Array<MsgModel> = this._msgBuffer.getBufferContent();
      for (let msgModel of msgs) this._transferMsg(msgModel);
    };
    this._intervalId = setInterval(periodicFunction, 1000);
  }
  public releaseResources() {
    clearInterval(this._intervalId!);
  }
}
