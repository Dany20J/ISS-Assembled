"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const UserCertificateNoPrId = client_1.Prisma.validator()({
    select: { certificateInfo: true, userId: true, certificateSignature: true }
});
