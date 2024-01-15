import { Certificate } from "../certificate"
import { Reply } from "./reply"

export type GetCertificateReply = Reply & {
    serverCertificate: Certificate
}