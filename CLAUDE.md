# Docs du jeu

Ce fichier sert à noter mes idées pour le jeu et les règles que Claude doit suivre quand il programme. Il est lu automatiquement au début de chaque session.

## Idées pour le jeu

- Jeu au tour par tour sur un échiquier (TypeScript, Three.js, Vite).
- Portée d'attaque (`attackRange`) : elle n'a jamais été utilisée. Je veux qu'elle tienne compte de certains types d'objets bloquants (on ne peut pas passer par-dessus), sur le même principe que le déplacement des unités.
- Système de tour : à intégrer dans le jeu. Tour camp par camp : tous les personnages d'un camp jouent dans l'ordre voulu, puis le tour passe à l'autre camp. Pendant son tour, un personnage a un déplacement gratuit (un seul par tour) et des actions qui coûtent des points d'action (PA). Les PA sont une valeur unique à chaque personnage (les personnages vont devenir des personnages à statistiques et classe aléatoires) et reviennent au maximum à chaque tour.
- Ordre de tour des ennemis : il dépend du comportement de leur race (les gobelins jouent dans un ordre au hasard, comme une bande désorganisée). On ne peut pas traverser les cases de ses alliés : c'est voulu, pour la profondeur stratégique.
- Multijoueur : idée pour plus tard, le jeu pourrait devenir multijoueur à un moment donné. On commence par un jeu PvE.

### Idées futures

- Personnages de type gacha : les 8 statistiques aléatoires (force, résistance, constitution, volonté, savoir, intelligence, dextérité, perception) et la rareté sont faites. Reste le système pour obtenir de nouveaux personnages.
- Savoir et perception : elles n'ont pas d'effet pour le moment, elles seront utilisées plus tard.
- Équipement : armes, armures et bijoux, dans les emplacements déjà prévus sur la fiche du personnage.
- Modèles et animations : remplacer le modèle rough par des modèles plus complets, puis ajuster la vitesse de marche et le moment du coup (`walkSpeed`, `walkAnimationSpeed`, `hitDelay` dans `piece.ts`).
- Application : transformer le jeu en application, même s'il roule dans un navigateur pour le moment. Le bouton Quit Game du menu Setting fermera alors l'application (il est désactivé d'ici là).
- Système de classes : au niveau X, le héros se voit proposer un choix de trois classes, selon ses statistiques.

### Plan du lobby

Le lobby est une zone hors combat pour gérer l'équipement des personnages, choisir les personnages qu'on apporte, faire monter les personnages de niveau et choisir le niveau. Ordre prévu, en petits changements :

1. Victoire et défaite à la fin d'un combat.
2. Une fiche permanente `Character` (stats, rareté, niveau, expérience, équipement), séparée de `Piece` : les stats sont tirées une seule fois, et chaque personnage choisi devient une `Piece` au début du niveau.
3. Une sauvegarde dans le navigateur (`localStorage`), isolée dans un seul fichier pour passer à un serveur plus tard (multijoueur, gacha).
4. Un lobby simple (interface HTML) : choisir les personnages et le niveau, puis lancer. Les niveaux définissent des cases de départ au lieu de héros précis.
5. L'expérience et la montée de niveau, qui préparent le choix de classe au niveau X.
6. L'équipement, qui modifie les stats, géré dans le lobby.

L'explication de l'univers du jeu est dans `Univers.md`.

## Règles de programmation

- Suivre la règle de nommage déjà utilisée dans le code existant (ne pas renommer les fichiers existants). Dans le code actuel : classes et interfaces en UpperCamelCase (`GameLogic`, `PieceConfig`), variables, fonctions et fichiers en lowerCamelCase (`cameraControle.ts`, `setupCounter`).
- Ne pas ajouter trop de commentaires dans le code.
- Programmer le jeu en PvE, mais garder en tête qu'il peut devenir multijoueur plus tard.
- Travailler par petits changements, un à la fois. Les grosses modifications faites d'un seul coup sont rares.

## Questions ouvertes

(à remplir au fur et à mesure)
