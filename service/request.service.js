import {calculate} from "./sha.service.js";
import fetch from "node-fetch";
import {HttpsProxyAgent} from "https-proxy-agent";

export async function doRequest(body, secretAccessKey, accessKey, url, proxyRunning) {
    let timestamp = Math.floor(Date.now() / 1000);
    const vsig = calculate(timestamp, body, secretAccessKey);
    const proxyServer = !process.env.HTTPS_PROXY? process.env.https_proxy : process.env.HTTPS_PROXY;
    let i = 0;
    let req;

    async function getResponse() {
        return await fetch(url, {
            method: "POST",
            headers: {
                "x-fwup-access-key-id": accessKey,
                "x-fwup-dtstmp": timestamp,
                "x-fwup-vsig": vsig,
            },
            body: JSON.stringify(body),
        })
            .then((response) => {
                i = 4;
                return response;
            })
            .catch((error) => {
                i++;
                // Handle network or other request-related errors
                if (error)
                    console.error(`Error occurred on request: ${error?.message}`);
                else console.error(`Error occurred on request.`);
                if (i == 1) console.log("Retrying request for first time.");
                if (i == 2) console.log("Retrying request for second time.");
                if (i == 3) console.log("Retrying request for third time.");
                return error;
                // throw error;
            });
    }

    async function getProxyResponse() {
        const proxyAgent = new HttpsProxyAgent(proxyServer.trim());
        return await fetch(url, {
            agent: proxyAgent,
            method: "POST",
            headers: {
                "x-fwup-access-key-id": accessKey,
                "x-fwup-dtstmp": timestamp,
                "x-fwup-vsig": vsig,
            },
            body: JSON.stringify(body),
        })
            .then((response) => {
                i = 4;
                return response;
            })
            .catch((error) => {
                i++;
                // Handle network or other request-related errors
                if (error)
                    console.error(`Error occurred on request: ${error?.message}`);
                else console.error(`Error occurred on request.`);
                if (i == 1) console.log("Retrying request for first time.");
                if (i == 2) console.log("Retrying request for second time.");
                if (i == 3) console.log("Retrying request for third time.");
                return error;
                // throw error;
            });
    }

    while (i < 4) {
        if (proxyRunning && proxyServer) {
            req = await getProxyResponse();
        } else
            req = await getResponse();
        await new Promise((r) => setTimeout(r, 100));
    }

    if (req?.error) return "";

    if (!req?.ok) {
        // Request failed (status outside the range of 200-299)
        if (req.status !== undefined)
            console.error(
                `Request failed with status ${req?.status}: ${req?.statusText}`
            );
        else
            console.error(
                `Request failed due to Network issue`
            );
        return "";
    }

    if (!isResponseJSON(req)) {
        console.log(
            "No JSON Response detected. Please check api url if it is correct."
        );
        return "";
    }
    return await req.json();
}

function isResponseJSON(response) {
    const contentType = response.headers.get("content-type");
    return contentType?.includes("application/json");
}
