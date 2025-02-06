import {generateJson} from "./service/json.generator.js";
import {addImport, getImportByKey} from "./service/import.service.js";
import {uploadFile} from "./service/file.upload.service.js";
import {getDependencyVulnearabilities} from "./service/dependency.vulnerabilities.service.js";
import {checkFile, fileCheckSumCalculate} from "./service/sha.service.js";
import path from "path";
const core = require('@actions/core');
const github = require('@actions/github');

let url = core.getInput(url);
const filePath = core.getInput(filePath);
const secretAccessKey = core.getInput(secretAccessKey);
const accessKey = core.getInput(accessKey);
const manufactureName = core.getInput(manufactureName);
const supplierName = core.getInput(supplierName);
const subType = core.getInput(subType);
const threshold = core.getInput(threshold);
const pkgType = core.getInput(pkgType);
const sbomComponentName = core.getInput(sbomComponentName);
const namespace = core.getInput(namespace);
const sbomComponentVersion = core.getInput(sbomComponentVersion);
const sbomQuality = core.getInput(sbomQuality);


// let url = process.env.INPUT_URL.trim()
// const filePath = process.env.INPUT_FILEPATH.trim()
// const secretAccessKey = process.env.INPUT_SECRETACCESSKEY.trim()
// const accessKey = process.env.INPUT_ACCESSKEY.trim()
// const manufactureName = process.env.INPUT_MANUFACTURENAME.trim()
// const supplierName = process.env.INPUT_SUPPLIERNAME.trim()
// const subType = process.env.INPUT_SUBTYPE.trim()
// const threshold = process.env.INPUT_THRESHOLD.trim()
// const pkgType = process.env.INPUT_PKGTYPE.trim()
// const sbomComponentName = process.env.INPUT_SBOMCOMPONENTNAME.trim()
// const namespace = process.env.INPUT_NAMESPACE.trim()
// const sbomComponentVersion = process.env.INPUT_SBOMCOMPONENTVERSION.trim()
// const sbomQuality = process.env.INPUT_SBOMQUALITY.trim()

const noProxy = !process.env.NO_PROXY? process.env.no_proxy : process.env.NO_PROXY;

let contentType;
if (!url || !filePath || !secretAccessKey || !accessKey || !subType) {
    console.log("Please provide all required parameters: url, filePath, accessKey, secretAccessKey, and subType.");
    process.exit(1);
}

// pkgType, sbomComponentName, sbomComponentVersion, and optionally namespace shall be either all present or all absent
let optionalArgsPresent = (pkgType && sbomComponentName && sbomComponentVersion)
let optionalArgsAbsent = (!pkgType && !sbomComponentName && !sbomComponentVersion && !namespace)
if (!(optionalArgsPresent || optionalArgsAbsent)) {
    console.log("Input parameters pkgType, sbomComponentName, sbomComponentVersion, and optionally namespace shall be used together" +
        " and cannot be used individually.")
    process.exit(1)
}

if (url.endsWith('/')){
    url = url.substring(0, url.length -1);
}

const regex = /^https:\/\/[^ "]+$/;
if (!regex.test(url)) {
    console.log("Incorrect api url. Please adjust configuration.")
    process.exit(1)
}
if (threshold) {
    if (threshold != 'Low' && threshold != 'Medium' && threshold != 'High' && threshold != 'Critical') {
        console.log("Please provide correct data for threshold field (Low, Medium, High, Critical). NOTE: it's case sensitive so it needs to match as provided example.")
        process.exit(1)
    }
}
if (sbomQuality) {
    if (isNaN(sbomQuality)) {
        console.log("Only number allowed for sbomQuality. Please input number from 0 - 100.")
        process.exit(1)
    }
    if (sbomQuality < 0 || sbomQuality > 100) {
        console.log("Please enter number from 0 - 100.")
        process.exit(1);
    }
}
try {
    if (!checkFile(filePath))
        process.exit(1)
} catch (err) {
    console.log("Incorrect filePath. Please check if file is missing.")
    process.exit(1)
}
let fileName = path.basename(filePath);

const extension = path.extname(fileName);
if (extension == "")
    contentType = "application/octet-stream";
else contentType = "application/" + extension.replace(".", "");

fileName = path.basename(filePath);
const fileCheckSum = fileCheckSumCalculate(filePath);
const jsonBody = generateJson(
    fileCheckSum,
    fileName,
    contentType,
    manufactureName,
    supplierName,
    subType,
    pkgType,
    sbomComponentName,
    sbomComponentVersion,
    namespace
);
if (jsonBody == "") {
    console.log("Wrong config.")
    process.exit(1)
}
let proxyRunning = true;
if (noProxy) {
    const apiUrl = new URL(url)
    const proxyArray = noProxy.split(',');
    for (let i = 0; i < proxyArray.length; i++) {
        if (proxyArray[i] === apiUrl.hostname)
            proxyRunning = false;
    }
}
const importResult = await addImport(
    jsonBody,
    secretAccessKey,
    accessKey,
    url, proxyRunning
);
let importId = importResult?.data?.importId;
const signedUrl = importResult?.data?.signedUrl;
if (importId == undefined || signedUrl == undefined) {
    console.log(importResult)
    process.exit(1);
}
let sbomQualityGrade = "";
let sbomQualityPct = 0;

if (!uploadFile(filePath, signedUrl, fileCheckSum, proxyRunning)) {
    console.log("Upload Failed. Failing build.")
    process.exit(1);
}
let runLoop = true;
let uploadedAt = true;
let normalizedAt = true;
let analyzedAt = true;
let importedAt = true;
while (runLoop) {
    let result = await getImportByKey(
        importId,
        secretAccessKey,
        accessKey,
        url, proxyRunning
    );
    if (result == "") process.exit(1);
    const status = result?.data?.status;
    const enrichmentStatus = result?.data?.enrichmentStatus;

    if (result?.data?.uploadedAt != undefined && uploadedAt) {
        console.log("File " + fileName + " has been uploaded.");
        uploadedAt = false;
    }
    if (result?.data?.normalizedAt != undefined && normalizedAt) {
        console.log("File " + fileName + " has been normalized.");
        normalizedAt = false;
    }
    if (result?.data?.analyzedAt != undefined && analyzedAt) {
        console.log("File " + fileName + " has been analyzed.");
        analyzedAt = false;
    }
    if (result?.data?.importedAt != undefined && importedAt) {
        console.log("File " + fileName + " has been imported.");
        importedAt = false;
    }
    if (status == 8001 || status == 8002 || status == 8003 || status == 8004) {
        console.log(result?.data?.statusDesc);
        if (result?.data?.errorMsg != undefined) console.log(result.data.errorMsg);

        process.exit(1);
    }
    // console.log(result)
    if (status == 7110 && enrichmentStatus == 7010) {
        runLoop = false;
        importId = result?.data?.id;
        sbomQualityPct = result?.data?.sbomQualitySummary?.gradePct;
        sbomQualityGrade = result?.data?.sbomQualitySummary?.gradeLetter;
    }
    await new Promise((r) => setTimeout(r, 15000));
}
const millisecondsToWait = 15000;
setTimeout(function () {
    // Whatever you want to do after the wait
}, millisecondsToWait);

console.log(
    "Sbom Quality Grade: " +
    sbomQualityGrade +
    ", Grade Points : " +
    sbomQualityPct
);

let failBuild = false;
if (threshold != undefined && threshold != '') {
    let result = await getDependencyVulnearabilities(
        importId,
        secretAccessKey,
        accessKey,
        url, proxyRunning
    );
    while (result == undefined) {
        result = await getDependencyVulnearabilities(
            importId,
            secretAccessKey,
            accessKey,
            url, proxyRunning
        );
        console.log(result)
        await new Promise((r) => setTimeout(r, 15000));
    }
    const lowVulns = result?.entities[0]?.depsVulnStats?.l;
    const mediumVulns = result?.entities[0]?.depsVulnStats?.m;
    const highVulns = result?.entities[0]?.depsVulnStats?.h;
    const criticalVulns = result?.entities[0]?.depsVulnStats?.c;
    switch (threshold) {
        case "Low":
            if (
                lowVulns != undefined ||
                mediumVulns != undefined ||
                highVulns != undefined ||
                criticalVulns != undefined
            ) {
                failBuild = true;
            }
            break;
        case "Medium":
            if (
                mediumVulns != undefined ||
                highVulns != undefined ||
                criticalVulns != undefined
            ) {
                failBuild = true;
            }
            break;
        case "High":
            if (highVulns != undefined || criticalVulns != undefined) {
                failBuild = true;
            }
            break;
        case "Critical":
            if (criticalVulns != undefined) {
                failBuild = true;
            }
            break;
    }
    if (criticalVulns != undefined)
        console.log("Critical Vulnerabilities found " + criticalVulns);
    if (highVulns != undefined)
        console.log("High Vulnerabilities found " + highVulns);
    if (mediumVulns != undefined)
        console.log("Medium Vulnerabilities found " + mediumVulns);
    if (lowVulns != undefined)
        console.log("Low Vulnerabilities found " + lowVulns);
    if (result?.entities[0]?.depsVulns) {
        for (let i = 0; i < result.entities[0].depsVulns.length; i++) {
            console.log("--------------");
            console.log(result?.entities[0]?.depsVulns[i]?.id);
            console.log(result?.entities[0]?.depsVulns[i]?.summary);
        }
    }
    if (failBuild) {
        console.log("Vulnerabilities found above the set threshold. Build failing.")
        process.exit(1);
    }
}
if (sbomQuality != undefined) {
    if (sbomQuality > sbomQualityPct) {
        console.log("Sbom Quality bellow acceptable parameter. Build failing.")
        process.exit(1)
    }
}