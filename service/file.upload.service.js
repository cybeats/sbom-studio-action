import {readFileContent} from "./sha.service.js";
import {extname, basename} from "path"
import fetch from 'node-fetch';

export async function uploadFile(filePath, url, fileCheckSum) {
    const fileName = basename(filePath);
    const extension = extname(fileName);
    let contentType;
    if (extension == "") contentType = "application/octet-stream";
    else contentType = "application/" + extension;
    const fileContent = await readFileContent(filePath);
    fetch(url,
        {
            method: "PUT",
            headers: {
                "Content-Type": contentType.replace(".", ""),
                "Content-Disposition": "attachment; filename=" + fileName,
                "X-Amz-Content-Sha256": fileCheckSum,
            },
            body: fileContent.toString(),
        }).then(response => {
        if (!response.ok) {
            // Request failed (status outside the range of 200-299)
            console.error(`Request failed with status ${response.status}: ${response.statusText}`);
            return "";
        }
    })
        .catch(error => {
            // Handle network or other request-related errors
            console.error(`Error occurred on request: ${error.message}`);
        });
    return true;
};