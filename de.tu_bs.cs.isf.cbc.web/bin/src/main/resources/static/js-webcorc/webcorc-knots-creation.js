/***********************************************************************************************************************
 * the following code copies knots, set positions and controls knot-uniqueness.
 */

// Variables to control uniqueness of knots.
var allAddedKnotIds = [];

var countFormulas = 1;
var countStatement = 1;
var countSelectionStatement = 1;
var countCompositionStatement = 1;
var countRepetitionStatement = 1;
var countStrongWeakStatement = 1;

// Function variables.
var createStatementKnot;
var createSelectionStatementKnot;
var createCompositionStatementKnot;
var createRepetitionStatementKnot;

var createRepetitionStatement;
var createCompositionStatement;
var createSelectionStatement;
var createStatement;
/**********************************************************************************************************************/
// Functions to trigger knot creation, including positioning, due to reading JSObject.

createStatementKnot = function (posX, posY, parentID) {
    let newKnotId = createStatement();
    setKnotSettings(newKnotId, posX, posY, parentID);
    return  document.getElementById(newKnotId);
};

createSelectionStatementKnot = function (posX, posY, parentID) {
    let newKnotId = createSelectionStatement();
    setKnotSettings(newKnotId, posX, posY, parentID);
    return  document.getElementById(newKnotId);
};

createCompositionStatementKnot = function (posX, posY, parentID) {
    let newKnotId = createCompositionStatement();
    setKnotSettings(newKnotId, posX, posY, parentID);
    return  document.getElementById(newKnotId);
};

createRepetitionStatementKnot = function (posX, posY, parentID) {
    let newKnotId = createRepetitionStatement();
    setKnotSettings(newKnotId, posX, posY, parentID);
    return  document.getElementById(newKnotId);
};

function setKnotSettings(knotId, posX, posY, parentID){
    document.getElementById(knotId).style.left = posX;
    document.getElementById(knotId).style.top = posY;
    drawConnection(parentID, knotId);
    refresh();
}
/**********************************************************************************************************************/
// Knot creation, triggered by click on button or above functions.

// Create statement.
$("#createStatement").click(
    createStatement = function () {
        let knotId = 'statement_' + countStatement;
        createSourceTargetKnot(knotId, 'statement-prototype', false);
        countStatement++;
        return knotId;
    }
);

// Creates selection statement.
$("#createSelectionStatement").click(
    createSelectionStatement = function () {
        let knotId = 'selectionStatement_' + countSelectionStatement;
        createSourceTargetKnot(knotId, 'selection-statement-prototype');
        countSelectionStatement++;
        return knotId;
    }
);

// Creates composition statement.
$("#createCompositionStatement").click(
    createCompositionStatement = function () {
        let knotId = 'compositionStatement_' + countCompositionStatement;
        let newKnot = $("#composition-statement-prototype").clone(true, true).css("display", "flex").prop('id', knotId);
        $("#canvas").append(newKnot);
        setTargetpoint(knotId);
        addSourcepoint(knotId, 1);
        addSourcepoint(knotId, 6);
        makeDraggable(knotId);
        refresh();
        countCompositionStatement++;
        allAddedKnotIds.push(knotId);
        return knotId;
    }
);

// Creates repetition statement.
// $("#createRepetitionStatement").click(
    createRepetitionStatement = function (clickedSymbol) {
        let editorId = getEditorIdOfSymbol(clickedSymbol);
        let knotId = 'repetitionStatement_' + countRepetitionStatement;
        createSourceTargetKnot(knotId, 'repetition-statement-prototype', editorId);
        countRepetitionStatement++;
        return knotId;
    }
// );

// Creates strong-weak statement.
$("#createStrongWeakStatement").click(function () {
    let knotId = 'strongWeakStatement_' + countStrongWeakStatement;
    createSourceTargetKnot(knotId, 'strong-weak-statement-prototype');
    countStrongWeakStatement++;
});

// Clone knot and adding source/target points.
function createSourceTargetKnot(knotId, prototype, editorId , withSource = true) {
    let newKnot = $("#" + prototype).clone(true, true).css("display", "flex").prop('id', knotId);
    $("#"+ editorId).append(newKnot);
    setTargetpoint(knotId);
    if (withSource) addSourcepoint(knotId, 1);
    makeDraggable(knotId);
    refresh();
    allAddedKnotIds.push(knotId);
}

function getEditorIdOfSymbol(symbolDomElement) {
    return symbolDomElement.parentElement.parentElement.id;
}