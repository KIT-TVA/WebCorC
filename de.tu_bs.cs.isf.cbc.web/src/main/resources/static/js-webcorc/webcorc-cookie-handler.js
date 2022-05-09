/***********************************************************************************************************************
 * does the cookie magic
 * TODO: datenschutz form
 */

function writeToCookie(builtModel) {
    // console.log("start writing to cookies");
    // //console.log(JSON.stringify(builtModel, null,2));
    // document.cookie = JSON.stringify(builtModel).replaceAll(";", "//CORCRULEZ//") + "; path=/";
    // console.log(JSON.stringify(builtModel,null,2));
}

// this function starts right after jsPlumb is drawn.
function loadCookie () {
    // console.log("loading cookie...");
    // var allCookieArray = document.cookie.split(';');
    // let myCookie = JSON.parse(allCookieArray[allCookieArray.length-1].replaceAll("//CORCRULEZ//", ";"));
    // console.log(JSON.stringify(myCookie,null,2));
    //
    // createGraph(myCookie);
}

var createGraph = function (treeObject) {
    //TODO: this function is only allowed to execute if a diagram is open
    let preCond = treeObject.preCondition;
    let postCond = treeObject.postCondition;
    let statement = treeObject.statement;
    let javaVariables = treeObject.javaVariables;
    let globalConditions = treeObject.globalConditions;

    let rootKnot = document.getElementById("formula");

    rootKnot.style.left = treeObject.x;
    rootKnot.style.top = treeObject.y;

    $("#" +rootKnot.id + " .precondition").val(preCond.name);
    $("#" +rootKnot.id + " .postcondition").val(postCond.name);
    
    createJavaVariables(javaVariables);
    createGlobalConditions(globalConditions);

    if(!isEmpty(statement.type)){
        createAnyStatement(statement,"formula");
    }
    refresh();
}

function createAnyStatement(statement, parentID) {
    if(statement.type.startsWith("Abstract")) {
        let createdKnot = createStatementKnot(statement.x, statement.y, parentID);
        $("#"+createdKnot.id+" .statement").val(statement.name);
    }
    if(statement.type.startsWith("selection")) {
        let createdKnot = createSelectionStatementKnot(statement.x, statement.y, parentID);
        for (let i = 0; i < statement.statements.length; i++){
            if (i >= 1) {
                addSelection(createdKnot.firstElementChild.children[1]);
            }
            if (statement.statements[i] !== "") {
                createAnyStatement(statement.statements[i], createdKnot.id);
            }
        }
        let guardsHtml = [];
        guardsHtml = $("#"+createdKnot.id+" .guard");
        for(let l =0; l< statement.guards.length; l++){
            guardsHtml[l].value=statement.guards[l].name;
        }
    }
    if (statement.type.startsWith("composition")){
        let createdKnot = createCompositionStatementKnot(statement.x, statement.y, parentID);
        $("#"+createdKnot.id+" .intermediateCondition").val(statement.intermediateCondition.name);
        if (statement.statement1 !== ""){
            createAnyStatement(statement.statement1, createdKnot.id)
        }
        if (statement.statement2 !== ""){
            createAnyStatement(statement.statement2, createdKnot.id)
        }
    }
    if(statement.type.startsWith("repetition")){
        let createdKnot = createRepetitionStatementKnot(statement.x, statement.y, parentID);
        $("#"+createdKnot.id+" .invariant").val(statement.invariantCondition.name);
        $("#"+createdKnot.id+" .guard").val(statement.guardCondition.name);
        $("#"+createdKnot.id+" .variant").val(statement.variant.name);
        createAnyStatement(statement.loopStatement, createdKnot.id);
    }
}

function createJavaVariables(javaVariables) {
    for (let i = 0; i < javaVariables.length; i++){
        let variable = addListElement(document.getElementById("dummyJavaVariable"));
        variable.firstElementChild.value = javaVariables[i];
    }
}

function createGlobalConditions(globalConditions) {
    for (let i = 0; i < globalConditions.length; i++){
        let variable = addListElement(document.getElementById("dummyGlobalCondition"));
        variable.firstElementChild.value = globalConditions[i];
    }
}

function getSessionIdFromCookie() {
    return /SESS\w*ID=([^;]+)/i.test(document.cookie) ? RegExp.$1 : false;
}

// TODO: this function may cause session id confusion on server side! Take a closer look.
function setSessionIdToCookie(sessionId) {
    document.cookie = "SESSIONID=" + sessionId + "; path=/";
}

function setCurrentPathToCookie(path) {
    document.cookie = "CURRENTPATH=" + path + ";path=/";
    setCurrentDirectoryPathToCookie(path.substring(0, path.lastIndexOf("/")));
}

function getCurrentPathFromCookie(){
    return /CURRENTPATH=([^;]+)/i.test(document.cookie) ? RegExp.$1 : false;
}

function setCurrentDirectoryPathToCookie(path) {
    document.cookie = "CURRENTDIRPATH=" + path + ";path=/";
}

function getCurrentDirectoryFromCookie(){
    return /CURRENTDIRPATH=([^;]+)/i.test(document.cookie) ? RegExp.$1 : false;
}