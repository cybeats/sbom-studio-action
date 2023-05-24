import {doRequest} from "./request.service.js";

export async function addImport(
    body,
    secretAccessKey,
    accessKey,
    url
) {
    return await doRequest(body, secretAccessKey, accessKey, url + "/v1/sboms/imports/add");
};

export async function getImportByKey(
    importId,
    secretAccessKey,
    accessKey,
    url
) {
    let body = {id: importId};
    return await doRequest(body, secretAccessKey, accessKey, url + "/v1/sboms/imports/getbykey");
};