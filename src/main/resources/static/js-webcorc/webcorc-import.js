/***********************************************************************************************************************
 * import management for import graph and helper file(tbd)
 */

$("#importGraph").change(function(){

    var graph = document.getElementById("importGraph").files[0];

    let reader = new FileReader();
    let result = "";
    let fileName = graph.name;

    reader.readAsText(graph);

    reader.onload = function() {
        result = reader.result;
        console.log("file:");
        console.log(result);
        // clearLists();
        // deleteAllKnots();
        // createGraph(JSON.parse(result));
        fileName = fileName.replace("json","diagram");
        createNewFileOnServer(getCurrentDirectoryFromCookie() + "/" + fileName, result);
    };

    reader.onerror = function() {
        console.log(reader.error);
    };

});

$("#uploadFile").change(function(){
    let file = document.getElementById("uploadFile").files[0];
    // sendHelperFile(helperFile);
    uploadFileAtCurrentPath(file);
});

$("#uploadZipArchive").change(function(){
    var archive = document.getElementById("uploadZipArchive").files[0];
    uploadWorkspaceAsArchive(archive);
});

$("#uploadJavaFile").change(function(){
    var javaFile = document.getElementById("uploadJavaFile").files[0];
    sendJavaFile(javaFile);
});

