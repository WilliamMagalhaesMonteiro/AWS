 # Rapport Groupe 9 semaine du 13/04/23


## Descriptif du projet

Nous avons décidé de faire un jeu du style Pictionary.
>Rappel bref des règles (version [Skribbl.io](skribbl.io)): Le Pictionary est un jeu dans lequel le joueur J1 doit choisir un mot parmi une liste de mots, et le faire deviner aux autres participants en un temps imparti, à l'aide uniquement d'un dessin. Dans cette version web, le premier qui trouve le mot gagne le maximum de points, mais les autres continuent à essayer de deviner pour gagner jusqu'à la fin du temps imparti et les propositions se feront à l'aide d'un chat.


## Rôles:
- William : chercheur (recherche concernant la base de données)
- Hugo : Codeur (la communication pour le dessin)
- Asmaa : Responsable (Distribution des taches,Rapport)
- Christian : Codeur (amélioration du chat et intégration avec la page)




## Organisation
- Discussions jeudi dernier, et sur discord.

- Pour les codeurs :
	- améliorer la page statique, en ajoutant certains éléments (des icones plus esthétique pour la couleur du stylo , ajout de fonctionnalités utile ),
      et faire en sorte d'avoir un meilleur design.
	- améliorer le chat et l’intégrer avec la page.
    - gérer la communication pour le dessin.
    

- Pour le chercheur :
    - s'intéresser à la partie base de données pour pouvoir inscrire les joueurs ainsi que les mots a deviner et un début de recherche pour la plateforme d'hébergement.

## Ce qu'on a appris*

### Par le biais du codeur 

- Etablir la communication pour le dessin afin d'avoir un partage en temps réel [dans exemple_de_dessin. ()]

- l'ajout de l'outil remplissage en travaillant directement sur les pixel de la zone de dessin en générant une image bitmap traduite en image konva


## Résultats des recherches

### Pourquoi une base de données ?

- Enregistrer les utilisateurs
- Avoir une (ou plusieurs) liste(s) de mots.

### Outils de base de données

- MySQL : Solution la plus populaire, gratuite, efficace et simple d'utilisation. Il existe un package Node pour pouvoir utiliser une base de données MySQL sans passer par PHP.
- SQLite : Alternative légère, basée sur le C et ses bibliothèques standards. Les données sont stockées dans un simple fichier.

- MongoDB (No SQL).


## Discussion du choix

## MongoDB
Sert à de grands volumes de données tels que la vidéo etc, ce qui ne nous intéresse pas.


## MySQL vs SQLite:

MySQL est un service de base de données qui s'exécute sur le serveur.
SQLite est un SGBD embarqué, ne nécessitant pas de serveur pour fonctionner (c'est un fichier qui sera consulté par l'application). 

Bien que notre application ne soit pas de grande envergure au niveau des données, le fait que SQLite ne permette pas plusieurs connexions en simultanée me semble être un frein. Aussi, je pense que c'est mieux d'avoir la base de données sur notre serveur, comme elle va servir à la gestion des utilisateurs et au stockage des mots : comme ça c'est le serveur qui s'occupe de proposer les mots.

## Choix du Système d'hébergement

Heroku : Supporte Node.Js, gratuit, suffisant pour notre application web.

## Les avancées du code :

- Une page web statique organisée, avec de nouvelles options 

- le partage du dessin est en temps réel.

## Les difficultés rencontrés :

- Implémenter le remplissage  (c'est compliqué, travaille directement sur les pixels de la zone de dessin et génère une image bitmap, traduite en image Konva)
- Transmettre une image au serveur (gros volume de données)
- Gérer le caractère asynchrone de la création d'une image Konva lorsqu'un nouvel utilisateur se connecte (en gros les remplissages apparaissaient toujours au-dessus de tout le reste pour le nouvel utilisateur)