document.addEventListener('DOMContentLoaded', function() {
    const contentWrapper = document.getElementById('content-wrapper');
    contentWrapper.style.cursor = 'grab';

    let pos = { top: 0, left: 0, x: 0, y: 0 };

    const mouseDownHandler = function(e) {
        contentWrapper.style.cursor = 'grabbing';
        contentWrapper.style.userSelect = 'none';

        pos = {
            left: contentWrapper.scrollLeft,
            top: contentWrapper.scrollTop,
            // Get the current mouse position
            x: e.clientX,
            y: e.clientY,
        };

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = function(e) {
        // How far the mouse has been moved
        const dx = e.clientX - pos.x;
        const dy = e.clientY - pos.y;

        // Scroll the element
        contentWrapper.scrollTop = pos.top - dy;
        contentWrapper.scrollLeft = pos.left - dx;
    };

    const mouseUpHandler = function() {
        contentWrapper.style.cursor = 'grab';
        contentWrapper.style.removeProperty('user-select');

        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    // Attach the handler
    contentWrapper.addEventListener('mousedown', mouseDownHandler);
});