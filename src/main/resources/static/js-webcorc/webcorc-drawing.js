var deleteConnection;
var setSourcepoint;
var setTargetpoint;
var addSourcepoint;
var removeSourcepoint;
var makeDraggable;
var refresh;
var drawConnection;

var connections = [];

let updateConnections = function (conn, remove) {
    if (!remove) {
        connections.push(conn);
    }
    else {
        var idx = -1;
        for (var i = 0; i < connections.length; i++) {
            if (connections[i] === conn) {
                idx = i;
                break;
            }
        }
        if (idx !== -1) connections.splice(idx, 1);
    }
    let s ="";
    for (var j = 0; j < connections.length; j++) {
        s = s + "source: "+ connections[j].sourceId +"  |  target: "+ connections[j].targetId + "\n";
    }
    console.log(s);

    startPropagateConditions();
    //resetAllColors();
};

jsPlumb.bind("ready", function () {


    var exampleColor ="#323e58";

    var instance = jsPlumb.getInstance({
        // DragOptions: { cursor: 'pointer', zIndex: 2000 },
        // PaintStyle: { stroke: '#666666' },
        EndpointHoverStyle: {fill:exampleColor },
        HoverPaintStyle: {stroke: "#0f56c1"},
        // EndpointStyle: { width: 10, height: 10, stroke: '#666' },
        // Endpoint: "Dot",
        // Anchors: ["TopCenter", "TopCenter"],
        Container: "corcDiagramKnotContainer"
    });

    // suspend drawing and initialise.
    instance.batch(function () {

        //bind to connection/connectionDetached events, and update the list of connections on screen.
        //these events may be useful for inheriting and building the json
        instance.bind("connection", function (info, originalEvent) {
            updateConnections(info.connection);
        });
        instance.bind("connectionDetached", function (info, originalEvent) {
            updateConnections(info.connection, true);
        });

        instance.bind("connectionMoved", function (info, originalEvent) {
            // only remove here, because a 'connection' event is also fired.
            // in a future release of jsplumb this extra connection event will not
            // be fired.
            updateConnections(info.connection, true);
        });


        var exampleDropOptions = {
            tolerance: "touch",
            hoverClass: "dropHover",
            activeClass: "dragActive"
        };


        // TODO: overlap between source and target endpoint into global definitions (?)
        // TODO: arrow overlay (maybe)
        var sourceEndpoint = {
            endpoint: ["Dot", {radius:7}],
            paintStyle: {width: 50, height: 50, fill: exampleColor},
            isSource: true,
            reattach: false,
            scope: "blue",
            connectorStyle: {
                gradient: {
                    stops: [
                        [0, exampleColor],
                        [0.5, exampleColor],
                        [1, exampleColor]
                    ]
                },
                strokeWidth: 3,
                stroke: exampleColor
            },
            // connectorOverlays:[
            //     [ "Arrow", { width:10, length:30, location:1, id:"arrow" } ],
            //     [ "Label", { label:"foo", id:"label" } ]
            // ],
            maxConnections: 1,
            isTarget: false,
            // beforeDrop: function (params) {
            //     return confirm("Connect " + params.sourceId + " to " + params.targetId + "?");
            // },
            dropOptions: exampleDropOptions
        };

        var targetEndpoint = {
            endpoint: ["Dot", {radius:7}],
            paintStyle: {width: 50, height: 50, fill: exampleColor},
            isSource: false,
            //reattach: true,
            scope: "blue",
            connectorStyle: {
                gradient: {
                    stops: [
                        [0, exampleColor],
                        [0.5, exampleColor],
                        [1, exampleColor]
                    ]
                },
                strokeWidth: 3,
                stroke: exampleColor
            },
            maxConnections: 1,
            isTarget: true,
            // beforeDrop: function (params) {
            //     return confirm("Connect " + params.sourceId + " to " + params.targetId + "?");
            // },
            dropOptions: exampleDropOptions
        };

        // document.addEventListener("onresize", function () {
        //     refresh();
        // });

        /***************************************************************************************************************
         */
        // add sourcepoint to initial formula
        //instance.addEndpoint("formula", {anchor: ["Continuous", { faces:[ "bottom" ] } ], uuid: "formula_source"}, sourceEndpoint);
        instance.addEndpoint("formula", {anchor:[ 0.5, 1, 0, 1 ], uuid: "formula_source_1"}, sourceEndpoint);
        //instance.draggable("formula");


        addSourcepoint = function(id, counter){
            instance.addEndpoint(id, {anchor:[ 0.5, 1, 0, 1 ], uuid: id + "_source_" + counter}, sourceEndpoint);
            positionChildren(id, counter);
            refresh();
        };

        removeSourcepoint = function(id, counter){
            instance.deleteEndpoint(id + "_source_" + counter);
            positionChildren(id, counter-1);
            refresh();
        };

        var positionChildren = function(id, counter) {
            for(var i=1; i<=counter; i++) {
                var endpoint = instance.getEndpoint(id + "_source_" + i);
                if(endpoint === undefined)
                    continue;

                endpoint.anchor.x = (i) / (counter + 1);
            }
        }

        setTargetpoint = function(id){
            instance.addEndpoint(id, {anchor: ["Continuous", { faces:[ "top" ] } ], uuid: id +"_target"}, targetEndpoint);
        };

        makeDraggable = function(id){
            //instance.draggable(id);
        };

        deleteConnection = function (knot){
            instance.deleteConnectionsForElement(knot.id);
            instance.removeAllEndpoints(knot.id);
        };

        refresh = function() {
            instance.repaintEverything();
        };

        // TODO: resolve the case in which selections statement got more selections
        var comp = 1;
        var sel = 0;
        var selStatementID = "";
        drawConnection = function(sourceId, targetId) {
            let con = 1;
            console.log(sourceId+"_source_"+ con +" -> "+ targetId+"_target");
            // instance.connect({uuids: [sourceId + "_source_"+con, targetId + "_target"]});

            if (sourceId.startsWith("composition")) {
                if (comp === 1){
                    instance.connect({uuids: [sourceId + "_source_1", targetId + "_target"]});
                    comp ++;
                }
                else{
                    instance.connect({uuids: [sourceId + "_source_6", targetId + "_target"]});
                    comp = 1;
                }
            }
            else if (sourceId.startsWith("selection")){
                instance.connect({uuids: [sourceId + "_source_"+sel, targetId + "_target"]});
                if(selStatementID === sourceId){
                    sel ++;
                }else {
                    sel = 1;
                }
                instance.connect({uuids: [sourceId + "_source_"+sel, targetId + "_target"]});
                selStatementID = sourceId;
            }
            else {
                instance.connect({uuids: [sourceId + "_source_"+con, targetId + "_target"]});
            }

        };

        /***************************************************************************************************************
         */

        jsPlumb.fire("initial_load", instance);
        // loadCookie();
        refresh();
        // startPropagateConditions();
        //new ScrollZoom($('#canvas'),4,0.5)
    });
});