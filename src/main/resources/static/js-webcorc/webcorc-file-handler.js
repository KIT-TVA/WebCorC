/***********************************************************************************************************************
 * the following code ... (TODO)
 */

function openFile(content, type, fullPath, fileName) {
	currentlyOpenedFile = fullPath;
	let dummyEditorId = "";
	$("#helper-toggle-button").removeAttr("style");
	removePreviousCode();
	removePreviousDiagram();
	dummyConsoleId = "dummyCorcConsoleArea";
	if (type === "java") {
		dummyEditorId = "dummyCodeEditorDom";
		$("#" + dummyEditorId).css("display", "flex");
		$("#codeEditorSaveButton").attr("onclick", "saveJavaFile()");
		$("#codeEditorCompileButton").removeClass('disabled-button');
		createCodeMirrorInstance(fileName, content);
	} else if (type === "diagram") {
		dummyEditorId = "dummyDiagramEditorDom";
		$("#" + dummyEditorId).css("display", "flex");
		createGraph(JSON.parse(content));
		//the following steps are only required to update the colors
	    let rootKnot = document.getElementById("formula");
	    let returnObject = Object.assign(buildFormula(rootKnot), buildJavaVariables(), buildGlobalConditions());
	    returnObject.proven = JSON.parse(content).proven;
	    let data = {
	        "content": {CorcOutput: returnObject}
    	};
    	updateKnotColors(returnObject, false);
	} else if (type == "helper" || type == "key") {
		dummyEditorId = "dummyCodeEditorDom";
		$("#" + dummyEditorId).css("display", "flex");
		$("#" + dummyEditorId).css("align-self", "auto");
		$("#helper-toggle-button").css("background-color", "green");
		$("#helper-toggle-button").css("color", "white");
		// Rewire buttons on the editor interface when working with helper files
		$("#codeEditorSaveButton").attr("onclick", "saveHelperFile()");
		$("#codeEditorCompileButton").addClass('disabled-button');
		CodeMirror(document.getElementById("dummyCorcCodeArea"), {
			value: content,
			mode: "text/smtlib",
			lineNumbers: "true"
		});
		// TODO Disable the compile button shown in the CodeMirror interface
	}
	if (type === "diagram") {
		$('#' + dummyConsoleId).addClass('corc-console-area');
		$('#' + dummyConsoleId).removeClass('corc-console-area-FULLSIZE');
	} else if (type === "java") {
		$('#' + dummyConsoleId).removeClass('corc-console-area');
		$('#' + dummyConsoleId).addClass('corc-console-area-FULLSIZE');
	}
	$("#" + dummyConsoleId).detach().appendTo("#" + dummyEditorId);
	if (type == "helper" || type == "key") {
		// Hide the console if we are displaying a proof file
		$("#" + dummyConsoleId).css("display", "none");
	} else {
		$("#" + dummyConsoleId).css("display", "flex");
	}
	// TODO Implement toggleConsole function that switches between flex and none
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
	if (currentDir === false) {
		// TODO: treeview string should be a global static variable
		currentDir = "treeView";
	}
	createFolder(getFileName(createButton), currentDir);
}

function createNewFile(createButton, type, dummyEditorId) {

	let fileName = getFileName(createButton, type);


	// removePreviousEditor();

	if (fileNameExists(fileName, type)) {
		alert("file name already exists");
		// TODO if this is the case, modal should stay opened
	}
	else {
		let fileContent = "class " + fileName + "{\n" +
			"  public void main(String[] args){\n" +
			"  }\n" +
			"}";
		// let newKnot = $("#"+dummyEditorId).clone(true, true).css("display", "block").prop('id', fileName);
		// $("#content-wrapper").append(newKnot);
		$("#" + dummyEditorId).css("display", "flex");
		refresh();
		if (dummyEditorId === "dummyDiagramEditorDom") {
			$("#dummyCodeEditorDom").css("display", "none");
		}
		else {
			$("#dummyDiagramEditorDom").css("display", "none");
		}

		// fileName is also the editor ID
		if (type === "java") {
			createCodeMirrorInstance(fileName);
		}
		else {
			let webcorcObject = buildWebCorCModel();
			fileContent = JSON.stringify(webcorcObject);
		}
		// TODO: display it in the tree viewer / display that it is active

		// TODO: fullPath is empty
		//let fullPath = getCurrentFilePath();
		// TODO: important! implement a way to know the parent structure (just treeview as parent or any folders?)
		let directoryPath = getCurrentDirectoryFromCookie();
		// let folderId = directoryPath;
		// if (directoryPath !== "treeView") {
		//     folderId = directoryPath + "Folder";
		// }
		let fullPath = directoryPath + "/" + fileName + "." + type;

		createNewFileOnServer(fullPath, fileContent);
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

function hideConsole() {
	$("#dummyCorcConsoleArea").css("display", "none");
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

function saveJavaFile() {
	let content = document.querySelector('.CodeMirror').CodeMirror.getValue();
	let fullPath = getCurrentPathFromCookie();

	saveFileToServer(fullPath, content);
}

function saveHelperFile() {
	let content = document.querySelector('.CodeMirror').CodeMirror.getValue();
	let fullPath = 'helpers/default.key';
	// 'helpers' is here shorthand for session ID + HelperFiles

	saveFileToServer(fullPath, content);
}

function saveDiagramFile() {
	let webcorcObject = buildWebCorCModel();
	let fullPath = getCurrentPathFromCookie();

	saveFileToServer(fullPath, JSON.stringify(webcorcObject));
}

function saveCurrentFile() {
	// currentlyOpenedFile saves the full path of the current file
}

function deleteCurrentDirectoryElement() {
	// TODO: implement this function
	let currentFile = getCurrentPathFromCookie();
	if (currentFile === "" || currentFile === false) {
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