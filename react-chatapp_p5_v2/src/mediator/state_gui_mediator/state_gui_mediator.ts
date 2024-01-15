import { AuthenticatorRepository } from "../auth/authentication_repository";
import Authenticator from "../auth/authenticator";
import { Client } from "../client";
import { SendMessageRequest } from "../shared_types/internal_requests/send_message_request";
import { SignInRequest } from "../shared_types/internal_requests/sign_in_request";
import { SignOutRequest } from "../shared_types/internal_requests/sign_out_request";
import { SignUpRequest } from "../shared_types/internal_requests/sign_up_request";
import { SocketMessage } from "../shared_types/socket_message";
import ChatState from "../state/chat_state";
import { ChatPrepState } from "../state/chat_prep_state";
import { StartingState } from "../state/starting_state";
import { State } from "../state/state";

export class StateGUIMediator {
  CSRDone() {

  }
  public callbacks = {} as {
    loginSuccessCallback: any;
    refreshChatStateCallback: any;
    signUpCallback: any;
    sendMessageCallback: any;
  };

  private _currentState: State | undefined;
  public startingState: StartingState;
  public chatPrepState: ChatPrepState;
  public chatState: ChatState;

  private _authenticator: Authenticator
  private _authRep: AuthenticatorRepository

  constructor(_client?: Client);

  constructor(private _client: Client) {


    this._authRep = new AuthenticatorRepository()
    this._authenticator = new Authenticator(this._authRep)
    this.startingState = new StartingState(this, this._authRep, this._authenticator);
    this.chatPrepState = new ChatPrepState(this, this._authRep);
    this.chatState = new ChatState(this, this._authenticator, this._authRep);

    this._client.setRouteMessage(async (message: SocketMessage) => {
      if (await this._authenticator.handle(message) == false) {
        console.log("INValid message from server")
        return
      }
      this.applyExternalEvent(message)
    });
    this._client.setNotifyOfOpening(() => {
      this.changeState(this.startingState, undefined)
      // this.changeState(this.preStartingState, undefined)
    })
  }

  public applyExternalEvent(event: any): void {
    event = event.data
    switch (event.event) {
      case "getChatsHistory": {
        if (this._currentState instanceof ChatPrepState) {
          this._currentState.receiveGetChatsHistoryReply({
            chatHistory: event.chatHistory,
            successful: event.successful,
            error: event.error,
          });
        }
        break;
      }
      case "chatSubscription": {
        if (this._currentState instanceof ChatPrepState) {
          this._currentState.receiveChatSubscriptionReply({
            successful: event.successful,
            error: event.error,
          });
        }

        break;
      }
      case "getMessagesHistory": {
        if (this._currentState instanceof ChatPrepState) {
          this._currentState.receiveGetMessagesHistory({
            messageInfoList: event.chatMessagesHistory.messageInfoList,
            successful: event.successful,
            error: event.error,
          });
        }

        break;
      }
      case "sendMessage": {
        if (this._currentState instanceof ChatState) {
          this._currentState.receiveSendMessageReply({
            successful: event.successful,
            error: event.error,
          });
          // just success message
        }

        break;
      }
      case "message": {
        if (
          this._currentState instanceof ChatState ||
          this._currentState instanceof ChatPrepState
        ) {
          this._currentState.receiveMessageEvent({
            messageId: event.messageId,
            message: event.message,
            senderPhoneNumber: event.senderPhoneNumber,
            receiverPhoneNumber: event.receiverPhoneNumber,
            time: event.time,
            chatId: event.chatId,
          });
        }

        break;
      }
      case "signIn": {
        if (this._currentState instanceof StartingState) {
          this._currentState.receiveSignIn({
            successful: event.successful,
            error: event.error,
          });
        }

        break;
      }
      case "signUp": {
        if (this._currentState instanceof StartingState) {
          this._currentState.receiveSignUp({
            successful: event.successful,
            error: event.error,
          });
        }

        break;
      }
      case "signOut": {
        if (this._currentState instanceof ChatState) {
          this._currentState.receiveSignOutResponse({
            successful: event.successful,
            error: event.error,
          });
        }
        break;
      }
      case 'getCertificate': {
        if (this._currentState instanceof StartingState) {
          this._currentState.receiveGetCertificateReply({
            successful: event.successful,
            error: event.error,
            serverCertificate: event.serverCertificate
          });
        }
        break;
      }
      case 'getSomeCertificate': {
        if (this._currentState instanceof ChatState) {
          this._currentState.receiveGetSomeCertificate({
            successful: event.successful,
            error: event.error,
            certificate: event.certificate
          });
        }
        break;
      }
    }
  }

  public signIn(request: SignInRequest) {
    if (this._currentState instanceof StartingState) {
      console.log(request)

      this._currentState.signIn(request);
    }
  }
  public signUp(request: SignUpRequest) {
    if (this._currentState instanceof StartingState) {
      this._currentState.signUp(request);
    }
  }
  public signOut(request: SignOutRequest) {
    if (this._currentState instanceof ChatState) {
      this._currentState.signOut(request);
    }
  }
  public sendMessage(request: SendMessageRequest) {
    if (this._currentState instanceof ChatState) {
      this._currentState.sendMessage(request);
    }
  }
  public postCSR(request: { phoneNumber: string }) {
    if (this._currentState instanceof StartingState) {
      this._currentState.postCSR(request.phoneNumber)
    }
  }
  public async sendExternalMsg(message: any) {

    message = await this._authenticator.handleOnGoing(message)
    this._client.send(message);
  }
  public changeState(newState: State, event: any) {
    console.log(newState)
    this._currentState = newState;
    this._currentState.notifyAsSet(event);
  }
}
