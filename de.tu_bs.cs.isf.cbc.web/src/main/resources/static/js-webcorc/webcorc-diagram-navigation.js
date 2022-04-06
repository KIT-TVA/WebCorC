// $('#dummyDiagramArea').mousedown(
//     function (e) {
//         if (e.button === 2) {
//             e.preventDefault();
//             // TODO: move all divs for navigation
//             let movableDiv = document.getElementById('corcDiagramKnotContainer');
//             movableDiv.style.left = (movableDiv.style.left + e.clientX) + 'px';
//             movableDiv.style.top = (movableDiv.style.top + e.clientY) + 'px';
//         }
//     }
// );

var mousePosition;
var offset = [0, 0];
var div = document.getElementById('corcDiagramKnotContainer');
var isDown = false;
var isMoving = false;

document.getElementById('dummyDiagramArea').addEventListener('mousedown', function (e) {
    if (e.button === 2) {

        e.preventDefault();
        isDown = true;
        offset = [
            div.offsetLeft - e.clientX,
            div.offsetTop - e.clientY
        ];
    }

}, true);

document.addEventListener('mousemove', function (event) {
    event.preventDefault();
    if (isDown) {
        hideAllContextMenus();
        isMoving = true;
        mousePosition = {

            x: event.clientX,
            y: event.clientY

        };
        div.style.left = (mousePosition.x + offset[0]) + 'px';
        div.style.top = (mousePosition.y + offset[1]) + 'px';
    }


}, true);


document.addEventListener('mouseup', function (e) {
    if (e.button === 2) {
        isDown = false;
        // timeout to not display the context menu when moving is stopped
        setTimeout(()=> isMoving=false, 500);
    }
}, true);


// scroll in and out
let scale = 1;
const resizeDiv = document.getElementById('corcDiagramKnotContainer');
document.getElementById("dummyDiagramArea").onwheel = zoom;
function zoom (event) {

    // TODO: crosshair scales too, possible solution: scale it the other way
    event.preventDefault();

    scale += Math.sign(event.deltaY) * -0.1;

    // Restrict scale
    scale = Math.min(Math.max(.125, scale), 1);

    // Apply scale transform
    resizeDiv.style.transform = `scale(${scale})`;
};

