const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');

const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'admin',
	password : 'Supermotdepasse',
	database : 'loginBD'
});

let mots_list = [];
connection.query(
    "select mot,theme from mots order by id;",
    function (err, result) {
        if (err) throw err;
        if (Array.isArray(result)) {
            for (let row of result) {
                mots_list.push({mot: row.mot, theme: row.theme});
            }
        }
    }
)

const app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'login')));

app.get('/', function(request, response) {
	response.redirect('/auth');
});

app.get('/auth', function(request, response) {
	response.sendFile(path.join(__dirname, 'login/index.html'));
});

// Lorsque l'utilisateur clique sur 'Login'
// -> http://localhost:3000/auth
app.post('/auth', function(request, response) {
	let username = request.body.username;
	let password = request.body.password;
	if (username && password) {
		// Vraiment la base de la base avec les failles qui vont avec
		connection.query("select * from comptes where username = ? and password = ?;", [username, password], function(error, results) {
			if (error) throw error;
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				return response.redirect('/pictionary');
			} else {
				response.send('Incorrect Username and/or Password!');
			}
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

function pictionaryGetVerifAuth(request, response, next) {
    if (request.session.loggedin) {
		return next();
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
}

app.use(express.static(path.join(__dirname, 'pictionary')));

app.get('/pictionary', pictionaryGetVerifAuth, function(request, response) {
    response.sendFile(path.join(__dirname, 'pictionary', 'index.html'));
    // Le cookie est modifié pour ajouter le nom d'uilisteur, récupéré dans le script du pictionary côté client par la suite.
    response.cookie('name', request.session.username, { secure: true });
});

const port_socket = 3000;

/* Socket et jeu */
var draw_stack = [];
var effSize = 0;
let lastLine;

var chat_stack = [];

var users = [];
var game_mot = "";
var game_mot_cache = "";
var usr_dessinateur = "";

function clearPrev() {
    if (effSize < draw_stack.length) {
        let toDelete = draw_stack.length - effSize;
        draw_stack.splice(-toDelete, toDelete);
    }
}

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Indique si le jeu est en cours (=> si il y a au moins 2 joueurs connectés)
var game = false; 
// Indique le joueur qui dessine (tous les autres devinent)
var id_dessineur = 0;

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function nouveau_tour() {
    let mot = mots_list[getRandomInt(mots_list.length - 1)].mot;
    var mot_cache = "";
    // remplacer les lettres du mots par des '_' pour les devinateurs
    for (let c of mot) {
        mot_cache += (c.toLowerCase() != c.toUpperCase()) ? "_ " : "  ";
    }
    id_dessineur = (id_dessineur + 1) % users.length;
    usr_dessinateur = users[id_dessineur];
    game_mot_cache = mot_cache;
    game_mot = mot;
    io.emit("stoc dessinateur", {dessinateur: usr_dessinateur, mot_cache: mot_cache, mot_clair: mot});
}

// Nouvelle connexion.
io.on("connection", function(socket) {

    // Le nom d'utilisateur du nouveau client est enregistré ici (comme dans squid game).
    var username = socket.handshake.query.username;

    if (users.includes(username)) {
        // Un utilisateur ne peut se connecter qu'une seule fois.
        socket.disconnect();
        return;
    }
    users.push(username);

    io.emit("stoc user list", users);

    // Envoi de toute le pile d'éxécution pour que le nouveau client récupère l'état du dessin.
    socket.emit("stoc draw stack", {pile: draw_stack, lg: effSize});
    socket.emit("stoc chat stack", chat_stack);

    if (!game) {
        if (users.length >= 2) {
            game = true;
            nouveau_tour();
        }
    } else {
        socket.emit("stoc dessinateur", {dessinateur: usr_dessinateur, mot_cache: game_mot_cache, mot_clair: game_mot});
    }

    socket.on("disconnect", function() {
        const indexUser = users.indexOf(username);
        if (indexUser > -1) {
            users.splice(indexUser, 1);
        }
        socket.broadcast.emit("stoc user list", users);
        if (game) {
            if (users.length < 2) {
                game = false;
                io.emit("stoc dessinateur", '');
                // user vide pour indiquer que le jeu s'arrête
            } else {
                if (usr_dessinateur == username) {
                    // Le dessinateur s'est déconnecté !
                    nouveau_tour();
                }
            }
        }
    });


    // Transmission du dessin en temps réel :
    // Nouveau cercle
    socket.on("ctos draw cercle", function(props) {
        // nouvelle forme envoyée à tous les autres clients
        socket.broadcast.emit("stoc draw cercle", props);
        clearPrev();
        draw_stack.push({type: 'newCircle', props: props});
        effSize = draw_stack.length;
    });

    // Nouvelle ligne
    socket.on("ctos draw line", function(props) {
        socket.broadcast.emit("stoc draw line", props);
        clearPrev();
        draw_stack.push({type: 'newLine', props: props});
        effSize = draw_stack.length;
        lastLine = props;
    });

    // Fin du ligne, mise en cache.
    socket.on("ctos cache line", function() {
        socket.broadcast.emit("stoc cache line");
        // pas besoin d'ajouter cette information à la pile,
        // chaque nouvelle ligne est mise en cache lors d'une nouvelle connexion
    });

    // Nouveau point d'une ligne.
    socket.on("ctos draw point", function(props) {
        socket.broadcast.emit("stoc draw point", props);
        if (lastLine) {
            lastLine.points.push(props.coords);
        }
    });

    socket.on("ctos draw fill", function(props) {
        socket.broadcast.emit("stoc draw fill", props);
        clearPrev();
        draw_stack.push({type: 'newFill', props: props});
        effSize = draw_stack.length;
    });

    // Suppression (poubelle).
    socket.on("ctos delete", function() {
        socket.broadcast.emit("stoc delete");
        draw_stack.splice(0, draw_stack.length);
    });

    // undo
    socket.on("ctos undo", function() {
        socket.broadcast.emit("stoc undo");
        if (effSize > 0)
            effSize--;
    });

    // redo
    socket.on("ctos redo", function() {
        socket.broadcast.emit("stoc redo");
        if (effSize < draw_stack.length)
            effSize++;
    });

    // Message dans le chat !
    socket.on('chat message', (msg) => {
        socket.broadcast.emit('chat message', msg);
        chat_stack.push(msg);
    });
});

server.listen(port_socket, () => {
	console.log("listening on port " + port_socket);
});
