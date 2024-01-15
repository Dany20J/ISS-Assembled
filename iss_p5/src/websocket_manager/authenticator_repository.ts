

import { PrismaClient, UserCertificate } from '@prisma/client'
import keypair from 'keypair'
import { Certificate } from '../shared_types/certificate'
import { UserCertificateData } from '../shared_types/user_public_key_data'
export class AuthenticatorRepository {
    private prisma: PrismaClient = new PrismaClient()

    public async getServerPairKey() {
        let serverKeyPair = await this.prisma.serverKeyPair.findFirst({
            where: {
                serverKeyPairId: 1
            }
        })
        if (serverKeyPair === null) {
            let keyPair = keypair()
            serverKeyPair = await this.prisma.serverKeyPair.create({
                data: {
                    serverKeyPairId: 1,
                    serverPublicKey: keyPair.public,
                    serverPrivateKey: keyPair.private
                }
            })
        }
        return serverKeyPair
    }
    public async saveUserCertificateData(cerData: UserCertificateData): Promise<UserCertificate> {
        return await this.prisma.userCertificate.create({
            data: {
                userId: cerData.userId,
                certificateSignature: cerData.certificateSignature,
                certificateInfo: cerData.certificateInfo
            }
        })
    }
    public async getUserCertificateByPhoneNumber(phoneNumber: string) {
        return await this.prisma.userCertificate.findFirst({
            where: {
                User: {
                    phoneNumber: phoneNumber
                }
            }
        })
    }
    public async saveSignature(phoneNumber: string, signature: string, info: string) {
        let user = (await this.prisma.user.findFirst({ where: { phoneNumber: phoneNumber } }))!
        return await this.prisma.userComm.create({
            data: {
                userId: user.userId,
                userSignature: signature,
                userComm: info
            }
        })
    }
    public async getServerCertificate() {
        return await this.prisma.serverCertificate.findFirst({
            where: {
                serverCertificateId: 1
            }
        })
    }
    public async saveServerCertificate(certificateInfo: string, certificateSignature: string) {
        return await this.prisma.serverCertificate.create({
            data: {
                serverCertificateId: 1,
                certificateInfo: certificateInfo,
                certificateSignature: certificateSignature
            }
        })
    }

    public async getCAPublicKey() {
        return (await this.prisma.cAPublicKey.findFirst())!
    }
    public async setCAPublicKey(publicKey: string) {
        try {
            await this.prisma.cAPublicKey.delete({
                where: {
                    CAPublicKeyId: 1
                }
            })
        } catch (_) { }
        return await this.prisma.cAPublicKey.create({
            data: {
                CAPublicKeyId: 1,
                publicKey: publicKey
            }
        })
    }
}