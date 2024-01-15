
import { AuthenticationInfo } from "../shared_types/authentication_info"
import { Message } from "../shared_types/message"
import { AuthenticatorRepository } from "./authenticator_repository"
import { createVerify, createSign, randomBytes } from 'crypto'
import { decodeHex, _hasList } from "../shared_functions/shared_functions"
import EncryptRsa from 'encrypt-rsa';
import { Certificate, CertificateInfo } from "../shared_types/certificate"
import { ServerKeyPair } from "@prisma/client"
import * as CryptoJS from 'crypto-js'
type EncIv = {
    enc: string,
    iv: Buffer
}
type EncData = {
    enc_iv: EncIv,
    mac: Buffer
}
export class Authenticator implements Handler<Message> {

    private _authenticated: boolean = false
    private _authenticationInfo: AuthenticationInfo = { phoneNumber: '' }

    private _symKey: Buffer = randomBytes(32)

    private _doSignature: boolean = false

    private _doSymEnc: boolean = false
    private _doSymDec: boolean = false

    private _doAsymEnc: boolean = false
    private _doAsymDec: boolean = false
    constructor(private _authenticatorRepository: AuthenticatorRepository, private _keyPair: ServerKeyPair) {

    }

    public async handle(message: Message): Promise<boolean> {
        if (this._doAsymDec) {
            try {
                let dec = this.decryptWithPrivateKey(message.data)
                message.data = JSON.parse(dec)
            } catch (_) {
                console.log("aaaaa DEC FAILED")

                return false
            }
        }
        if (this._doSymDec) {
            let res = this._checkEncInt(message.data)
            console.log('ressss', res)
            if (res !== false)
                message.data = res
            else {
                console.log("SYMMM DEC FAILED")
                return false
            }
        }
        if (this._doSignature) {
            let userCerDB = (await this._authenticatorRepository.getUserCertificateByPhoneNumber(this._authenticationInfo.phoneNumber))!
            let userCer = {
                certificateInfo: JSON.parse(userCerDB.certificateInfo),
                certificateSignature: userCerDB.certificateSignature
            } as Certificate
            let isVerified = this.verifySignature(userCer.certificateInfo.publicKey, JSON.stringify(message.data.info), message.data.signature)
            if (isVerified == false) {
                console.log("WRONG SIGNATURE")
                return false
            }
            else {
                await this._authenticatorRepository.saveSignature(this.authenticationInfo.phoneNumber, message.data.signature, JSON.stringify(message.data.info))
                message.data = message.data.info
            }
        }
        if (this.isAuthenticated()) {
            message.authenticationInfo = this._authenticationInfo
        }
        return true
    }

    public _checkEncInt(data: any): any {

        if (_hasList(data, ['enc_iv', 'mac']) && _hasList(data.enc_iv, ['enc', 'iv'])) {
            try {

                let enc: string = data.enc_iv.enc
                let iv: Buffer = Buffer.from(data.enc_iv.iv)
                let mac: Buffer = Buffer.from(data.mac)



                let keyHex = this._symKey.toString('hex')
                let ivHex = CryptoJS.enc.Hex.parse(iv.toString('hex'))
                let decrypted_hex = CryptoJS.AES.decrypt(enc, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC }).toString()
                let dec = decodeHex(decrypted_hex)



                let val_mac: Buffer = Buffer.from(CryptoJS.HmacSHA256(dec, keyHex).toString(), 'hex')


                if (Buffer.compare(mac, val_mac) == 0) {
                    return JSON.parse(dec)
                }
            }
            catch (_) {
                return false
            }

        }

        return false
    }
    public symEnc(data: any) {
        if (this._doSymEnc) {
            let message = JSON.stringify(data);
            let iv: Buffer = randomBytes(16);


            let keyHex = this._symKey.toString('hex')
            let ivHex = CryptoJS.enc.Hex.parse(iv.toString('hex'))
            let enc = CryptoJS.AES.encrypt(message, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC }).toString()


            let mac: Buffer = Buffer.from(CryptoJS.HmacSHA256(message, keyHex).toString(), 'hex')


            let newData: EncData = {
                enc_iv: {
                    enc: enc,
                    iv: iv
                },
                mac: mac
            }

            data = newData

        }
        return data
    }
    public isAuthenticated(): boolean {
        return this._authenticated
    }
    public doSignature() {
        return this._doSignature
    }
    public getPublicKey() {
        return this._keyPair.serverPublicKey
    }
    private getPrivateKey() {
        return this._keyPair.serverPrivateKey
    }

    public async authenticate(authenticationInfo: AuthenticationInfo): Promise<void> {
        this._authenticated = true
        this._authenticationInfo = authenticationInfo
    }
    public get authenticationInfo(): AuthenticationInfo {
        return this._authenticationInfo
    }
    public disableAuthentication(): void {
        this._authenticated = false
        this._authenticationInfo = { phoneNumber: '' }
    }


    public encryptWithPublicKey(data: string) {
        let encryptRsa = new EncryptRsa()
        let enc = encryptRsa.encryptStringWithRsaPublicKey({
            text: data,
            publicKey: this.getPublicKey(),
        });
        return enc
    }
    public decryptWithPrivateKey(data: string) {
        let encryptRsa = new EncryptRsa()
        let dec = encryptRsa.decryptStringWithRsaPrivateKey({
            text: data,
            privateKey: this.getPrivateKey(),
        });
        return dec
    }
    public verifySignature(publicKey: string, dataSigned: string, signature: string) {
        console.log('veriPu', publicKey)
        console.log('dataSigned', dataSigned)
        console.log('signature', signature)
        let verifier = createVerify('rsa-sha256');
        verifier.update(dataSigned);

        let isVerified = verifier.verify(publicKey, signature, 'hex');

        return isVerified

    }
    public verifiyCertificate(certificate: Certificate, caPublicKey: string) {
        return this.verifySignature(caPublicKey, JSON.stringify(certificate.certificateInfo), certificate.certificateSignature)
    }
    public async signData(dataToSign: string) {

        let privateKey = (await this._authenticatorRepository.getServerPairKey())!.serverPrivateKey

        let signer = createSign('rsa-sha256')
        signer.update(dataToSign);
        let siguature = signer.sign(privateKey, 'hex')
        return siguature
    }
    public async handleOnGoing(message: Message) {
        if (this._doSignature) {

            let data = message.data
            let signature = await this.signData(JSON.stringify(data))
            message.data = {
                info: data,
                signature: signature
            }
        }
        if (this._doAsymEnc) {

        }
        if (this._doSymEnc) {
            message.data = this.symEnc(message.data)
        }
        return true
    }
    public enableSigning() {
        this._doSignature = true
    }
    public disableSigning() {
        this._doSignature = false
    }

    public enableSymEnc() {
        this._doSymEnc = true
    }
    public disableSymEnc() {
        this._doSymEnc = false
    }

    public enableAsymEnc() {
        this._doAsymEnc = true
    }
    public disableAsymEnc() {
        this._doAsymEnc = false
    }

    public enableSymDec() {
        this._doSymDec = true
    }
    public disableSymDec() {
        this._doSymDec = false
    }

    public enableAsymDec() {
        this._doAsymDec = true
    }
    public disableAsymDec() {
        this._doAsymDec = false
    }
    public setSessionKeyRequest(encryptedSessionKey: string) {

        let encryptRsa = new EncryptRsa()
        let sessionKey = encryptRsa.decryptStringWithRsaPrivateKey({
            text: encryptedSessionKey.toString(),
            privateKey: this.getPrivateKey(),
        });

        this._symKey = Buffer.from(this.localFrom(sessionKey))

        this.enableSymEnc()

    }

    public localFrom(strList: string) {
        var numberPattern = /\d+/g
        let numList = strList.match(numberPattern)
        if (numList == null)
            return []
        let toRet = []
        for (let num of numList) {
            toRet.push(parseInt(num))
        }
        return toRet
    }
    public setNonEncSessionKey(nonEncSessionKey: string) {
        this._symKey = Buffer.from(this.localFrom(nonEncSessionKey))

        this.enableSymEnc()
    }

}