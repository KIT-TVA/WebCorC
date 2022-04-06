/***********************************************************************************************************************
 * import management for import graph and helper file(tbd)
 */

$("#importGraph").change(function(){

    var graph = document.getElementById("importGraph").files[0];

    let reader = new FileReader();
    let result = "";

    reader.readAsText(graph);

    reader.onload = function() {
        result = reader.result;
        console.log("file:");
        console.log(result);
        clearLists();
        deleteAllKnots();
        createGraph(JSON.parse(result));
    };

    reader.onerror = function() {
        console.log(reader.error);
    };

});

$("#uploadHelperfile").change(function(){
    var helperFile = document.getElementById("uploadHelperfile").files[0];
    sendHelperFile(helperFile);
});

$("#uploadJavaFile").change(function(){
    var javaFile = document.getElementById("uploadJavaFile").files[0];
    sendJavaFile(javaFile);
});
