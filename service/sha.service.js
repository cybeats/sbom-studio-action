import {createHash, createHmac} from "crypto"
import {readFileSync, existsSync} from "fs"

export function calculate(timestamp, body, secretAccessKey) {
    const hmacAlg = "SHA256";
    const data = timestamp + JSON.stringify(body);
    // Build session signature
    let sessionSignature = createHmac(hmacAlg, secretAccessKey)
        .update(data)
        .digest("base64");
    // Make signature URL safe
    sessionSignature = sessionSignature
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/\=+$/, "");
    return sessionSignature;
};

export function fileCheckSumCalculate(filePath) {
    const fileBuffer = readFileSync(filePath);

    const hash = createHash("sha256");
    const finalHex = hash.update(fileBuffer).digest("hex");
    return finalHex;
};

export async function readFileContent(file) {
    const contents = readFileSync(file, "utf-8");
    return contents;
};

export function checkFile(fileUrl) {
    if (!existsSync(fileUrl)) {
        console.log("File does not exist.")
        return false;
    }
    return true;
}

