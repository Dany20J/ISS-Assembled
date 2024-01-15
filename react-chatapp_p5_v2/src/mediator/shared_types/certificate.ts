export type Certificate = {
    certificateInfo: CertificateInfo,
    certificateSignature: string
}
export type CertificateInfo = {
    caName: string,
    phoneNumber: string,
    publicKey: string
}