 # Rapport Groupe 9 semaine du 17/04/23


## Descriptif du projet

Nous avons décidé de faire un jeu du style Pictionary.
>Rappel bref des règles (version [Skribbl.io](skribbl.io)): Le Pictionary est un jeu dans lequel le joueur J1 doit choisir un mot parmi une liste de mots, et le faire deviner aux autres participants en un temps imparti, à l'aide uniquement d'un dessin. Dans cette version web, le premier qui trouve le mot gagne le maximum de points, mais les autres continuent à essayer de deviner pour gagner jusqu'à la fin du temps imparti et les propositions se feront à l'aide d'un chat.


## Rôles:
- William : Codeur (la base de données pour le jeu, envoi des requets via JS)
- Hugo : Codeur (implementation de l'authentification pour acceder le jeu, les roles des joueurs, liste des joueuers connectés et affichage du mot en haut)
- Asmaa : Chercheur (Comment heberger le site avec Heroku)
- Christian : Responsable (distribution des taches + rapport)


## Organisation
- Discussions sur discord.

- Pour les codeurs :
	- Implementation de la base de données pour le site web. (MySQL)
    - Verifier avec des requettes envoyés avec JavaScript.
    - Implementation de l'authentification pour les joueurs dans une partie, les roles (joueur qui dessine, joueuers qui devinent).
    - L'affichage du mot secret en haut comme "hint" pour le joueurs, ou confirmation quand le joueur devinne le mot correctement.
    

- Pour le chercheur :
    - On utilisera Heroku pour l'hebergement. Le chercheur a verifiée comment implementé la solution de Heroku

## Ce qu'on a appris

## Résultats des recherches

Choix du Système d'hébergement : Heroku
Il y a plusieurs raisons pour lesquelles choisir Heroku afin d’héberger votre jeu :
Heroku est très facile à utiliser pour déployer des applications. Vous pouvez déployer votre jeu en
quelques minutes en utilisant la ligne de commande, il offre une option gratuite pour les petites
applications, ce qui peut être utile si vous démarrez votre jeu et que vous avez un budget limité ,
permet de facilement ajuster la capacité de vos applications en fonction de la demande, ce qui est
important pour les jeux en ligne qui peuvent avoir des pics de trafic.
Dans l'ensemble, Heroku est un excellent choix pour héberger des jeux en ligne, en particulier pour
les développeurs qui cherchent une solution facile à utiliser et qui peut facilement évoluer avec leur
jeu.
Heroku qui peut héberger à la fois notre (API + front) et notre base de données (clearDB)
ETAPES POUR DEPLOYER UN API (Node Js ):
- créer un compte sur Heroku
- créer un APP sur heroku
- connecter heroku au Git (ou déploiement manuel via une commande sur mon laptop)
- je dis à Heroku qu'à chaque fois qu'y a un push sur la branche MASTER, il déploie mon api Node Js
- Je configure un fichier bash (.sh) qui va être lancé par Heroku au moment du déploiement (pour
faire mes npm install)
- ETAPES Pour déployer une base de données :
- je crée ma BDD sur Heroku (https://elements.heroku.com/addons/cleardb)
- je chope les identifiants de la base de données sur l'interface d'heroku
- à travers le doc : https://devcenter.heroku.com/articles/cleardb (des commandes à lancer ici pour le
provisioning)
- je modifie le code de mon api Node Js pour y mettre le DATABASE_URL du MySQL qui était
fraichement créé
- je relance mon API Node Js sur Heroku (déploiement automatique si j'ai connecté Heroku à Git ->
sans oublier le fichier .sh)
AVANT TOUT : installer Heroku CLI https://devcenter.heroku.com/articles/heroku-cli
 https://devcenter.heroku.com/articles/getting-started-with-nodejs
Sur Heroku, on a un fichier Procfile -> sur lequel on spécifie le script à lancer au
moment du déploiement

## Les avancées du code :

- Un jeu presque finalisé. Il nous reste la verification des mots dans le chat pour savoir si un joueur a deviné le mot correctement ou pas.

## Les difficultés rencontrés :

- Implémenter le remplissage  (c'est compliqué, travaille directement sur les pixels de la zone de dessin et génère une image bitmap, traduite en image Konva)
- Transmettre une image au serveur (gros volume de données)
- Gérer le caractère asynchrone de la création d'une image Konva lorsqu'un nouvel utilisateur se connecte (en gros les remplissages apparaissaient toujours au-dessus de tout le reste pour le nouvel utilisateur)