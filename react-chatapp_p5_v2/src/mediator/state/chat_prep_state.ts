import { AuthenticatorRepository } from "../auth/authentication_repository";
import Authenticator from "../auth/authenticator";
import { AllChatState } from "../shared_types/chat_message_state";
import { GetChatsHistoryReply } from "../shared_types/external_replies/get_chats_history_reply";
import { GetMessagesHistoryReply } from "../shared_types/external_replies/get_messages_history_reply";
import { Reply } from "../shared_types/external_replies/reply";
import { SignInRequest } from "../shared_types/internal_requests/sign_in_request";
import { MessageEvent } from "../shared_types/message_event";
import { StateGUIMediator } from "../state_gui_mediator/state_gui_mediator";
import { State } from "./state";

export class ChatPrepState extends State {
  private _toFillChatNum: number = 0;
  private _chatNumCnt: number = 0;
  private _allChatState: AllChatState;
  private _myPhoneNumber = "";
  constructor(med: StateGUIMediator, private _authRep: AuthenticatorRepository) {
    super(med);
    this._allChatState = {
      chatList: [],
    };
  }
  public notifyAsSet(event: any): void {
    this._allChatState = {
      chatList: [],
    };
    this._myPhoneNumber = event.myPhoneNumber;
    this.med.sendExternalMsg({
      event: "chatSubscription",
    });
  }
  public applyExternalEvent(event: any): void {}

  public receiveChatSubscriptionReply(reply: Reply) {
    if (reply.successful) {
      this.med.sendExternalMsg({
        event: "getChatsHistory",
      });
    } else {
    }
  }

  public receiveGetChatsHistoryReply(reply: GetChatsHistoryReply) {
    if (reply.successful) {
      this._toFillChatNum = reply.chatHistory.chatInfoList.length;
      if (this._toFillChatNum === 0) {
        this.med.changeState(this.med.chatState, {
          allChatState: this._allChatState,
          myPhoneNumber: this._myPhoneNumber,
        });
      }
      for (let chat of reply.chatHistory.chatInfoList) {
        this._allChatState.chatList.push({
          chatId: chat.chatId,
          chatMessagesList: [],
          yourPhoneNumber: chat.User_You.phoneNumber,
          otherPhoneNumber:
            chat.User_1.phoneNumber == chat.User_You.phoneNumber
              ? chat.User_2.phoneNumber
              : chat.User_1.phoneNumber,
        });
        this.med.sendExternalMsg({
          event: "getMessagesHistory",
          chatId: chat.chatId,
        });
      }
    } else {
    }
  }
  public receiveGetMessagesHistory(reply: GetMessagesHistoryReply) {
    if (reply.successful) {
      this._chatNumCnt++;
      for (let message of reply.messageInfoList) {
        for (let chatState of this._allChatState.chatList) {
          if (chatState.chatId == message.chatId) {
            let senderPhoneNumber: string;
            let receiverPhoneNumber: string;
            if (message.User.phoneNumber == chatState.yourPhoneNumber) {
              senderPhoneNumber = chatState.yourPhoneNumber;
              receiverPhoneNumber = chatState.otherPhoneNumber;
            } else {
              senderPhoneNumber = chatState.otherPhoneNumber;
              receiverPhoneNumber = chatState.yourPhoneNumber;
            }
           
            chatState.chatMessagesList.push({
              message: message.message,
              messageId: message.messageId,
              time: message.time,
              senderPhoneNumber: senderPhoneNumber,
              receiverPhoneNumber: receiverPhoneNumber,
            });
          }
        }
      }
    } else {
    }
    if (this._chatNumCnt == this._toFillChatNum) {
      this.med.changeState(this.med.chatState, {
        allChatState: this._allChatState,
        myPhoneNumber: this._myPhoneNumber,
      });
    }
  }

  public receiveMessageEvent(message: MessageEvent) {
    let found: boolean = false;
    for (let chatState of this._allChatState.chatList) {
      if (chatState.chatId == message.chatId) {
        chatState.chatMessagesList.push({
          message: message.message,
          messageId: message.messageId,
          time: message.time,
          senderPhoneNumber: message.senderPhoneNumber,
          receiverPhoneNumber: message.receiverPhoneNumber
        });
      }
      found = true
    }
    if (!found) {
      this._allChatState.chatList.push({
        chatId: message.chatId,
        chatMessagesList: [
          {
            message: message.message,
            messageId: message.messageId,
            time: message.time,
            senderPhoneNumber: message.senderPhoneNumber,
            receiverPhoneNumber: message.receiverPhoneNumber,
          },
        ],
        yourPhoneNumber: this._myPhoneNumber,
        otherPhoneNumber:
          message.receiverPhoneNumber == this._myPhoneNumber
            ? message.senderPhoneNumber
            : message.receiverPhoneNumber,
      });
    }
  }
}
