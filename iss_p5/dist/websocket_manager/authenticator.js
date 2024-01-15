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
exports.Authenticator = void 0;
const crypto_1 = require("crypto");
const shared_functions_1 = require("../shared_functions/shared_functions");
const encrypt_rsa_1 = __importDefault(require("encrypt-rsa"));
const CryptoJS = __importStar(require("crypto-js"));
class Authenticator {
    constructor(_authenticatorRepository, _keyPair) {
        this._authenticatorRepository = _authenticatorRepository;
        this._keyPair = _keyPair;
        this._authenticated = false;
        this._authenticationInfo = { phoneNumber: '' };
        this._symKey = (0, crypto_1.randomBytes)(32);
        this._doSignature = false;
        this._doSymEnc = false;
        this._doSymDec = false;
        this._doAsymEnc = false;
        this._doAsymDec = false;
    }
    async handle(message) {
        if (this._doAsymDec) {
            try {
                let dec = this.decryptWithPrivateKey(message.data);
                message.data = JSON.parse(dec);
            }
            catch (_) {
                console.log("aaaaa DEC FAILED");
                return false;
            }
        }
        if (this._doSymDec) {
            let res = this._checkEncInt(message.data);
            console.log('ressss', res);
            if (res !== false)
                message.data = res;
            else {
                console.log("SYMMM DEC FAILED");
                return false;
            }
        }
        if (this._doSignature) {
            let userCerDB = (await this._authenticatorRepository.getUserCertificateByPhoneNumber(this._authenticationInfo.phoneNumber));
            let userCer = {
                certificateInfo: JSON.parse(userCerDB.certificateInfo),
                certificateSignature: userCerDB.certificateSignature
            };
            let isVerified = this.verifySignature(userCer.certificateInfo.publicKey, JSON.stringify(message.data.info), message.data.signature);
            if (isVerified == false) {
                console.log("WRONG SIGNATURE");
                return false;
            }
            else {
                await this._authenticatorRepository.saveSignature(this.authenticationInfo.phoneNumber, message.data.signature, JSON.stringify(message.data.info));
                message.data = message.data.info;
            }
        }
        if (this.isAuthenticated()) {
            message.authenticationInfo = this._authenticationInfo;
        }
        return true;
    }
    _checkEncInt(data) {
        if ((0, shared_functions_1._hasList)(data, ['enc_iv', 'mac']) && (0, shared_functions_1._hasList)(data.enc_iv, ['enc', 'iv'])) {
            try {
                let enc = data.enc_iv.enc;
                let iv = Buffer.from(data.enc_iv.iv);
                let mac = Buffer.from(data.mac);
                let keyHex = this._symKey.toString('hex');
                let ivHex = CryptoJS.enc.Hex.parse(iv.toString('hex'));
                let decrypted_hex = CryptoJS.AES.decrypt(enc, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC }).toString();
                let dec = (0, shared_functions_1.decodeHex)(decrypted_hex);
                let val_mac = Buffer.from(CryptoJS.HmacSHA256(dec, keyHex).toString(), 'hex');
                if (Buffer.compare(mac, val_mac) == 0) {
                    return JSON.parse(dec);
                }
            }
            catch (_) {
                return false;
            }
        }
        return false;
    }
    symEnc(data) {
        if (this._doSymEnc) {
            let message = JSON.stringify(data);
            let iv = (0, crypto_1.randomBytes)(16);
            let keyHex = this._symKey.toString('hex');
            let ivHex = CryptoJS.enc.Hex.parse(iv.toString('hex'));
            let enc = CryptoJS.AES.encrypt(message, keyHex, { iv: ivHex, mode: CryptoJS.mode.CBC }).toString();
            let mac = Buffer.from(CryptoJS.HmacSHA256(message, keyHex).toString(), 'hex');
            let newData = {
                enc_iv: {
                    enc: enc,
                    iv: iv
                },
                mac: mac
            };
            data = newData;
        }
        return data;
    }
    isAuthenticated() {
        return this._authenticated;
    }
    doSignature() {
        return this._doSignature;
    }
    getPublicKey() {
        return this._keyPair.serverPublicKey;
    }
    getPrivateKey() {
        return this._keyPair.serverPrivateKey;
    }
    async authenticate(authenticationInfo) {
        this._authenticated = true;
        this._authenticationInfo = authenticationInfo;
    }
    get authenticationInfo() {
        return this._authenticationInfo;
    }
    disableAuthentication() {
        this._authenticated = false;
        this._authenticationInfo = { phoneNumber: '' };
    }
    encryptWithPublicKey(data) {
        let encryptRsa = new encrypt_rsa_1.default();
        let enc = encryptRsa.encryptStringWithRsaPublicKey({
            text: data,
            publicKey: this.getPublicKey(),
        });
        return enc;
    }
    decryptWithPrivateKey(data) {
        let encryptRsa = new encrypt_rsa_1.default();
        let dec = encryptRsa.decryptStringWithRsaPrivateKey({
            text: data,
            privateKey: this.getPrivateKey(),
        });
        return dec;
    }
    verifySignature(publicKey, dataSigned, signature) {
        console.log('veriPu', publicKey);
        console.log('dataSigned', dataSigned);
        console.log('signature', signature);
        let verifier = (0, crypto_1.createVerify)('rsa-sha256');
        verifier.update(dataSigned);
        let isVerified = verifier.verify(publicKey, signature, 'hex');
        return isVerified;
    }
    verifiyCertificate(certificate, caPublicKey) {
        return this.verifySignature(caPublicKey, JSON.stringify(certificate.certificateInfo), certificate.certificateSignature);
    }
    async signData(dataToSign) {
        let privateKey = (await this._authenticatorRepository.getServerPairKey()).serverPrivateKey;
        let signer = (0, crypto_1.createSign)('rsa-sha256');
        signer.update(dataToSign);
        let siguature = signer.sign(privateKey, 'hex');
        return siguature;
    }
    async handleOnGoing(message) {
        if (this._doSignature) {
            let data = message.data;
            let signature = await this.signData(JSON.stringify(data));
            message.data = {
                info: data,
                signature: signature
            };
        }
        if (this._doAsymEnc) {
        }
        if (this._doSymEnc) {
            message.data = this.symEnc(message.data);
        }
        return true;
    }
    enableSigning() {
        this._doSignature = true;
    }
    disableSigning() {
        this._doSignature = false;
    }
    enableSymEnc() {
        this._doSymEnc = true;
    }
    disableSymEnc() {
        this._doSymEnc = false;
    }
    enableAsymEnc() {
        this._doAsymEnc = true;
    }
    disableAsymEnc() {
        this._doAsymEnc = false;
    }
    enableSymDec() {
        this._doSymDec = true;
    }
    disableSymDec() {
        this._doSymDec = false;
    }
    enableAsymDec() {
        this._doAsymDec = true;
    }
    disableAsymDec() {
        this._doAsymDec = false;
    }
    setSessionKeyRequest(encryptedSessionKey) {
        let encryptRsa = new encrypt_rsa_1.default();
        let sessionKey = encryptRsa.decryptStringWithRsaPrivateKey({
            text: encryptedSessionKey.toString(),
            privateKey: this.getPrivateKey(),
        });
        this._symKey = Buffer.from(this.localFrom(sessionKey));
        this.enableSymEnc();
    }
    localFrom(strList) {
        var numberPattern = /\d+/g;
        let numList = strList.match(numberPattern);
        if (numList == null)
            return [];
        let toRet = [];
        for (let num of numList) {
            toRet.push(parseInt(num));
        }
        return toRet;
    }
    setNonEncSessionKey(nonEncSessionKey) {
        this._symKey = Buffer.from(this.localFrom(nonEncSessionKey));
        this.enableSymEnc();
    }
}
exports.Authenticator = Authenticator;
