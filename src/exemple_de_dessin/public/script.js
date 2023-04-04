var width = window.innerWidth;
var height = window.innerHeight - 25;

const bouton_noir = document.getElementById("bouton-noir")
const bouton_vert = document.getElementById("bouton-vert")
const bouton_rouge = document.getElementById("bouton-rouge")


const bouton_5 = document.getElementById("bouton-5")
const bouton_20 = document.getElementById("bouton-20")


// first we need Konva core things: stage and layer
var stage = new Konva.Stage({
    container: 'container',
    width: width,
    height: height,
});

var layer = new Konva.Layer();
stage.add(layer);

var isPaint = false;
var mode = 'brush';
var color = '#df4b26'
var epaisseur = 5;
var lastLine;

bouton_noir.addEventListener("click",function(){
    color = "#000000";
});

bouton_rouge.addEventListener("click",function(){
    color = "#df4b26";
});


bouton_vert.addEventListener("click", function() {
    color = "#008000";
  });



bouton_5.addEventListener("click", function() {
    epaisseur = 5;
  });

  bouton_20.addEventListener("click", function() {
    epaisseur = 20;
  });


stage.on('mousedown touchstart', function (e) {
    isPaint = true;
    var pos = stage.getPointerPosition();
    lastLine = new Konva.Line({
        stroke: color,
        strokeWidth: epaisseur,
        globalCompositeOperation:
            mode === 'brush' ? 'source-over' : 'destination-out',
        // round cap for smoother lines
        lineCap: 'round',
        lineJoin: 'round',
        // add point twice, so we have some drawings even on a simple click
        points: [pos.x, pos.y, pos.x, pos.y],
    });
    layer.add(lastLine);
});

stage.on('mouseup touchend', function () {
    isPaint = false;
});

// and core function - drawing
stage.on('mousemove touchmove', function (e) {
    if (!isPaint) {
        return;
    }

    // prevent scrolling on touch devices
    e.evt.preventDefault();

    const pos = stage.getPointerPosition();
    var newPoints = lastLine.points().concat([pos.x, pos.y]);
    lastLine.points(newPoints);
});

var select = document.getElementById('tool');
select.addEventListener('change', function () {
    mode = select.value;
});
