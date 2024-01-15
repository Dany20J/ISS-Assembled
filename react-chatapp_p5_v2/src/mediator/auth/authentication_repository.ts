import { Certificate } from "../shared_types/certificate"

export class AuthenticatorRepository {
    public clientCert: Certificate | undefined
    saveClientCertificate(certificate: Certificate, phoneNumber: string) {

        localStorage.setItem('clientCertificate' + phoneNumber, JSON.stringify(certificate))
    }

    public getClientCertificate(phoneNumber: string) {
        return localStorage.getItem('clientCertificate' + phoneNumber)
    }
    public saveServerPublicKey(serverPublicKey: string) {
        localStorage.setItem('serverPublicKey', serverPublicKey)
    }
    public getServerPublicKey() {
        return localStorage.getItem('serverPublicKey')!
    }
    public saveMyPublicKey(phoneNumber: string, publicKey: string) {
        localStorage.setItem('publicKey' + phoneNumber, publicKey)
    }
    public saveMyPrivateKey(phoneNumber: string, privateKey: string) {
        localStorage.setItem('privateKey' + phoneNumber, privateKey)
    }
    public getMyPublicKey(phoneNumber: string) {
        return localStorage.getItem('publicKey' + phoneNumber)!
    }
    public getMyPrivateKey(phoneNumber: string) {
        return localStorage.getItem('privateKey' + phoneNumber)!
    }
    public hasMyPrivateKey(phoneNumber: string) {
        return localStorage.getItem('privateKey' + phoneNumber) != null
    }
    public saveSignature(phoneNumber: string, signature: string, info: string) {
        let serverCommName = 'serverComm' + phoneNumber
        if (localStorage.getItem(serverCommName) == null) {
            localStorage.setItem(serverCommName, JSON.stringify({ 'data': [] }))
        }
        let serverComm = JSON.parse(localStorage.getItem(serverCommName)!)
        serverComm['data'].push({
            'signature': signature,
            'info': info
        })
        console.log('WHHHHHHHHH',serverComm)
        console.log(serverCommName)
        localStorage.setItem(serverCommName, JSON.stringify(serverComm))
    }
    public saveMessage(myPhoneNumber: string, messageId: number, message: string) {
        localStorage.setItem(myPhoneNumber + messageId, message)
    }
    public getMessage(myPhoneNumber: string, messageId: number) {
        return localStorage.getItem(myPhoneNumber + messageId)
    }
    public hasMessage(myPhoneNumber: string, messageId: number) {
        return localStorage.getItem(myPhoneNumber + messageId) != null
    }
}