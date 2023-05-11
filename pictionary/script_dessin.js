var wwidth = window.innerWidth;
var wheight = window.innerHeight;
const fenetre = window;
const ctn_name = "drawing-container";

const container = document.getElementById(ctn_name);

const outilsDiv = document.getElementById("tools");
const couleursDiv = document.getElementById("colors");
const taillesDiv = document.getElementById("tailles");

const poubelleImg = document.getElementById("poubelle");
const undoImg = document.getElementById("undo");
const redoImg = document.getElementById("redo");

const playersList = document.getElementById("players-list");

const wordToFind = document.getElementById("word-to-find");

var messages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const input = document.getElementById('chat-input');

// La gestion des événements de base, ceux du pinceau et de la gomme.
function traitsBinds() {
    if (stage) {
        stage.on('mousedown', newLine);
        window.addEventListener('mousemove', newPoint);
        window.addEventListener('mouseup', endLine);
    }
}

// Evénements pour le rond
function rondBinds() {
    if (stage) {
        stage.on('mousedown', nouveauRond);
    }
}

function rempBinds() {
    if (stage) {
        stage.on('mousedown', nouveauRemplissage);
    }
}

// Tous les outils disponibles.
const outils = [{ tool: 'brush', file: "images/crayon.png", binds: traitsBinds },
{ tool: 'eraser', file: "images/gomme.png", binds: traitsBinds },
{ tool: 'rond', file: "images/rond.png", binds: rondBinds },
{ tool: 'fill', file: "images/remplissage.png", binds: rempBinds }];

// Toutes les couleurs disponibles, avec un bouton pour chaque couleur.
const couleurs = ["#ff0000", "#00f00f", "#0000ff", "#f6f600", "#ff9000", "#ff00ff", "#ffd19a", "#8c4c00", "#000000", "#a1a1a1", "#ffffff"];

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

const borderYouColor = "#9060fe";
const borderNotYouColor = "transparent";
const bgDessinateurColor = "#ffbfcf";
const bgDevineurColor = "#caf3fe";
const bgVainqueurColor = "#80d066";

var isPaint = false;
var outil_id = 0;

var color = couleurs[0];
var epaisseur = tailles[0];
var lastLine;

// Gestion de l'historique pour undo et redo.
var content = [];
var sizeDrawn = 0;

// roles et utilisateurs
var roleDessinateur = false;
var users = [];
var usersDessinateurs = [];
var usersVainqueurs = [];

// scores
var scores = [];

// Donne à chaque utilisateur un identifiant
// (pour identifier le conteneur dans la liste des participants)
var users_id = new Map();

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

// Compresse des données à la main en rassemblant les suites de 1
// (très basique mais efficace pour compresser les résultats de remplissage).
function compresseData(props, tab) {
    for (let i = 0; i < tab.length; i++) {
        if (tab[i] == 1) {
            let bl = { id: i, l: 0 };
            while ((i < tab.length) && (tab[i] == 1)) {
                i++;
                bl.l++;
            }
            props.data.push(bl);
        }
    }
}

// Décompression des données compressées à la mano.
// Donne un tableau de 1 et de 0 à partir des données compressées.
// Le tableau obtenu contient pour chaque pixel de la zone de dessin 0 ou 1 pour savoir si le pixel fait partie du remplissage.
function deCompresseData(props, tab) {
    for (let elem of props.data) {
        for (let i = 0; i < elem.l; i++) {
            tab[elem.id + i] = 1;
        }
    }
}

// A partir d'un tableau, crée une image correspondant au résultat d'un remplissage.
async function buildNewImage(props) {
    let imdata = new ImageData(props.dim.width, props.dim.height);
    imdata.data.fill(0);
    for (let i = 0; i < props.data.length; i++) {
        if (props.data[i] == 1) {
            imdata.data[i * 4] = props.color.r;
            imdata.data[i * 4 + 1] = props.color.g;
            imdata.data[i * 4 + 2] = props.color.b;
            imdata.data[i * 4 + 3] = props.color.a;
        }
    }
    return createImageBitmap(imdata).then(function (im) {
        let image = new Konva.Image({
            image: im,
            width: props.dim.width,
            height: props.dim.height
        });
        return image;
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
    let data = [props.dim.width * props.dim.heigth];
    deCompresseData(props, data);
    buildNewImage({ dim: props.dim, color: props.color, data: data }).then((image) => { addContent(image); });
}
// Serveur -> suppression du dessin.
function stocDelete() {
    if (layer) {
        layer.destroyChildren();
    }
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

function newChatMessage(msg) {
    const item = document.createElement('li');
    item.className = "text-container";
    if (msg.bool) {

        const texteGras = document.createElement("b");
        const texte = document.createTextNode(msg.text);
        texteGras.appendChild(texte);
        item.appendChild(texteGras);

        item.style.color = "green";
    }
    else {
        const texteGras = document.createElement("b");
        const texte = document.createTextNode(msg.user + " : ");
        texteGras.appendChild(texte);
        item.appendChild(texteGras);
        item.appendChild(document.createTextNode(msg.text));
    }
    messages.appendChild(item);

    messages.scrollTop = messages.scrollHeight;
}

function giveUsersId() {
    users_id.clear();
    var compteur = 1;
    for (let user of users) {
        users_id.set(user, compteur);
        compteur++;
    }
}

function userList(list) {
    users = list.users;
    giveUsersId();
    usersVainqueurs = list.vainqueurs;
    playersList.innerHTML = ""; //nettoyage
    for (let user of users) {
        let playerContainer = document.createElement("div");
        playerContainer.setAttribute("class", "player-container");
        playerContainer.setAttribute("id", user);
        playerContainer.style.borderColor = (user === username) ? borderYouColor : borderNotYouColor;
        playerContainer.style.backgroundColor = (usersDessinateurs.includes(user)) ? bgDessinateurColor
            : (usersVainqueurs.includes(user) ? bgVainqueurColor : bgDevineurColor);

        let playerRank = document.createElement("p");
        playerRank.setAttribute("class", "player-rank align-vertical");
        playerRank.textContent = "#1";
        playerContainer.appendChild(playerRank);

        let playerName = document.createElement("div");
        playerName.setAttribute("class", "player-name align-vertical");
        playerContainer.appendChild(playerName);

        const pseudoB = document.createElement("b");
        const userValue = user + (user === username ? " (You)" : "");
        const texteGras = document.createTextNode(userValue);
        pseudoB.appendChild(texteGras);

        let pseudo = document.createElement("div");
        pseudo.className = "text-container";
        pseudo.appendChild(pseudoB);
        let score = document.createElement("div");
        score.id = "score-" + users_id.get(user);
        score.textContent = 0 + " points";
        playerName.appendChild(pseudo);
        playerName.appendChild(score);

        playersList.appendChild(playerContainer);
    }
    updateListScores();
}

function updateListScores() {
    if (scores.length < users.length) {
        for (let user of users) {
            if (!scores.find(e => e.name === user)) {
                scores.push({name: user, value: 0});
            }
        }
    }
    console.log(scores);
    const playerContainers = playersList.querySelectorAll('.player-container');
    playerContainers.forEach(ctn => ctn.remove());
    let c = 1;
    for (let i of scores) {
        for (let elem of playerContainers) {
            if (elem.getAttribute("id") === i.name) {
                let div_score = elem.querySelector("#score-" + users_id.get(i.name));
                div_score.textContent = i.value + " points";
                let rank = elem.querySelector(".player-rank");
                rank.textContent = "#" + c;
                playersList.appendChild(elem);
                break;
            }
        }
        c++;
    }
}

function newDessinateurs(users) {
    resetBinds();
    usersDessinateurs = users;
    if (usersDessinateurs.includes(username) || users == []) {
        roleDessinateur = true;
    } else {
        roleDessinateur = false;
    }
    for (let elem of playersList.children) {
        elem.style.backgroundColor = (users.includes(elem.getAttribute("id")))
            ? bgDessinateurColor : bgDevineurColor;
    }
}

var stage = null;
var layer = null;

let socket = null;

// Calcule la position du curseur relativement à la zone de dessin à partir de la position absolue sur la fenêtre.
function getPtrPosStage({ x, y }) {
    return { x: x - container.offsetLeft, y: y - container.offsetTop };
}

// Début d'un nouveau trait.
function newLine(e) {
    if (!roleDessinateur)
        return;
    isPaint = true;
    const pos = stage.getPointerPosition();
    var props = { coords: pos, width: epaisseur, clr: color, mode: (outils[outil_id].tool === 'brush') ? 'source-over' : 'destination-out', points: [] };
    lastLine = buildNewLine(props);
    socket.emit("ctos draw line", props);
    addContent(lastLine);
}

// Nouveau segment sur le trait à chaque déplacement de souris.
function newPoint(e) {
    if (!isPaint || !roleDessinateur)
        return;
    const pos = getPtrPosStage({ x: e.pageX, y: e.pageY });
    var props = { coords: pos };
    var newPoints = lastLine.points().concat([props.coords.x, props.coords.y]);
    socket.emit("ctos draw point", props);
    lastLine.points(newPoints);
}

// Le clic est relaché, fin du tracé de la ligne et mise en cache.
function endLine() {
    if (!roleDessinateur)
        return;
    if (isPaint) {
        isPaint = false;
        lastLine.cache();
        socket.emit("ctos cache line");
    }
}

// Un disque (rond) est tracé sur un clic
function nouveauRond() {
    if (!roleDessinateur)
        return;
    var pos = stage.getPointerPosition();
    var props = { coords: pos, radius: epaisseur * 2, fill: color };
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
    if (data[index + 3] != 255 && data[index + 3] != 0)
        return true; //on remplit toujours les pixels semi-transparents
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
    if (!roleDessinateur)
        return;
    let cwidth = stage.width();
    let cheigth = stage.height();
    let dim = { width: cwidth, height: cheigth };
    let imageData = layer.toCanvas().getContext('2d').getImageData(0, 0, cwidth, cheigth);
    let data = imageData.data;
    // Comme chaque pixel du remplissage peut, soit être transparent, soit avoir la couleur du remplissage,
    // on peut réduire les informations à un nombre par pixel : 0 (transparent) ou 1 (couleur).
    let dataDest = [cwidth * cheigth];
    dataDest.fill(0);
    var pos = stage.getPointerPosition();
    var posInt = { x: Math.trunc(pos.x), y: Math.trunc(pos.y) };

    let colDest = { r: parseInt(color.slice(1, 3), 16), g: parseInt(color.slice(3, 5), 16), b: parseInt(color.slice(5, 7), 16), a: 255 };
    let indexClic = getIndex(posInt.x, posInt.y, dim);
    let colCible = { r: data[indexClic], g: data[indexClic + 1], b: data[indexClic + 2], a: data[indexClic + 3] };
    if (colDest.r == colCible.r && colDest.g == colCible.g && colDest.b == colCible.b && colDest.a == colCible.a)
        return;
    var p = [];
    p.push(posInt);
    while (p.length > 0) {
        let pix = p.pop();
        //setColor(dataDest, getIndex(pix.x, pix.y, dim), colDest);
        dataDest[pix.y * dim.width + pix.x] = 1;
        setColor(data, getIndex(pix.x, pix.y, dim), colDest);
        if (cmpColor(data, getIndex(pix.x, pix.y - 1, dim), colCible))
            p.push({ x: pix.x, y: pix.y - 1 });
        if (cmpColor(data, getIndex(pix.x, pix.y + 1, dim), colCible))
            p.push({ x: pix.x, y: pix.y + 1 });
        if (cmpColor(data, getIndex(pix.x - 1, pix.y, dim), colCible))
            p.push({ x: pix.x - 1, y: pix.y });
        if (cmpColor(data, getIndex(pix.x + 1, pix.y, dim), colCible))
            p.push({ x: pix.x + 1, y: pix.y });
    }
    buildNewImage({ dim: dim, color: colDest, data: dataDest }).then((image) => { addContent(image); });
    let props = { dim: dim, color: colDest, data: [] };
    compresseData(props, dataDest);
    socket.emit("ctos draw fill", props);
}

// Fonction de changement de l'outil, lorsque l'utilisateur clique sur un des boutons.
function resetBinds() {
    if (stage) {
        stage.off();
    }
    window.removeEventListener('mouseup', endLine);
    window.removeEventListener('mousemove', newPoint);
}

// Création des boutons pour les outils.
for (let i = 0; i < ochild.length; i++) {
    ochild[i].addEventListener('click', function () {
        for (let j = 0; j < ochild.length; j++) {
            ochild[j].style.borderColor = 'black';
        }
        ochild[i].style.borderColor = 'red';
        outil_id = i;
        resetBinds();
        outils[i].binds();
    });
}

// Création des boutons pour les couleurs.
for (let i = 0; i < cchild.length; i++) {
    cchild[i].addEventListener('click', function () {
        for (let j = 0; j < cchild.length; j++)
            cchild[j].style.borderColor = 'black';
        cchild[i].style.borderColor = 'red';
        color = couleurs[i];
    });
}

// Création des boutons pour les tailles.
for (let i = 0; i < tchild.length; i++) {
    tchild[i].addEventListener('click', function () {
        for (let j = 0; j < tchild.length; j++)
            tchild[j].style.borderColor = 'black';
        tchild[i].style.borderColor = 'red';
        epaisseur = tailles[i];
    });
}

// Bouton de suppression.
poubelleImg.addEventListener('click', function () {
    if (!roleDessinateur || !layer)
        return;
    if (confirm("Êtes-vous sûr de vouloir supprimer votre beau dessin ?")) {
        layer.destroyChildren();
        sizeDrawn = 0;
        content.splice(0, content.length);
        socket.emit("ctos delete");
    }
});

// Bouton undo.
undoImg.addEventListener('click', function () {
    if (!roleDessinateur)
        return;
    if (sizeDrawn > 0) {
        sizeDrawn--;
        content[sizeDrawn].remove();
        socket.emit("ctos undo");
    }

});

// Bouton redo.
redoImg.addEventListener('click', function () {
    if (!roleDessinateur)
        return;
    if (sizeDrawn < content.length) {
        layer.add(content[sizeDrawn]);
        sizeDrawn++;
        socket.emit("ctos redo");
    }

});

var username = '';

function zoneDessin() {
    container.innerHTML = "";
    stage = new Konva.Stage({
        container: ctn_name,
        width: container.clientWidth,
        height: container.clientHeight,
    });
    layer = new Konva.Layer();
    layer.listening(false);
    stage.add(layer);
}

var intervalle = null;

function socket_comm() {

    // Le serveur nous envoir notre nom d'utilisateur oui oui
    socket.on("username", function (name) {
        username = name;
    });

    chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (input.value) {
            var texte = input.value;
            socket.emit('chat message', texte);
            newChatMessage({user: username, text: texte, bool: false});
            input.value = '';
        }
    });

    socket.on("game infos", function (infos) {
        newDessinateurs(infos.dessinateurs);
        wordToFind.textContent = infos.mot;
        scores = infos.scores;
        console.log("game infos");
        console.log(scores);
        updateListScores();
        zoneDessin();
        seconds = infos.temps_restant;
        var compteur = document.getElementById("counter");
        intervalle = setInterval(function() {
            seconds--;
            if (seconds === 0) {
                clearInterval(intervalle);
                intervalle = null;
            }
            compteur.textContent = "" + seconds;
        }, 1000);
    });
    
    socket.on("stoc user list", function (list) {
        console.log(list);
        userList(list);
    });
    
    socket.on("stoc chat stack", function (stack) {
        for (let msg of stack) {
            newChatMessage(msg);
        }
    });
    
    socket.on('chat message', function (msg) {
        newChatMessage(msg);
    });

    socket.on('new score', function(new_scores) {
        scores = new_scores;
        console.log("new score");
        console.log(scores);
        updateListScores();
    });
    
    socket.on("correct guess", function (user) {
        newChatMessage({user: user, text: user + " a deviné le mot !", bool: true});
    
        for (let elem of playersList.children) {
            if (elem.getAttribute("id") === user) {
                elem.style.backgroundColor = bgVainqueurColor
            }
        }
    });
    
    // Serveur -> pile d'exécution.
    // Envoyé lors d'une nouvelle connexion, pour récupérer l'état du dessin.
    // Pour gérer le côté asynchrone de la création d'une image pour les remplissages,
    // on gère 'content' non pas comme une pile mais comme un tableau où les éléments sont ajoutés au bon index.
    // Pour le layer on précise l'ordre d'affichage des éléments avec 'setZindex'.
    socket.on("stoc draw stack", function (props) {
        content = [props.pile.length];
        for (let i = 0; i < props.pile.length; i++) {
            switch (props.pile[i].type) {
                case 'newLine':
                    lastLine = buildNewLine(props.pile[i].props);
                    for (let elem of props.pile[i].props.points) {
                        lastLine.points(lastLine.points().concat([elem.x, elem.y]));
                    }
                    if (i < props.lg) {
                        layer.add(lastLine);
                        lastLine.setZIndex(i);
                    }
                    lastLine.cache();
                    content[i] = lastLine;
                    continue;
                case 'newCircle':
                    let cercle = buildNewCircle(props.pile[i].props);
                    if (i < props.lg) {
                        layer.add(cercle);
                        cercle.setZIndex(i);
                    }
                    content[i] = cercle;
                    continue;
                case 'newFill':
                    let data = [props.pile[i].props.dim.width * props.pile[i].props.dim.heigth];
                    deCompresseData(props.pile[i].props, data);
                    buildNewImage({ dim: props.pile[i].props.dim, color: props.pile[i].props.color, data: data })
                        .then((image) => {
                            if (i < props.lg) {
                                layer.add(image);
                                image.setZIndex(i);
                            }
                            content[i] = image;
                        });
                    continue;
                default:
                    continue;
            }
        }
        sizeDrawn = props.lg;
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
    
    socket.on("stoc dessinateur", function (users) {
        if (intervalle) {
            clearInterval(intervalle);
        }
        newDessinateurs(users);
        container.innerHTML = "";
        stage = null;
        if (roleDessinateur) {
            let titre = document.createElement("p");
            titre.appendChild(document.createTextNode("Mot : "));
            const mot = document.createElement("b");
            mot.setAttribute("id", "proposition-mot");
            mot.appendChild(document.createTextNode(""));
            titre.appendChild(mot);
            container.appendChild(titre);
    
            const boutonValider = document.createElement("button");
            boutonValider.textContent = "Commencer";
            container.appendChild(boutonValider);
            
            const divVotes = document.createElement("div");
            divVotes.setAttribute("id", "div-validations");
            container.appendChild(divVotes);

            boutonValider.addEventListener("click", function listener () {
                socket.emit("ctos commencer");
                boutonValider.style.backgroundColor = "#90b800";
                boutonValider.removeEventListener("click", listener);
            });
        } else {
            let titre = document.createElement("p");
            const texteGras = document.createElement("b");
            texteGras.appendChild(document.createTextNode(usersDessinateurs.length > 1
                ? "En attente des dessinateurs..." : "En attente du dessinateur..."));
            titre.appendChild(texteGras);
            container.appendChild(titre);
        }
    });
    
    socket.on("stoc nouveau mot", function (mot) {
        const leMot = document.getElementById("proposition-mot");
        leMot.innerHTML = "";
        leMot.appendChild(document.createTextNode(mot));
    });

    socket.on("stoc nb ready", function (nb) {
        const divVotes = container.querySelector("#div-validations");
        divVotes.innerHTML = "";
        for (let i = 0; i < nb; i++) {
            const check = document.createElement("img");
            check.setAttribute("src", "images/check.png");
            divVotes.appendChild(check);
        }
    });
    
    // Nouveau mot à deviner, et donc début du tour de jeu !
    socket.on("stoc round start", function (info) {
        container.innerHTML = "";
        zoneDessin();
        console.log(info.mot);
        wordToFind.textContent = info.mot;
        if (usersDessinateurs.includes(username)) {
            outils[outil_id].binds();
        }
        var seconds = info.duree;
        var compteur = document.getElementById("counter");
        intervalle = setInterval(function() {
            seconds--;
            if (seconds === 0) {
                clearInterval(intervalle);
                intervalle = null;
            }
            compteur.textContent = "" + seconds;
        }, 1000);
    });

    // Pour les dessinateurs, le mot qu'il fallait deviner.
    socket.on("word guessed", function (mot) {
        wordToFind.textContent = mot;
    });

    socket.on("stoc fin de partie", function (owner) {
        if(intervalle) {
            clearInterval(intervalle);
            intervalle = null;
        }
        finDePartie(owner);
    });

    socket.on("disconnect", function () {
        location.reload();
    });
}

function finDePartie(owner) {
    usersDessinateurs = [];

    container.innerHTML = "";

    const titre = document.createElement("h1");
    titre.textContent = "Fin de la partie !";
    const infoGagnant = document.createElement("p");
    infoGagnant.textContent = "vainqueur : ";
    const nomGagnant = document.createElement("b");
    const gagnant = (scores.length > 0 ? scores[0].name : "?") + " !";
    nomGagnant.appendChild(document.createTextNode(gagnant));
    infoGagnant.appendChild(nomGagnant);
    container.appendChild(titre);
    container.appendChild(infoGagnant);

    if (owner === username) {
        boutonsWaitingRoom();
    } else {
        socket.on("stoc game start", function () {
            zoneDessin();
        });
    }
}

function tentativeDeCo(roomID, isOwner) {
    socket = io(roomID);

    socket.on('connect_error', () => {
        var err_co = document.getElementById("erreur-connexion");
        if (err_co) {
            err_co.innerHTML = "";
        } else {
            err_co = document.createElement("div");
            err_co.setAttribute("id", "erreur-connexion");
            container.appendChild(err_co);
        }
        
        setTimeout(function() {
            const titre = document.createElement("p");
            const texteGras = document.createElement("b");
            texteGras.appendChild(document.createTextNode("Partie introuvable"));
            titre.appendChild(texteGras);
            err_co.appendChild(titre);
        }, 100);
    });

    socket.on("connect", () => {
        const room_display = document.getElementById("room-code");
        room_display.textContent = roomID.replace("/","");
        socket_comm();
        waitingScreen(roomID, isOwner);
    });
}

function copierTexte() {
    texteCode = document.getElementById("texteCode");
    texteCode.select();
    navigator.clipboard.writeText(texteCode.value);
    const span = document.getElementById("bouton-copie-span");
    span.innerHTML = "Code copié !";
}

function outFunc() {
    const span = document.getElementById("bouton-copie-span");
    span.innerHTML = "Copier le code";
}

function paramsRange(div, input, val, name, labelText, min, max, value) {
    val.appendChild(document.createTextNode("" + value));

    let label = document.createElement("label");
    label.setAttribute("for", name);
    label.textContent = labelText;
    container.appendChild(label);

    input.setAttribute("type", "range");
    input.setAttribute("name", name);
    input.setAttribute("min", "" + min);
    input.setAttribute("max", "" + max);
    input.setAttribute("value", "" + value);

    const minG = document.createElement("b");
    minG.appendChild(document.createTextNode("" + min));

    const maxG = document.createElement("b");
    maxG.appendChild(document.createTextNode("" + max));

    div.appendChild(minG);
    div.appendChild(input);
    div.appendChild(maxG);
}

function boutonsWaitingRoom() {
    let inputDess = document.createElement("input");
    const inputDivDess = document.createElement("div");
    inputDivDess.setAttribute("id", "choix-dessinateurs");
    const valDessG = document.createElement("b");
    paramsRange(inputDivDess, inputDess, valDessG, "dessinateurs", "Nombre de dessinateurs : ", 1, 7, 1);
    container.appendChild(inputDivDess);
    container.appendChild(valDessG);

    let inputRound = document.createElement("input");
    const inputDivRound = document.createElement("div");
    inputDivRound.setAttribute("id", "choix-rounds");
    const valRoundG = document.createElement("b");
    paramsRange(inputDivRound, inputRound, valRoundG, "rounds", "Nombre de tours : ", 1, 10, 4);
    container.appendChild(inputDivRound);
    container.appendChild(valRoundG);

    let boutonStart = document.createElement("button");

    boutonStart.textContent = "Démarrer la partie";
    container.appendChild(boutonStart);

    inputDess.addEventListener("input", function() {
        valDessG.innerHTML = "";
        valDessG.appendChild(document.createTextNode(inputDess.value));
    });

    inputRound.addEventListener("input", function() {
        valRoundG.innerHTML = "";
        valRoundG.appendChild(document.createTextNode(inputRound.value));
    });
    
    boutonStart.addEventListener("click", function () {
        if (users.length < 2) {
            alert("Nombre de joueurs insufisant.");
            return;
        }
        let inputDessValue = parseInt(inputDess.value);
        if (inputDessValue > users.length - 1) {
            alert("Trop de dessinateurs.");
            return;
        }
        let inputRoundValue = parseInt(inputRound.value);

        socket.emit("ctos game start", {dessinateurs: inputDessValue, rounds: inputRoundValue});
        zoneDessin();
    });
}

function waitingScreen(roomID, isOwner) {
    container.innerHTML = "";

    users = [username];

    if (isOwner) {
        let divCodeCopier = document.createElement("div");
        divCodeCopier.setAttribute("id", "code-copie");

        let titre = document.createElement("p");
        titre.appendChild(document.createTextNode("Code de la partie : "));
        const texteCode = document.createElement("input");
        texteCode.setAttribute("id", "texteCode");
        texteCode.setAttribute("class", "code-input");
        texteCode.setAttribute("value", roomID.replace("/", ""));
        texteCode.setAttribute("readonly", true);

        divCodeCopier.appendChild(titre);
        divCodeCopier.appendChild(texteCode);

        let boutonDiv = document.createElement("div");
        boutonDiv.setAttribute("id", "bouton-copie-div");
        
        let boutonCopie = document.createElement("button");
        boutonCopie.setAttribute("onclick", "copierTexte()");
        boutonCopie.setAttribute("onmouseout", "outFunc()");
        boutonCopie.setAttribute("id", "bonton-copie");

        let span = document.createElement("span");
        span.textContent = "Copier le code";
        span.setAttribute("id", "bouton-copie-span");
        span.setAttribute("class", "copie-span");
        
        boutonCopie.textContent = "Copier";
        boutonCopie.appendChild(span);

        boutonDiv.appendChild(boutonCopie);
        divCodeCopier.appendChild(boutonDiv);
        container.appendChild(divCodeCopier);

        boutonsWaitingRoom();
    } else {
        let titre = document.createElement("p");
        titre.textContent = "En attente de joueurs...";
        container.appendChild(titre);
        socket.on("stoc game start", function () {
            zoneDessin();
        });
    }

    socket.on("stoc user list", function (list) {
        users = list.users; 
        userList(list);
    });
}

// Le crayon est l'outil sélectionné par défaut
ochild[0].style.borderColor = 'red';
// Le premier bouton est sélectionné par défaut
cchild[0].style.borderColor = 'red';
// Epaisseur par défaut
tchild[0].style.borderColor = 'red';

let createRoomButton = document.getElementById("creer-room");
createRoomButton.addEventListener("click", function () {
    fetch('new-room', {
        method: 'GET'
    })
    .then(function(response) {
        response.text().then(function(text) {
            tentativeDeCo(text, true);
        })
    })
    .catch(function (err) {
        console.log(err);
    });
});

let joinRoomFrom = document.getElementById("rejoindre-room");
let joinRoomInput = document.getElementById("join-input");
joinRoomFrom.addEventListener('submit', function(info) {
    info.preventDefault();
    if (joinRoomInput.value) {
        tentativeDeCo("/" + joinRoomInput.value, false);
    }
});
