export function generateJson(
    fwCheckSum,
    fileName,
    fileType,
    manufactureName,
    supplierName,
    subType,
    pkgType,
    sbomComponenentName,
    sbomComponentVersion,
    namespace,
    sbomAutocorrection,
    sbomLicenseCorrection
) {
    let jsonBody = {
        type: "catalog",
        subType: subType,
        checksum: fwCheckSum,
        fileName: fileName,
        silentMode: true,
        fileType: fileType,
    };
    let component = undefined;
    if (
        isDefined(pkgType) &&
        isDefined(sbomComponenentName) &&
        isDefined(sbomComponentVersion)
    ) {
        component = {
            pkgType: pkgType,
            name: sbomComponenentName,
            version: sbomComponentVersion
        };
        if (isDefined(namespace))
            component['namespace'] = namespace;
    }
    if (isDefined(manufactureName))
        jsonBody["manufactureName"] = manufactureName;
    if (isDefined(supplierName)) jsonBody["supplierName"] = supplierName;
    if (component !== undefined) jsonBody["sbomComponent"] = component;
    if ((sbomAutocorrection != undefined) && (typeof sbomAutocorrection == 'boolean')) jsonBody["autocorrection"] = sbomAutocorrection;
    if ((sbomLicenseCorrection != undefined) && (typeof sbomLicenseCorrection == 'boolean')) jsonBody["licenseAutocorrection"] = sbomLicenseCorrection;

    return jsonBody;
};

function isDefined(inputVar) {
    return (inputVar && inputVar.trim() !== '')
}