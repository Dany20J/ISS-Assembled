

import { UserSignUpData } from '../shared_types/user_sign_up_data'

import { PrismaClient, User } from '@prisma/client'
import { randomBytes } from "crypto";

export class AccountRepository {
    private prisma: PrismaClient = new PrismaClient()

    public async saveUserSignUpData(data: UserSignUpData): Promise<User> {
        return await this.prisma.user.create({
            data: {
                phoneNumber: data.phoneNumber,
                hashedPassword: data.hashedPassword
            }
        })
    }
    public async getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
        return await this.prisma.user.findUnique({
            where: {
                phoneNumber: phoneNumber
            }
        })
    }

}


