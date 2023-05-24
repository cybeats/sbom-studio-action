import {calculate, fileCheckSumCalculate} from "./sha.service.js";
import {extname, basename} from "path"
import fetch from 'node-fetch';

export function signedUrlService(
    url,
    filePath,
    secretAccessKey,
    accessKey
) {
    const checksum = fileCheckSumCalculate(filePath);
    var extension = extname(filePath);
    var fileName = basename(filePath);
    var contentType;
    if (extension == "") contentType = "application/octet-stream";
    else contentType = "application/" + extension.replace(".", "");

    let timestamp = Math.floor(Date.now() / 1000);
    var body = {fileName: fileName, checksum: checksum, fileType: contentType};
    const vsig = calculate(timestamp, body, secretAccessKey);
    fetch(url,
        {
            method: "POST",
            headers: {
                "x-fwup-access-key-id": accessKey,
                "x-fwup-dtstmp": timestamp,
                "x-fwup-vsig": vsig,
            },
            body: JSON.stringify(body),
        },
        function (error, response, body) {
        }
    ).then(r => {
        return r
    });
};