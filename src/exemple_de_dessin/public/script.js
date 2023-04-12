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

function rempBinds() {
    stage.on('mousedown', nouveauRemplissage);
}

// Tous les outils disponibles.
const outils = [{tool: 'brush', file: "images/crayon.png", binds: defaultBinds},
    {tool: 'eraser', file: "images/gomme.png", binds: defaultBinds},
    {tool: 'rond', file: "images/rond.png", binds: rondBinds},
    {tool: 'fill', file: "images/remplissage.png", binds: rempBinds}];

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
var color = couleurs[0];
var epaisseur = tailles[0];
var lastLine;

// Gestion de l'historique pour undo et redo.
var content = [];
var sizeDrawn = 0;

// Ajout d'un nouvel élément au Layer, avec gestion de l'historique.
function addContent(ctt) {
    if (sizeDrawn < content.length) {
        // Si on est revenu en arrière avec undo et qu'on a dessiné quelque chose.
        // Dans ce cas suppression des éléments qui ne sont pas affichés.
        let toDelete = content.length - sizeDrawn;
        content.splice(-toDelete, toDelete);
    }
    layer.add(ctt);
    content.push(ctt);
    sizeDrawn++;
}

// Utilisation des informations pour créer une ligne.
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

// Un nouveau cercle.
function buildNewCircle(props) {
    return new Konva.Circle({
        x: props.coords.x,
        y: props.coords.y,
        radius: props.radius,
        fill: props.fill,
    });
}

// Le serveur envoie une nouvelle ligne.
function stocNewLine(props) {
    lastLine = buildNewLine(props);
    addContent(lastLine);
}
// Serveur -> nouveau point.
function stocNewPoint(props) {
    lastLine.points(lastLine.points().concat([props.coords.x, props.coords.y]));
}
// Serveur -> ligne en cache.
function stocCacheLine() {
    lastLine.cache();
}
// Serveur -> nouveau cercle.
function stocNewCircle(props) {
    addContent(buildNewCircle(props));
}
function stocNewFill(props) {
    //...
}
// Serveur -> suppression du dessin.
function stocDelete() {
    layer.destroyChildren();
    sizeDrawn = 0;
    content.splice(0, content.length);
}
// Serveur -> undo.
function stocUndo() {
    if (sizeDrawn > 0) {
        sizeDrawn--;
        content[sizeDrawn].remove();
    }
}
// Serveur -> redo.
function stocRedo() {
    if (sizeDrawn < content.length) {
        layer.add(content[sizeDrawn]);
        sizeDrawn++;
    }
}
// Serveur -> pile d'exécution.
// Envoyé lors d'une nouvelle connexion, pour récupérer l'état du dessin.
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
            case 'newFill':
                stocNewFill(elem.props);
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

/* --- Récéption des commandes du serveur temps réel. --- */
socket.on("stoc draw line", stocNewLine);

socket.on("stoc draw point", stocNewPoint);

socket.on("stoc cache line", stocCacheLine);

socket.on("stoc draw cercle", stocNewCircle);

socket.on("stoc draw fill", stocNewFill);

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
    const pos = getPtrPosStage({x: e.pageX, y: e.pageY});
    var props = {coords: pos};
    var newPoints = lastLine.points().concat([props.coords.x, props.coords.y]);
    socket.emit("ctos draw point", props);
    lastLine.points(newPoints);
}

// Le clic est relaché, fin du tracé de la ligne et mise en cache.
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

/* Fonctions utilisées par le remplissage */
// Calculs d'index dans le tableau.
function getIndex(x, y, dim) {
    if (x < 0)
        x = 0;
    if (y < 0)
        y = 0;
    if (x >= dim.width)
        x = dim.width - 1;
    if (y >= dim.height)
        y = dim.height - 1;
    return (y * dim.width + x) * 4;
}

// Modification de 4 cases dans le tableau pour changer la couleur d'un pixel.
function setColor(data, index, color) {
    data[index] = color.r;
    data[index + 1] = color.g;
    data[index + 2] = color.b;
    data[index + 3] = color.a;
}

// Vérifie si le pixel indiqué est de la couleur indiqué.
function cmpColor(data, index, color) {
    if (data[index] != color.r)
        return false;
    if (data[index + 1] != color.g)
        return false;
    if (data[index + 2] != color.b)
        return false;
    if (data[index + 3] != color.a)
        return false;
    return true;
}

// Ici on récupère le tableau des pixels de la zone de dessin,
// puis on applique un algorithme de remplissage qui compare la couleur des pixels.
// On crée ensuite une nouvelle image qui est ajoutée au dessin.
function nouveauRemplissage() {
    let cwidth = stage.width();
    let cheigth = stage.height();
    let dim = {width: cwidth, height: cheigth};
    let imageData = layer.toCanvas().getContext('2d').getImageData(0,0,cwidth,cheigth);
    let data = imageData.data;
    let imdata = new ImageData(cwidth, cheigth);
    let dataDest = imdata.data;
    var pos = stage.getPointerPosition();
    var posInt = {x: Math.trunc(pos.x), y: Math.trunc(pos.y)};

    let colDest = {r: parseInt(color.slice(1,3),16), g: parseInt(color.slice(3,5),16), b: parseInt(color.slice(5,7),16), a: 255};
    let indexClic = getIndex(posInt.x, posInt.y, dim);
    let colCible = {r: data[indexClic], g: data[indexClic + 1], b: data[indexClic + 2], a: data[indexClic + 3]};
    if (colDest.r == colCible.r && colDest.g == colCible.g && colDest.b == colCible.b && colDest.a == colCible.a)
        return;
    var p = [];
    p.push(posInt);
    while (p.length > 0) {
        let pix = p.pop();
        setColor(dataDest, getIndex(pix.x, pix.y, dim), colDest);
        setColor(data, getIndex(pix.x, pix.y, dim), colDest);
        if (cmpColor(data, getIndex(pix.x, pix.y - 1, dim), colCible))
            p.push({x: pix.x, y: pix.y - 1});
        if (cmpColor(data, getIndex(pix.x, pix.y + 1, dim), colCible))
            p.push({x: pix.x, y: pix.y + 1});
        if (cmpColor(data, getIndex(pix.x - 1, pix.y, dim), colCible))
            p.push({x: pix.x - 1, y: pix.y});
        if (cmpColor(data, getIndex(pix.x + 1, pix.y, dim), colCible))
            p.push({x: pix.x + 1, y: pix.y});
    }
    createImageBitmap(imdata).then(function(im) {
        let image = new Konva.Image({
            image: im,
            width: cwidth,
            height: cheigth
        });
        addContent(image);
        //socket.emit("ctos draw fill", image); non
    });
    
}

// Fonction de changement de l'outil, lorsque l'utilisateur clique sur un des boutons.
function resetBinds() {
    stage.off();
    window.removeEventListener('mouseup', endLine);
    window.removeEventListener('mousemove', newPoint);
}

// Création des boutons pour les outils.
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

// Création des boutons pour les couleurs.
for (let i = 0; i < cchild.length; i++) {
    cchild[i].addEventListener('click', function() {
        for (let j = 0; j < cchild.length; j++)
            cchild[j].style.borderColor = 'black';
        cchild[i].style.borderColor = 'red';
        color = couleurs[i];
    });
}

// Création des boutons pour les tailles.
for (let i = 0; i < tchild.length; i++) {
    tchild[i].addEventListener('click', function() {
        for (let j = 0; j < tchild.length; j++)
            tchild[j].style.borderColor = 'black';
        tchild[i].style.borderColor = 'red';
        epaisseur = tailles[i];
    });
}

// Bouton de suppression.
poubelleImg.addEventListener('click', function() {
    if (confirm("Êtes-vous sûr de vouloir supprimer votre beau dessin ?")) {
        layer.destroyChildren();
        sizeDrawn = 0;
        content.splice(0, content.length);
        socket.emit("ctos delete");
    }
});

// Bouton undo.
undoImg.addEventListener('click', function() {
    if (sizeDrawn > 0) {
        sizeDrawn--;
        content[sizeDrawn].remove();
        socket.emit("ctos undo");
    }
    
});

// Bouton redo.
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
