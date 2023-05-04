const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');
const pug = require('pug');
const { createHash } = require('crypto');
const { randomBytes } = require('crypto');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: 'Supermotdepasse',
    database: 'loginBD'
});

let mots_list = [];
connection.query(
    "select mot,theme from mots order by id;",
    function (err, result) {
        if (err) throw err;
        if (Array.isArray(result)) {
            for (let row of result) {
                mots_list.push({ mot: row.mot, theme: row.theme });
            }
        }
    }
);

const port_socket = 3000;
const app = express();
const http = require('http');
const server = http
    .createServer(app)
    .listen(port_socket, () => {
        console.log("listening on port " + port_socket);
    });

app.set("view engine", "pug");

const dotenv = require('dotenv');
dotenv.config();

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
});

app.use(sessionMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, "accueil.html"));
});

app.get('/auth', function (req, res) {
    // Rendu de la page d'authentification
    res.render('login');

});

app.get('/register', function (req, res) {
    res.render('register');
});

app.post('/register', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let hash = createHash('sha256').update(password).digest('hex');
    let IV = randomBytes(32).toString("hex");
    let hashIV = hash + IV;
    if (username && hashIV) {
        // Vraiment la base de la base avec les failles qui vont avec
        connection.query("select * from comptes where username = ?;", [username], function (error, results) {
            if (error) {
                console.log(error);
                return res.render('register', { message: "Une erreur est survenue.", username: username });
            }
            if (results.length > 0) {
                return res.render('register', { message: "Nom d'utilisateur déjà utilisé.", username: username });
            }
            connection.query("insert into comptes (username, password, IV) values (?, ?, ?);", [username, hashIV, IV], function (error2, r) {
                if (error2) {
                    console.log(error2);
                    return res.render('register', { message: "Une erreur est survenue.", username: username });
                }
                return res.redirect('/auth');
            });
        });
    }
});

// Lorsque l'utilisateur clique sur 'Login'
// -> http://localhost:3000/auth
app.post('/auth', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let hash = createHash('sha256').update(password).digest('hex');
    let IV = '';
    let hashIV = '';

    // On récupère l'IV de l'utilisateur
    connection.query("select iv from comptes where username = ?;", [username], function (error, results) {
        if (error) {
            console.log(error);
            return res.render('login', { message: "Une erreur est survenue.", username: username });
        }
        if (results.length > 0) {   // Cet utilisateur existe
            IV = results[0].iv;
            hashIV = hash + IV;
            //Deuxième requête
            if (username && hashIV) {
                // Vraiment la base de la base avec les failles qui vont avec
                connection.query("select * from comptes where username = ? and password = ?;", [username, hashIV], function (error, results) {
                    if (error) {
                        console.log(error);
                        return res.render('login', { message: "Une erreur est survenue.", username: username });
                    }
                    if (results.length > 0) {
                        req.session.loggedin = true;
                        req.session.username = username;
                        return res.redirect('/pictionary');
                    }
                    // Rendu de la page d'authentification avec des trucs à afficher en plus !
                    return res.render('login', { message: "Nom d'utilisateur ou mot de passe incorrect.", username: username });
                });
            }
        }
    });
});

function getVerifAuth(req, res, next) {
    if (req.session.loggedin) {
        return next();
    } else {
        res.redirect('/auth');
    }
    res.end();
}

app.use(express.static(path.join(__dirname, 'pictionary')));

app.get('/pictionary', getVerifAuth, function (req, res) {
    res.sendFile(path.join(__dirname, 'pictionary', 'index.html'));
});

var rooms = [];

app.get('/new-room', getVerifAuth, function (req, res) {
    let roomId;
    do {
        roomId = "/" + (Math.random() + 1).toString(36).substring(7);
    } while (rooms.includes(roomId));
    rooms.push(roomId);
    gameServer(roomId);
    res.send(roomId);
});

const { Server } = require("socket.io");
const io = new Server(server);
// Utilisation du middleware de session pour l'authentification
io.engine.use(sessionMiddleware);

function removeFromTab(tab, elem) {
    const index = tab.indexOf(elem);
    if (index > -1)
        tab.splice(index, 1);
}

function gameServer(roomPath) {
    const ioNsp = io.of(roomPath);

    var draw_stack = []; // la pile d'éléments ayant été dessinés
    var effSize = 0; // le nombre d'éléments de la pile qui sont affichés (change avec undo/redo)
    let lastLine;  // la dernière ligne ayant été tracée (ou en cours)

    var chat_stack = [];

    var scores = new Map(); // socres totaux des joueurs
    var points_marques = new Map(); // points marqués lors du tour

    var users = []; // liste des noms des utilisateurs connectés
    var owner = null; // l'utilisateur qui a créé la room
    var game_mot = ""; // le mot que les dessinateurs doivent faire deviner
    var game_mot_cache = ""; // le mot que les autres voients (des '_ _ _ ...')
    var usrs_dessinateurs = []; // la liste des utilisateurs qui dessinent
    var nb_ready = 0; // le nombre de dessinateurs qui sont prêts à commencer
    var tour_de_jeu = 0; // compteur de tours ()
    var nb_tours_de_jeu = 1;

    var nb_dessinateurs = 1; // le nombre d'utilisateurs qui dessinent en même temps
    var users_vainqueurs = []; // liste des utilisateurs qui on deviné le mot

    var duree_round = 60;   // durée en seconde des rounds
    var timeout = null; // ref vers la fonction en attente qui s'exécute quand le temps est écoulé
    var instantDebut = null;

    function clearPrev() {
        if (effSize < draw_stack.length) {
            let toDelete = draw_stack.length - effSize;
            draw_stack.splice(-toDelete, toDelete);
        }
    }

    // Indique si le jeu est en cours
    var game = false;
    // Indique si un tour de jeu est en cours
    var round = false;
    // Indique le joueur qui dessine (tous les autres devinent)
    var id_dessineur = -1;

    // Deux rooms : une où se trouvent le ou les dessinateurs, une où se trouvent ceux qui devinent.
    const roomDevinateurs = "roomDev";
    const roomDessinateurs = "roomDess";

    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    function suppression() {
        draw_stack.splice(0, draw_stack.length);
    }

    function nouveau_mot() {
        var nouveauMot;
        do {
            nouveauMot = mots_list[getRandomInt(mots_list.length - 1)].mot;
        } while (nouveauMot === game_mot);
        game_mot = nouveauMot;
    }

    function ajouterScore(value, key) {
        scores.set(key, scores.get(key) + value);
    }

    function scoreZero(value, key) {
        scores.set(key, 0);
    }

    function compareScore(a, b) {
        return a.value < b.value ? 1 : (a.value > b.value ? -1 : 0);
    }

    function marquer_points() {
        round = false;
        for (let user of usrs_dessinateurs) {
            points_marques.set(user, users_vainqueurs.length);
        }
        points_marques.forEach(ajouterScore);
        var arrayScores = Array.from(scores, ([name, value]) => ({ name, value }));
        arrayScores.sort(compareScore);
        var msg = "Points marqués : ";
        for (let entry of points_marques.entries()) {
            msg += entry[0] + " : " + entry[1] + ", ";
        }
        msg = msg.slice(0, -2);
        msg += ".";
        ioNsp.emit('new score', arrayScores);
        ioNsp.emit('chat message', { user: "", text: msg, bool: true });
        chat_stack.push({ user: "", text: msg, bool: true });
        points_marques.clear();
    }

    function reset_game_info() {
        game = false;
        round = false;
        nb_ready = 0;
        id_dessineur = -1;
        scores.forEach(scoreZero);
    }

    function nouveau_tour() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        users_vainqueurs = [];

        // On donne le mot aux joueurs qui n'ont pas deviné
        ioNsp.to(roomDevinateurs).emit("word guessed", game_mot);
        // Le dessin est effacé
        suppression();
        ioNsp.emit("stoc delete");

        // Un des dessinateurs est choisit de façon cyclique
        id_dessineur++;
        if (id_dessineur >= users.length) {
            id_dessineur = 0;
            tour_de_jeu++;
            if (tour_de_jeu >= nb_tours_de_jeu) {
                reset_game_info();
                ioNsp.emit("stoc fin de partie", users.includes(owner) ? owner : users[0]);
                return;
            }
        }
        usrs_dessinateurs = [users[id_dessineur]];

        nouveau_mot();

        // Les autres sont aléatoires
        for (var i = 1; i < nb_dessinateurs && i < users.length - 1; i++) {
            let new_dessinateur;
            do {
                new_dessinateur = users[getRandomInt(users.length - 1)];
            } while (usrs_dessinateurs.includes(new_dessinateur));
            usrs_dessinateurs.push(new_dessinateur);
        }
        nb_ready = 0;
        ioNsp.emit("stoc dessinateur", usrs_dessinateurs);
        for (let entry of ioNsp.sockets.entries()) {
            if (usrs_dessinateurs.includes(entry[1].request.session.username)) {
                entry[1].leave(roomDevinateurs);
                entry[1].join(roomDessinateurs);
            } else {
                entry[1].join(roomDevinateurs);
                entry[1].leave(roomDessinateurs);
            }
        }
        let msg = "Au tour de ";
        for (var i = 0; i < usrs_dessinateurs.length; i++) {
            msg += usrs_dessinateurs[i] + ((i == usrs_dessinateurs.length - 1) ? "" : ", ");
        }
        msg += " de dessiner !";
        ioNsp.emit('chat message', { user: "", text: msg, bool: true });
        chat_stack.push({ user: "", text: msg, bool: true });
        ioNsp.to(roomDessinateurs).emit("stoc nouveau mot", game_mot);
    }

    function reset() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        reset_game_info();
        usersDessinateurs = [];
        users_vainqueurs = [];
        instantDebut = null;
        suppression();
        ioNsp.emit("stoc fin de partie", users.includes(owner) ? owner : users[0]);
    }

    function round_start() {
        game_mot_cache = "";
        // remplacer les lettres du mots par des '_' pour les devinateurs
        for (let c of game_mot) {
            game_mot_cache += (c.toLowerCase() != c.toUpperCase()) ? "_ " : "  ";
        }
        ioNsp.to(roomDevinateurs).emit("stoc round start", { mot: game_mot_cache, duree: duree_round });
        ioNsp.to(roomDessinateurs).emit("stoc round start", { mot: game_mot, duree: duree_round });
        round = true;
        instantDebut = Date.now();
        timeout = setTimeout(function () {
            marquer_points();
            nouveau_tour();
        }, 1000 * (duree_round + 1));
    }

    // Nouvelle connexion.
    ioNsp.on("connection", function (socket) {

        // Le nom d'utilisateur du nouveau client est enregistré ici (comme dans squid game).
        const username = socket.request.session.username;

        // Le premier qui se connecte est l'owner
        if (users.includes(username) || users.length >= 7) {
            // Un utilisateur ne peut se connecter qu'une seule fois, et le nombre max de joueurs est de 8.
            socket.disconnect();
            return;
        }

        socket.emit("username", username);
        if (!owner) {
            owner = username;
        }
        users.push(username);

        if (!scores.get(username)) {
            scores.set(username, 0);
        }

        ioNsp.emit("stoc user list", { users: users, vainqueurs: users_vainqueurs });

        // Envoi de toute le pile d'éxécution pour que le nouveau client récupère l'état du dessin.
        socket.emit("stoc draw stack", { pile: draw_stack, lg: effSize });
        socket.emit("stoc chat stack", chat_stack);

        if (game) {
            // Le joueur devient un nouveau devinateur.
            socket.emit("stoc game start");
            socket.emit("game infos", {
                dessinateurs: usrs_dessinateurs, mot: game_mot_cache,
                vainqueurs: users_vainqueurs, scores: Array.from(scores, ([name, value]) => ({ name, value })),
                temps_restant: Math.floor((Date.now() - instantDebut) / 1000)
            });
            socket.join(roomDevinateurs);

        }

        socket.on("disconnect", function () {
            removeFromTab(users, username);
            socket.broadcast.emit("stoc user list", { users: users, vainqueurs: users_vainqueurs });
            if (game) {
                if (users.length < 2) {
                    reset();
                } else {
                    if (usrs_dessinateurs.includes(username)) {
                        // Un dessinateur s'est déconnecté !
                        nouveau_tour();
                    }
                }
            }
            if (users.length === 0) {
                // Le namespace est supprimé si tout le monde part...
                io._nsps.delete(roomPath);
                removeFromTab(rooms, roomPath);
            }
        });

        socket.on("ctos commencer", function () {
            nb_ready++;
            if (nb_ready >= usrs_dessinateurs.length) {
                round_start();
            } else {
                ioNsp.to(roomDessinateurs).emit("stoc nb ready", nb_ready);
            }
        });


        socket.on("ctos game start", function (infos) {
            scores.forEach(scoreZero);
            var arrayScores = Array.from(scores, ([name, value]) => ({ name, value }));
            ioNsp.emit("new score", arrayScores);
            nb_dessinateurs = infos.dessinateurs;
            nb_tours_de_jeu = infos.rounds;
            socket.broadcast.emit("stoc game start");
            game = true;
            nouveau_tour();
        });

        // Transmission du dessin en temps réel :
        // Nouveau cercle
        socket.on("ctos draw cercle", function (props) {
            // nouvelle forme envoyée à tous les autres clients
            socket.broadcast.emit("stoc draw cercle", props);
            clearPrev();
            draw_stack.push({ type: 'newCircle', props: props });
            effSize = draw_stack.length;
        });

        // Nouvelle ligne
        socket.on("ctos draw line", function (props) {
            socket.broadcast.emit("stoc draw line", props);
            clearPrev();
            draw_stack.push({ type: 'newLine', props: props });
            effSize = draw_stack.length;
            lastLine = props;
        });

        // Fin du ligne, mise en cache.
        socket.on("ctos cache line", function () {
            socket.broadcast.emit("stoc cache line");
            // pas besoin d'ajouter cette information à la pile,
            // chaque nouvelle ligne est mise en cache lors d'une nouvelle connexion
        });

        // Nouveau point d'une ligne.
        socket.on("ctos draw point", function (props) {
            socket.broadcast.emit("stoc draw point", props);
            if (lastLine) {
                lastLine.points.push(props.coords);
            }
        });

        socket.on("ctos draw fill", function (props) {
            socket.broadcast.emit("stoc draw fill", props);
            clearPrev();
            draw_stack.push({ type: 'newFill', props: props });
            effSize = draw_stack.length;
        });

        // Suppression (poubelle).
        socket.on("ctos delete", function () {
            socket.broadcast.emit("stoc delete");
            suppression();
        });

        // undo
        socket.on("ctos undo", function () {
            socket.broadcast.emit("stoc undo");
            if (effSize > 0)
                effSize--;
        });

        // redo
        socket.on("ctos redo", function () {
            socket.broadcast.emit("stoc redo");
            if (effSize < draw_stack.length)
                effSize++;
        });

        // Message dans le chat !
        socket.on('chat message', (data) => {
            if (usrs_dessinateurs.includes(username) || users_vainqueurs.includes(username)) {
                // Un dessinateur ou un vainqueur envoie un message
                socket.broadcast.except(roomDevinateurs).emit('chat message', { user: username, text: data, bool: false });
            } else {
                if (data === game_mot) {
                    socket.leave(roomDevinateurs);
                    users_vainqueurs.push(username);
                    ioNsp.emit('correct guess', username);
                    socket.emit("word guessed", game_mot);
                    chat_stack.push({ user: username, text: username + " a deviné le mot !", bool: true });
                    points_marques.set(username, users.length - usrs_dessinateurs.length - users_vainqueurs.length + 1);

                    if (users_vainqueurs.length === users.length - usrs_dessinateurs.length) {
                        // Tout le monde a deviné
                        marquer_points();
                        nouveau_tour();
                    }
                }
                else {
                    socket.broadcast.emit('chat message', { user: username, text: data, bool: false });
                    chat_stack.push({ user: username, text: data, bool: false });
                }
            }
        });
    });
}
