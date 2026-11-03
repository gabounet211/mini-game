# Docs du jeu

Ce fichier sert à noter mes idées pour le jeu et les règles que Claude doit suivre quand il programme. Il est lu automatiquement au début de chaque session.

## Idées pour le jeu

- Jeu au tour par tour sur un échiquier (TypeScript, Three.js, Vite).
- Portée d'attaque (`attackRange`) : elle n'a jamais été utilisée. Je veux qu'elle tienne compte de certains types d'objets bloquants (on ne peut pas passer par-dessus), sur le même principe que le déplacement des unités.
- Système de tour : à intégrer dans le jeu.
- Multijoueur : idée pour plus tard, le jeu pourrait devenir multijoueur à un moment donné. On commence par un jeu PvE.

### Idées futures

- Remplacer les personnages fixes par un système de personnages de type gacha, avec des statistiques aléatoires : armure, résistance, volonté, savoir, intelligence, dextérité et perception.
- Système de classes : au niveau X, le héros se voit proposer un choix de trois classes, selon ses statistiques.

L'explication de l'univers du jeu est dans `Univers.md`.

## Règles de programmation

- Suivre la règle de nommage déjà utilisée dans le code existant (ne pas renommer les fichiers existants). Dans le code actuel : classes et interfaces en UpperCamelCase (`GameLogic`, `PieceConfig`), variables, fonctions et fichiers en lowerCamelCase (`cameraControle.ts`, `setupCounter`).
- Ne pas ajouter trop de commentaires dans le code.
- Programmer le jeu en PvE, mais garder en tête qu'il peut devenir multijoueur plus tard.
- Travailler par petits changements, un à la fois. Les grosses modifications faites d'un seul coup sont rares.

## Questions ouvertes

(à remplir au fur et à mesure)
