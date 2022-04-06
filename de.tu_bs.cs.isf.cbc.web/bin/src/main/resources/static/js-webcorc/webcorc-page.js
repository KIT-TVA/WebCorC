/***********************************************************************************************************************
 *  here lives the logic for general functions, eg. the contextmenu
 */
var clickedStatementId = "";

// TODO register these listener in a function and call it when needed
$('body').on('contextmenu', function (e) {
    // right click

    $("#context-menu-statement").removeClass("show").hide();
    $("#context-menu-repetition").removeClass("show").hide();
    $("#context-menu-selection").removeClass("show").hide();

    var target = e.target;
    var top = e.pageY - 0;
    var left = e.pageX - 0;


    $("#context-menu-default").css({
        display: "block",
        top: top,
        left: left
    }).addClass("show");


    return false; //blocks default web browser right click menu
}).on("click", function() {
    // left click
    $("#context-menu-default").removeClass("show").hide();
    $("#context-menu-statement").removeClass("show").hide();
    $("#context-menu-repetition").removeClass("show").hide();
    $("#context-menu-selection").removeClass("show").hide();
});

$("[id^=statement]").on("contextmenu", function (e) {
    $("#context-menu-default").removeClass("show").hide();
    $("#context-menu-repetition").removeClass("show").hide();
    $("#context-menu-selection").removeClass("show").hide();

    var target = e.target;
    var top = e.pageY - 0;
    var left = e.pageX - 0;

    $("#context-menu-statement").css({
        display: "block",
        top: top,
        left: left
    }).addClass("show");

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

    $("#context-menu-repetition").css({
        display: "block",
        top: top,
        left: left
    }).addClass("show");

    clickedStatementId = $(this).attr("id");

    return false;
});

$("[id^=selection]").on("contextmenu", function (e) {
    $("#context-menu-default").removeClass("show").hide();
    $("#context-menu-statement").removeClass("show").hide();
    $("#context-menu-repetition").removeClass("show").hide();

    var target = e.target;
    var top = e.pageY - 0;
    var left = e.pageX - 0;

    $("#context-menu-selection").css({
        display: "block",
        top: top,
        left: left
    }).addClass("show");

    clickedStatementId = $(this).attr("id");

    return false;
});

$("#context-menu-default a").on("click", function() {
    $(this).parent().removeClass("show").hide();
});

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

    for (var i = 1; i < javaVariables.length; i++){
        javaVariables[i].remove();
    }
    for (var i = 1; i < globalConditions.length; i++){
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
$(function(){
    $('.corc-knot-input').each(resizeInputFields);
}).on('input', function () {
    $('.corc-knot-input').each(resizeInputFields);
});

resizeInputFields = function () {
    let invisibleInputWidthMeasure = $('#hidden-input-measure');
    invisibleInputWidthMeasure.text($(this).val());

    let width = invisibleInputWidthMeasure.width();
    $(this).width(Math.max(140, width+10));
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
    if (!isEmpty(textInput.value)){
        document.execCommand("copy");

        createToast("Copied Session ID", "Session ID copied to clipboard" );
    }
    else{
        createToast("Error: No Session ID", "Copy failed");
    }

    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }
    else if (document.selection) {
        document.selection.empty();
    }

    /* Alert the copied text */
    // alert("Copied the text: " + textInput.value);
}