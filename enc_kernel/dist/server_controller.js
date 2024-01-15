"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerController = exports.decodeHex = exports._hasList = void 0;
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const keypair_1 = __importDefault(require("keypair"));
const crypto_1 = require("crypto");
const CryptoJS = __importStar(require("crypto-js"));
const encrypt_rsa_1 = __importDefault(require("encrypt-rsa"));
const cors_1 = __importDefault(require("cors"));
function _hasList(parentProperty, childPropertyList) {
    for (const childProperty of childPropertyList)
        if (!parentProperty.hasOwnProperty(childProperty))
            return false;
    return true;
}
exports._hasList = _hasList;
function decodeHex(hex) {
    return decodeURIComponent(hex.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'));
}
exports.decodeHex = decodeHex;
class ServerController {
    constructor() {
        // this._keyPair = keypair()
        // console.log(this._keyPair.private)
        // console.log(this._keyPair.public)
        this._app = (0, express_1.default)();
        this._app.use(express_1.default.json());
        this._app.use((0, cors_1.default)());
        this._httpServer = http_1.default.createServer(this._app);
    }
    initiate() {
        this._httpServer.listen(process.env.PORT, () => { console.log(`Server running on port ${process.env.PORT}`); });
        this._API();
    }
    _API() {
        this._app.post('/digital_signature', async (req, res) => {
            let dataToSign = req.body.dataToSign;
            let privateKey = req.body.privateKey;
            console.log('digital_signature');
            console.log('dataToSign', dataToSign);
            console.log('privateKey', privateKey);
            let signer = (0, crypto_1.createSign)('rsa-sha256');
            signer.update(dataToSign);
            let signature = signer.sign(privateKey, 'hex');
            return res.json({
                signature: signature
            });
        });
        this._app.post('/verify_signature', async (req, res) => {
            console.log('verify_signature');
            let publicKey = req.body.publicKey;
            let dataSigned = req.body.dataSigned;
            let signature = req.body.signature;
            let verifier = (0, crypto_1.createVerify)('rsa-sha256');
            verifier.update(dataSigned);
            let isVerified = verifier.verify(publicKey, signature, 'hex');
            console.log(isVerified);
            return res.json({
                isVerified: isVerified
            });
        });
        this._app.post('/generate_public_private', async (req, res) => {
            let keyPairToSend = (0, keypair_1.default)();
            return res.json({ publicKey: keyPairToSend.public, privateKey: keyPairToSend.private });
        });
        this._app.post('/encrypt_with_public_key', async (req, res) => {
            console.log('encrypt_with_public_key');
            let publicKey = req.body.publicKey;
            let message = req.body.message;
            console.log(message);
            let encryptRSA = new encrypt_rsa_1.default();
            let enc = encryptRSA.encryptStringWithRsaPublicKey({ publicKey: publicKey, text: message });
            console.log(req.body);
            return res.json({ enc: enc });
        });
        this._app.post('/decrypt_with_private_key', async (req, res) => {
            try {
                let privateKey = req.body.privateKey;
                let message = req.body.message;
                console.log(message);
                let encryptRSA = new encrypt_rsa_1.default();
                let dec = encryptRSA.decryptStringWithRsaPrivateKey({ privateKey: privateKey, text: message });
                return res.json({ dec: dec });
            }
            catch (_) {
                return res.json({ dec: req.body.message });
            }
        });
        this._app.post('/encrypt_with_symmetric_key', async (req, res) => {
            console.log('encrypt_with_symmetric_key');
            let body = req.body;
            console.log(body);
            let symmetricKey = Buffer.from(body.symmetricKey);
            let message = JSON.stringify(body.data);
            let iv = (0, crypto_1.randomBytes)(16);
            let keyHex = symmetricKey.toString('hex');
            let ivHex = CryptoJS.enc.Hex.parse(iv.toString('hex'));
            console.log('ivhex', ivHex);
            console.log('keyHex', keyHex);
            let enc = CryptoJS.AES.encrypt(message, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC }).toString();
            let mac = Buffer.from(CryptoJS.HmacSHA256(message, keyHex).toString(), 'hex');
            // let cipher = createCipheriv(this._cryptMode, this._symKey, iv)
            // let enc = cipher.update(message, 'utf8', 'hex') + cipher.final('hex');
            // let mac = createHmac('sha256', this._symKey.toString()).update(enc).digest()
            let newData = {
                enc_iv: {
                    enc: enc,
                    iv: iv
                },
                mac: mac
            };
            console.log(newData);
            return res.json(newData);
        });
        this._app.post('/check_enc_int', async (req, res) => {
            console.log('check_enc_int');
            let body = req.body;
            console.log(body);
            let data = body.data;
            let symmetricKey = Buffer.from(body.symmetricKey);
            if (true || (_hasList(data, ['enc_iv', 'mac']) && _hasList(data.enc_iv, ['enc', 'iv']))) {
                try {
                    console.log('Part1');
                    let enc = data.enc_iv.enc;
                    let iv = Buffer.from(data.enc_iv.iv);
                    let mac = Buffer.from(data.mac);
                    console.log(data.enc_iv);
                    console.log('Part2');
                    let keyHex = symmetricKey.toString('hex');
                    let ivHex = CryptoJS.enc.Hex.parse(iv.toString('hex'));
                    let decrypted_hex = CryptoJS.AES.decrypt(enc, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC }).toString();
                    let dec = decodeHex(decrypted_hex);
                    console.log(decrypted_hex);
                    console.log(dec);
                    // let decipher = createDecipheriv(this._cryptMode, this._symKey, iv)
                    // let dec = decipher.update(enc, 'hex', 'utf8') + decipher.final('utf8')
                    let val_mac = Buffer.from(CryptoJS.HmacSHA256(dec, keyHex).toString(), 'hex');
                    // let val_mac: Buffer = createHmac('sha256', this._symKey.toString()).update(dec).digest()
                    console.log(val_mac);
                    console.log(mac);
                    if (Buffer.compare(mac, val_mac) == 0) {
                        console.log(dec);
                        return res.json({ dec: JSON.parse(dec), successful: true });
                    }
                }
                catch (_) {
                    return res.json({ successful: false });
                }
            }
            return res.json({ successful: false });
        });
    }
}
exports.ServerController = ServerController;
