var wwidth = window.innerWidth;
var wheight = window.innerHeight;
const fenetre = window;
/*
const bouton_noir = document.getElementById("bouton-noir");
const bouton_vert = document.getElementById("bouton-vert");
const bouton_rouge = document.getElementById("bouton-rouge");
*/
const bouton_5 = document.getElementById("bouton-5");
const bouton_20 = document.getElementById("bouton-20");

const container = document.getElementById("container");

const outils = document.getElementById("tools");
const crayon = document.getElementById("crayon");
const gomme = document.getElementById("gomme");
const rond = document.getElementById("rond");
const couleursDiv = document.getElementById("colors");

const couleurs = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff", "#000000", "#ffffff"];

for (let i = 0; i < couleurs.length; i++) {
    let newDiv = document.createElement("div");
    newDiv.style.backgroundColor = couleurs[i];
    couleursDiv.appendChild(newDiv);
}

const ctnOffset = {x: container.offsetLeft, y: container.offsetTop};

const socket = io();

var stage = new Konva.Stage({
    container: 'container',
    width: container.clientWidth,
    height: container.clientHeight,
});

var layer = new Konva.Layer();
layer.listening(false);
stage.add(layer);

var isPaint = false;
var onStage = false;
var outil = 'brush';
var color = couleurs[0];
var epaisseur = 5;
var lastLine;
/*
bouton_noir.addEventListener("click",function(){
    color = "#000000";
});

bouton_rouge.addEventListener("click",function(){
    color = "#df4b26";
});


bouton_vert.addEventListener("click", function() {
    color = "#008000";
});
*/

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

function getPtrPosStage({x, y}) {
    return {x: x - ctnOffset.x, y: y - ctnOffset.y};
}

// Début d'un nouveau trait.
function newLine(e) {
    isPaint = true;
    //const pos = stage.getPointerPosition();
    const pos = getPtrPosStage({x: e.pageX, y: e.pageY});
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

// Nouveau segment sur le trait à chaque déplacement de souris.
function newPoint(e) {
    if (!isPaint)
        return;
    //const pos = stage.getPointerPosition();
    const pos = getPtrPosStage({x: e.pageX, y: e.pageY});
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
    var props = {coords:pos, radius: epaisseur * 2, fill: color};
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
    window.addEventListener('mousedown', newLine);
    window.addEventListener('mousemove', newPoint);
    window.addEventListener('mouseup', endLine);
}

function changeOutil(tool) {
    outil = tool;
    var children = outils.children;
    for (let i = 0; i < children.length; i++) {
        children[i].style.borderColor = "black";
    }

    stage.off();
    window.removeEventListener('mousedown', newLine);
    window.removeEventListener('mouseup', endLine);
    window.removeEventListener('mousemove', newPoint);
}

crayon.addEventListener('click', function() {
    changeOutil('brush');
    crayon.style.borderColor = "red";
    defaultBinds();
});
gomme.addEventListener('click', function() {
    changeOutil('eraser');
    gomme.style.borderColor = "red";
    defaultBinds();
});
rond.addEventListener('click', function() {
    changeOutil('rond');
    rond.style.borderColor = "red";
    stage.on('mousedown', nouveauRond);
});

var cchild = couleursDiv.children;
for (let i = 0; i < cchild.length; i++) {
    cchild[i].addEventListener('click', function() {
        for (let j = 0; j < cchild.length; j++)
            cchild[j].style.borderColor = 'black';
        cchild[i].style.borderColor = 'red';
        color = couleurs[i];
    });
}

defaultBinds();
