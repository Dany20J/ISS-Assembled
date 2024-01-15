import { AuthenticatorRepository } from "../auth/authentication_repository";
import Authenticator from "../auth/authenticator";
import { Certificate } from "../shared_types/certificate";
import { GetCertificateReply } from "../shared_types/external_replies/get_certificate_reply";
import { Reply } from "../shared_types/external_replies/reply";
import { SignInReply } from "../shared_types/external_replies/sign_in_reply";
import { SignUpReply } from "../shared_types/external_replies/sign_up_reply";
import { SignInRequest } from "../shared_types/internal_requests/sign_in_request";
import { SignUpRequest } from "../shared_types/internal_requests/sign_up_request";
import { StateGUIMediator } from "../state_gui_mediator/state_gui_mediator";
import { State } from "./state";

export class StartingState extends State {
  private _myPhoneNumber: string = "";
  constructor(med: StateGUIMediator, private _authRep: AuthenticatorRepository, private _authenticator: Authenticator) {
    super(med);
  }
  public notifyAsSet(event: any): void {
    // gui callback start sign in/up page
    this.med.sendExternalMsg({
      event: 'getCertificate',

    })
  }
  public applyExternalEvent(event: any): void {
    throw new Error("Method not implemented.");
  }

  public signIn(request: SignInRequest) {

    this._myPhoneNumber = request.phoneNumber
    this._authenticator.setMyPhoneNumber(request.phoneNumber)

    this.med.sendExternalMsg({
      event: "signIn",
      phoneNumber: request.phoneNumber,
      password: request.password,
    });
  }
  public signUp(request: SignUpRequest) {
    this._authenticator.setMyPhoneNumber(request.phoneNumber)
    this._authenticator.generatePublicPrivateIfNot()
    let certificate: Certificate = JSON.parse(this._authRep.getClientCertificate(request.phoneNumber)!)
    // let certificate: Certificate = this._authRep.clientCert!

    this.med.sendExternalMsg({
      event: "signUp",
      phoneNumber: request.phoneNumber,
      password: request.password,
      certificate: certificate
    });
  }

  public receiveSignIn(reply: SignInReply) {

    this.med.callbacks.loginSuccessCallback(reply);
    if (reply.successful) {
      this._authenticator.authenticate()
      this._authenticator.enableSigning()
      this.med.changeState(this.med.chatPrepState, {
        myPhoneNumber: this._myPhoneNumber,
      });

    } else {
    }
  }
  public receiveSignUp(reply: SignUpReply) {
    if (reply.successful) {

    } else {

    }
    this.med.callbacks.signUpCallback(reply);
  }
  public async receiveGetCertificateReply(reply: GetCertificateReply) {
    let rep = await this._authenticator.verifiyCertificate(reply.serverCertificate, this._authenticator.caPublicKey)

    if (rep == false) {
      console.log("wrong server")
    }
    else {
      // come back
      this._authenticator.enableAsymEnc()
      this._authenticator.serverCertificate = reply.serverCertificate
      await this.med.sendExternalMsg({
        event: 'setSessionKey',
        nonEncSessionKey: JSON.stringify(this._authenticator._symKey.data)
      })
      this._authenticator.enableSymEnc()
      this._authenticator.enableSymDec()
      this._authenticator.disableAsymEnc()
    }
  }

  public async postCSR(phoneNumber: string) {
    this._authenticator.setMyPhoneNumber(phoneNumber)
    this._authenticator.generatePublicPrivateIfNot()
    await this._authenticator.certifyMyPublicKey(phoneNumber)
    this.med.CSRDone()
  }
  public receiveSetSessionKey(reply: Reply) {

  }
}
