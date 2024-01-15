import WebSocket from 'ws';
import http from 'http';
import express from 'express';




import * as crypto from 'crypto'
import keypair, { KeypairResults } from 'keypair';
import { createSign, createVerify, randomBytes } from 'crypto';
import * as CryptoJS from 'crypto-js'
import EncryptRSA from 'encrypt-rsa'

import cors from 'cors';

export function _hasList(parentProperty: any, childPropertyList: Array<string>) {
    for (const childProperty of childPropertyList)
        if (!parentProperty.hasOwnProperty(childProperty))
            return false
    return true
}

export function decodeHex(hex: string): string {
    return decodeURIComponent(hex.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'))
}
type EncIv = {
    enc: string,
    iv: Buffer
}
type EncData = {
    enc_iv: EncIv,
    mac: Buffer
}


export class ServerController {


    // private _keyPair: KeypairResults

    private _httpServer: http.Server;
    private _app: express.Express;



    constructor() {
        // this._keyPair = keypair()

        // console.log(this._keyPair.private)
        // console.log(this._keyPair.public)
        this._app = express()
        this._app.use(express.json())
        this._app.use(cors())
        this._httpServer = http.createServer(this._app)




    }
    public initiate() {
        this._httpServer.listen(process.env.PORT, () => { console.log(`Server running on port ${process.env.PORT}`) })

        this._API()
    }

    private _API() {


        this._app.post('/digital_signature', async (req, res) => {


            let dataToSign: string = req.body.dataToSign
            let privateKey: string = req.body.privateKey
            console.log('digital_signature')
            console.log('dataToSign', dataToSign)
            console.log('privateKey', privateKey)

            let signer = createSign('rsa-sha256')
            signer.update(dataToSign);
            let signature = signer.sign(privateKey, 'hex')
            return res.json({
                signature: signature
            })

        })
        this._app.post('/verify_signature', async (req, res) => {
            console.log('verify_signature')
            let publicKey: string = req.body.publicKey


            let dataSigned: string = req.body.dataSigned
            let signature: string = req.body.signature
            let verifier = createVerify('rsa-sha256');
            verifier.update(dataSigned);

            let isVerified = verifier.verify(publicKey, signature, 'hex');
            console.log(isVerified)
            return res.json({
                isVerified: isVerified
            })
            
        })

        this._app.post('/generate_public_private', async (req, res) => {
            let keyPairToSend = keypair()
            return res.json({ publicKey: keyPairToSend.public, privateKey: keyPairToSend.private })
        })

        this._app.post('/encrypt_with_public_key', async (req, res) => {
            console.log('encrypt_with_public_key')

            let publicKey: string = req.body.publicKey
            let message: string = req.body.message
            console.log(message)
            let encryptRSA = new EncryptRSA()


            let enc = encryptRSA.encryptStringWithRsaPublicKey({ publicKey: publicKey, text: message })


            console.log(req.body)
            return res.json({ enc: enc })
        })
        this._app.post('/decrypt_with_private_key', async (req, res) => {


            try {

                let privateKey: string = req.body.privateKey
                let message: string = req.body.message
                console.log(message)
                let encryptRSA = new EncryptRSA()


                let dec = encryptRSA.decryptStringWithRsaPrivateKey({ privateKey: privateKey, text: message })
                return res.json({ dec: dec })

            }
            catch (_) {
                return res.json({ dec: req.body.message })
            }



        })



        this._app.post('/encrypt_with_symmetric_key', async (req, res) => {
            console.log('encrypt_with_symmetric_key')

            let body = req.body

            console.log(body)

            let symmetricKey: Buffer = Buffer.from(body.symmetricKey)
            let message = JSON.stringify(body.data)

            let iv: Buffer = randomBytes(16)

            let keyHex = symmetricKey.toString('hex')
            let ivHex = CryptoJS.enc.Hex.parse(iv.toString('hex'))
            console.log('ivhex', ivHex)
            console.log('keyHex', keyHex)
            let enc = CryptoJS.AES.encrypt(message, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC }).toString()


            let mac: Buffer = Buffer.from(CryptoJS.HmacSHA256(message, keyHex).toString(), 'hex')

            // let cipher = createCipheriv(this._cryptMode, this._symKey, iv)
            // let enc = cipher.update(message, 'utf8', 'hex') + cipher.final('hex');

            // let mac = createHmac('sha256', this._symKey.toString()).update(enc).digest()

            let newData: EncData = {
                enc_iv: {
                    enc: enc,
                    iv: iv
                },
                mac: mac
            }
            console.log(newData)
            return res.json(newData)
        })

        this._app.post('/check_enc_int', async (req, res) => {
            console.log('check_enc_int')

            let body = req.body
            console.log(body)
            let data = body.data
            let symmetricKey: Buffer = Buffer.from(body.symmetricKey)

            if (true || (_hasList(data, ['enc_iv', 'mac']) && _hasList(data.enc_iv, ['enc', 'iv']))) {
                try {
                    console.log('Part1')
                    let enc: string = data.enc_iv.enc
                    let iv: Buffer = Buffer.from(data.enc_iv.iv)
                    let mac: Buffer = Buffer.from(data.mac)

                    console.log(data.enc_iv)
                    console.log('Part2')

                    let keyHex = symmetricKey.toString('hex')
                    let ivHex = CryptoJS.enc.Hex.parse(iv.toString('hex'))
                    let decrypted_hex = CryptoJS.AES.decrypt(enc, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC }).toString()
                    let dec = decodeHex(decrypted_hex)
                    console.log(decrypted_hex)
                    console.log(dec)

                    // let decipher = createDecipheriv(this._cryptMode, this._symKey, iv)
                    // let dec = decipher.update(enc, 'hex', 'utf8') + decipher.final('utf8')

                    let val_mac: Buffer = Buffer.from(CryptoJS.HmacSHA256(dec, keyHex).toString(), 'hex')
                    // let val_mac: Buffer = createHmac('sha256', this._symKey.toString()).update(dec).digest()
                    console.log(val_mac)
                    console.log(mac)
                    if (Buffer.compare(mac, val_mac) == 0) {
                        console.log(dec)
                        return res.json({ dec: JSON.parse(dec), successful: true })
                    }
                }
                catch (_) {
                    return res.json({ successful: false })
                }

            }

            return res.json({ successful: false })
        })

    }
}
