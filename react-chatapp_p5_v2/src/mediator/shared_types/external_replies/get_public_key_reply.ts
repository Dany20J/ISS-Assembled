import { BufferImpl } from "../../auth/authenticator"
import { Reply } from "./reply"

export type GetPublicKeyReply = Reply & {
    publicKey: string

}