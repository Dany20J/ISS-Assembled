import { Prisma } from '@prisma/client'


const UserCertificateNoPrId = Prisma.validator<Prisma.UserCertificateArgs>()({
    select: { certificateInfo: true, userId: true, certificateSignature: true }
})

export type UserCertificateData = Prisma.UserCertificateGetPayload<typeof UserCertificateNoPrId>
