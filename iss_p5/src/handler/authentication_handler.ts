

import { UserCertificate } from "@prisma/client";
import { createInflate } from "zlib";
import { generateRandomBuffer, _has, _hasList } from "../shared_functions/shared_functions";
import { Certificate, CertificateInfo } from "../shared_types/certificate";
import { Message } from "../shared_types/message";
import { Authenticator } from "../websocket_manager/authenticator";
import { AuthenticatorRepository } from "../websocket_manager/authenticator_repository";
import { WebsocketInfoManager } from "../websocket_manager/websocket_info_manager";
import { ErrorData } from "./error_data";

import { MessageDestinationHandler } from "./message_destination_handler";
import { MessageHandler } from "./message_handler";

export class AuthenticationHandler implements MessageHandler {

    private _messageDestinationHandler: MessageDestinationHandler
    constructor(_messageDestinationHandler: MessageDestinationHandler, private _authRep: AuthenticatorRepository) {
        this._messageDestinationHandler = _messageDestinationHandler
    }
    async handle(message: Message): Promise<void> {
        switch (message.data.event) {
            case 'signOut': {
                let authenticator: Authenticator | undefined = WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId)
                if (authenticator !== undefined) {
                    authenticator.disableAuthentication()

                    authenticator.disableAsymEnc()
                    authenticator.disableAsymDec()

                    authenticator.disableSymEnc()
                    authenticator.disableSymDec()

                    authenticator.disableSigning()
                }
                let data: any = {}
                data.successful = true
                data.event = message.data.event

                this._messageDestinationHandler.handle({ data: data, socketId: message.socketId })
                break
            } case 'getCertificate': {
                this._handleGetCertificate(message)
                break
            }
            case 'setSessionKey': {
                this._handleSetSessionKey(message)
                break
            }
            case 'getSomeCertificate': {
                this._handleGetSomeCertificate(message)
                break
            }

        }
    }
    private async _handleGetCertificate(message: Message) {
        let cer = await this._authRep.getServerCertificate()
        if (cer == null) {
            let errorData: ErrorData = { event: message.data.event, error: "Unknown error.", successful: false }
            message.data = errorData
            this._messageDestinationHandler.handle(message)
            return
        }
        let data: any = {}

        data.successful = true
        data.serverCertificate = {
            certificateInfo: JSON.parse(cer.certificateInfo)
            , certificateSignature: cer.certificateSignature
        } as Certificate
        data.event = message.data.event

        await this._messageDestinationHandler.handle({ data: data, socketId: message.socketId })

        WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId)!.enableAsymDec()
    }
    private async _handleSetSessionKey(message: Message) {
        let errorData: ErrorData = { event: message.data.event, error: "Missing nonEncSessionKey/rejection to use it.", successful: false }

        let authenticator: Authenticator | undefined = WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId)
        if (authenticator !== undefined && _has(message.data, 'nonEncSessionKey')) {

            try {
                // authenticator.setSessionKeyRequest(message.data.encryptedSessionKey)
                authenticator.setNonEncSessionKey(message.data.nonEncSessionKey)
            }
            catch (e) {
                console.log(e)
                message.data = errorData
                this._messageDestinationHandler.handle(message)
                return
            }
            let data: any = {}
            data.successful = true
            data.event = message.data.event
            WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId)!.disableAsymDec()
            WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId)!.enableSymEnc()
            WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId)!.enableSymDec()
            await this._messageDestinationHandler.handle({ data: data, socketId: message.socketId })

        }
        else {
            message.data = errorData
            this._messageDestinationHandler.handle(message)

        }
    }
    private async _handleGetSomeCertificate(message: Message) {
        if (_hasList(message.data, ['phoneNumber'])) {
            let certificate: UserCertificate | null = await this._authRep.getUserCertificateByPhoneNumber(message.data.phoneNumber)
            if (certificate != null) {
                let certificateInfo = JSON.parse(certificate.certificateInfo) as CertificateInfo
                let data: any = {}
                data.successful = true
                data.event = message.data.event
                data.certificate = {
                    certificateInfo: {
                        caName: certificateInfo.caName,
                        phoneNumber: certificateInfo.phoneNumber,
                        publicKey: certificateInfo.publicKey
                    },
                    certificateSignature: certificate.certificateSignature
                } as Certificate
                message.data = data
                await this._messageDestinationHandler.handle(message)
                return
            }


        }

        let errorData: ErrorData = { event: message.data.event, error: "Missing phoneNumber/unknown error.", successful: false }
        message.data = errorData
        this._messageDestinationHandler.handle(message)

    }
}