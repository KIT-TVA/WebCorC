/***********************************************************************************************************************
 *  propagates through the built tree and is responsible for inheriting the conditions
 */
var timedPropagation;
var isEmpty;
var uuid;

document.addEventListener("input", function () {
    refresh();
    clearTimeout(timedPropagation);

    timedPropagation = setTimeout(startPropagateConditions, 750);
    //resetAllColors();
});

var startPropagateConditions = function () {
    // TODO: only execute the propagation if a diagram is opened
    console.log("propagation starts");
    var root = document.getElementById("formula");

    propagateConditions(root);

    console.log("propagation finished");

    // writeToCookie(buildWebCorCModel());
}

var propagateConditions = function (knot) {

    if (knot.id.startsWith("selection")) {
        let postcondition = $("#" + knot.id + " .postcondition").html();
        let preconditions = $("#" + knot.id + " .precondition");
        let guards = $("#" + knot.id + " .guard");

        var i =0;
        var guardHtml = [];
        guards.each(function () {
            guardHtml[i] = $(this).val();
            i++;
        });

        i=0;
        preconditions.each(function () {
            $(this).html("("+$(this).html()+")&("+guardHtml[i]+")");
            i++
        });

        let childCount = preconditions.length;
        let children = [];
        let l = 0;
        uuid = "";

        if (connections.length > 0) {
            for (var i = 0; i < connections.length; i++) {
                if (connections[i].sourceId === knot.id) {

                    // for(let j = 0; j< connections[i].endpoints.length; j++ ){
                    //     uuid = connections[i+j].endpoints[0]._jsPlumb.uuid;
                    //     let ending = j+1;
                    //     if (uuid.endsWith(ending.toString())){
                    //         children[j] = connections[i].targetId;
                    //     }
                    //     // if (uuid.endsWith("1")) {
                    //     //     firstChildID = connections[i].targetId;
                    //     // }else if(uuid.endsWith("6")) {
                    //     //     secondChildID = connections[i].targetId;
                    //     // }
                    // }

                    children[l] = connections[i].targetId;
                    l ++;
                }
            }
            l=0;
            preconditions.each(function () {
                if (!isEmpty(children[l])) {
                    propagateChildCondition(children[l], $(this).html(), postcondition);
                }
                l++
            });

        } else {
            console.log("there are no children, " + knot.id);
        }


    } else if (knot.id.startsWith("composition")) {
        let preCondLeft = $("#" + knot.id + " .precondition").html();
        let postCondLeft = $("#" + knot.id + " .intermediateCondition").val();
        let preCondRight = postCondLeft;
        let postCondRight = $("#" + knot.id + " .postcondition").html();

        let firstChildID = "firstCompositionChild";
        let secondChildID = "secondCompositionChild";

        if (connections.length > 0) {
            uuid = "";
            for (var i = 0; i < connections.length; i++) {

                if(connections[i].sourceId === knot.id) {
                    for(let j = 0; j< connections[i].endpoints.length; j++ ){
                        uuid = connections[i].endpoints[j]._jsPlumb.uuid;
                        if (uuid.endsWith("1")) {
                            firstChildID = connections[i].targetId;
                        }else if(uuid.endsWith("6")) {
                            secondChildID = connections[i].targetId;
                        }
                    }
                }
            }
            propagateChildCondition(firstChildID, preCondLeft, postCondLeft);
            propagateChildCondition(secondChildID, preCondRight, postCondRight);
        } else {
            console.log("there are no children, " + knot.id);
        }
    } else if (knot.id.startsWith("repetition")) {
        let invariant = $("#" + knot.id + " .invariant").val();
        let guard = $("#" + knot.id + " .guard").val();

        let childID = "defaultRepetitionChild";

        $("#" + knot.id + " .precondition").html("((" + invariant + ")&(" + guard + "))");
        $("#" + knot.id + " .postcondition").html("(" + invariant + ")");

        if (connections.length > 0) {
            for (var i = 0; i < connections.length; i++) {
                if (connections[i].sourceId === knot.id) {
                    childID = connections[i].targetId;
                    break;
                }
            }
            propagateChildCondition(childID, "(" + invariant + ")&(" + guard + ")", invariant);
        } else {
            console.log("there are no children, " + knot.id);
        }
    }


    // the statements treated with else: only allowed to have one child
    else {
        let preCond = $("#" + knot.id + " .precondition").val();
        let postCond = $("#" + knot.id + " .postcondition").val();

        let childID = "defaultChild";

        if (connections.length > 0) {
            for (var i = 0; i < connections.length; i++) {
                if (connections[i].sourceId === knot.id) {
                    childID = connections[i].targetId;
                    break;
                }
            }
            propagateChildCondition(childID, preCond, postCond);
        } else {
            console.log("there are no children, " + knot.id);
        }
    }
}

function propagateChildCondition (childID, pre, post) {
    switch (true) {
        case childID.startsWith("statement"):
            $("#" + childID + " .precondition").html(pre);
            $("#" + childID + " .postcondition").html(post);

            break;

        case childID.startsWith("composition"):
            $("#" + childID + " .precondition").html(pre);
            $("#" + childID + " .postcondition").html(post);

            propagateConditions(document.getElementById(childID));

            break;

        case childID.startsWith("strong"):
        case childID.startsWith("repetition"):
            propagateConditions(document.getElementById(childID));

            break;

        case childID.startsWith("selection"):
            $("#" + childID + " .postcondition").html(post);
            let preconditions = $("#" + childID + " .precondition");
            preconditions.each(function () {
                $(this).html(pre);
            });

            propagateConditions(document.getElementById(childID));

            break;

        default:
            console.log("no " + childID);
    }
}

isEmpty = function (str) {
    return (!str || 0 === str.length);
}