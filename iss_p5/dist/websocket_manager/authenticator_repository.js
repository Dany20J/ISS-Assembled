"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticatorRepository = void 0;
const client_1 = require("@prisma/client");
const keypair_1 = __importDefault(require("keypair"));
class AuthenticatorRepository {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async getServerPairKey() {
        let serverKeyPair = await this.prisma.serverKeyPair.findFirst({
            where: {
                serverKeyPairId: 1
            }
        });
        if (serverKeyPair === null) {
            let keyPair = (0, keypair_1.default)();
            serverKeyPair = await this.prisma.serverKeyPair.create({
                data: {
                    serverKeyPairId: 1,
                    serverPublicKey: keyPair.public,
                    serverPrivateKey: keyPair.private
                }
            });
        }
        return serverKeyPair;
    }
    async saveUserCertificateData(cerData) {
        return await this.prisma.userCertificate.create({
            data: {
                userId: cerData.userId,
                certificateSignature: cerData.certificateSignature,
                certificateInfo: cerData.certificateInfo
            }
        });
    }
    async getUserCertificateByPhoneNumber(phoneNumber) {
        return await this.prisma.userCertificate.findFirst({
            where: {
                User: {
                    phoneNumber: phoneNumber
                }
            }
        });
    }
    async saveSignature(phoneNumber, signature, info) {
        let user = (await this.prisma.user.findFirst({ where: { phoneNumber: phoneNumber } }));
        return await this.prisma.userComm.create({
            data: {
                userId: user.userId,
                userSignature: signature,
                userComm: info
            }
        });
    }
    async getServerCertificate() {
        return await this.prisma.serverCertificate.findFirst({
            where: {
                serverCertificateId: 1
            }
        });
    }
    async saveServerCertificate(certificateInfo, certificateSignature) {
        return await this.prisma.serverCertificate.create({
            data: {
                serverCertificateId: 1,
                certificateInfo: certificateInfo,
                certificateSignature: certificateSignature
            }
        });
    }
    async getCAPublicKey() {
        return (await this.prisma.cAPublicKey.findFirst());
    }
    async setCAPublicKey(publicKey) {
        try {
            await this.prisma.cAPublicKey.delete({
                where: {
                    CAPublicKeyId: 1
                }
            });
        }
        catch (_) { }
        return await this.prisma.cAPublicKey.create({
            data: {
                CAPublicKeyId: 1,
                publicKey: publicKey
            }
        });
    }
}
exports.AuthenticatorRepository = AuthenticatorRepository;
