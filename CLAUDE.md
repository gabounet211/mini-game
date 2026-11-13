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
- Équipement : la base est faite (objets qui donnent des bonus de stats, butin de victoire, inventaire et équipement dans le lobby). Plus tard : restrictions par classe, objets plus rares, effets propres.
- Modèles et animations : remplacer le modèle rough par des modèles plus complets, puis ajuster la vitesse de marche et le moment du coup (`walkSpeed`, `walkAnimationSpeed`, `hitDelay` dans `piece.ts`).
- Application : transformer le jeu en application, même s'il roule dans un navigateur pour le moment. Le bouton Quit Game du menu Setting fermera alors l'application (il est désactivé d'ici là).

### Système de classes

- La classe de départ dépend de la rareté et explique, dans le lore, ce que le personnage faisait avant le jeu (et donc ses stats). Paliers :
  - palier 1 (commun) : métiers de villageois (fermier, bûcheron, chasseur…) ;
  - palier 2 (rare) : classes spécialisées (soldat, apprenti, soigneur…) ;
  - palier 3 (légendaire) : classes au gameplay plus unique (berserker, élémentaliste, cleric…) ;
  - palier 4 et plus : évolutions avancées.
- La classe oriente le tirage des stats (préférences par classe). Les classes communes ont une chance d'avoir un talent caché : une stat « hors norme » (ex. un bûcheron intelligent), qui ouvre des évolutions différentes.
- Chaque classe a ses actions, avec leur propre nom. Pour le moment elles fonctionnent comme les attaques actuelles ; on ajoutera des effets propres quand la liste d'actions sera plus grande.
- À chaque niveau, le joueur répartit lui-même ses points de stats.
- Au niveau X (puis à d'autres paliers), de nouvelles classes sont proposées selon la stat la plus haute et des minimums dans d'autres stats (ex. intelligence la plus haute → classes magiques ; avec une force au-dessus d'un seuil → mageblade).
- Un héros commun peut monter jusqu'au palier des classes légendaires de départ (palier 3, plafond à revoir). Un légendaire commence à ce palier et a donc accès plus tôt aux classes uniques.
- Lien avec les nations : certaines classes sont plus présentes dans certaines nations (plus de chevaliers dans la nation bleue, etc.), mais les classes communes et certaines rares existent dans plusieurs nations, pour ne pas priver un joueur d'un type de classe. À approfondir plus tard.

### Chapitres et changement de classe

- Les niveaux sont regroupés en chapitres de 5 niveaux à histoire continue, avec le même type de monstres (ex. chapitre gobelin : peu de gobelins au début, puis plus de gobelins et des gobelins plus forts, et le chef gobelin au niveau 5).
- Les niveaux se débloquent un à un et restent débloqués : on peut y emmener n'importe quel héros (ex. un héros niveau 1 dans le niveau 4). Les niveaux 1 à 4 se rejouent librement, ce qui permet aux héros arrivés plus tard de rattraper l'XP (en plus de la future zone de transfert d'XP).
- Niveau 5 (fin de chapitre) : chaque héros n'a qu'un seul essai contre le champion. Le changement de classe se gagne héros par héros : une deuxième équipe peut faire le niveau 5 à son tour, et un héros trop fort ne peut pas tuer le champion à répétition pendant que les autres attendent.
- Changement de classe : double condition, le héros doit avoir atteint le niveau X (X = 4 pour le moment, à revoir avec l'équilibrage de l'XP) et avoir participé au combat contre le champion de fin de chapitre. Seuls les héros qui ont participé y ont droit.
- Choix proposés : des classes accessibles avec peu de stats (pour ne bloquer personne qui a eu de mauvaises stats de départ) et des classes aux conditions plus dures (pour récompenser les joueurs qui investissent leurs points de façon créative).
- Légendaires : leur changement de classe passe par un objet spécifique (ex. un cleric avec un objet sacré devient un saint).
- Défaite au niveau 5 : les héros emmenés ne peuvent pas refaire le niveau et perdent leur chance de changer de classe pour ce chapitre. La fin du chapitre suivant leur donnera une nouvelle chance. Il faut donc gagner contre le champion.
- Objet légendaire : le champion laisse obligatoirement tomber l'objet de changement de classe si un héros légendaire participe au combat. Le légendaire doit aussi remplir les deux autres conditions (niveau X et victoire contre le champion).
- Liste des classes validée pour une première version testable (noms en anglais, seuils à faire tester). Chaque branche correspond à la stat la plus haute, avec une classe facile et une classe exigeante (minimum dans une autre stat) :
  - palier 2 (pour les communs) : Soldier / Mercenary, Guard / Shieldbearer, Brawler / Warden, Healer / Exorcist, Scholar / Alchemist, Apprentice / Mageblade, Scout / Duelist, Tracker / Sharpshooter ;
  - palier 3 (pour les rares) : Berserker / Warlord, Knight / Paladin, Juggernaut / Gladiator, Cleric / Inquisitor, Sage / Runesmith, Elementalist / Spellblade, Ranger / Assassin, Marksman / Beastmaster.
- Des classes et des conditions pourront être ajoutées ou retirées plus tard.

### Chapitres prévus et ennemis

- Chapitre 1 (gobelins), nouvelle répartition des gobelins :
  - jeunes gobelins : gobelins de rareté commune, qui remplacent les gobelins actuels (même nombre). Comme les gobelins actuels, ils attaquent le personnage le plus proche avec une attaque simple au corps à corps ;
  - gobelins adultes : archers et guerriers, de rareté rare (plus de stats) ;
  - chef gobelin : un mage, chef de la tribu que les joueurs affrontent pendant tout le chapitre. Il remplace le Goblin Champion au niveau 5. C'est le seul gobelin avec une petite stratégie : il attaque le personnage qui a le moins de HP dans sa portée, et il cherche à rester derrière ses gobelins. Quand aucun personnage n'est à sa portée, il se rapproche.
- Chapitre 2 : contre les bandits de Marco, un Warlord, ancien général de l'Empire (histoire dans la Bible de l'univers). Sur la carte actuelle pour le moment (une carte de plaines viendra plus tard).
  - Les bandits utilisent les classes des héros : Brawler, Mercenary et Scout de rareté rare pour les troupes, un Berserker fidèle (mini-boss du niveau 2-4), et Marco avec deux Apprentice au niveau 2-5.
  - Combat plus ordonné : les bandits les plus proches des héros jouent en premier. Le berserker fonce sur la cible la plus proche. Marco va au corps à corps, mais joue après ses troupes. Les apprentis restent derrière Marco et jouent en dernier.
- Pas de deuxième changement de classe pour le moment (le système est à repenser) : un héros ne change de classe qu'une fois. Battre le champion du chapitre 2 donne quand même leur chance aux héros qui ne l'ont pas encore eue.
- Bard (classe de départ rare) et Skald (évolution du Bard, toujours proposée à un Bard) : capacité unique, pour le moment +1 dégât sur les attaques des alliés tant qu'un Bard ou un Skald est en vie (ne se cumule pas, ne s'applique pas à lui-même).
- L'histoire de chaque classe (ce qu'elle faisait avant le jeu et sa nation) est dans la Bible de l'univers, onglet Classes (lien dans `Univers.md`).

### Plan du lobby

Le lobby est une zone hors combat pour gérer l'équipement des personnages, choisir les personnages qu'on apporte, faire monter les personnages de niveau et choisir le niveau. Ordre prévu, en petits changements :

1. Victoire et défaite à la fin d'un combat.
2. Une fiche permanente `Character` (stats, rareté, niveau, expérience, équipement), séparée de `Piece` : les stats sont tirées une seule fois, et chaque personnage choisi devient une `Piece` au début du niveau.
3. Une sauvegarde dans le navigateur (`localStorage`), isolée dans un seul fichier pour passer à un serveur plus tard (multijoueur, gacha).
4. Un lobby simple (interface HTML) : choisir les personnages et le niveau, puis lancer. Les niveaux définissent des cases de départ au lieu de héros précis.
5. L'expérience et la montée de niveau, qui préparent le choix de classe au niveau X.
6. L'équipement, qui modifie les stats, géré dans le lobby.

L'univers du jeu est dans la Bible de l'univers, la référence unique partagée avec les autres projets : https://claude.ai/artifact/5DQAoGp56bztgddjvBzBYv (lien aussi dans `Univers.md`).

## Règles de programmation

- Suivre la règle de nommage déjà utilisée dans le code existant (ne pas renommer les fichiers existants). Dans le code actuel : classes et interfaces en UpperCamelCase (`GameLogic`, `PieceConfig`), variables, fonctions et fichiers en lowerCamelCase (`cameraControle.ts`, `setupCounter`).
- Ne pas ajouter trop de commentaires dans le code.
- Programmer le jeu en PvE, mais garder en tête qu'il peut devenir multijoueur plus tard.
- Travailler par petits changements, un à la fois. Les grosses modifications faites d'un seul coup sont rares.

## Questions ouvertes

(à remplir au fur et à mesure)

