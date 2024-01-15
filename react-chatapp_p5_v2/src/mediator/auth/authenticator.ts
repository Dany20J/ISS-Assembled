
import keypair from 'keypair'
import { decodeHex, generateRandomBuffer, sleep, _hasList } from '../shared_functions/shared_functions'
import { Certificate } from '../shared_types/certificate'
import { AuthenticatorRepository } from './authentication_repository'


export type BufferImpl = {
    type: string,
    data: Array<number>
}
type EncIv = {
    enc: string,
    iv: BufferImpl
}
type EncData = {
    enc_iv: EncIv,
    mac: BufferImpl
}

export default class Authenticator {
    public async certifyMyPublicKey(phoneNumber: string) {
        let dataToSend = JSON.stringify({
            phoneNumber: phoneNumber,
            publicKey: this.getMyPublicKey()
        })

        let response = await fetch('http://localhost:8999/post-csr', {
            method: 'POST',
            body: dataToSend,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });


        let incomingData = (await response.json()) as { successful: boolean, message?: string, error?: string }


        if (response.ok && incomingData.successful) {
            console.log("Loop")

            await this.getCertLoop(phoneNumber)
        }
    }

    public async getCertLoop(phoneNumber: string) {
        while (true) {
            let dataToSend = JSON.stringify({
                phoneNumber: phoneNumber,
            })

            let response = await fetch('http://localhost:8999/get-cert', {
                method: 'POST',
                body: dataToSend,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });


            let incomingData = (await response.json()) as {
                successful: boolean, error?: string,
                cert?: { signature: string, signatureData: string }
            }

            if (incomingData.successful) {
                let caCert = incomingData.cert
                let certificateInfoStr = (caCert?.signatureData)!

                if ((await this.verifiyCertificate({
                    certificateInfo: JSON.parse(certificateInfoStr),
                    certificateSignature: caCert?.signature!
                }, this.caPublicKey)) == false) {
                    // process.exit(0)
                    console.log("WROOOONG")
                    return
                }
                console.log("CERTIFICATED")
                this._authenticatorRepository.saveClientCertificate({
                    certificateInfo: JSON.parse(certificateInfoStr),
                    certificateSignature: caCert?.signature!
                }, phoneNumber)
                // this._authenticatorRepository.clientCert = {
                //     certificateInfo: JSON.parse(certificateInfoStr),
                //     certificateSignature: caCert?.signature!
                // }
                break
            }
            await sleep(1000)
        }
    }

    public async verifiyCertificate(certificate: Certificate, caPublicKey: string) {
        return await this.verifySignature(caPublicKey, JSON.stringify(certificate.certificateInfo), certificate.certificateSignature)
    }

    public caPublicKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA11Tbvr5fALpPrmE3lGRa\ny26+j/WdKOPV28iUQMcnYlkl7t1oHyB5i2ugCoUX6u7W0yLxWv8Pj+mmFuIXbqkz\nT/8CraAhLh7+7a3gvDLu2iJkI04y2Ro94qIeOaK0ybZSUbkWCrbkocQWfZUc5izC\nWuIhdMLN0o64pmQYjywTqkY10hzvQW8MuwBQY83tlqnRuSrUfMARnIk/m8XdLCPx\nCqijo3RK7S3A4d/LPrh7sG+ahfKY5PNKeeVfMs70oW9xXbUXutx/BXG2JEzCZB+2\nFSFYkmj+1fmCXz49nKDNVwu6upK/QZn8t9zjI/2/OkcXpMPtNa8564+qvdp9eLUU\njwIDAQAB\n-----END PUBLIC KEY-----\n'
    private _authenticated: boolean = false


    private myPhoneNumber = '' // dooooon't forget
    public serverCertificate: Certificate | undefined


    private _doSignature: boolean = false

    private _doSymEnc: boolean = false
    private _doSymDec: boolean = false

    private _doAsymEnc: boolean = false
    private _doAsymDec: boolean = false


    constructor(private _authenticatorRepository: AuthenticatorRepository) {

    }
    public async handle(message: any): Promise<boolean> {


        if (this._doAsymDec) {

        }
        if (this._doSymDec) {
            let res = await this._checkEncInt(message.data)
            console.log('sym dec', res)
            if (res !== false)
                message.data = res
            else {
                console.log("SYMMM DEC FAILED")
                return false
            }
        }
        if (this._doSignature) {
            let isVerified = await this.verifySignature(this.serverCertificate?.certificateInfo.publicKey!, JSON.stringify(message.data.info), message.data.signature)
            if (isVerified == false) {
                console.log("WRONG SIGNATURE")
                return false
            }
            else {
                this._authenticatorRepository.saveSignature(this.myPhoneNumber, message.data.signature, JSON.stringify(message.data.info))
                message.data = message.data.info
            }

            return true
        }
        return true
    }

    public async handleOnGoing(message: any) {
        if (this._doSignature) {

            let signature = await this.signData(JSON.stringify(message))
            message = {
                info: message,
                signature: signature
            }
        }
        if (this._doAsymEnc) {
            message = await this.ecryptWithPublicKey(this.serverCertificate?.certificateInfo.publicKey!, JSON.stringify(message))

        }
        if (this._doSymEnc) {
            message = await this.symEnc(message)
        }
        return message
    }

    private async _checkEncInt(data: any): Promise<any> {
        console.log(this._symKey)
        let toSend = JSON.stringify({ data: data, symmetricKey: this._symKey })
        console.log(toSend)
        const response = await fetch('http://localhost:5100/check_enc_int', {
            method: 'POST',
            body: toSend,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const incomingData = await (response.json())


        if (response.ok && incomingData.successful) {
            console.log('symm dec', incomingData)
            return incomingData.dec
        }
        return false


    }
    public _symKey: BufferImpl = generateRandomBuffer()

    public async symEnc(data: any) {

        let toSend = JSON.stringify({ data: data, symmetricKey: this._symKey })
        const response = await fetch('http://localhost:5100/encrypt_with_symmetric_key', {
            method: 'POST',
            body: toSend,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const incomingData = await (response.json())


        if (response.ok) {
            console.log('symmetric', incomingData)
            return incomingData
        }

    }
    public setMyPhoneNumber(myPhoneNumber: string) {
        this.myPhoneNumber = myPhoneNumber
    }
    public isAuthenticated(): boolean {
        return this._authenticated
    }
    public async authenticate(): Promise<void> {
        this._authenticated = true
    }
    public disableAuthentication(): void {
        this._authenticated = false
    }
    public getMyPublicKey() {
        if (this.myPhoneNumber != '')
            return this._authenticatorRepository.getMyPublicKey(this.myPhoneNumber)
    }
    public getMyPrivateKey() {
        if (this.myPhoneNumber != '')
            return this._authenticatorRepository.getMyPrivateKey(this.myPhoneNumber)
    }
    public async verifySignature(publicKey: string, dataSigned: string, signature: string) {


        let dataToSend = JSON.stringify({
            publicKey: publicKey,
            dataSigned: dataSigned,
            signature: signature
        })

        const response = await fetch('http://localhost:5100/verify_signature', {
            method: 'POST',
            body: dataToSend,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const incomingData = await (response.json())


        if (response.ok) {
            console.log('incoming', incomingData)
            return incomingData.isVerified as boolean
        }
        return false
    }
    public generatePublicPrivateIfNot() {
        if (!this._authenticatorRepository.hasMyPrivateKey(this.myPhoneNumber)) {
            let KP = keypair()
            this._authenticatorRepository.saveMyPrivateKey(this.myPhoneNumber, KP.private)
            this._authenticatorRepository.saveMyPublicKey(this.myPhoneNumber, KP.public)
        }
    }
    public async signData(dataToSign: string) {

        let privateKey = this.getMyPrivateKey()

        let dataToSend = JSON.stringify({
            privateKey: privateKey,
            dataToSign: dataToSign
        })
        const response = await fetch('http://localhost:5100/digital_signature', {
            method: 'POST',
            body: dataToSend,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const incomingData = await (response.json())


        if (response.ok) {
            console.log('incoming', incomingData)
            return incomingData.signature
        }
        return ''
    }

    public async ecryptWithPublicKey(publicKey: string, message: string) {

        // let toSend = JSON.stringify({ publicKey: publicKey, message: JSON.stringify(this._symKey.data) })
        let toSend = JSON.stringify({ publicKey: publicKey, message: message })
        const response = await fetch('http://localhost:5100/encrypt_with_public_key', {
            method: 'POST',
            body: toSend,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const incomingData = await (response.json())


        if (response.ok) {
            console.log('enc reply', incomingData)
            return incomingData.enc
        }
    }

    public async decryptWithPrivateKey(privateKey: string, message: string) {

        // let toSend = JSON.stringify({ publicKey: publicKey, message: JSON.stringify(this._symKey.data) })
        let toSend = JSON.stringify({ privateKey: privateKey, message: message })
        const response = await fetch('http://localhost:5100/decrypt_with_private_key', {
            method: 'POST',
            body: toSend,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const incomingData = await (response.json())


        if (response.ok) {
            console.log('enc reply', incomingData)
            return incomingData.dec
        }
    }
    public doSignature() {
        return this._doSignature
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
}