# A installer (npm install ...)

`express`

`express-session`

`socket.io`

`konva.js`

`mysql`

`pug`

`dotenv`

# Important

'dotenv' lit un fichier '.env' et s'en sert pour créer des variables d'environnement.

Il faut créer un fichier '.env' et mettre dedans "SESSION_SECRET=[une chaine de caractères aléatoire]"

# Installer et lancer mysql dans ubuntu

`sudo apt install mysql-server`

`sudo systemctl start mysql`

# Exécuter le script SQL dans mySQL pour tout initialiser

`sudo mysql -u root -p < script.sql`

# And enjoy (voir le script pour les login/mdp)

`node index.js`

# note

Le moteur pug est utilisé pour la page d'authentification.

Il permet de modifier l'affichage de la page en fonction de la réponse du serveur lorque l'utilisateur soumet login/password.
