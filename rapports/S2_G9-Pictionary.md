# Rapport Groupe 9 semaine du 06/04/23


## Descriptif du projet

Nous avons décidé de faire un jeu du style Pictionary.
>Rappel bref des règles (version [Skribbl.io](https://skribbl.io/)): Le Pictionary est un jeu dans lequel le joueur J1 doit choisir un mot parmi une liste de mots, et le faire deviner aux autres participants en un temps imparti, à l'aide uniquement d'un dessin. Dans cette version web, le premier qui trouve le mot gagne le maximum de points, mais les autres continuent à essayer de deviner pour gagner jusqu'à la fin du temps imparti et les propositions se feront à l'aide d'un chat.


## Rôles:
- William : Codeur (Maquettes)
- Hugo : Responsable
- Asmaa : Codeuse (Mise en forme)
- Christian : Chercheur (Solutions d'hébergement)

.....

## Ce qu'on a appris*

### Par le biais du codeur partie technique

- Lancer un serveurs Node.js en local pour faire des tests.

- Gérer la communication côté serveur et côté client pour le chat.

- Dessiner avec la souris en utilisant Konva, choix de la couleur et de l'épaisseur du trait.

### Résultats des recherches

- Node.js

	Nous utilisons Node.js car notre projet repose sur la communication en jeu (deviner ce que dessine l'autre) ainsi que sur le dessin lui-même.k
	Node.js est efficace et léger et peut gérer ce type d'application.
	De plus, Node.js nous permet d'écrire du code Javascript à la fois côté client et côté serveur de l'application web.
	Enfin, Node.js offre une approche évolutive pour la construction d'applications web.

	Socket.io est un framework spécialement conçu pour la création de jeux web et pourrait nous être utile. (https://socket.io/)

- Options d'hébergement :

	- Hébergement cloud : AWS, MS Azure, Google Cloud Platform (évolutif et fiable)
	- Serveurs privés virtuels (VPS) : DigitalOcean, Linode (offre plus de contrôle sur la configuration et les ressources du serveur, s'exécute sur une machine virtuelle dédiée)
	- Platform as a Service (PaaS) : Heroku, Google App Engine (nous permet de nous concentrer sur le développement plutôt que sur l'infrastructure)

- Autres options :

	- Render : Gratuit mais prend jusqu'à 30 secondes pour répondre après avoir été mis en veille. L'application se met en veille si elle est inactive pendant 15 minutes. Un ping récurrent vers l'application serait nécessaire pour la maintenir active.
	- Vercel : Gratuit, utilise des fonctions serverless, ne permet que des dépôts personnels GitHub, enveloppe sur AWS Lambda.
	- Cyclic : Gratuit, sans serveur, excellente enveloppe pour plusieurs services AWS

Liens :

	Documentation de Node.js : (https://nodejs.dev/en/learn/)
	socket.io : (https://socket.io/)
	Hébergement : (https://geshan.com.np/blog/2021/01/free-nodejs-hosting/)

## Les avancées du code :

- Une page web statique organisée, avec chaque espace bien délimité.

- Des maquettes pour le chat et pour la partie dessin.
