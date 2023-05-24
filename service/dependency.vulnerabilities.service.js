import {doRequest} from "./request.service.js";

export async function getDependencyVulnearabilities(
    importId,
    secretAccessKey,
    accessKey,
    url
) {
    const body = {importId: importId};
    return await doRequest(body, secretAccessKey, accessKey, url + "/v1/sboms/componentcatalog/software");
};