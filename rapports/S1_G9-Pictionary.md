# Rapport Groupe 9 semaine du 30/03/23


## Descriptif du projet

Nous avons décidé de faire un jeu du style Pictionary.
>Rappel bref des règles (version [Skribbl.io](skribbl.io)): Le Pictionary est un jeu dans lequel le joueur J1 doit choisir un mot parmi une liste de mots, et le faire deviner aux autres participants en un temps imparti, à l'aide uniquement d'un dessin. Dans cette version web, le premier qui trouve le mot gagne le maximum de points, mais les autres continuent à essayer de deviner pour gagner jusqu'à la fin du temps imparti et les propositions se feront à l'aide d'un chat.


## Rôles:
- William : Responsable (Rapport)
- Hugo : Chercheur (Rapport technos)
- Asmaa : Codeuse (Test Konva)
- Christian : Codeur

## Ce qu'on a appris (recherches technos)

### Pour le dessin

- Pour dessiner : `<canvas>\</canvas>`
	Fonctionne avec une matrice de pixels : image bitmap.
	Supporté par les navigateurs modernes, pas de soucis là dessus.
	API de base pour la manipulation du rendu 2D :
	- rectangles, paths (suite de lignes, arcs ou courbes de bézier connectées)
	avec gestion assez poussée des styles, couleurs, transformations, textures.
	- manipulation directe des pixels.
	- permet de réaliser ce qu'on veut, mais complexe à prendre en main et à manipuler.

	>Remarque : besoin d'une balise `</canvas>` pour terminer le canvas (contrairement à `<img>` par exemple).
	Utile car il est bon de mettre un message dans le canvas, pour les cas où il n'est pas supporté :
	`<canvas> Canvas non supporté </canvas>` par ex.
- Comme ce n'est pas très pratique : utilisation d'un FrameWork pour plus d'accessibilité et de possibilités sans passer du temps à réinventer la roue.
	- [FabricJs](http://fabricjs.com/), [KonvaJs](https://konvajs.org/) pour manipuler les canvas sont pertinents notamment, toujours actifs et assez simples à manipuler.
		Le choix s'oriente plus vers Konva

### Pour le chat/communication (à creuser)

-  [socket.io](socket.io) pour la communication en "temps réel"
	- Devrait nous permettre de pouvoir transmettre en temps réel le chat à tous les utilisateurs, et surtout le canevas !


## Les problèmes recontrés :


- Organisation :
	- Rôles déterminés le Dimanche soir
   	- Certains avaient des retards dans leur rendus respectifs (Ranking, Calcul sécurisé...)
	- Ce qui a amené à peu d'avancées sur le code lui-même

## Les avancées du code :.


- Test simple du Framework Konva pour afficher des formes basiques sur la page