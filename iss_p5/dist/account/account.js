"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
class Account {
    constructor(_accountRepository, _bcryptCycles, _authRep, _authenticator) {
        this._accountRepository = _accountRepository;
        this._bcryptCycles = _bcryptCycles;
        this._authRep = _authRep;
        this._authenticator = _authenticator;
    }
    async signUp(signUpMessage) {
        if (await this._accountRepository.getUserByPhoneNumber(signUpMessage.phoneNumber) === null) {
            // TODO validate username/password lengths 
            console.log('signUpCert', signUpMessage.certificate);
            let verification = this._authenticator.verifiyCertificate(signUpMessage.certificate, (await this._authRep.getCAPublicKey()).publicKey);
            if (verification == false) {
                console.log('INVALID CERTIFICATE');
                return { successful: false, };
            }
            let userInfo = {
                phoneNumber: signUpMessage.phoneNumber,
                hashedPassword: (await bcrypt_1.default.hash(signUpMessage.password, this._bcryptCycles))
            };
            let user = await this._accountRepository.saveUserSignUpData(userInfo);
            let userCerData = {
                userId: user.userId,
                certificateInfo: JSON.stringify(signUpMessage.certificate.certificateInfo),
                certificateSignature: signUpMessage.certificate.certificateSignature
            };
            await this._authRep.saveUserCertificateData(userCerData);
            // let dbCertificate: UserCertificate = (await this._authRep.getUserCertificateByPhoneNumber('0000000000'))!
            // let serverCertificate: Certificate = {
            //     certificateInfo: JSON.parse(dbCertificate.certificateInfo),
            //     certificateSignature: dbCertificate.certificateSignature
            // }
            return { successful: true };
        }
        return { successful: false, error: 'Phone number already exists' };
    }
    async signIn(signInMessage) {
        let user = await this._accountRepository.getUserByPhoneNumber(signInMessage.phoneNumber);
        if (user == null) {
            return { successful: false, error: 'Phone number not found.' };
        }
        else {
            if (await bcrypt_1.default.compare(signInMessage.password, user.hashedPassword)) {
                return { successful: true };
            }
            else {
                return { successful: false, error: 'Wrong password.' };
            }
        }
    }
}
exports.Account = Account;
