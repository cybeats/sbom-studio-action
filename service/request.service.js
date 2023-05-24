import {calculate} from "./sha.service.js";
import fetch from 'node-fetch';

export async function doRequest(
    body,
    secretAccessKey,
    accessKey,
    url
) {
    let timestamp = Math.floor(Date.now() / 1000);
    const vsig = calculate(timestamp, body, secretAccessKey);
    const req = await fetch(url, {
        method: "POST",
        headers: {
            "x-fwup-access-key-id": accessKey,
            "x-fwup-dtstmp": timestamp,
            "x-fwup-vsig": vsig,
        },
        body: JSON.stringify(body),
    }).then(response => {
        return response;
    })
        .catch(error => {
            // Handle network or other request-related errors
            console.log(error)
            if (error)
                console.error(`Error occurred on request: ${error.message}`);
            else
                console.error(`Error occurred on request.`);

            return error;
            // throw error;
        });

    if (req?.error)
        return "";

    if (!req?.ok) {
        // Request failed (status outside the range of 200-299)
        console.error(`Request failed with status ${req.status}: ${req.statusText}`);
        return "";
    }

    if (!isResponseJSON(req)) {
        console.log('No JSON Response detected. Please check api url if it is correct.')
        return "";
    }
    return await req.json();
};

function isResponseJSON(response) {
    var contentType = response.headers.get('content-type');
    return contentType && contentType.includes('application/json');
}
