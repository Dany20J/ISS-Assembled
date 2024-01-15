import { Prisma } from '@prisma/client'


const UserNoId = Prisma.validator<Prisma.UserArgs>()({
    select: { phoneNumber: true, hashedPassword: true }
})

export type UserSignUpData = Prisma.UserGetPayload<typeof UserNoId>
