/***********************************************************************************************************************
 * the following code ... (TODO)
 */

function createNewDiagram(createButton) {
    createNewFile(createButton, "diagram", "dummyDiagramEditorDom")
}
function createNewJavaFile(createButton) {
    createNewFile(createButton, "java", "dummyCodeEditorDom")
}

function createNewFile(createButton, type, dummyEditorId) {

    let fileName = getFileName(createButton, type);

    removePreviousEditor();

    if (fileNameExists(fileName, type)){
        alert("file name already exists");
        // TODO if this is the case, modal should stay opened
    }
    else {
        let newKnot = $("#"+dummyEditorId).clone(true, true).css("display", "block").prop('id', fileName);
        $("#content-wrapper").append(newKnot);

        // fileName is also the editor ID
        if(type === "diagram") initializeJsPlumb(fileName);

        // TODO: display it in the tree viewer
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

function removePreviousEditor() {
    // TODO: do this but remember the file
}

function initializeJsPlumb(editorId) {
    // TODO: do this
}
