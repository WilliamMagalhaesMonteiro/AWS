# A installer (npm install ...)

`express`

`express-session`

`socket.io`

`konva.js`

`mysql`

`pug`

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
