"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationHandler = void 0;
const shared_functions_1 = require("../shared_functions/shared_functions");
const websocket_info_manager_1 = require("../websocket_manager/websocket_info_manager");
class AuthenticationHandler {
    constructor(_messageDestinationHandler, _authRep) {
        this._authRep = _authRep;
        this._messageDestinationHandler = _messageDestinationHandler;
    }
    async handle(message) {
        switch (message.data.event) {
            case 'signOut': {
                let authenticator = websocket_info_manager_1.WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId);
                if (authenticator !== undefined) {
                    authenticator.disableAuthentication();
                    authenticator.disableAsymEnc();
                    authenticator.disableAsymDec();
                    authenticator.disableSymEnc();
                    authenticator.disableSymDec();
                    authenticator.disableSigning();
                }
                let data = {};
                data.successful = true;
                data.event = message.data.event;
                this._messageDestinationHandler.handle({ data: data, socketId: message.socketId });
                break;
            }
            case 'getCertificate': {
                this._handleGetCertificate(message);
                break;
            }
            case 'setSessionKey': {
                this._handleSetSessionKey(message);
                break;
            }
            case 'getSomeCertificate': {
                this._handleGetSomeCertificate(message);
                break;
            }
        }
    }
    async _handleGetCertificate(message) {
        let cer = await this._authRep.getServerCertificate();
        if (cer == null) {
            let errorData = { event: message.data.event, error: "Unknown error.", successful: false };
            message.data = errorData;
            this._messageDestinationHandler.handle(message);
            return;
        }
        let data = {};
        data.successful = true;
        data.serverCertificate = {
            certificateInfo: JSON.parse(cer.certificateInfo),
            certificateSignature: cer.certificateSignature
        };
        data.event = message.data.event;
        await this._messageDestinationHandler.handle({ data: data, socketId: message.socketId });
        websocket_info_manager_1.WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId).enableAsymDec();
    }
    async _handleSetSessionKey(message) {
        let errorData = { event: message.data.event, error: "Missing nonEncSessionKey/rejection to use it.", successful: false };
        let authenticator = websocket_info_manager_1.WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId);
        if (authenticator !== undefined && (0, shared_functions_1._has)(message.data, 'nonEncSessionKey')) {
            try {
                // authenticator.setSessionKeyRequest(message.data.encryptedSessionKey)
                authenticator.setNonEncSessionKey(message.data.nonEncSessionKey);
            }
            catch (e) {
                console.log(e);
                message.data = errorData;
                this._messageDestinationHandler.handle(message);
                return;
            }
            let data = {};
            data.successful = true;
            data.event = message.data.event;
            websocket_info_manager_1.WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId).disableAsymDec();
            websocket_info_manager_1.WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId).enableSymEnc();
            websocket_info_manager_1.WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId).enableSymDec();
            await this._messageDestinationHandler.handle({ data: data, socketId: message.socketId });
        }
        else {
            message.data = errorData;
            this._messageDestinationHandler.handle(message);
        }
    }
    async _handleGetSomeCertificate(message) {
        if ((0, shared_functions_1._hasList)(message.data, ['phoneNumber'])) {
            let certificate = await this._authRep.getUserCertificateByPhoneNumber(message.data.phoneNumber);
            if (certificate != null) {
                let certificateInfo = JSON.parse(certificate.certificateInfo);
                let data = {};
                data.successful = true;
                data.event = message.data.event;
                data.certificate = {
                    certificateInfo: {
                        caName: certificateInfo.caName,
                        phoneNumber: certificateInfo.phoneNumber,
                        publicKey: certificateInfo.publicKey
                    },
                    certificateSignature: certificate.certificateSignature
                };
                message.data = data;
                await this._messageDestinationHandler.handle(message);
                return;
            }
        }
        let errorData = { event: message.data.event, error: "Missing phoneNumber/unknown error.", successful: false };
        message.data = errorData;
        this._messageDestinationHandler.handle(message);
    }
}
exports.AuthenticationHandler = AuthenticationHandler;
