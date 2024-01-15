import { Account, SignInMessage, SignInReply, SignUpMessage, SignUpReply } from "../account/account";
import { Message } from "../shared_types/message";
import { _has, _hasList } from "../shared_functions/shared_functions";
import { ErrorData } from "./error_data";
import { MessageDestinationHandler } from "./message_destination_handler";
import { MessageHandler } from "./message_handler";
import { WebsocketInfoManager } from "../websocket_manager/websocket_info_manager";



export class AccountServicesHandler implements MessageHandler {
    private _account: Account;
    private _messageDestinationHandler: MessageDestinationHandler
    constructor(account: Account, _messageDestinationHandler: MessageDestinationHandler) {
        this._account = account
        this._messageDestinationHandler = _messageDestinationHandler

    }
    public handle(message: Message): void {
        switch (message.data.event) {
            case 'signIn':
                this._handleSignIn(message)
                break;
            case 'signUp':
                this._handleSignUp(message)
                break;

        }
    }
    private async _handleSignIn(message: Message): Promise<void> {

        let signInMessage: SignInMessage | undefined = this._toSignInMessage(message)
        if (signInMessage === undefined) {
            let errorData: ErrorData = { event: message.data.event, error: "Missing phoneNumber/password.", successful: false }
            message.data = errorData
            this._messageDestinationHandler.handle(message)
            return
        }
        let signInReply: SignInReply = await this._account.signIn(signInMessage)
        if (signInReply.successful === false) {
            let errorData: ErrorData = { event: message.data.event, error: signInReply.error!, successful: false }
            message.data = errorData
            this._messageDestinationHandler.handle(message)
        }
        else {
            message.data = { event: message.data.event }
            message.data.successful = true
            await this._messageDestinationHandler.handle(message)
            WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId)?.authenticate({ phoneNumber: signInMessage.phoneNumber })
            WebsocketInfoManager.getInstance().getAuthenticatorBySocketId(message.socketId)?.enableSigning()

        }
    }
    private _toSignInMessage(message: Message): SignInMessage | undefined {
        let data: any = message.data
        if (_has(data, 'password') && _has(data, 'phoneNumber'))
            return { phoneNumber: message.data.phoneNumber, password: message.data.password }
        return undefined
    }
    private async _handleSignUp(message: Message): Promise<void> {
        let signUpMessage: SignUpMessage | undefined = this._toSignUpMessage(message)
        if (signUpMessage === undefined) {
            let errorData: ErrorData = { event: message.data.event, error: "Missing password/phoneNumber/publicKey.", successful: false }
            message.data = errorData
            this._messageDestinationHandler.handle(message)
            return
        }
        let signUpReply: SignUpReply = await this._account.signUp(signUpMessage)
        if (signUpReply.successful === false) {
            let errorData: ErrorData = { event: message.data.event, error: signUpReply.error!, successful: false }
            message.data = errorData
            this._messageDestinationHandler.handle(message)
        }
        else {

            message.data = { event: message.data.event }
            message.data.successful = signUpReply.successful
            this._messageDestinationHandler.handle(message)
        }

    }
    private _toSignUpMessage(message: Message): SignUpMessage | undefined {
        let data: any = message.data
        if (_has(data, 'phoneNumber') && _has(data, 'password') && _has(data, 'certificate')) {
            let certificate = data.certificate
            let certificateInfo = certificate.certificateInfo
            return {
                phoneNumber: data.phoneNumber, password: data.password, certificate: {
                    certificateInfo: {
                        caName: certificateInfo.caName,
                        phoneNumber: certificateInfo.phoneNumber,
                        publicKey: certificateInfo.publicKey,
                    },
                    certificateSignature: certificate.certificateSignature
                }
            }
            // {
            //     certificateInfo: {
            //         caName: data.certificate.certificateInfo
            //     },
            //     certificateSignature: data.certificate.certificateSignature
            // }
        }
        return undefined
    }


}