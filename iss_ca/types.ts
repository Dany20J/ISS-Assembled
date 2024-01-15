export interface CSR {
  phoneNumber: string;
  publicKey: string;
}

export interface SignatureData {
  caName: string;
  phoneNumber: string;
  publicKey: string;
}

export interface Certificate {
  signatureData: string;
  signature: string;
}
