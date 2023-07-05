import {readFileContent} from "./sha.service.js";
import {extname, basename} from "path"
import fetch from 'node-fetch';
import {HttpsProxyAgent} from "https-proxy-agent";

export async function uploadFile(filePath, url, fileCheckSum, proxyRunning) {
    const fileName = basename(filePath);
    const extension = extname(fileName);
    const proxyServer = !process.env.HTTPS_PROXY? process.env.https_proxy : process.env.HTTPS_PROXY;
    let contentType;
    if (extension == "") contentType = "application/octet-stream";
    else contentType = "application/" + extension;
    const fileContent = await readFileContent(filePath);
    if (!proxyRunning || !proxyServer)
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
    else {
        const proxyAgent = new HttpsProxyAgent(proxyServer.trim());
        fetch(url,
            {
                agent: proxyAgent,
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
    }
    return true;
};