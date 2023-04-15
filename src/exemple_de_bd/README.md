# Pour installer :


`mv package_vide.json package.json`

`npm install express@4`

`npm install socket.io`

# Pour sql: 

Pour installer mysql: 

`sudo apt install mysql-server`

Dans le répertoire du node:

`npm install mysql`

Pour lancer démarrer le SGBD:

`sudo systemctl start mysql`

Ensuite on va créer un utilisateur:

`sudo mysql -u root -p` (mdp : vrai mot de passe sudo)
`CREATE USER 'le_patron'@'localhost' IDENTIFIED WITH mysql_native_password BY motdepassebidon;`
`GRANT ALL ON MOTS.* TO le_patron@localhost;`


## Pour lancer le script

`sudo mysql -u root -p < script.sql`


## Pour se connecter à la base de données via terminal


`sudo mysql -u le_patron -p` (mdp : motdepassebidon)
`sudo mysql -u root -p` (mdp : vrai mot de passe sudo)

