
import { Message } from "../shared_types/message";
import { SocketStateInfo } from "../websocket_manager/websocket_info_manager";


export class SocketsStateHandler implements Handler<SocketStateInfo> {
    private _listeners: Array<Handler<Message>> = []
    public handle(socketStateHandler: SocketStateInfo): void {
        let message: Message ={
            authenticationInfo: socketStateHandler.authenticationInfo,
            socketId: socketStateHandler.socketId,
            data: {
                "event": "state",
                "state": socketStateHandler.state
            }
        }
        for(const listener of this._listeners) {
            listener.handle(message)
        }
    }
    public addListener(listener: Handler<Message>): void {
        this._listeners.push(listener)
    }

}