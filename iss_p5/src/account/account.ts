
import { User, UserCertificate } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AuthenticationInfo } from '../shared_types/authentication_info';
import { Certificate } from '../shared_types/certificate';
import { Reply } from '../shared_types/reply';
import { UserCertificateData } from '../shared_types/user_public_key_data';
import { UserSignUpData } from '../shared_types/user_sign_up_data';
import { Authenticator } from '../websocket_manager/authenticator';
import { AuthenticatorRepository } from '../websocket_manager/authenticator_repository';
import { AccountRepository } from './account_repository';


export type SignInMessage = {
    phoneNumber: string,
    password: string,
}
export type SignInReply = Reply

export type SignUpMessage = {
    phoneNumber: string,
    password: string,
    certificate: Certificate
}

export type SignUpReply = Reply


export class Account {


    constructor(private _accountRepository: AccountRepository, private _bcryptCycles: number, private _authRep: AuthenticatorRepository, private _authenticator: Authenticator) { }

    public async signUp(signUpMessage: SignUpMessage): Promise<SignUpReply> {
        if (await this._accountRepository.getUserByPhoneNumber(signUpMessage.phoneNumber) === null) {
            // TODO validate username/password lengths 
            console.log('signUpCert',signUpMessage.certificate)
            let verification = this._authenticator.verifiyCertificate(signUpMessage.certificate, (await this._authRep.getCAPublicKey())!.publicKey)
            if(verification == false) {
                console.log('INVALID CERTIFICATE')
                return {successful: false, }
            }
            let userInfo: UserSignUpData = {
                phoneNumber: signUpMessage.phoneNumber,
                hashedPassword: (await bcrypt.hash(signUpMessage.password, this._bcryptCycles))
            }
            let user = await this._accountRepository.saveUserSignUpData(userInfo)
            let userCerData: UserCertificateData = {
                userId: user.userId,
                certificateInfo: JSON.stringify(signUpMessage.certificate.certificateInfo),
                certificateSignature: signUpMessage.certificate.certificateSignature
            }
            await this._authRep.saveUserCertificateData(userCerData)
            // let dbCertificate: UserCertificate = (await this._authRep.getUserCertificateByPhoneNumber('0000000000'))!

            // let serverCertificate: Certificate = {
            //     certificateInfo: JSON.parse(dbCertificate.certificateInfo),
            //     certificateSignature: dbCertificate.certificateSignature
            // }
            return { successful: true }

        }

        return { successful: false, error: 'Phone number already exists' }


    }
    public async signIn(signInMessage: SignInMessage): Promise<SignInReply> {
        let user: User | null = await this._accountRepository.getUserByPhoneNumber(signInMessage.phoneNumber)
        if (user == null) {
            return { successful: false, error: 'Phone number not found.' }

        }
        else {
            if (await bcrypt.compare(signInMessage.password, user.hashedPassword)) {
                return { successful: true }
            }
            else {
                return { successful: false, error: 'Wrong password.' }
            }
        }
    }


}