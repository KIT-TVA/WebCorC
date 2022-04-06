var dragEle = null;
var eleX = 0;
var eleY = 0;
var mouseX = 0;
var mouseY = 0;
document.onmousemove = move;
document.onmouseup = dragStop;

function dragStart(element) {
    dragEle = element.parentElement;
    eleX = mouseX - dragEle.offsetLeft;
    eleY = mouseY - dragEle.offsetTop;
}

function dragStop() {
    dragEle = null;
    startPropagateConditions();
}

function move(dragEvent) {
    mouseX = document.all ? window.event.clientX : dragEvent.pageX;
   // document.cookie = "x-value = mouseX;"
    mouseY = document.all ? window.event.clientY : dragEvent.pageY;
    if (dragEle != null) {
        dragEle.style.left = (mouseX - eleX) + "px";
        dragEle.style.top = (mouseY - eleY) + "px";
        refresh();
    }
}

//removes a knot: TODO: command stack,
function deleteElement(element){
    var knot = getKnot(element);
    deleteConnection(knot);
    knot.remove();

    for( var i = 0; i < allAddedKnotIds.length; i++){

        if ( allAddedKnotIds[i] === knot.id) {
            allAddedKnotIds.splice(i, 1);
            i--;
        }
    }
}

function getKnot(element) {
    for(var i=0; i<element.classList.length; ++i) {
        var className = element.classList[i];
        if(className == 'knot') {
            return element;
        }
    }
    return getKnot(element.parentElement);
}

function addSelection(element) {

    var tdGuard = getTdElement(element, 1);
    var tdPrecondition = getTdElement(element, 3);
    var tdStatement = getTdElement(element, 5);

    var children = tdGuard.parentElement.childElementCount + 1;

    var newGuard =  tdGuard.cloneNode(true);
    var newPrecondition = tdPrecondition.cloneNode(true);
    var newStatement = tdStatement.cloneNode(true);

    newGuard.firstElementChild.value = "";
    // newPrecondition.firstElementChild.innerHTML = "condition";
    newStatement.firstElementChild.value = "";

    tdGuard.parentElement.append(newGuard);
    tdPrecondition.parentElement.append(newPrecondition);
    tdStatement.parentElement.append(newStatement);

    addSourcepoint(getKnot(element).id,children);
    startPropagateConditions();

}

function deleteSelection(element) {

    var tdGuard = getTdElement(element, 1);
    var tdPrecondition = getTdElement(element, 3);
    var tdStatement = getTdElement(element, 5);

    var children = tdGuard.parentElement.childElementCount;
    if(children > 1) {

        tdGuard.parentElement.lastElementChild.remove();
        tdPrecondition.parentElement.lastElementChild.remove();
        tdStatement.parentElement.lastElementChild.remove();

        removeSourcepoint(getKnot(element).id, children);
    }
}

function getTdElement(element, tdNr){
    var tables = element.parentElement.nextElementSibling.children;
    return tables[tdNr].firstElementChild.firstElementChild.lastElementChild;
}

function updateKnotColors(checkedWebCorCModel){
    let model = checkedWebCorCModel.CorcOutput;
    let formulaKnot = $("#formula")

    updateColors(formulaKnot, model.proven)

    if (model.proven === true){
        formulaKnot.children(":first").addClass("knot-header-proven");
        formulaKnot.children(":first").removeClass("knot-header-proven-false");
    }
    else if(model.proven === false){
        formulaKnot.children(":first").addClass("knot-header-proven-false");
        formulaKnot.children(":first").removeClass("knot-header-proven");
    }

    updateChildColors(model.statement);
}

function updateChildColors(statement) {
    let statementType = statement.type;
    // statement without child
    if (statementType.startsWith("Abstract") ){
        updateColors($("#" + statement.id), statement.proven);
    }
    //statement with two children
    else if (statementType.startsWith("composition")){
        updateColors($("#" + statement.id), statement.proven);
        updateChildColors(statement.statement1);
        updateChildColors(statement.statement2);
    }
    // statement with one or more children
    else if (statementType.startsWith("selection")){
        updateColors($("#" + statement.id), statement.proven);
        for (let i = 0; i < statement.statements.length; i++) {
            updateChildColors(statement.statements[i]);
        }
    }
    else if (statementType.startsWith("repetition")){
        updateColors($("#" + statement.id), statement.proven);
        updateChildColors(statement.loopStatement);
    }
    // statements with one child
    else{
        updateColors($("#" + statement.id), statement.proven);
        updateChildColors(statement.statement);
    }
}

function updateColors(knot, isProven) {
    if (isProven === true){
        knot.children(":first").addClass("knot-header-proven");
        knot.children(":first").removeClass("knot-header-proven-false");
    }
    else if(isProven === false){
        knot.children(":first").addClass("knot-header-proven-false");
        knot.children(":first").removeClass("knot-header-proven");
    }
    else {
        knot.children(":first").removeClass("knot-header-proven");
        knot.children(":first").removeClass("knot-header-proven-false");
    }
}

function resetAllColors() {
    for( var i = 0; i < allAddedKnotIds.length; i++){
        $("#" + allAddedKnotIds[i]).children(":first").removeClass("knot-header-proven-false");
        $("#" + allAddedKnotIds[i]).children(":first").removeClass("knot-header-proven");
        $("#formula").children(":first").removeClass("knot-header-proven-false");
        $("#formula").children(":first").removeClass("knot-header-proven");
    }
}

function deleteAllKnots() {

    for (var i = 0; i < allAddedKnotIds.length; i++){
        console.log(allAddedKnotIds[i]);
        deleteElement(document.getElementById(allAddedKnotIds[i]));
        i --;
    }
}
