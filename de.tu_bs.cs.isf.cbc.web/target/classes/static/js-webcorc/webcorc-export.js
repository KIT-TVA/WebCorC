function exportJson() {

    var model = buildWebCorCModel();
    //Convert JSON Array to string.
    var json = JSON.stringify(model, null, 2);

    //Convert JSON string to BLOB.
    json = [json];
    var blob1 = new Blob(json, { type: "text/plain;charset=utf-8" });

    //Check the Browser.
    var isIE = false || !!document.documentMode;
    if (isIE) {
        // TODO: get name of file or get file from server
        window.navigator.msSaveBlob(blob1, "WebCorCDiagram.json");
    } else {
        var url = window.URL || window.webkitURL;
        link = url.createObjectURL(blob1);
        var a = document.createElement("a");
        a.download = "WebCorCDiagram.json";
        a.href = link;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

function exportWorkspace() {

}