/***********************************************************************************************************************
 *  the graph will be managed here. An object will be initialized by creating the first statement.
 *  add a statement
 *  delete a statement
 *  if connections are made: server should alter the json for updating the children. --> using communication-handler
 *
 *  TODO: checkProven function to not override the received json
 */

// var userActionsCounter;

// TODO: remove the -1 thing
 function buildWebCorCModel() {
    let rootKnot = document.getElementById("formula");
    let returnObject = Object.assign(buildFormula(rootKnot), buildJavaVariables(), buildGlobalConditions());
    return returnObject;
}

// function buildUserActions() {
//      let builtObject = {};
//
//      if(isEmpty(userActionsCounter)){
//          builtObject.userActions = 0;
//      }
//      else {
//          builtObject.userActions = userActionsCounter;
//      }
//
//      return builtObject;
// }

function buildGlobalConditions() {
    let builtObject = {};
    let conditionsDOM = $(".globalCondition");
    let conditionsJSON = [];

    conditionsDOM.each(function () {
        let contentVar = $(this).val();
        if (contentVar != "..." && contentVar!= "") {
            conditionsJSON.push(contentVar);
        }
    });

    builtObject.globalConditions = conditionsJSON;
    return builtObject;
}

function buildJavaVariables() {
    let builtObject = {};
    let variablesDOM = $(".javaVariable");
    let variablesJSON = [];

    variablesDOM.each(function () {
        let contentVar = $(this).val();
        if (contentVar != "..." && contentVar!= "") {
            variablesJSON.push(contentVar);
        }
    });

    builtObject.javaVariables = variablesJSON;
    return builtObject;
}

function buildAnyStatement(htmlTag){
    if (!isEmpty(htmlTag)) {

        //switch case possible statements
        switch (true) {
            case htmlTag.id.startsWith("statement"):
                return buildStatement(htmlTag);
                break;

            case htmlTag.id.startsWith("composition"):
                return buildCompositionStatement(htmlTag);
                break;

            case htmlTag.id.startsWith("repetition"):
                // get the parent of htmlTag and his conditions
                let parentHtmlTag = getParent(htmlTag);
                let parentPostCond = $("#" + parentHtmlTag.id + " .postcondition").html();
                let parentPreCond = $("#" + parentHtmlTag.id + " .precondition").html();
                return buildRepetitionStatement(htmlTag, parentPreCond, parentPostCond);
                break;

            case htmlTag.id.startsWith("selection"):
                let parentSelHtmlTag = getParent(htmlTag);
                let parentSelPreCond = $("#" + parentSelHtmlTag.id + " .precondition").val();
                if (parentSelPreCond === ""){
                    parentSelPreCond = $("#" + parentSelHtmlTag.id + " .precondition").html();
                }
                return buildSelectionStatement(htmlTag, parentSelPreCond);
                break;

            case htmlTag.id.startsWith("strong"):
                return buildStrongWeakStatement(htmlTag);
                break;
        }
    }
    else {
        console.log("missing child - graph is incomplete");
        return "";
    }
}

function buildFormula(htmlTag) {
    let builtObject = {};
    let children = getChildren(htmlTag);

    builtObject.type = "CBCFormula";
    builtObject.name = "WebCorc File";
    builtObject.id = htmlTag.id;
    builtObject.preCondition = buildCondition($("#"+htmlTag.id+" .precondition").val());
    builtObject.postCondition = buildCondition($("#"+htmlTag.id+" .postcondition").val());
    builtObject.proven = "";
    builtObject.comment = "";
    builtObject.compositionTechnique = "CONTRACT_OVERRIDING";
    builtObject.className = "";
    builtObject.methodName = "";
    builtObject.x = htmlTag.style.left;
    builtObject.y = htmlTag.style.top;
    builtObject.statement = buildAnyStatement(children[0]);

    // if (builtObject.statement == -1){
    //     return -1;
    // }
    return builtObject;
}

function buildStatement(htmlTag){
    let builtObject = {};

    builtObject.type = "AbstractStatement";
    builtObject.name = $("#"+htmlTag.id+" .statement").val();
    builtObject.id = htmlTag.id;
    builtObject.proven = "";
    builtObject.comment = "";
    //builtObject.statementCondition = buildCondition($("#"+htmlTag.id+" .statement").html());
    builtObject.preCondition = buildCondition($("#"+htmlTag.id+" .precondition").html());
    builtObject.postCondition = buildCondition($("#"+htmlTag.id+" .postcondition").html());
    builtObject.x = htmlTag.style.left;
    builtObject.y = htmlTag.style.top;


    return builtObject;
}

function buildCompositionStatement(htmlTag) {
    let builtObject = {};
    let children = getChildren(htmlTag);

    builtObject.type = "compositionStatement"
    builtObject.name = "compositionStatement";
    builtObject.id = htmlTag.id;
    builtObject.proven = "";
    builtObject.comment = "";
    builtObject.preCondition = buildCondition($("#"+htmlTag.id+" .precondition").html());
    builtObject.postCondition = buildCondition($("#"+htmlTag.id+" .postcondition").html());
    builtObject.intermediateCondition = buildCondition($("#"+htmlTag.id+" .intermediateCondition").val());
    builtObject.x = htmlTag.style.left;
    builtObject.y = htmlTag.style.top;
    builtObject.statement1 = buildAnyStatement(children[0]);
    builtObject.statement2 = buildAnyStatement(children[1]);

    // if (builtObject.statement1 == -1 | builtObject.statement2 == -1){
    //     return -1;
    // }
    return builtObject;
}

function buildRepetitionStatement(htmlTag, hiddenPreCond, hiddenPostCond) {
    let builtObject = {};
    let children = getChildren(htmlTag);

    builtObject.type = "repetitionStatement";
    builtObject.name = "repetitionStatement";
    builtObject.id = htmlTag.id;
    builtObject.postProven = "";
    builtObject.preProven = "";
    builtObject.variantProven = "";
    builtObject.proven = "";
    builtObject.comment = "";
    builtObject.preCondition = buildCondition(hiddenPreCond);
    builtObject.postCondition = buildCondition(hiddenPostCond);
    builtObject.invariantCondition = buildCondition($("#"+htmlTag.id+" .invariant").val());
    builtObject.guardCondition = buildCondition($("#"+htmlTag.id+" .guard").val());
    builtObject.variant = buildCondition($("#"+htmlTag.id+" .variant").val());
    builtObject.x = htmlTag.style.left;
    builtObject.y = htmlTag.style.top;
    builtObject.loopStatement = buildAnyStatement(children[0]);

    return builtObject;
}

function buildSelectionStatement(htmlTag, hiddenPreCond) {
    let builtObject = {};
    let children = getChildren(htmlTag);
    let guardsDom = $("#"+htmlTag.id+" .guard");
    let guardsJson = []
    let statements = [];
    // let preconditionsDom = $("#"+htmlTag.id+" .precondition");
    // let preconditionsJson = [];
    for (var i = 0; i < guardsDom.length; i++){
        statements.push(buildAnyStatement(children[i]));
    }
    guardsDom.each(function () {
       guardsJson.push({name : $(this).val()});
    });
    // preconditionsDom.each(function () {
    //     preconditionsJson.push({name : $(this).html()});
    // });

    builtObject.type = "selectionStatement";
    builtObject.name = "selectionStatement";
    builtObject.id = htmlTag.id;
    builtObject.proven = "";
    builtObject.preProven = "";
    builtObject.comment = "";
    builtObject.preCondition = buildCondition(hiddenPreCond);
    builtObject.postCondition = buildCondition($("#"+htmlTag.id+" .postcondition").html());
    builtObject.guards = guardsJson;
    builtObject.x = htmlTag.style.left;
    builtObject.y = htmlTag.style.top;
    builtObject.statements = statements;

    return builtObject;
}

function buildStrongWeakStatement(htmlTag) {
    let builtObject = {};
    let children = getChildren(htmlTag);

    builtObject.type = "strongWeakStatement";
    builtObject.name = $("#"+htmlTag.id+" .statement").val();
    builtObject.id = htmlTag.id;
    builtObject.proven = "";
    builtObject.comment = "";
    builtObject.preCondition = buildCondition($("#"+htmlTag.id+" .precondition").val());
    builtObject.postCondition = buildCondition($("#"+htmlTag.id+" .postcondition").val());
    builtObject.x = htmlTag.style.left;
    builtObject.y = htmlTag.style.top;
    builtObject.statements = buildAnyStatement(children[0]);

    return builtObject;
}

function buildCondition(condition) {
    let builtObject = {};
    builtObject.name = condition;
    return builtObject;
}

function getChildren(htmlTag) {

    let children = [];
    let l = 0;

    if (connections.length > 0) {
        for (var i = 0; i < connections.length; i++) {
            if (connections[i].sourceId == htmlTag.id) {
                children[l] = document.getElementById(connections[i].targetId);
                l ++;
            }
        }
        l=0;

    }
    return children;
}

function getParent(htmlTag) {
    let parentHtmlTag;
    if (connections.length > 0) {
        for (var i = 0; i < connections.length; i++) {
            if (connections[i].targetId == htmlTag.id) {
                parentHtmlTag = document.getElementById(connections[i].sourceId);
            }
        }
    }
    return parentHtmlTag;
}

// function incrementUserAction() {
//      //TODO: use here loadCookie in the future (the function is not general enaugh at this point)
//     let allCookieArray = document.cookie.split(';');
//     let myCookie = JSON.parse(allCookieArray[allCookieArray.length-1].replaceAll("//CORCRULEZ//", ";"));
//
//     userActionsCounter = myCookie.userActions;
//
//     userActionsCounter ++;
//
//
// }