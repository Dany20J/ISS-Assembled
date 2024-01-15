import { createSign } from "crypto";
import express from "express";
import path, { dirname } from "path";
import { JsonDB, Config } from "node-json-db";
import cors from "cors";
const db = new JsonDB(new Config("./db.json", true, false, "/"));
const app = express();
const port = 8999;
// const { privateKey: serverPrivateKey, publicKey: serverPublicKey } =
//   generateKeyPairSync("rsa", {
//     modulusLength: 2048,
//     publicKeyEncoding: {
//       type: "spki",
//       format: "pem",
//     },
//     privateKeyEncoding: {
//       type: "pkcs8",
//       format: "pem",
//     },
//   });
// db.push("/secrets/privateKey", serverPrivateKey);
// db.push("/secrets/publicKey", serverPublicKey);
let pendingCSRs = [];
let approvedCSRs = [];
const serverPrivateKey = await db.getData("/secrets/privateKey");
const serverPublicKey = await db.getData("/secrets/publicKey");
pendingCSRs = await db.getData("/csrs/pending");
approvedCSRs = await db.getData("/csrs/approved");
app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({
    extended: true,
}));
app.use(cors());
app.set("view engine", "hbs");
app.set("views", path.join(dirname("./"), "views"));
app.get("/admin/panel", (req, res) => {
    res.render("admin", {
        pendingCsrs: pendingCSRs,
        approvedCsrs: approvedCSRs,
        URI: `http://localhost:${port}/admin/approve-csr`,
    });
});
function moveElement(fromArray, toArray, index) {
    if (index >= 0 && index < fromArray.length) {
        const element = fromArray[index];
        toArray.push(element);
        fromArray.splice(index, 1);
    }
}
app.post("/admin/approve-csr", (req, res) => {
    const body = req.body;
    const pendingRequestIndex = pendingCSRs.findIndex((request) => request.phoneNumber === body.phoneNumber);
    if (pendingRequestIndex === -1) {
        return res.send("can`t find csr");
    }
    moveElement(pendingCSRs, approvedCSRs, pendingRequestIndex);
    db.push("/csrs/pending", pendingCSRs, true);
    db.push("/csrs/approved", approvedCSRs, true);
});
app.post("/post-csr", (req, res) => {
    console.log('/post-csr', req.body);
    const body = req.body;
    if (pendingCSRs.find((csr) => csr.phoneNumber === body.phoneNumber) ||
        approvedCSRs.find((csr) => csr.phoneNumber === body.phoneNumber)) {
        return res.json({ successful: false, error: "You`ve issued a CSR" });
    }
    pendingCSRs.push(body);
    db.push("/csrs/pending", pendingCSRs, true);
    return res.json({ successful: true, message: "Your CSR is under review" });
});
app.post("/get-cert", (req, res) => {
    console.log('/get_cer', req.body);
    const body = req.body;
    const approvedRequest = approvedCSRs.find((request) => request.phoneNumber === body.phoneNumber);
    if (approvedRequest === undefined) {
        return res.json({
            successful: false,
            error: "can't find CSR or it still being reviewed",
        });
    }
    const signatureData = JSON.stringify({
        caName: "ISS CA",
        phoneNumber: approvedRequest.phoneNumber,
        publicKey: approvedRequest.publicKey,
    });
    const signer = createSign("rsa-sha256");
    signer.update(signatureData);
    const signature = signer.sign(serverPrivateKey, "hex");
    const cert = {
        signatureData: signatureData,
        signature: signature,
    };
    return res.send({ successful: true, cert: cert });
});
app.get("/public-key", (req, res) => {
    res.send(serverPublicKey);
});
app.listen(port, () => {
    console.log(`Server started on port ${port} :)`);
});
