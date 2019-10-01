// Fall tekið af https://stackoverflow.com/questions/1152203/centering-a-canvas
window.onload = window.onresize = function() {
    let canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
};