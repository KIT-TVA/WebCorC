/***********************************************************************************************************************
 *  here lives the logic for general functions, eg. the contextmenu
 */
var clickedStatementId = "";
var activeContextMenuIds = [];
// var sessionId ="";
var globalMenuFields ={"entries": [{"name": "Refresh", "extraClass": ["disabled"]}]};

// TODO register these listener in a function and call it when needed
$('#leftSidebar').on('click', function (e){
    if(e.target=== this){
        setCurrentDirectoryPathToCookie("treeView");
        setCurrentPathToCookie("");
        deselectTreeviewElements();
    }
})

createContextMenu("context-menu-global", globalMenuFields , $("#page-top"));

let menuFields = {"entries" : []};
Array.prototype.push.apply(menuFields.entries, globalMenuFields.entries);
menuFields.entries.push({"name": "Verify All", "extraClass": ["context-menu-button-verify"]});
createContextMenu("context-menu-default", menuFields, $("#dummyDiagramArea"));

menuFields = {"entries" : []};
Array.prototype.push.apply(menuFields.entries, globalMenuFields.entries);
menuFields.entries.push({"name": "Verify Precondition", "extraClass": ["context-menu-button-verify-precondition"]},{"name": "Verify All", "extraClass":["context-menu-button-verify"]});
createContextMenu("context-menu-selection", menuFields,  $("[id^=selection]"));

menuFields = {"entries" : []};
Array.prototype.push.apply(menuFields.entries, globalMenuFields.entries);
menuFields.entries.push({"name": "Verify Statement", "extraClass": ["context-menu-button-verify-statement"]}, {"name": "Verify All", "extraClass": ["context-menu-button-verify"]});
createContextMenu("context-menu-statement", menuFields, $("[id^=statement]"));

menuFields = {"entries" : []};
Array.prototype.push.apply(menuFields.entries, globalMenuFields.entries);
menuFields.entries.push(
	{"name": "Verify Precondition", "extraClass": ["context-menu-button-verify-precondition"]},
	{"name": "Verify Postcondition", "extraClass": ["context-menu-button-verify-postcondition"]},
	{"name": "Verify Variant", "extraClass": ["context-menu-button-verify-variant"]}, 
	{"name": "Verify All", "extraClass": ["context-menu-button-verify"]});
createContextMenu("context-menu-repetition", menuFields, $("[id^=repetition]"));

$('body').on('contextmenu', function (e) {
    // right click
    // $("#context-menu-statement").removeClass("show").hide();
    // $("#context-menu-repetition").removeClass("show").hide();
    // $("#context-menu-selection").removeClass("show").hide();
    //
    // // var target = e.target;
    // var top = e.pageY - 0;
    // var left = e.pageX - 0;
    //
    // showContextMenu("context-menu-default", top, left);


    return false; //blocks default web browser right click menu
}).on("click", function () {
    // left click
    hideAllContextMenus();
});


$("[id^=statement]").on("contextmenu", function (e) {
    $("#context-menu-default").removeClass("show").hide();
    $("#context-menu-repetition").removeClass("show").hide();
    $("#context-menu-selection").removeClass("show").hide();

    var target = e.target;
    var top = e.pageY - 0;
    var left = e.pageX - 0;

    if (!isMoving) {
        $("#context-menu-statement").css({
            display: "block",
            top: top,
            left: left
        }).addClass("show");
    }


    clickedStatementId = $(this).attr("id");

    return false;
});

$("[id^=repetition]").on("contextmenu", function (e) {
    $("#context-menu-default").removeClass("show").hide();
    $("#context-menu-statement").removeClass("show").hide();
    $("#context-menu-selection").removeClass("show").hide();

    var target = e.target;
    var top = e.pageY - 0;
    var left = e.pageX - 0;

    if (!isMoving) {
        $("#context-menu-repetition").css({
            display: "block",
            top: top,
            left: left
        }).addClass("show");
    }

    clickedStatementId = $(this).attr("id");

    return false;
});

// $("[id^=selection]").on("contextmenu", function (e) {
//     $("#context-menu-default").removeClass("show").hide();
//     $("#context-menu-statement").removeClass("show").hide();
//     $("#context-menu-repetition").removeClass("show").hide();
//
//     // var target = e.target;
//     var top = e.pageY - 0;
//     var left = e.pageX - 0;
//
//     if (!isMoving) {
//         $("#context-menu-selection").css({
//             display: "block",
//             top: top,
//             left: left
//         }).addClass("show");
//     }
//
//
//     clickedStatementId = $(this).attr("id");
//
//     return false;
// });

$("#context-menu-default a").on("click", function () {
    $(this).parent().removeClass("show").hide();
});

function hideAllContextMenus() {
    $("#context-menu-default").removeClass("show").hide();
    $("#context-menu-statement").removeClass("show").hide();
    $("#context-menu-repetition").removeClass("show").hide();
    $("#context-menu-selection").removeClass("show").hide();

    for (let i = 0; i< activeContextMenuIds.length; i++){
        $("#"+activeContextMenuIds[i]).removeClass("show").hide();
    }
}

function showContextMenu(menuId, top, left) {
    let element = $("#"+menuId);
    if (!isMoving) {
        element.css({
            display: "block",
            top: top,
            left: left
        }).addClass("show");
    }
}

// <div class="dropdown-menu dropdown-menu-sm" id="context-menu-default">
//     <a class="dropdown-item dropdown-item-corc context-menu-button-verify" href="#">Verify All</a>
// </div>

function createContextMenu(menuId, listOfMenuElements, querySelector) {
    // create html element
    let contextmenu = document.createElement("div");
    contextmenu.id = menuId;
    contextmenu.classList.add("dropdown-menu");
    contextmenu.classList.add("dropdown-menu-sm");

    listOfMenuElements = listOfMenuElements.entries;

    listOfMenuElements.forEach(element => {
        if (element.name !== undefined) {
            let menuElement = document.createElement("a");
            menuElement.classList.add("dropdown-item");
            menuElement.classList.add("dropdown-item-corc");
            // if (element.extraClass !== undefined) {
            //     menuElement.classList.add(element.extraClass);
            // }
            for (let i = 0; i < element.extraClass.length; i ++){
                menuElement.classList.add(element.extraClass[i]);
            }
            menuElement.innerText = element.name;
            menuElement.href = "#";
            contextmenu.appendChild(menuElement);
        }
    });
    activeContextMenuIds.push(menuId);
    querySelector.on("contextmenu", e =>{
                hideAllContextMenus();
                var top = e.pageY - 0;
                var left = e.pageX - 0;
                showContextMenu(menuId, top, left);
                return false;
    }).on("click", e=>{
        hideAllContextMenus();
    });
    // if(multipleTargets !== "default"){
    //     multipleTargets.on("contextmenu", e => {
    //         hideAllContextMenus();
    //         var top = e.pageY - 0;
    //         var left = e.pageX - 0;
    //         showContextMenu(menuId, top, left);
    //         return false;
    //     });
    // }
    // else {
    //
    //     targetContainer.addEventListener("contextmenu", e => {
    //         hideAllContextMenus();
    //         var top = e.pageY - 0;
    //         var left = e.pageX - 0;
    //         showContextMenu(menuId, top, left);
    //         return false; //blocks default web browser right click menu
    //     });
    // }
    document.getElementById("context-menu-container").appendChild(contextmenu);
    // TODO target containter only for listener at that point and not as parent

    // register listener on specific target container on which the contextmenu should appear
    // register the id on a different list to ensure it will be hidden -> adapt hideAllContextMenus()
}

function addListElement(element) {
    var dummyListItem = element.parentElement.nextElementSibling.firstElementChild;
    // var id = dummyListItem.id;
    var newListItem = dummyListItem.cloneNode(true);
    // id = id + "_" + dummyListItem.parentElement.childElementCount;
    newListItem.firstElementChild.innerHTML = "...";
    newListItem.style.display = "flex";
    // newListItem.id = id;


    dummyListItem.parentElement.append(newListItem);
    return newListItem;
}

function clearLists() {
    var javaVariables = $("#javaVariableList").children();
    var globalConditions = $("#globalConditionList").children();

    for (var i = 1; i < javaVariables.length; i++) {
        javaVariables[i].remove();
    }
    for (var i = 1; i < globalConditions.length; i++) {
        globalConditions[i].remove();
    }
}

function deleteListElement(element) {
    if (element.parentElement.parentElement.childElementCount > 1) {
        element.parentElement.remove();
    }
    startPropagateConditions();
}

// resizing input fields
$(function () {
    $('.corc-knot-input').each(resizeInputFields);
}).on('input', function () {
    $('.corc-knot-input').each(resizeInputFields);
});

resizeInputFields = function () {
    let invisibleInputWidthMeasure = $('#hidden-input-measure');
    invisibleInputWidthMeasure.text($(this).val());

    let width = invisibleInputWidthMeasure.width();
    $(this).width(Math.max(140, width + 10));
};

function createToast(header, message) {
    let newToast = $("#defaultToast").clone();
    $("#toastContainer").append(newToast);
    newToast.children().children(".corcToastHeader").text(header);
    newToast.children(".corcToastBody").text(message);
    newToast.toast("show");
}

$("#positionResetButton").on("click", function setKnotPositionToZero() {
    //TODO: read cookie, override positions, write cookie, reload
});

function printSessionId(session) {
    $("#sessionIdLabel").val(session);
}

function copyLabel(textInput) {

    /* Select the text field */
    textInput.select();
    textInput.setSelectionRange(0, 99999); /* For mobile devices */

    /* Copy the text inside the text field */
    if (!isEmpty(textInput.value)) {
        document.execCommand("copy");

        createToast("Copied Session ID", "Session ID copied to clipboard");
    } else {
        createToast("Error: No Session ID", "Copy failed");
    }

    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    } else if (document.selection) {stopResize
        document.selection.empty();
    }

    /* Alert the copied text */
    // alert("Copied the text: " + textInput.value);
}


function makeResizableDiv(div, direction, resizerId = "notSet") {
    const element = document.querySelector(div);
    let resizer = document.querySelectorAll(div + ' .webcorc-resizer-' + direction)
    if (resizerId !== "notSet") {
        resizer = document.querySelectorAll("#" + resizerId);
    }
    for (let i = 0; i < resizer.length; i++) {
        const currentResizer = resizer[i];
        currentResizer.addEventListener('mousedown', function (e) {
            e.preventDefault()
            window.addEventListener('mousemove', resize)
            window.addEventListener('mouseup', stopResize)
        })

        function resize(e) {
            if (currentResizer.classList.contains('webcorc-resizer-' + direction)) {
                // console.log(element.getBoundingClientRect());
                if (direction === "horizontal") {
                    if (div === ".sidebar-corc-right") {
                        let diagramConsole = document.getElementById('dummyCorcConsoleArea');
                        let diagramArea = document.getElementById('dummyDiagramArea');
                        let width = 'calc(100vw - ' + e.pageX + 'px';
                        currentResizer.style.left = "-5px";
                        element.style.width = width;
                        if (e.pageX > (0.3 * document.documentElement.clientWidth)) {
                            diagramConsole.style.marginRight = 'calc(100vw - ' + e.pageX + 'px + 3px';
                            diagramArea.style.marginRight = 'calc(100vw - ' + e.pageX + 'px + 3px';
                        }

                    } else {
                        element.style.width = e.pageX + 'px';
                        currentResizer.style.left = 'calc(' + element.getBoundingClientRect().width + 'px - 5px)';
                    }

                } else {
                    if (div === ".corc-java-variable-container") {
                        element.style.height = 'calc(' + e.pageY + 'px - 104px)';
                        currentResizer.style.top = 'calc(' + element.getBoundingClientRect().height + 'px - 5px)';
                        let globalConditionDiv = document.getElementById('corcGlobalConditionContainer');
                        globalConditionDiv.style.height = 'calc(100% - (' + e.pageY + 'px - 104px))';
                    } else if (resizerId === "codeResizer") {
                        element.style.height = 'calc(' + e.pageY + 'px - 70px)';
                        currentResizer.style.top = 'calc(' + element.getBoundingClientRect().height + 'px + 70px)';
                    } else {
                        element.style.height = 'calc(' + e.pageY + 'px - 109px)';
                        currentResizer.style.top = 'calc(' + element.getBoundingClientRect().height + 'px + 109px)';
                    }
                }
            }
        }

        function stopResize() {
            window.removeEventListener('mousemove', resize)
        }
    }
}

function initTriggering() {
    resizer = document.getElementById("webcorcLeftSidebarResizer");
    var clickEvent = document.createEvent("MouseEvents");
    clickEvent.initEvent("mousedown", true, true);
    resizer.dispatchEvent(clickEvent);
    clickEvent.initEvent("mousemove", true, true);
    resizer.dispatchEvent(clickEvent);
    clickEvent.initEvent("mouseup", true, true);
    resizer.dispatchEvent(clickEvent);
}

function printConsole(message, console = "corcConsole") {
    let codeArea = $("#" + console);
    let previousConsoleMessage = codeArea.html();
    if (previousConsoleMessage === ""){
        codeArea.html(message);
    }
    else {
        previousConsoleMessage =previousConsoleMessage.concat("\n=================================================\n"+ message );
        codeArea.html(previousConsoleMessage);
    }
    codeArea.scrollTop(codeArea[0].scrollHeight);
    // alert("Message printed to console");
}

// Left sidebar
makeResizableDiv('.sidebar-corc', 'horizontal');
initTriggering();
// Right sidebar within diagram editor
makeResizableDiv('.sidebar-corc-right', 'horizontal');
// Code display within code editor
makeResizableDiv('.webcorc-resizable-vertical', 'vertical', "codeResizer");
// Diagram display within diagram editor
makeResizableDiv('.corc-diagram-area', 'vertical', "diagramResizer");
// Sidebar with java variables and global conditions
makeResizableDiv('.corc-java-variable-container', 'vertical', "sidebarResizer");
