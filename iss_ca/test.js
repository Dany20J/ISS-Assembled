import * as crypto from "crypto";
import fetch from "node-fetch";

async function main() {
  let headersList = {
    "Content-Type": "application/json",
  };

  let bodyContent = JSON.stringify({
    phoneNumber: "23124127",
  });

  let cert = await fetch("http://localhost:8999/get-cert", {
    method: "POST",
    body: bodyContent,
    headers: headersList,
  }).then((res) => res.json());

  console.log(cert)
  const data = cert.cert.signatureData;
  const signature = cert.cert.signature;
  console.log(data, signature)

  const verifier = crypto.createVerify("rsa-sha256");
  verifier.update(data);
  const isVerified = verifier.verify(publicKey, signature, "hex");
  console.log(isVerified);
}
main();
