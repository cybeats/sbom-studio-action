import {doRequest} from "./request.service.js";

export async function addImport(
    body,
    secretAccessKey,
    accessKey,
    url, proxyRunning
) {
    return await doRequest(body, secretAccessKey, accessKey, url + "/v1/sboms/imports/add", proxyRunning);
};

export async function getImportByKey(
    importId,
    secretAccessKey,
    accessKey,
    url, proxyRunning
) {
    let body = {id: importId};
    return await doRequest(body, secretAccessKey, accessKey, url + "/v1/sboms/imports/getbykey", proxyRunning);
};