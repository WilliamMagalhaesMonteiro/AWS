var wwidth = window.innerWidth;
var wheight = window.innerHeight;
const fenetre = window;

const container = document.getElementById("container");

const outilsDiv = document.getElementById("tools");
const couleursDiv = document.getElementById("colors");
const taillesDiv = document.getElementById("tailles");

const poubelleImg = document.getElementById("poubelle");
const undoImg = document.getElementById("undo");
const redoImg = document.getElementById("redo");

// La gestion des événements de base, ceux du pinceau et de la gomme.
function defaultBinds() {
    stage.on('mousedown', newLine);
    window.addEventListener('mousemove', newPoint);
    window.addEventListener('mouseup', endLine);
}

// Evénements pour le rond
function rondBinds() {
    stage.on('mousedown', nouveauRond);
}

// Tous les outils disponibles.
const outils = [{tool: 'brush', file: "images/crayon.png", binds: defaultBinds},
    {tool: 'eraser', file: "images/gomme.png", binds: defaultBinds},
    {tool: 'rond', file: "images/rond.png", binds: rondBinds}];

// Toutes les couleurs disponibles, avec un bouton pour chaque couleur.
const couleurs = ["#ff0000", "#00f00f", "#0000ff", "#f6f600", "#ff9000", "#ff00ff", "#000000", "#ffffff"];

// Toute les tailles disponibles pour le pinceau et la gomme.
const tailles = [5, 10, 15, 20, 25, 30];

// Création des boutons pour les outils.
for (let i = 0; i < outils.length; i++) {
    let newImg = document.createElement("img");
    newImg.setAttribute("src", outils[i].file);
    outilsDiv.appendChild(newImg);
}

// Création des boutons pour les couleurs.
for (let i = 0; i < couleurs.length; i++) {
    let newDiv = document.createElement("div");
    newDiv.style.backgroundColor = couleurs[i];
    couleursDiv.appendChild(newDiv);
}

// Création des boutons pour les tailles.
for (let i = 0; i < tailles.length; i++) {
    let newDiv = document.createElement("div");
    newDiv.style.width = "" + tailles[i] + "px";
    newDiv.style.height = "" + tailles[i] + "px";
    taillesDiv.appendChild(newDiv);
}

// Liste des enfants pour chaque partie des boutons
var ochild = outilsDiv.children;
var cchild = couleursDiv.children;
var tchild = taillesDiv.children;

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
var outil = outils[0].tool;
var color = couleurs[0]; // Couleur par défaut.
var epaisseur = tailles[0];
var lastLine;

// Gestion de l'historique pour undo et redo.
var content = [];
var sizeDrawn = 0;

// Ajout d'un nouvel élément au Layer, avec gestion de l'historique.
function addContent(ctt) {
    if (sizeDrawn < content.length) {
        // Si on est revenu en arrière avec undo et qu'on a dessiné quelque chose.
        let toDelete = content.length - sizeDrawn;
        content.splice(-toDelete, toDelete);
    }
    layer.add(ctt);
    content.push(ctt);
    sizeDrawn++;
}

function buildNewLine(props) {
    return new Konva.Line({
        stroke: props.clr,
        strokeWidth: props.width,
        globalCompositeOperation: props.mode,
        lineCap: 'round',
        lineJoin: 'round',
        points: [props.coords.x, props.coords.y, props.coords.x, props.coords.y],
    });
}

function buildNewCircle(props) {
    return new Konva.Circle({
        x: props.coords.x,
        y: props.coords.y,
        radius: props.radius,
        fill: props.fill,
    });
}

function stocNewLine(props) {
    lastLine = buildNewLine(props);
    addContent(lastLine);
}

function stocNewPoint(props) {
    lastLine.points(lastLine.points().concat([props.coords.x, props.coords.y]));
}

function stocCacheLine() {
    lastLine.cache();
}

function stocNewCircle(props) {
    addContent(buildNewCircle(props));
}

function stocDelete() {
    layer.destroyChildren();
    sizeDrawn = 0;
    content.splice(0, content.length);
}

function stocUndo() {
    if (sizeDrawn > 0) {
        sizeDrawn--;
        content[sizeDrawn].remove();
    }
}

function stocRedo() {
    if (sizeDrawn < content.length) {
        layer.add(content[sizeDrawn]);
        sizeDrawn++;
    }
}

socket.on("stoc stack", function(stack) {
    for(let elem of stack) {
        switch(elem.type) {
            case 'newLine':
                stocNewLine(elem.props);
                break;
            case 'newPoint':
                stocNewPoint(elem.props);
                break;
            case 'cacheLine':
                stocCacheLine();
                break;
            case 'newCircle':
                stocNewCircle(elem.props);
                break;
            case 'undo':
                stocUndo();
                break;
            case 'redo':
                stocRedo();
                break;
            default:
                break;
        }
    }
});

socket.on("stoc draw line", stocNewLine);

socket.on("stoc draw point", stocNewPoint);

socket.on("stoc cache line", stocCacheLine);

// Le client reçoit un cercle du serveur.
socket.on("stoc draw cercle", stocNewCircle);

socket.on("stoc delete", stocDelete);

socket.on("stoc undo", stocUndo);

socket.on("stoc redo", stocRedo);

// Calcule la position du curseur relativement à la zone de dessin à partir de la position absolue sur la fenêtre.
function getPtrPosStage({x, y}) {
    return {x: x - container.offsetLeft, y: y - container.offsetTop};
}

// Début d'un nouveau trait.
function newLine(e) {
    isPaint = true;
    //const pos = stage.getPointerPosition();
    const pos = stage.getPointerPosition();
    var props = {coords: pos, width: epaisseur, clr: color, mode: (outil === 'brush') ? 'source-over' : 'destination-out'};
    lastLine = buildNewLine(props);
    socket.emit("ctos draw line", props);
    addContent(lastLine);
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
    if (isPaint) {
        isPaint = false;
        lastLine.cache();
        socket.emit("ctos cache line");
    }
}

// Un disque (rond) est tracé sur un clic
function nouveauRond() {
    var pos = stage.getPointerPosition();
    var props = {coords:pos, radius: epaisseur * 2, fill: color};
    var rond = buildNewCircle(props);
    socket.emit("ctos draw cercle", props);
    addContent(rond);
}

// Fonction de changement de l'outil, lorsque l'utilisateur clique sur un des boutons.
function resetBinds() {
    stage.off();
    window.removeEventListener('mouseup', endLine);
    window.removeEventListener('mousemove', newPoint);
}

for (let i = 0; i < ochild.length; i++) {
    ochild[i].addEventListener('click', function() {
        for (let j = 0; j < ochild.length; j++) {
            ochild[j].style.borderColor = 'black';
        }
        ochild[i].style.borderColor = 'red';
        outil = outils[i].tool;
        resetBinds();
        outils[i].binds();
    });
}

for (let i = 0; i < cchild.length; i++) {
    cchild[i].addEventListener('click', function() {
        for (let j = 0; j < cchild.length; j++)
            cchild[j].style.borderColor = 'black';
        cchild[i].style.borderColor = 'red';
        color = couleurs[i];
    });
}

for (let i = 0; i < tchild.length; i++) {
    tchild[i].addEventListener('click', function() {
        for (let j = 0; j < tchild.length; j++)
            tchild[j].style.borderColor = 'black';
        tchild[i].style.borderColor = 'red';
        epaisseur = tailles[i];
    });
}

poubelleImg.addEventListener('click', function() {
    if (confirm("Êtes-vous sûr de vouloir supprimer votre beau dessin ?")) {
        layer.destroyChildren();
        sizeDrawn = 0;
        content.splice(0, content.length);
        socket.emit("ctos delete");
    }
});

undoImg.addEventListener('click', function() {
    if (sizeDrawn > 0) {
        sizeDrawn--;
        content[sizeDrawn].remove();
        socket.emit("ctos undo");
    }
    
});

redoImg.addEventListener('click', function() {
    if (sizeDrawn < content.length) {
        layer.add(content[sizeDrawn]);
        sizeDrawn++;
        socket.emit("ctos redo");
    }
    
});

// Le crayon est l'outil sélectionné par défaut
ochild[0].style.borderColor = 'red';
// Le premier bouton est sélectionné par défaut
cchild[0].style.borderColor = 'red';
// Epaisseur par défaut
tchild[0].style.borderColor = 'red';

defaultBinds();
