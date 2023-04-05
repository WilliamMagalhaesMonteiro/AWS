var width = 1200;    // 100;//window.innerWidth;
var height = 600;   // 100; //window.innerHeight - 25;

// first we need Konva core things: stage and layer
var stage = new Konva.Stage({
    container: 'drawing-container',
    width: width,
    height: height,
});
stage.container().style.backgroundColor = '#DCDCDC';

var layer = new Konva.Layer();
stage.add(layer);

var isPaint = false;    // initialisation de isPaint -> on ne peind pas encore.
var mode = 'brush';
var color = 'black';
var lastLine;

// function to sendData
const sendData = (eventName, data) => {
    console.log('should have sent data:', { eventName, data });
    // todo? -> wait for backend to finish;
}

// https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
window.addEventListener("DOMContentLoaded", (event) => {
    console.log("DOM fully loaded and parsed");
    const buttonBlue = document.getElementById('choose-blue-button');
    const buttonRed = document.getElementById('choose-red-button');
    const buttonGreen = document.getElementById('choose-green-button');
    const buttonYellow = document.getElementById('choose-yellow-button');

    buttonBlue.addEventListener('click', (e) =>{
        color = 'blue';
    });
    buttonRed.addEventListener('click', (e) =>{
        color = 'red';
    });
    buttonGreen.addEventListener('click', (e) =>{
        color = 'green';
    });
    buttonYellow.addEventListener('click', (e) =>{
        color = 'yellow';
    });
});


// STEP 1 - évènement : on clique ->
stage.on('mousedown touchstart', function (e) {
    isPaint = true;
    var pos = stage.getPointerPosition();   // position du cursuer
    lastLine = new Konva.Line({
        stroke: color,
        strokeWidth: 10,
        globalCompositeOperation:
        mode === 'brush' ? 'source-over' : 'destination-out',
        // round cap for smoother lines
        lineCap: 'round',
        lineJoin: 'round',
        // add point twice, so we have some drawings even on a simple click
        points: [pos.x, pos.y, pos.x, pos.y],
    });
    layer.add(lastLine);

    const dataToSend = {
        mousePointerPosition: pos,
    };
    sendData('mousedown touchstart', dataToSend)
});

// STEP 2 - and core function - drawing
stage.on('mousemove touchmove', function (e) {
    if (!isPaint) {
        return;
    }

    // prevent scrolling on touch devices
    e.evt.preventDefault();

    const pos = stage.getPointerPosition();
    var newPoints = lastLine.points().concat([pos.x, pos.y]);
    lastLine.points(newPoints);

    const dataToSend = {
        mousePointerPosition: pos,
    };
    sendData('mousemove touchmove', dataToSend)
});

// STEP 3 - évènement: pour arrêter de peindre
stage.on('mouseup touchend', function () {
    isPaint = false;

    const dataToSend = {};
    sendData('mouseup touchend', dataToSend)
});

var select = document.getElementById('tool');
select.addEventListener('change', function () {
    mode = select.value;

    const dataToSend = { mode };
    sendData('changing-mode', dataToSend);
});


/* var width = window.innerWidth;
var height = window.innerHeight;

var stage = new Konva.Stage({
    container: "bienvenue",

    width: width,
    height: height,
});

var layer = new Konva.Layer();
stage.add(layer);

var triangle = new Konva.RegularPolygon({
    x: 750,
    y: 320,
    sides: 3,
    radius: 100,
    fill: "blue",
    stroke: "black",
    strokeWidth: 4,
});
layer.add(triangle);
var circle = new Konva.Circle({
    x: 1000,
    y: 300,
    radius: 100,
    fill: "blue",
    stroke: "black",
    strokeWidth: 4,
});
layer.add(circle);
console.log("ok")
*/
