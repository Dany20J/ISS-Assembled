"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const UserNoId = client_1.Prisma.validator()({
    select: { phoneNumber: true, hashedPassword: true }
});
