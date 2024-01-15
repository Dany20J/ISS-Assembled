"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountServicesHandler = void 0;
const shared_functions_1 = require("../shared_functions/shared_functions");
const websocket_info_manager_1 = require("../websocket_manager/websocket_info_manager");
class AccountServicesHandler {
    constructor(account, _messageDestinationHandler) {
        this._account = account;
        this._messageDestinationHandler = _messageDestinationHandler;
    }
    handle(message) {
        switch (message.data.event) {
            case 'signIn':
                this._handleSignIn(message);
                break;
            case 'signUp':
                this._handleSignUp(message);
                break;
        }
    }
    async _handleSignIn(message) {
        let signInMessage = this._toSignInMessage(message);
        if (signInMessage === undefined) {
            let errorData = { event: message.data.event, error: "Missing phoneNumber/password.", successful: false };
            message.data = errorData;
            this._messageDestinationHandler.handle(message);
            return;
        }
        let signInReply = await this._account.signIn(signInMessage);
        if (signInReply.successful === false) {
            let errorData = { event: message.data.event, error: signInReply.error, successful: false };
            message.data = errorData;
            this._messageDestinationHandler.handle(message);
        }
        else {
            message.data = { event: message.data.event };
            message.data.successful = true;
            await this._messageDestinationHandler.handle(message);
            websocket_info_manager_1.WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId)?.authenticate({ phoneNumber: signInMessage.phoneNumber });
            websocket_info_manager_1.WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId)?.enableSigning();
        }
    }
    _toSignInMessage(message) {
        let data = message.data;
        if ((0, shared_functions_1._has)(data, 'password') && (0, shared_functions_1._has)(data, 'phoneNumber'))
            return { phoneNumber: message.data.phoneNumber, password: message.data.password };
        return undefined;
    }
    async _handleSignUp(message) {
        let signUpMessage = this._toSignUpMessage(message);
        if (signUpMessage === undefined) {
            let errorData = { event: message.data.event, error: "Missing password/phoneNumber/publicKey.", successful: false };
            message.data = errorData;
            this._messageDestinationHandler.handle(message);
            return;
        }
        let signUpReply = await this._account.signUp(signUpMessage);
        if (signUpReply.successful === false) {
            let errorData = { event: message.data.event, error: signUpReply.error, successful: false };
            message.data = errorData;
            this._messageDestinationHandler.handle(message);
        }
        else {
            message.data = { event: message.data.event };
            message.data.successful = signUpReply.successful;
            this._messageDestinationHandler.handle(message);
        }
    }
    _toSignUpMessage(message) {
        let data = message.data;
        if ((0, shared_functions_1._has)(data, 'phoneNumber') && (0, shared_functions_1._has)(data, 'password') && (0, shared_functions_1._has)(data, 'certificate')) {
            let certificate = data.certificate;
            let certificateInfo = certificate.certificateInfo;
            return {
                phoneNumber: data.phoneNumber, password: data.password, certificate: {
                    certificateInfo: {
                        caName: certificateInfo.caName,
                        phoneNumber: certificateInfo.phoneNumber,
                        publicKey: certificateInfo.publicKey,
                    },
                    certificateSignature: certificate.certificateSignature
                }
            };
            // {
            //     certificateInfo: {
            //         caName: data.certificate.certificateInfo
            //     },
            //     certificateSignature: data.certificate.certificateSignature
            // }
        }
        return undefined;
    }
}
exports.AccountServicesHandler = AccountServicesHandler;
