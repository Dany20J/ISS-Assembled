"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountRepository = void 0;
const client_1 = require("@prisma/client");
class AccountRepository {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async saveUserSignUpData(data) {
        return await this.prisma.user.create({
            data: {
                phoneNumber: data.phoneNumber,
                hashedPassword: data.hashedPassword
            }
        });
    }
    async getUserByPhoneNumber(phoneNumber) {
        return await this.prisma.user.findUnique({
            where: {
                phoneNumber: phoneNumber
            }
        });
    }
}
exports.AccountRepository = AccountRepository;
