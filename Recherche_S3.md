# Pourquoi une base de données ?

- Enregistrer les utilisateurs
- Avoir une (ou plusieurs) liste(s) de mots.

# Outils de base de donnée

- MySQL : Solution la plus populaire, gratuite, efficace et simple d'utilisation. Il existe un package Node pour pouvoir utiliser une base de données MySQL sans passer par PHP.
- SQLite : Alternative légère, basée sur le C et ses bibliothèques standards. Les données sont stockées dans un simple fichier.

- MongoDB (No SQL).


# Discussion du choix

## MongoDB
Sert à de grands volumes de données tels que la vidéo etc, ce qui ne nous intéresse pas.


## MySQL vs SQLite:

MySQL est un service de base de données qui s'exécute sur le serveur.
SQLite est un SGBD embarqué, ne nécessitant pas de serveur pour fonctionner (c'est un fichier qui sera consulté par l'application). 

Bien que notre application ne soit pas de grande envergure au niveau des données, le fait que SQLite ne permette pas plusieurs connexions en simultanné me semble être un frein. Aussi, je pense que c'est mieux d'avoir la base de données sur notre serveur, comme elle va servir à la gestion des utilisateurs et au stockage des mots : comme ça c'est le serveur qui s'occupe de proposer les mots.

# Choix du Système d'hébergement

Heroku : Supporte Node.Js, gratuit, suffisant pour notre application web.