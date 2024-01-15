import { SocketMessage } from "./shared_types/socket_message";
import { WebsocketConnection } from "./websocket/websocket_connection";

export class Client {
  private _serverWebsocket: WebSocket | undefined;
  private _socketConnection: WebsocketConnection | undefined;
  public _routeMessage: ((message: SocketMessage) => void) | undefined;
  public _notifyOfOpening: (() => void) | undefined;

  public connect() {
    this._serverWebsocket = new WebSocket("ws://localhost:5000");

    this._serverWebsocket.onopen = (event) => {
      this._socketConnection = new WebsocketConnection(
        this._serverWebsocket!,
        (message: SocketMessage) => {
          this._handleMessage(message);
        },
        this._disconnectionCallback
      );
      if(this._notifyOfOpening !== undefined)
        this._notifyOfOpening()

    };
  }
  private _handleMessage(message: SocketMessage) {
    this._routeMessage!(message);
  }

    public setNotifyOfOpening(notifyOfOpening: (() => void) | undefined) {
      this._notifyOfOpening = notifyOfOpening
    }
  public setRouteMessage(routeMessage: ((message: any) => void) | undefined) {
    this._routeMessage = routeMessage;
  }
  private _disconnectionCallback() {}

  public send(data: any) {
    if (this._socketConnection !== undefined)
      this._socketConnection?.send(data);
  }
}
