var wwidth = window.innerWidth;
var wheight = window.innerHeight;
const fenetre = window;

const bouton_noir = document.getElementById("bouton-noir")
const bouton_vert = document.getElementById("bouton-vert")
const bouton_rouge = document.getElementById("bouton-rouge")

const bouton_5 = document.getElementById("bouton-5")
const bouton_20 = document.getElementById("bouton-20")

const container = document.getElementById("container")

const select = document.getElementById("tool")

const socket = io();

var stage = new Konva.Stage({
    container: 'container',
    width: container.clientWidth,
    height: container.clientHeight,
});

var layer = new Konva.Layer();
stage.add(layer);

var isPaint = false;
var onStage = false;
var outil = 'brush';
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

socket.on("stoc draw line", function (props) {
    lastLine = new Konva.Line({
        stroke: props.clr,
        strokeWidth: props.width,
        globalCompositeOperation: props.mode,
        lineCap: 'round',
        lineJoin: 'round',
        points: [props.coords.x, props.coords.y, props.coords.x, props.coords.y],
    });
    layer.add(lastLine);
});

socket.on("stoc draw point", function (props) {
    var newPoints = lastLine.points().concat([props.coords.x, props.coords.y]);
    lastLine.points(newPoints);
});

// Le client reçoit un cercle du serveur.
socket.on("stoc draw cercle", function (props) {
    var rond = new Konva.Circle({
        x: props.coords.x,
        y: props.coords.y,
        radius: props.radius,
        fill: props.fill,
    });
    layer.add(rond);
});

// Début d'un nouveau trait.
function newLine(e) {
    isPaint = true;
    const pos = stage.getPointerPosition();
    var props = {coords: pos, width: epaisseur, clr: color, mode: (outil === 'brush') ? 'source-over' : 'destination-out'};
    lastLine = new Konva.Line({
        stroke: props.clr,
        strokeWidth: props.width,
        globalCompositeOperation: props.mode,
        lineCap: 'round',
        lineJoin: 'round',
        points: [props.coords.x, props.coords.y, props.coords.x, props.coords.y],
    });
    socket.emit("ctos draw line", props);
    layer.add(lastLine);

}

// Nouveau trait quand le curseur retourne au-dessus de la zone de dessin, 
// sauf si le clic a été relaché entre temps.
function reLine(e) {
    if (isPaint) {
        newLine(e);
    }
}

// Nouveau segment sur le trait à chaque déplacement de souris.
function newPoint(e) {
    if (!isPaint)
        return;
    const pos = stage.getPointerPosition();
    var props = {coords: pos};
    var newPoints = lastLine.points().concat([props.coords.x, props.coords.y]);
    socket.emit("ctos draw point", props);
    lastLine.points(newPoints);
}

// Le clic est relaché.
function endLine(e) {
    isPaint = false;
}

// Un disque (rond) est tracé sur un clic
function nouveauRond() {
    var pos = stage.getPointerPosition();
    var props = {coords:pos, radius: epaisseur * 5, fill: color};
    var rond = new Konva.Circle({
        x: props.coords.x,
        y: props.coords.y,
        radius: props.radius,
        fill: props.fill,
    });
    socket.emit("ctos draw cercle", props);
    layer.add(rond);
}

// La gestion des événements de base, ceux du pinceau et de la gomme.
function defaultBinds() {
    stage.on('mousedown', newLine);
    stage.on('mousemove', newPoint);
    window.addEventListener('mouseup', endLine);
    stage.on('mouseenter', reLine);
}

// Bouton des outils, à chaque changement d'outil, on refait tous les événements.
select.addEventListener('change', function () {
    stage.off();
    outil = select.value;
    switch (outil) {
        case 'rond' :
            stage.on('mousedown', nouveauRond);
            break;
        case 'brush' :
        case 'eraser' :
            defaultBinds();
            break;
    }
});

defaultBinds();
