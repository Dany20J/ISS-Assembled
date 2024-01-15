import { AuthenticationInfo } from "./authentication_info";


export type Message = {
    data: any,
    authenticationInfo?: AuthenticationInfo,
    socketId: string,
}