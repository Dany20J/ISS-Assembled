import { indexOf } from "typescript-collections/dist/lib/arrays";
import { AuthenticatorRepository } from "../auth/authentication_repository";
import Authenticator from "../auth/authenticator";
import { Certificate } from "../shared_types/certificate";
import { AllChatState } from "../shared_types/chat_message_state";
import { Reply } from "../shared_types/external_replies/reply";
import { SendMessageRequest } from "../shared_types/internal_requests/send_message_request";
import { SignOutRequest } from "../shared_types/internal_requests/sign_out_request";
import { MessageEvent } from "../shared_types/message_event";
import { StateGUIMediator } from "../state_gui_mediator/state_gui_mediator";
import { State } from "./state";

type QueueOfSendMessagesInfo = {
  queue: Array<SendMessageRequest>
}


type AllMessagesInfoISent = {
  allInfo: Array<MessagesInfoOfOneISent>
}
type MessagesInfoOfOneISent = {
  sendToPhoneNumber: string,
  messages: Array<MessageISent>
}
type MessageISent = {
  message: string,
  encMessage: string
}

type AllMessageEvents = {
  allEvents: Array<MessageEvent>
}

export default class ChatState extends State {
  private _allChatState: AllChatState;
  private _NonDecAllChatState: AllChatState;
  private _myPhoneNumber = "";
  private _queue: QueueOfSendMessagesInfo = { queue: [] }
  private _messagesWithEncSent: AllMessagesInfoISent = { allInfo: [] }
  private _allMessagesEvents: AllMessageEvents = { allEvents: [] }
  private _othersCertificates: any = {}
  constructor(med: StateGUIMediator, private _auth: Authenticator, private _authRep: AuthenticatorRepository) {
    super(med);
    this._NonDecAllChatState = {
      chatList: [],
    };
    this._allChatState = {
      chatList: [],
    };
    this._myPhoneNumber = "";

  }
  public async notifyAsSet(event: any) {
    this._NonDecAllChatState = event.allChatState;
    this._myPhoneNumber = event.myPhoneNumber;
    for (let ch of this._NonDecAllChatState.chatList) {
      this.med.sendExternalMsg({
        event: 'getSomeCertificate',
        phoneNumber: ch.otherPhoneNumber
      })
    }

    // this.med.callbacks.refreshChatStateCallback(
    //   this._allChatState,
    //   this._myPhoneNumber
    // );
  }
  public applyExternalEvent(event: any): void {
    throw new Error("Method not implemented.");
  }

  public signOut(request: SignOutRequest) {
    this.med.sendExternalMsg({
      event: "signOut",
    });
  }
  public receiveSignOutResponse(reply: Reply) {
    if (reply.successful) {
      this.med.changeState(this.med.startingState, undefined);
    }
  }


  public async sendMessage(request: SendMessageRequest) {

    // if (this._allChatState.chatList.length < this._NonDecAllChatState.chatList.length)
    //   return
    this.med.sendExternalMsg({
      event: 'getSomeCertificate',
      phoneNumber: request.sendToPhoneNumber
    })

    this._queue.queue.push({
      message: request.message,
      sendToPhoneNumber: request.sendToPhoneNumber
    })

  }
  public async receiveGetSomeCertificate(reply: Reply & { certificate?: Certificate }) {

    if (reply.successful == false || reply.certificate == undefined) {
      return
    }
    let cert = reply.certificate
    let res = await this._auth.verifiyCertificate(cert, this._auth.caPublicKey)
    if (res == false)
      return
    this._othersCertificates[cert.certificateInfo.phoneNumber] = cert

    this._reduceSendMessageRequests(cert)
    this._reduceMessageEvents(cert)
    this._reduceNonDecChatList(cert)
  }

  /*
  save sendrequests
    -- send certificate request
  save message events
    -- send certificate request 
  receive certificate requests
   -- reduce message events
      -- as to encrypt messages and to save messages i sent
   -- reduce sendrequests
      -- as to send messages with enc
    


  */
  private _getMessageOfEnc(sendToPhoneNumber: string, encMessage: string) {
    for (let info of this._messagesWithEncSent.allInfo) {
      if (info.sendToPhoneNumber == sendToPhoneNumber) {
        for (let msgEnc of info.messages) {
          if (msgEnc.encMessage == encMessage)
            return msgEnc.message
        }
      }
    }
    return ''
  }
  private _addSentMessageWithEnc(message: string, enc: string, sendToPhoneNumber: string) {
    let found = false
    for (let info of this._messagesWithEncSent.allInfo) {
      if (sendToPhoneNumber == info.sendToPhoneNumber) {
        info.messages.push({ message: message, encMessage: enc })
        found = true
        break

      }
    }

    if (!found) {
      this._messagesWithEncSent.allInfo.push({
        sendToPhoneNumber: sendToPhoneNumber,
        messages: [{ message: message, encMessage: enc }]
      })
    }
  }
  private async _reduceSendMessageRequests(cert: Certificate) {
    let newQ: Array<SendMessageRequest> = []
    for (let sdInfo of this._queue.queue) {
      if (sdInfo.sendToPhoneNumber == cert.certificateInfo.phoneNumber) {
        let endToEnd = await this._auth.ecryptWithPublicKey(cert.certificateInfo.publicKey, sdInfo.message)
        let mySignature = await this._auth.signData(sdInfo.message)
        this.med.sendExternalMsg({
          event: "sendMessage",
          message: endToEnd + "$" + mySignature,
          sendToPhoneNumber: sdInfo.sendToPhoneNumber,
        })
        this._addSentMessageWithEnc(sdInfo.message, endToEnd + "$" + mySignature, sdInfo.sendToPhoneNumber)
      }
      else {
        newQ.push({
          sendToPhoneNumber: sdInfo.sendToPhoneNumber,
          message: sdInfo.message
        })
      }
    }
    this._queue.queue = newQ
  }
  private async _reduceMessageEvents(cert: Certificate) {

    let newMessagesEvents: AllMessageEvents = { allEvents: [] }
    for (let message of this._allMessagesEvents.allEvents) {
      if (message.receiverPhoneNumber == cert.certificateInfo.phoneNumber || message.senderPhoneNumber == cert.certificateInfo.phoneNumber) {

        let found: boolean = false;
        for (let chatState of this._allChatState.chatList) {
          if (chatState.chatId == message.chatId) {
            found = true
            if (message.senderPhoneNumber == this._myPhoneNumber) {
              message.message = this._getMessageOfEnc(message.receiverPhoneNumber, message.message)
              this._authRep.saveMessage(this._myPhoneNumber, message.messageId, message.message)
            }
            else {
              let splitMessage = message.message.split("$")
              let enc = splitMessage[0], signature = splitMessage[1]
              let dec = await this._auth.decryptWithPrivateKey(this._auth.getMyPrivateKey()!, enc)
              let isValid = await this._auth.verifySignature(cert.certificateInfo.publicKey, dec, signature)
              if (isValid)
                message.message = dec
              else
                continue
              // message.message = await this._auth.decryptWithPrivateKey(this._auth.getMyPrivateKey()!, message.message)
            }
            chatState.chatMessagesList.push({
              message: message.message,
              messageId: message.messageId,
              time: message.time,
              senderPhoneNumber: message.senderPhoneNumber,
              receiverPhoneNumber: message.receiverPhoneNumber,
            });
          }
        }

        if (!found) {
          if (message.senderPhoneNumber == this._myPhoneNumber) {
            message.message = this._getMessageOfEnc(message.receiverPhoneNumber, message.message)
            this._authRep.saveMessage(this._myPhoneNumber, message.messageId, message.message)
          }
          else {
            let splitMessage = message.message.split("$")
            let enc = splitMessage[0], signature = splitMessage[1]
            let dec = await this._auth.decryptWithPrivateKey(this._auth.getMyPrivateKey()!, enc)
            let isValid = await this._auth.verifySignature(cert.certificateInfo.publicKey, dec, signature)
            if (isValid)
              message.message = dec
            else
              continue
            // message.message = await this._auth.decryptWithPrivateKey(this._authRep.getMyPrivateKey(this._myPhoneNumber)!, message.message)
          }
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
      else {
        newMessagesEvents.allEvents.push(message)
      }
    }
    this._allMessagesEvents = newMessagesEvents


    this.med.callbacks.refreshChatStateCallback(
      this._allChatState,
      this._myPhoneNumber
    );
  }

  private async _reduceNonDecChatList(cert: Certificate) {
    for (let chatState of this._NonDecAllChatState.chatList) {
      if (chatState.otherPhoneNumber == cert.certificateInfo.phoneNumber) {
        for (let chatMessage of chatState.chatMessagesList) {
          if (chatMessage.senderPhoneNumber == this._myPhoneNumber) {
            let possible = this._authRep.getMessage(this._myPhoneNumber, chatMessage.messageId)
            if (possible != null)
              chatMessage.message = possible
          }
          else {
            let splitMessage = chatMessage.message.split("$")
            let enc = splitMessage[0], signature = splitMessage[1]
            let dec = await this._auth.decryptWithPrivateKey(this._auth.getMyPrivateKey()!, enc)
            let isValid = await this._auth.verifySignature(cert.certificateInfo.publicKey, dec, signature)
            if (isValid)
            chatMessage.message = dec
            else
              continue
            // chatMessage.message = await this._auth.decryptWithPrivateKey(this._auth.getMyPrivateKey()!, chatMessage.message)
          }
        }
        this._allChatState.chatList.push(chatState)
      }
    }
    this.med.callbacks.refreshChatStateCallback(
      this._allChatState,
      this._myPhoneNumber
    );
    this._NonDecAllChatState.chatList = []

  }
  // private async 3344334453
  public async receiveMessageEvent(message: MessageEvent) {
    this.med.sendExternalMsg({
      event: 'getSomeCertificate',
      phoneNumber: message.senderPhoneNumber == this._myPhoneNumber ? message.receiverPhoneNumber : message.senderPhoneNumber
    })
    this._allMessagesEvents.allEvents.push(message)
    // let found: boolean = false;
    // for (let chatState of this._allChatState.chatList) {
    //   if (chatState.chatId == message.chatId) {
    //     if (message.senderPhoneNumber == this._myPhoneNumber) {
    //       message.message = this._lastMessage
    //     }
    //     else {
    //       message.message = await this._auth.decryptWithPrivateKey(this._auth.getMyPrivateKey()!, message.message)

    //     }
    //     chatState.chatMessagesList.push({
    //       message: message.message,
    //       messageId: message.messageId,
    //       time: message.time,
    //       senderPhoneNumber: message.senderPhoneNumber,
    //       receiverPhoneNumber: message.receiverPhoneNumber,
    //     });
    //   }
    //   found = true
    // }
    // if (!found) {
    //   this.med.sendExternalMsg({
    //     event: 'getSomeCertificate',
    //     phoneNumber: message.receiverPhoneNumber == this._myPhoneNumber
    //       ? message.senderPhoneNumber
    //       : message.receiverPhoneNumber
    //   })
    //   if (message.senderPhoneNumber == this._myPhoneNumber)
    //     message.message = this._lastMessage
    //   else {
    //     message.message = await this._auth.decryptWithPrivateKey(this._authRep.getMyPrivateKey(this._myPhoneNumber)!, message.message)
    //   }
    //   this._allChatState.chatList.push({
    //     chatId: message.chatId,
    //     chatMessagesList: [
    //       {
    //         message: message.message,
    //         messageId: message.messageId,
    //         time: message.time,
    //         senderPhoneNumber: message.senderPhoneNumber,
    //         receiverPhoneNumber: message.receiverPhoneNumber,
    //       },
    //     ],
    //     yourPhoneNumber: this._myPhoneNumber,
    //     otherPhoneNumber:
    //       message.receiverPhoneNumber == this._myPhoneNumber
    //         ? message.senderPhoneNumber
    //         : message.receiverPhoneNumber,
    //   });
    // }
    // // gui set
    // this.med.callbacks.refreshChatStateCallback(
    //   this._allChatState,
    //   this._myPhoneNumber
    // );
  }
  public receiveSendMessageReply(reply: Reply) {
    this.med.callbacks.sendMessageCallback(reply);
  }
}