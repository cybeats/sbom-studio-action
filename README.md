# Setup SBOM Studio Plugin

This action provides the following functionality for GitHub Actions users:

- Uploading SBOM file to SBOM Studio
- Scanning for vulnerabilities in uploaded SBOM file
- Failing build if threshold provided for acceptable vulnerabilities
- Generating report information with vulnerabilities data regarding uploaded SBOM file

**Examples:**

```yaml
on:
  workflow_dispatch:
jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    env:
      ############################################################################################
      # One way to provide the url input parameter is to define environmental variable.
      # 
      # Please find the API_URL value from SBOM Studio profile settings page.
      # 
      # This url could be different for each customer.
      #
      # You'll need to remove /v1 at the end of the URL.
      #
      # If SBOM Studio profile settings page shows https://api.us.services.cybeats.com/v1/
      # then the following shall be the url input for the sbom-studio-action.
      #
      ############################################################################################
      API_URL: 'https://api.us.services.cybeats.com'
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v3

      ############################################################################################
      # The required input parameters are the following
      #
      # url                   API_URL shall always start with https:// 
      #                       it should not have /v1 at the end.
      #
      # accessKey             accessKey for the SBOM Studio API
      #
      # secretAccessKey       secretAcessKey for the SBOM Studio API
      #
      # filePath              the filePath of the SBOM relative to the root of the workspace
      #                       the SBOM could be generated during the build.
      #
      # subType               This value shall match the actual top level component type
      #                       of the SBOM document.
      #
      #                       the following subTypes are currently supported  
      #                       - firmware
      #                       - container
      #                       - application
      #                       - operating-system
      #                       - package
      #                       - library
      #
      ############################################################################################
      - name: Import a cyclonedx SBOM of a container
        uses: cybeats/sbom-studio-action@v1
        with:
          url: ${{ env.API_URL }}
          filePath: examples/container/alpine-cyclonedx.json  
          secretAccessKey: ${{ secrets.SECRETKEY }}  
          accessKey: ${{ secrets.ACCESSKEY }}  
          subType: container  


      ############################################################################################
      # The required parameters are: url, accessKey, secretAccessKey, filePath, subType
      # 
      # There are optional parameters to provide top level component information
      # if top level component is missing from the generated SBOM.
      # 
      # Please note that the following 4 parameters shall not be used individually.
      # They shall be all provided together or not provided at all.
      # When provided together only namespace is optional. 
      #
      # pkgType               please find supported pkgType at the end of this README file
      # sbomComponentName     name of the artifact
      # sbomComponentVersion  version of the artifact
      # namespace             namespace of the artifact (required by maven artifacts)
      #
      ############################################################################################
      
      # pypi application
      # pkgType: pypi
      # sbomComponentName: my-example-pypi-application
      # sbomComponentVersion: an interpolated string start with 2.1
      # namespace parameter is optional and not needed by pypi package manager
      - name: Import a cyclonedx SBOM of a pypi application
        uses: cybeats/sbom-studio-action@v1
        with:
          url:  ${{ env.API_URL }}
          filePath:   examples/application/cyclonedx-sbom-of-my-pypi-application.json
          secretAccessKey:   ${{ secrets.SECRETKEY }}  
          accessKey:   ${{ secrets.ACCESSKEY }}  
          subType:   application     
          pkgType: pypi
          sbomComponentName: my-example-pypi-application
          sbomComponentVersion: 2.1.${{ github.run_number }}

      # maven application
      # namespace parameter is provided here as needed by maven central
      - name: Import a cyclonedx SBOM of a maven application
        uses: cybeats/sbom-studio-action@v1
        with:
          url:  ${{ env.API_URL }}
          filePath:   examples/application/cyclonedx-sbom-of-my-example-maven-application.json
          secretAccessKey:   ${{ secrets.SECRETKEY }}  
          accessKey:   ${{ secrets.ACCESSKEY }}  
          subType:   application     
          pkgType: maven
          sbomComponentName: my-example-maven-application
          sbomComponentVersion: 1.0.0
          namespace: 'com.mycompany'       

      ############################################################################################
      # The imported SBOM's manufacturer and supplier will default to the organization 
      # that the SBOM Studio account was created for. 
      #
      # There are optional input parameters to allow specifying the manufacture and supplier
      # for the SBOM. 
      #
      # manufactureName       manufacture organization from the SBOM apply chain orgs page
      #
      # supplierName          supplier organization from the SBOM spply chain orgs page
      #
      # The values of the manufactureName and supplierName shall actually exist 
      # in the SBOM Supply Chain Orgs page of the SBOM Studio, otherwise will get error.
      #
      ############################################################################################
      # The organizationsshall exist on the SBOM Supply Chain Orgs page,
      # If not they can be created in SBOM Studio before used.
      #
      # manufactureName: my-example-manufacture-organization 
      # supplierName: my-example-supplier-organization       
      - name: Import an SDPX SBOM of an application 
        uses: cybeats/sbom-studio-action@v1
        with:
          url:   ${{ env.API_URL }}  
          filePath:  ./spdx-example-application.spdx  
          secretAccessKey:   ${{ secrets.SECRETKEY }}  
          accessKey:   ${{ secrets.ACCESSKEY }}  
          subType:   application  
          manufactureName: my-example-manufacture-organization  
          supplierName: my-example-supplier-organization


      ############################################################################################
      # The imported SBOM's manufacturer and supplier will default to the organization 
      # that the SBOM Studio account was created for. 
      #
      # There are optional input parameters
      #
      # sbomQuality           exptected SBOM quality value (integer value between 0 - 100)
      #                       imported SBOM with lower quality than this value will stop build
      #
      # threshold             vulnerability threshold (Low, Medium, High, or Critical)
      #                       known vulnerability in the SBOM with severity equal or above
      #                       this threshold will cause stop build
      #
      ############################################################################################
      - name: Import an SPDX SBOM of an application
        uses: cybeats/sbom-studio-action@v1
        with:
          url:   ${{ env.API_URL }}  
          filePath:  ./spdx-example-application.spdx  
          secretAccessKey:   ${{ secrets.SECRETKEY }}  
          accessKey:   ${{ secrets.ACCESSKEY }}  
          subType:   application 
          sbomQuality:   90                

      # threshold of value High will cause build to fail.
      # only Low and Medium vulnerabilities allowed in this case.
      - name: Import an SPDX SBOM of an application
        uses: cybeats/sbom-studio-action@v1
        with:
          url:   ${{ env.API_URL }}  
          filePath:  ./spdx-example-application.spdx  
          secretAccessKey:   ${{ secrets.SECRETKEY }}  
          accessKey:   ${{ secrets.ACCESSKEY }}  
          subType:   application 
          threshold:   High  

      ############################################################################################
      # Required parameters: 
      # - url, accessKey, secretAccessKey, filePath, subType
      #
      # Optional parameter group for top level component information (need to use together)
      # - pkgType, sbomComponentName, sbomComponentVersion, and optinally namespace
      #
      # Optional parameters for supply chain orgs
      # - manufactureName supplierName threshold sbomQuality
      #
      # Optional parameters to stop build 
      # - sbomQuality, threshold
      #
      # All the input parameters are supplied the following example.
      #
      ############################################################################################
      - name: Import an SBOM providing all the parameters
        uses: cybeats/sbom-studio-action@v1
        with:
          url:   ${{ env.API_URL }}  
          filePath:  ./spdx-examples/example9/spdx2.2/appbomination.spdx.json  
          secretAccessKey:   ${{ secrets.SECRETKEY }}  
          accessKey:   ${{ secrets.ACCESSKEY }}  
          subType:   application 
          threshold:   Medium
          sbomQuality:   75  
          pkgType:   maven   
          sbomComponentName: appbomination 
          sbomComponentVersion:     8.8.5
          namespace: example9      
          manufactureName: my-example-manufacture-organization  
          supplierName: my-example-supplier-organization       
```

#### Required Fields

    url
    filePath
    secretAccessKey
    accessKey
    subType

#### Optional Fields

    manufactureName
    supplierName
    threshold
    sbomQuality
    pkgType
    sbomComponentName
    namespace
    sbomComponentVersion

#### NOTE

    The 4 input parameters (pkgType, sbomComponentName, sbomComponentVersion and optionally namespace) are optional but they go in pack together. They cannot be provided individually. 

    Required Fields need to be present when running the workflow every time otherwise build will stop and fail.

    Optional Fields can be left out if not needed.

#### pkgType supported by SBOM Studio

    alpine
    alpm
    apache
    apk
    android
    arch
    atom
    bitbucket
    bower
    brew
    buildroot
    cargo
    carthage // carthage for Cocoapods Cocoa packages
    chef
    chocolatey // chocolatey for Chocolatey packages
    clojars //clojars for Clojure packages
    conan // C++ packages
    conda
    cocoapods
    composer
    coreos // coreos for CoreOS packages
    cpan // cpan for CPAN Perl packages
    ctan // for CTAN TeX packages
    crystal // Crystal Shards packages
    deb
    docker
    drupal // Drupal packages
    dtype // DefinitelyTyped TypeScript type definitions
    dub // D packages
    ebuild // Gentoo Linux portage packages
    eclipse // Eclipse projects packages
    elm // Elm packages
    gem
    generic
    gitea // Gitea-based packages
    github
    gitlab // Gitlab-based packages
    golang
    gradle // Gradle plugins
    guix // Guix packages
    haxe // Haxe packages
    helm // Kubernetes packages
    hex
    julia // Julia packages
    ipk
    lua // LuaRocks packages
    maven
    melpa // Emacs packages,
    meteor // Meteor JavaScript packages
    nim // Nim packages
    nix // Nixos packages
    npm
    nuget
    oci // OCI containers
    opam // OCaml packages,
    openwrt // OpenWRT packages,
    osgi // OSGi bundle packages
    p2 // Eclipse p2 packages
    pacman
    pear // Pear PHP packages
    pecl // PECL PHP packages,
    perl6 //  Perl 6 module packages
    platformio // PlatformIO packages
    pypi
    puppet // Puppet Forge packages
    rpm
    sourceforge // Sourceforge-based packages
    sublime // Sublime packages
    terraform // Terraform modules
    vagrant // Vagrant boxes
    vim //Vim scripts packages
    wordpress //Wordpress packages
    yocto
    operating-system
