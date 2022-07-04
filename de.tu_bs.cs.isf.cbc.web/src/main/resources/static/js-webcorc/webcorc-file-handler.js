/***********************************************************************************************************************
 * the following code ... (TODO)
 */

function openFile(content, type, fullPath, fileName) {
    currentlyOpenedFile = fullPath;
    let dummyEditorId = "";
    removePreviousCode();
    removePreviousDiagram()
    if (type === "java"){
        dummyEditorId = "dummyCodeEditorDom";
        $("#"+dummyEditorId).css("display", "flex");

        createCodeMirrorInstance(fileName, content);
    }
    else if (type === "diagram"){
        dummyEditorId = "dummyDiagramEditorDom";
        $("#"+dummyEditorId).css("display", "flex");
        createGraph(JSON.parse(content));
    }
    refresh();
    console.log("current File opened: " + currentlyOpenedFile);
}

function createNewDiagram(createButton) {
    createNewFile(createButton, "diagram", "dummyDiagramEditorDom");
    // TODO: also reset the positions (currently saved ind cookies which will also change)
}
function createNewJavaFile(createButton) {
    removePreviousCode();
    createNewFile(createButton, "java", "dummyCodeEditorDom");
}
function createNewFolderFromModal(createButton) {
    let currentDir = getCurrentDirectoryFromCookie();
    if (currentDir === false){
        // TODO: treeview string should be a global static variable
        currentDir = "treeView";
    }
    createFolder(getFileName(createButton), currentDir);
}

function createNewFile(createButton, type, dummyEditorId) {

    let fileName = getFileName(createButton, type);


    // removePreviousEditor();

    if (fileNameExists(fileName, type)){
        alert("file name already exists");
        // TODO if this is the case, modal should stay opened
    }
    else {
        // let newKnot = $("#"+dummyEditorId).clone(true, true).css("display", "block").prop('id', fileName);
        // $("#content-wrapper").append(newKnot);
        $("#"+dummyEditorId).css("display", "flex");
        refresh();
        if(dummyEditorId === "dummyDiagramEditorDom"){
            $("#dummyCodeEditorDom").css("display", "none");
        }
        else {
            $("#dummyDiagramEditorDom").css("display", "none");
        }

        // fileName is also the editor ID
        if(type === "java"){
            createCodeMirrorInstance(fileName);
        }
        // TODO: display it in the tree viewer / display that it is active

        // TODO: fullPath is empty
        let webcorcObject = buildWebCorCModel();
        //let fullPath = getCurrentFilePath();
        // TODO: important! implement a way to know the parent structure (just treeview as parent or any folders?)
        let directoryPath = getCurrentDirectoryFromCookie();
        // let folderId = directoryPath;
        // if (directoryPath !== "treeView") {
        //     folderId = directoryPath + "Folder";
        // }
        let fullPath = directoryPath+"/" + fileName + "." + type;

        createNewFileOnServer(fullPath, JSON.stringify(webcorcObject));
        addFileToTreeviewer(fileName, type, directoryPath);
        setCurrentPathToCookie(fullPath);
    }
}

function getFileName(createButton, type) {
    // TODO: check if file name is ok and check for file endings
    return createButton.parentElement.previousElementSibling.lastElementChild.firstElementChild.value;
}

function fileNameExists(fileName, type) {
    // TODO: check this
    return false;
}

function removePreviousCode() {
    // saveJavaFile();
    $("#dummyCorcCodeArea").children().remove();
    $("#dummyCodeEditorDom").css("display", "none");
}

function removePreviousDiagram() {
    deleteAllKnots();
    // delete conditions
    clearLists();
    $("#dummyDiagramEditorDom").css("display", "none");
    // TODO: deactivate jsPlumb (prevent infinity svg error)
}

// function initializeJsPlumb(editorId) {
//
// }

function saveJavaFile(){
    let content =  document.querySelector('.CodeMirror').CodeMirror.getValue();
    let fullPath = getCurrentPathFromCookie();

    saveFileToServer(fullPath, content);
}

function saveDiagramFile() {
    let webcorcObject = buildWebCorCModel();
    let fullPath =getCurrentPathFromCookie();

    saveFileToServer(fullPath, JSON.stringify(webcorcObject));
}

function saveCurrentFile() {
    // currentlyOpenedFile saves the full path of the current file
}

function deleteCurrentDirectoryElement() {
    // TODO: implement this function
    let currentFile = getCurrentPathFromCookie();
    if (currentFile === "" || currentFile === false){
        // it is a folder, delete on server and remove from treeview
        deleteFileOrFolderOnServer(getCurrentDirectoryFromCookie());
        removeFolderFromTreeview(getCurrentDirectoryFromCookie());
    }
    else {
        deleteFileOrFolderOnServer(currentFile);
        removeFileFromTreeview(currentFile);
        // it is a file (same)
    }
    setCurrentPathToCookie("treeView");
}