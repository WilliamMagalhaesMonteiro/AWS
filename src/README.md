# A installer (npm install ...)

`express`

`express-session`

`socket.io`

`konva`

`sqlite3`

`pug`

`dotenv`

# Important

'dotenv' lit un fichier '.env' et s'en sert pour créer des variables d'environnement.

Il faut créer un fichier '.env' et mettre dedans "SESSION_SECRET=[une chaine de caractères aléatoire]"

# And enjoy (voir le script pour les login/mdp)

`node index.js`

# note

Le moteur pug est utilisé pour la page d'authentification.

Il permet de modifier l'affichage de la page en fonction de la réponse du serveur lorque l'utilisateur soumet login/password.
