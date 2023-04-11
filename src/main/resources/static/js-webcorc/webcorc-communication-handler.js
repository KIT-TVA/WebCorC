/***********************************************************************************************************************
 * here lives all the communication between server and client. The object created by the object handler will be
 * communicated and altered by the server.
 */
// import axios from "../vendor/jquery/jquery-2";

setSessionId();

setTimeout(() => {
    initialize();
}, 100);

$(".context-menu-button-verify").click(function () {
    verifyWebCorCModel(getCurrentPathFromCookie(),{CorcInput: buildWebCorCModel()});
    console.log("verification started ...");
});

// TODO Try implementing handler functions without code duplication
$(".context-menu-button-verify-statement").click(function () {
    // verifyWebCorCModel();
    verifyWebCorCModelStatement(getCurrentPathFromCookie(), clickedStatementId, "FullProof");
    console.log("verification of " + clickedStatementId + " started: Proof goal FULL ...");
});
$(".context-menu-button-verify-precondition").click(function () {
    // verifyWebCorCModel();
    verifyWebCorCModelStatement(getCurrentPathFromCookie(), clickedStatementId, "Precondition");
    console.log("verification of " + clickedStatementId + " started: Proof goal PRECONDITION ...");
});
$(".context-menu-button-verify-postcondition").click(function () {
    // verifyWebCorCModel();
    verifyWebCorCModelStatement(clickedStatementId, "Postcondition");
    console.log("verification of " + clickedStatementId + " started: Proof goal POSTCONDITION ...");
});
$(".context-menu-button-verify-variant").click(function () {
    // verifyWebCorCModel();
    verifyWebCorCModelStatement(clickedStatementId, "Variant");
    console.log("verification of " + clickedStatementId + " started: Proof goal VARIANT ...");
});


function saveFileToServer(fullPath, content) {
    let data = {
        "path": fullPath,
        "content": content
    };

    $.ajax({
        type: "POST",
        url: "//" + window.location.host + "/edu.kit.cbc.web/saveFile",
        // The key needs to match your method's input parameter (case-sensitive).
        data: JSON.stringify(data),
        contentType: false,
        dataType: false,
        success: function (data) {
            returnValue = data;
        },
        error: function (xhr, status, errMsg) {
            console.log("An Error occurred: ")
            console.log(errMsg);
            returnValue = -1;
        },
        async: false
    });
}

function createNewFileOnServer(fullPath, content) {
    let data = {
        "path": fullPath,
        "content": content
    };

    $.ajax({
        type: "POST",
        url: "//" + window.location.host + "/edu.kit.cbc.web/createFile",
        // The key needs to match your method's input parameter (case-sensitive).
        data: JSON.stringify(data),
        contentType: false,
        dataType: false,
        success: function (data) {
            returnValue = data;
        },
        error: function (xhr, status, errMsg) {
            console.log("An Error occurred: ")
            console.log(errMsg);
            returnValue = -1;
        },
        async: false
    });
}

function createNewDirectoryOnServer(fullPath) {
    let data = {
        "path": fullPath
    };

    $.ajax({
        type: "POST",
        url: "//" + window.location.host + "/edu.kit.cbc.web/createDirectory",
        // The key needs to match your method's input parameter (case-sensitive).
        data: JSON.stringify(data),
        contentType: false,
        dataType: false,
        success: function (data) {
            returnValue = data;
        },
        error: function (xhr, status, errMsg) {
            console.log("An Error occurred: ")
            console.log(errMsg);
            returnValue = -1;
        },
        async: false
    });
}
$(".context-menu-button-verify").click(function () {
    verifyWebCorCModel(getCurrentPathFromCookie(),{CorcInput: buildWebCorCModel()});
    console.log("verification started ...");
});

function exportWorkspaceAsArchive(){
    $.ajax({
        type: "GET",
        url: "//" + window.location.host + "/edu.kit.cbc.web/getWorkspaceAsArchive",
        contentType: 'application/json',
        xhrFields:{
            responseType: 'blob'
        },
        success: function (data) {
            console.log(data);
            const url = URL.createObjectURL(data);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', "WebCorCWorkspace.zip");
                document.body.append(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
        },
        error: function (errMsg) {
            console.log("An Error occurred: ");
            console.log(errMsg);
        },
        statusCode: {
            404: function () {
                // createToast("404: Server connection failed.", "Export Workspace failed");
            }
        }
    });
}

function uploadWorkspaceAsArchive(zipArchive){
    var form_zip_archive_upload = new FormData();
    form_zip_archive_upload.append('file', zipArchive);
    $.ajax({
        type: "POST",
        url: "//" + window.location.host + "/edu.kit.cbc.web/uploadWorkspaceAsArchive",
        data: form_zip_archive_upload,
        contentType: false,
        dataType: false,
        processData: false,
        success: function (data) {
            console.log(data);
            document.location.reload();
        },
        error: function (errMsg) {
            console.log("An Error occurred: ");
            console.log(errMsg);
        },
        statusCode: {
            404: function () {
                // createToast("404: Server connection failed.", "Failed to send Helperfile");
            }
        }
    });
}

function deleteFileOrFolderOnServer(fullPath) {
    let data = {
        "path": fullPath
    };

    $.ajax({
        type: "POST",
        url: "//" + window.location.host + "/edu.kit.cbc.web/deleteFileOrFolder",
        // The key needs to match your method's input parameter (case-sensitive).
        data: JSON.stringify(data),
        contentType: false,
        dataType: false,
        success: function (data) {
            returnValue = data;
        },
        error: function (xhr, status, errMsg) {
            console.log("An Error occurred: ")
            console.log(errMsg);
            returnValue = -1;
        },
        async: false
    });
}

function getFile(path) {
    let returnValue = "sync failed";
    $.ajax({
        type: "POST",
        url: "//" + window.location.host + "/edu.kit.cbc.web/getFileAtPath",
        // The key needs to match your method's input parameter (case-sensitive).
        // TODO: check if buidWebCorCModel is complete
        data: path,
        contentType: false,
        dataType: false,
        success: function (data) {
            returnValue = data;
        },
        error: function (xhr, status, errMsg) {
            console.log("An Error occurred: ")
            console.log(errMsg);
            returnValue = -1;
        },
        async: false
    });
    return returnValue;
}

function verifyWebCorCModel(fullPath, content) {
    $(".corc-spinner").css("display", "flex")
    let data = {
        "path": fullPath,
        "content": content
    };
    $.ajax({
        type: "POST",
        url: "//" + window.location.host + "/edu.kit.cbc.web/verifyDiagramFile",
        // The key needs to match your method's input parameter (case-sensitive).
        // TODO: check if buidWebCorCModel is complete
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            $(".corc-spinner").css("display", "none")
            //alert(data);
            console.log(JSON.stringify(data, null, 2));
            // TODO: resolve if its verified or not
            updateKnotColors(data);
            printConsole(data, "corcDiagramConsole")
        },
        error: function (xhr, status, errMsg) {
            $(".corc-spinner").css("display", "none")
            console.log("An Error occurred: ")
            console.log(errMsg);
            printConsole("Failed to verify statements - " + xhr.status + ": " + xhr.statusText, "corcDiagramConsole")
        },
        statusCode: {
            404: function () {
                createToast("404: Server connection failed.", "Failed to verify statements.");
            },
            500: function () {
                createToast("500: Graph incomplete", "Please complete the graph and try again.")
            }
        }
    });
}

function verifyWebCorCModelStatement(fullPath, idClickedStatement, proofType) {
    let model = buildWebCorCModel();
    let data = {
        "path": fullPath,
        "content": {CorcInput: model}
    };
    $(".corc-spinner").css("display", "flex")
    $.ajax({
        headers: {"statementId": idClickedStatement, "proofType": proofType},
        type: "POST",
        url: "//" + window.location.host + "/edu.kit.cbc.web/verifyStatement",
        // The key needs to match your method's input parameter (case-sensitive).
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            $(".corc-spinner").css("display", "none")
            //alert(data);
            printConsole("CorC responded:")
            printConsole(JSON.stringify(data.messages, null, 2));
            updateKnotColors(data);
        },
        error: function (errMsg) {
            $(".corc-spinner").css("display", "none")
            printConsole("CorC responded:")
            printConsole(JSON.stringify(data.messages, null, 2));
            printConsole("An Error occurred: ")
            printConsole(errMsg);

            // $("#testToast2").toast("show");
        },
        statusCode: {
            404: function () {
                createToast("404: Server connection failed.", "Failed to verify " + idClickedStatement + ".");
            },
            500: function () {
                createToast("500: Graph incomplete", "Please complete the graph and try again.")
            }
        }
    });
}

function sendHelperFile(helperFile) {
    var form_data_helper = new FormData();
    form_data_helper.append('file', helperFile);
    $.ajax({
        type: "POST",
        url: "//" + window.location.host + "/edu.kit.cbc.web/helperFileUpload",
        // The key needs to match your method's input parameter (case-sensitive).
        data: form_data_helper,
        contentType: false,
        dataType: false,
        processData: false,
        success: function (data) {
            alert("Helperfile uploaded");
            console.log(data);
        },
        error: function (errMsg) {
            // alert("Helperfile upload failed");
            console.log("An Error occurred: ");
            console.log(errMsg);
        },
        statusCode: {
            404: function () {
                createToast("404: Server connection failed.", "Failed to send Helperfile");
            }
        }
    });
}

function sendJavaFile(javaFile) {
    var form_data_java = new FormData();
    form_data_java.append('file', javaFile);
    $.ajax({
        type: "POST",
        url: "//" + window.location.host + "/edu.kit.cbc.web/javaFileUpload",
        // The key needs to match your method's input parameter (case-sensitive).
        data: form_data_java,
        contentType: false,
        dataType: false,
        processData: false,
        success: function (data) {
            // alert("java file uploaded");
            console.log(data);
            createToast("Verification of Java File", data);
        },
        error: function (errMsg) {
            // alert("upload java file failed");
            console.log("An Error occurred: ");
            console.log(errMsg);
        },
        statusCode: {
            404: function () {
                createToast("404: Server connection failed.", "Failed to send Java File.");
            }
        }
    });
}

function uploadFileAtCurrentPath(file) {
    var form_data_java = new FormData();
    form_data_java.append('file', file);
    form_data_java.append('pathCurrentDir', getCurrentDirectoryFromCookie());
    $.ajax({
        type: "POST",
        url: "//" + window.location.host + "/edu.kit.cbc.web/uploadFileToPath",
        data: form_data_java,
        contentType: false,
        dataType: false,
        processData: false,
        success: function (data) {
            console.log(data);
        },
        error: function (errMsg) {
            console.log("An Error occurred: ");
            console.log(errMsg);
        }
    });
}

function sendCodeAsString(javaCode) {

    javaCode = removeLineNumbers(javaCode);
    console.log("sending java file...");

    $.ajax({
        type: "POST",
        url: "//" + window.location.host + "/edu.kit.cbc.web/javaCodeAsString",
        // The key needs to match your method's input parameter (case-sensitive).
        data: javaCode,
        contentType: false,
        dataType: false,
        processData: false,
        success: function (data) {
            // alert("java code send");
            console.log("java file compiled: ");
            console.log(data);
            // createToast("Verification of Java File", data);
            printConsole(data);
        },
        error: function (errMsg) {
            // alert("upload java file failed");
            console.log("An Error occurred: ");
            console.log(errMsg);
            printConsole(data);
        },
        statusCode: {
            404: function () {
                createToast("404: Server connection failed.", "Failed to send Java File.");
            }
        }
    });
}

function setSessionId() {
    $.ajax({
        type: "GET",
        url: "//" + window.location.host + "/edu.kit.cbc.web/sessionId",
        // The key needs to match your method's input parameter (case-sensitive).
        contentType: false,
        dataType: false,
        processData: false,
        success: function (data) {
            console.log(data);
            printSessionId(data);
            setSessionIdToCookie(data);
        },
        error: function (errMsg) {
            // alert("upload java file failed");
            console.log("An Error occurred: ");
            console.log(errMsg);
        },
        statusCode: {
            404: function () {
                createToast("404: Server connection failed.", "Session ID could not  be queried");
            }
        }
    });
}

function initialize() {
    // no data required
    $.ajax({
        type: "POST",
        url: "//" + window.location.host + "/edu.kit.cbc.web/initialize",
        data: false,
        contentType: false,
        dataType: false,
        processData: false,
        success: function (data) {
            console.log(data);
            initializeTree(data)
        },
        error: function (xhr, status, errMsg) {
        }
    });
}

function removeLineNumbers(codeFromDom) {

    var lines = codeFromDom.split("\n");
    var codeWithoutLineNumbers = "";

    for (let i = 0; i < lines.length; i++) {
        if (i % 2 == 1) {
            codeWithoutLineNumbers = codeWithoutLineNumbers.concat(lines[i] + "\n");
        }
    }

    return codeWithoutLineNumbers;
}
