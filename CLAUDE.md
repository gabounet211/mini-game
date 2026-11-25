# Docs du jeu

Ce fichier sert à noter mes idées pour le jeu et les règles que Claude doit suivre quand il programme. Il est lu automatiquement au début de chaque session.

## Idées pour le jeu

- Jeu au tour par tour sur un échiquier (TypeScript, Three.js, Vite).
- Site de test : la version de `main` est publiée automatiquement sur https://gabounet211.github.io/mini-game/ à chaque fusion (GitHub Pages). Chaque push lance aussi la vérification (types, construction, tests Vitest, puis `tools/smokeTest.mjs` qui ouvre le jeu construit dans un navigateur et lance chaque niveau).
- Portée : chaque action a sa propre portée (`range`), et non plus la classe. Elle tient compte des objets qui bloquent la vue (on ne peut pas tirer par-dessus).
- Système de tour : à intégrer dans le jeu. Tour camp par camp : tous les personnages d'un camp jouent dans l'ordre voulu, puis le tour passe à l'autre camp. Pendant son tour, un personnage a un déplacement gratuit égal à son Ms, qu'il peut fractionner au cours du tour (ex. Ms 5 : 2 cases, une action, puis 3 cases) et des actions qui coûtent des points d'action (PA). Les PA sont une valeur unique à chaque personnage (les personnages vont devenir des personnages à statistiques et classe aléatoires) et reviennent au maximum à chaque tour.
- Placement : avant le premier tour, le joueur place ses héros dans la zone de départ du niveau (`startCells`, un carré de 3x3 pour le moment). La zone peut être plus grande que l'équipe : `teamSize` fixe le nombre de héros.
- Ordre de tour des ennemis : il dépend du comportement de leur race (les gobelins jouent dans un ordre au hasard, comme une bande désorganisée). On ne peut pas traverser les cases de ses alliés : c'est voulu, pour la profondeur stratégique.
- Musique : chaque niveau peut avoir sa propre musique (`music`). Les salles de champion jouent le 4e mouvement (Allegro con fuoco) de la Symphonie n° 9 de Dvořák, enregistrement trouvé sur Wikimedia Commons (`public/championMusic.mp3`). Le lobby joue « Medieval: The Old Tower Inn » de RandomMind (OpenGameArt, licence CC0, `public/lobbyMusic.mp3`), qui s'arrête au lancement d'un niveau. La musique tourne en boucle et part dès le chargement du niveau, sans attendre un clic (dans l'application, la règle de lecture automatique de Chrome est désactivée).
- Multijoueur : idée pour plus tard, le jeu pourrait devenir multijoueur à un moment donné. On commence par un jeu PvE.

### Idées futures

- Personnages de type gacha : les 8 statistiques aléatoires (force, résistance, constitution, volonté, savoir, intelligence, dextérité, perception) et la rareté sont faites. Reste le système pour obtenir de nouveaux personnages.
- Savoir et perception : le savoir fixe la concentration maximale et la perception les chances de coup critique.
- Équipement : la base est faite (objets qui donnent des bonus de stats, butin de victoire, inventaire et équipement dans le lobby). Plus tard : restrictions par classe, objets plus rares, effets propres.
- Modèles et animations : remplacer le modèle rough par des modèles plus complets, puis ajuster la vitesse de marche et le moment du coup (`walkSpeed`, `walkAnimationSpeed`, `hitDelay` dans `piece.ts`).
- Base (`src/base.ts`, onglet Base du lobby) : ordre décidé récolte → forge → recherche.
  - Récolte (faite) : un héros affecté à la récolte ne peut pas être dans l'équipe ; à chaque combat joué (victoire ou défaite), il rapporte 2 de la ressource choisie (bois, nourriture, cuir, minerai) ; Lumberjack, Farmer et Hunter rapportent +2 sur leur propre ressource ; un héros blessé récolte la moitié (arrondie au-dessus).
  - Forge (`src/forge.ts`, faite) : tout est immédiat et ne touche que les objets non équipés ; fabrication des 9 objets du butin avec une recette chacun (`recipes`) ; amélioration jusqu'à +3, chaque palier ajoute +1 à chaque bonus de l'objet et coûte 3, puis 6, puis 12 de sa ressource principale ; démontage = la moitié de la recette (arrondie en dessous) et la moitié des améliorations payées ; un objet amélioré est stocké comme `rustySword+2` et lu par `getItem`.
  - Recherche (`src/research.ts`, faite) : un héros à la base fait soit de la récolte, soit de la recherche ; un chercheur ajoute 1 point par combat joué au projet en cours (2 pour Scholar, Alchemist et Sage, la moitié s'il est blessé) ; un seul projet à la fois, payé en ressources au lancement. Projets : Larger Squad (+1 héros dans l'équipe), Summoning Rites (invocations à 40 / 30 / 20 / 10 %), Advanced Smithing (la forge peut fabriquer 5 objets avancés : Steel Sword, Longbow, Runed Staff, Plate Armor, Silver Amulet ; ils ne tombent pas en butin). Idées pour plus tard : renforts, guérison plus rapide.
- Interface et graphisme : une passe d'amélioration UI/UX et graphique (bandeau d'objectif, lobby, fiches, boutons…) est prévue quand le travail en cours sera fini (chapitres de 10 niveaux, base). D'ici là, l'interface reste simple.
- Application : le jeu vise surtout le PC. Il est emballé avec Electron (dossier `electron/`, lancement local avec `npm run desktop`) et GitHub Actions construit un `.exe` Windows portable à chaque push (artefact du workflow Desktop). Le site GitHub Pages reste la version de test rapide. Dans l'application, le bouton Quit Game du menu Setting ferme le jeu (il reste désactivé dans le navigateur). La sauvegarde de l'application est séparée de celle du site ; ce qui dépend de la plateforme passe par `src/desktop.ts`.

### Système de classes

- La classe de départ dépend de la rareté et explique, dans le lore, ce que le personnage faisait avant le jeu (et donc ses stats). Paliers :
  - palier 1 (commun, 24 points de stats) : métiers de villageois (Farmer, Lumberjack, Hunter) ;
  - palier 2 (peu commun, 28 points) : classes qu'on retrouve un peu partout dans l'univers (Soldier, Apprentice, Bard, Scout, Tracker) ;
  - palier 3 (rare, 32 points) : classes spécialisées, souvent liées à une nation (Healer, Guard, Brawler, Scholar et leurs variantes exigeantes) ;
  - palier 4 (légendaire, 40 points) : classes au gameplay plus unique (Berserker, Elementalist, Cleric…) ;
  - palier 5 : évolutions des légendaires (Ravager, Archmage, Saint).
- Chances d'invocation : 50 % commun, 28 % peu commun, 15 % rare, 7 % légendaire.
- Le palier peu commun sépare aussi des classes qui n'auront pas le même niveau de puissance quand elles auront leurs capacités propres.
- La classe oriente le tirage des stats (préférences par classe). Les classes communes ont une chance d'avoir un talent caché : une stat « hors norme » (ex. un bûcheron intelligent), qui ouvre des évolutions différentes.
- Chaque classe a ses actions, avec leur propre nom. Règles décidées (détail classe par classe dans le doc « Actions des classes », https://claude.ai/artifact/5ct4Y4Gi5NwxqUydJ1CAYd) :
  - 2 actions au palier 1, 3 au palier 2, 4 à 5 aux paliers supérieurs ;
  - en changeant de classe, le héros garde ses compétences (voir Compétences plus bas) ;
  - les actions de base n'ont pas de temps de recharge, les actions plus puissantes en ont un ;
  - les classes magiques (DPS magiques, healers, soutiens magiques) utilisent une ressource appelée concentration ;
  - rôles : Tank, Healer, Soutien magique, DPS magique, DPS physique ; le Paladin (tank) utilise aussi la concentration pour soigner ; le Warlord est le premier essai de soutien physique (ordres et cris de guerre, sans concentration) ;
  - concentration : maximum = 3 + savoir, +2 par tour (sans dépasser le maximum) ; un héros commence le combat au maximum ;
  - recharge : « recharge N tours » = l'action est bloquée pendant les N tours suivants du héros ;
  - décidé pour les prochaines briques : en feu = 2 dégâts magiques par tour, empoisonné = 1 dégât par tour qui ignore la résistance ; protect = le lanceur encaisse les dégâts à la place de la cible ; la perception augmente les chances de coup critique ; inspireChord et warChant augmentent la volonté de (volonté du lanceur ÷ 4, au moins 1) ;
  - effets (`src/effect.ts`) : étourdi (perd son tour), immobilisé, Ms réduit, en feu, empoisonné, volonté -/+, résistance +, dégâts +, insensible aux effets ennemis ; un même effet ne se cumule pas (relancer remplace) ; « N tours » = les N prochains tours de la cible, et un bonus lancé sur un allié pendant son propre tour dure aussi pendant le tour ennemi qui suit ; feu et poison font des dégâts au début du tour de la cible ;
  - déplacements forcés (`src/movement.ts`) : foncer sur la cible (en ligne droite si l'action l'exige, sinon sur la case libre voisine la plus proche), pousser, attirer, sauter par-dessus une unité (alliée ou ennemie) si la case derrière est libre, reculer ; un mur ou une unité arrête le mouvement ; une cible insensible ne peut pas être poussée ni attirée ;
  - zones d'effet (`src/area.ts`) : carré (s'étend à l'opposé du lanceur), rayon autour de la cible, balayage (la cible et une case de chaque côté) ; on peut viser une case vide et la zone touchée s'affiche en orange ; une zone touche seulement les ennemis, sauf si l'action touche tout le monde (bulletShower) ; zones au sol (`src/groundZone.ts`, wardenSlow) : elles restent au même endroit et appliquent leur effet aux ennemis qui s'y trouvent au début de leur tour ;
  - réactions : taunt (les ennemis à 3 cases ou moins du lanceur doivent l'attaquer pendant 2 tours ; ils s'en approchent et n'attaquent personne d'autre), protect (le lanceur encaisse à la place de l'allié pendant 1 tour), riposte (le lanceur rend un coup physique à chaque ennemi qui l'attaque au corps à corps pendant 1 tour) ; les dégâts de feu, de poison et des réactions ne déclenchent pas d'autres réactions ;
  - coups critiques : chance = perception × 3 % (+ bonus de l'action, ex. headShot +30 % et +2 dégâts), dégâts doublés ; ils s'appliquent aux attaques, pas aux soins ni aux effets qui durent.
- À chaque niveau, le joueur répartit lui-même ses points de stats.
- Compétences (`src/skill.ts`, onglet Training du lobby) : les actions deviennent des compétences que chaque héros apprend, équipe et améliore.
  - un héros commence avec l'attaque de base de sa classe et sa première compétence ; il gagne 1 point de compétence par niveau ;
  - apprendre une compétence de sa classe coûte 1 point ; 3 rangs, gagnés par la maîtrise (inspirée de *Pick Me Up*) : chaque utilisation en combat donne 1 point de maîtrise, le rang 2 demande 10 utilisations et le rang 3 25 de plus (`masteryToRank`) ; les points de compétence ne servent plus qu'à apprendre ; bonus génériques : rang 2 +1 dégât, rang 3 +2 dégâts et recharge -1 ; les rangs achetés avant la maîtrise sont gardés et leurs points rendus ; pour le moment, une compétence lancée dans le vide (une zone sans ennemi, comme fireball ou frostNova) compte aussi comme une utilisation, c'est accepté ; une compétence peut avoir ses propres versions de rang 2 et 3 (`withRanks`), qui remplacent alors ces bonus génériques ; le détail des compétences est dans l'onglet « Compétences » du doc « Actions des classes » (paliers 1 à 5 faits ; au palier 5, la classe reprend les compétences du légendaire d'avant en plus fort et ajoute une compétence signature) ;
  - places équipées selon le palier (attaque de base comprise) : 2 au palier 1, 3 au palier 2, 4 au palier 3, 5 aux paliers 4 et 5 ;
  - au changement de classe, le héros garde ses compétences ; celles que la nouvelle classe possède aussi passent à sa version (ex. legShot du Tracker devient celui du Sharpshooter, au même rang) ; l'attaque de base de la nouvelle classe est apprise et remplace l'ancienne si elle était équipée ;
  - idée : les attaques de base viendront plus tard des armes (rapierStrike, etc.) ;
  - les ennemis utilisent toutes les compétences de leur classe.
- Au niveau X (puis à d'autres paliers), toutes les classes du palier suivant dont le héros atteint les statistiques minimums sont proposées (ex. Soldier : force 5 et résistance 4). Les classes faciles demandent 2 stats, les classes complexes des valeurs plus élevées ou 3 à 4 stats. Ça propose plus de classes et permet plus de diversité.
- Plafond : un commun peut monter au plus jusqu'au palier rare (palier 3), un peu commun ou un rare jusqu'au palier légendaire (palier 4). Avec un seul changement de classe pour le moment, un commun s'arrête au palier 2. Un légendaire commence au palier 4 et a donc accès plus tôt aux classes uniques.
- Les seuils sont pensés pour qu'un héros atteigne au moins une classe en plaçant ses 6 points de stats des niveaux 2 à 4 (vérifié par simulation). S'il n'atteint aucune classe, le lobby montre les 3 classes les plus proches et les stats qui manquent ; il peut continuer à monter de niveau pour les atteindre. D'autres classes répandues seront ajoutées.
- À ajouter : une classe plus commune avant le Healer.
- Lien avec les nations : certaines classes sont plus présentes dans certaines nations (plus de chevaliers dans la nation bleue, etc.), mais les classes communes et certaines rares existent dans plusieurs nations, pour ne pas priver un joueur d'un type de classe. À approfondir plus tard.

### Chapitres et changement de classe

- Les niveaux sont regroupés en chapitres à histoire continue, avec le même type de monstres (ex. chapitre gobelin : peu de gobelins au début, puis plus de gobelins et des gobelins plus forts, et le chef gobelin à la fin).
- Objectifs de niveau (`src/endCondition.ts`, champs `victory` et `defeat` d'un niveau) : battre tous les ennemis (par défaut), survivre N tours (`surviveRounds`), gagner en N tours au plus (`roundLimit`), garder un personnage en vie (`keepAlive`), atteindre des cases marquées en jaune, seul ou avec un personnage à escorter (`reachCells`), battre une cible précise (`pieceDefeated`) ; `anyOf` combine des conditions. L'objectif et le tour en cours s'affichent en haut de l'écran.
- Un chapitre a 10 niveaux : des niveaux à objectif spécial ici et là, un mini-boss avec un objectif plus dur au niveau 5 (avec la musique de champion) et le champion au niveau 10. Chapitre 1 : 1 First Steps, 2 Patrol, 3 Ambush (survivre 5 tours, gobelins autour de la zone de départ), 4 Scouts, 5 The Brute (gros gobelin guerrier + garder en vie un villageois placé entre les gobelins et les héros), 6 Into the Woods (atteindre les cases marquées), 7 Village Defense (survivre 6 tours et garder 2 villageois en vie), 8 Camp Outskirts, 9 Raise the Alarm (gagner en 7 tours), 10 Goblin Chief (battre le chef). Chapitre 2 : 1 Roadblock, 2 Highway Robbery (garder un marchand en vie), 3 Toll Road, 4 Plains Ambush (survivre 5 tours), 5 The Loyal Berserker (mini-boss : le battre en 6 tours), 6 Bandit Camp, 7 The Cages (atteindre les cases marquées), 8 Burning Village (survivre 6 tours et garder 2 villageois en vie), 9 Marco's Lieutenants (gagner en 7 tours), 10 Marco (le battre). Les niveaux à objectif de survie placent les ennemis près des héros, en attendant des cartes faites pour eux.
- Villageois et marchand : des personnages du camp des héros que le joueur ne contrôle pas (`npc` dans `PieceConfig`) ; ils ne bougent pas, les ennemis peuvent les attaquer et ils ne comptent pas dans la règle « tous les héros sont tombés ».
- Les niveaux se débloquent un à un et restent débloqués : on peut y emmener n'importe quel héros (ex. un héros niveau 1 dans le niveau 4). Les niveaux 1 à 9 se rejouent librement, ce qui permet aux héros arrivés plus tard de rattraper l'XP (en plus de l'onglet Combination du lobby, où un héros sacrifié donne toute son XP, plus un petit bonus, à un autre héros).
- XP réduite pour les héros trop forts (`experienceShare`, `src/rewards.ts`) : chaque niveau a un niveau recommandé (`recommendedLevel`, affiché dans le lobby ; chapitre 1 : 1, 1, 2, 2, 3, 3, 4, 4, 5, 6 ; chapitre 2 : 6, 6, 6, 7, 7, 7, 7, 8, 8, 8) ; jusqu'à 1 niveau d'écart, XP complète ; chaque niveau de plus retire 25 %, minimum 10 % ; calculé héros par héros, et l'écran de fin le signale. Écraser un vieux niveau avec une équipe de fin de chapitre rapporte donc peu.
- Niveau 10 (fin de chapitre) : chaque héros n'a qu'un seul essai contre le champion. Le changement de classe se gagne héros par héros : une deuxième équipe peut faire le niveau 10 à son tour, et un héros trop fort ne peut pas tuer le champion à répétition pendant que les autres attendent.
- Changement de classe : double condition, le héros doit avoir atteint le niveau X (X = 6, soit 150 XP : à peu près le même rythme qu'avec les chapitres de 5 niveaux, en finissant le chapitre une fois et en rejouant quelques niveaux) et avoir participé au combat contre le champion de fin de chapitre (niveau 10 ; le passage de 5 à 10 ralentit les changements de classe, jugés trop rapides). Seuls les héros qui ont participé y ont droit.
- Choix proposés : des classes accessibles avec peu de stats (pour ne bloquer personne qui a eu de mauvaises stats de départ) et des classes aux conditions plus dures (pour récompenser les joueurs qui investissent leurs points de façon créative).
- Légendaires : leur changement de classe passe par un objet spécifique (ex. un cleric avec un objet sacré devient un saint).
- Défaite au niveau 10 : les héros emmenés ne peuvent pas refaire le niveau et perdent leur chance de changer de classe pour ce chapitre. La fin du chapitre suivant leur donnera une nouvelle chance. Il faut donc gagner contre le champion.
- Mort des héros (`applyCasualties`, `src/rewards.ts`) : pendant la phase d'introduction (les niveaux 1-1 à 1-5 compris, marqués `introduction` dans leur définition), un héros tombé au combat est seulement blessé et manque le combat suivant ; si toute l'équipe est blessée, elle se repose et guérit. À partir du niveau 1-6, un héros tombé meurt pour de bon : son équipement retourne à l'inventaire et son nom va dans le mémorial du lobby (onglet Heroes). Le lobby prévient quand un niveau est mortel. Inspiré du webtoon *Pick Me Up* (doc « Pick Me Up : inspiration pour mini-game », https://claude.ai/artifact/YW5HDT8UNBk6e8c8v7YoKs).
- Objet légendaire : le champion laisse obligatoirement tomber l'objet de changement de classe si un héros légendaire participe au combat. Le légendaire doit aussi remplir les deux autres conditions (niveau X et victoire contre le champion).
- Liste des classes validée pour une première version testable (noms en anglais, seuils à faire tester dans `minimums`, `src/characterClass.ts`). Seuils actuels : palier 2 environ 5 et 4 ; palier 3 6 et 5 (faciles) ou 7, 5 et 4 (exigeantes) ; palier 4 8 et 6 (faciles) ou 9, 7 et 5, parfois 4 stats (exigeantes) :
  - palier 2 (pour les communs) : Soldier, Apprentice, Bard, Scout, Tracker ;
  - palier 3 (pour les peu communs) : Mercenary, Guard / Shieldbearer, Brawler / Warden, Healer / Exorcist, Scholar / Alchemist, Mageblade, Duelist, Sharpshooter, et le Skald pour le Bard ;
  - palier 4 (pour les rares) : Berserker / Warlord, Knight / Paladin, Juggernaut / Gladiator, Cleric / Inquisitor, Sage / Runesmith, Elementalist / Spellblade, Ranger / Assassin, Marksman / Beastmaster.
- Des classes et des conditions pourront être ajoutées ou retirées plus tard.

### Chapitres prévus et ennemis

- Chapitre 1 (gobelins), nouvelle répartition des gobelins :
  - jeunes gobelins : gobelins de rareté commune, qui remplacent les gobelins actuels (même nombre). Comme les gobelins actuels, ils attaquent le personnage le plus proche avec une attaque simple au corps à corps ;
  - gobelins adultes : archers et guerriers, de rareté rare (plus de stats) ;
  - chef gobelin : un mage, chef de la tribu que les joueurs affrontent pendant tout le chapitre. Il remplace le Goblin Champion et sera le champion du niveau 10. C'est le seul gobelin avec une petite stratégie : il attaque le personnage qui a le moins de HP dans sa portée, et il cherche à rester derrière ses gobelins. Quand aucun personnage n'est à sa portée, il se rapproche.
- Chapitre 2 : contre les bandits de Marco, un Warlord, ancien général de l'Empire (histoire dans la Bible de l'univers). Sur la carte actuelle pour le moment (une carte de plaines viendra plus tard).
  - Les bandits utilisent les classes des héros : Brawler, Mercenary et Scout de rareté rare pour les troupes, un Berserker fidèle (mini-boss du niveau 2-5), et Marco avec deux Apprentice au champion (niveau 2-10).
  - Combat plus ordonné : les bandits les plus proches des héros jouent en premier. Le berserker fonce sur la cible la plus proche. Marco va au corps à corps, mais joue après ses troupes. Les apprentis restent derrière Marco et jouent en dernier.
- Pas de deuxième changement de classe pour le moment (le système est à repenser) : un héros ne change de classe qu'une fois. Battre le champion du chapitre 2 donne quand même leur chance aux héros qui ne l'ont pas encore eue.
- Bard (classe de départ peu commune, palier 2) et Skald (évolution du Bard au palier 3, toujours proposée à un Bard). Seul le Skald a la capacité unique : pour le moment +1 dégât sur les attaques des alliés tant qu'un Skald est en vie (ne se cumule pas, ne s'applique pas à lui-même). L'action dissonantChord du Bard ne fait pas de dégâts : elle réduit la volonté de la cible de (volonté du Bard ÷ 3, au moins 1) pendant 2 tours de la cible, sans cumul (relancer remet seulement la durée à 2).
- L'histoire de chaque classe (ce qu'elle faisait avant le jeu et sa nation) est dans la Bible de l'univers, onglet Classes (lien dans `Univers.md`).

### Plan du lobby

Le lobby est une zone hors combat pour gérer l'équipement des personnages, choisir les personnages qu'on apporte, faire monter les personnages de niveau et choisir le niveau. Ordre prévu, en petits changements :

1. Victoire et défaite à la fin d'un combat.
2. Une fiche permanente `Character` (stats, rareté, niveau, expérience, équipement), séparée de `Piece` : les stats sont tirées une seule fois, et chaque personnage choisi devient une `Piece` au début du niveau.
3. Une sauvegarde dans le navigateur (`localStorage`), isolée dans un seul fichier pour passer à un serveur plus tard (multijoueur, gacha).
4. Un lobby simple (interface HTML) : choisir les personnages et le niveau, puis lancer. Les niveaux définissent des cases de départ au lieu de héros précis.
5. L'expérience et la montée de niveau, qui préparent le choix de classe au niveau X.
6. L'équipement, qui modifie les stats, géré dans le lobby.
7. Des onglets dans le lobby : Heroes (liste et invocation), Combination (transfert d'XP, qui remplace la suppression de héros) et Inventory (objets non équipés).

L'univers du jeu est dans la Bible de l'univers, la référence unique partagée avec les autres projets : https://claude.ai/artifact/5DQAoGp56bztgddjvBzBYv (lien aussi dans `Univers.md`).

## Règles de programmation

- Suivre la règle de nommage déjà utilisée dans le code existant (ne pas renommer les fichiers existants). Dans le code actuel : classes et interfaces en UpperCamelCase (`GameLogic`, `PieceConfig`), variables, fonctions et fichiers en lowerCamelCase (`cameraControle.ts`, `setupCounter`).
- Ne pas ajouter trop de commentaires dans le code.
- Programmer le jeu en PvE, mais garder en tête qu'il peut devenir multijoueur plus tard.
- Travailler par petits changements, un à la fois. Les grosses modifications faites d'un seul coup sont rares.
- À l'essai : avant de proposer un pull, Claude fait relire le changement avec le plugin code-review (s'il est activé dans la session), corrige ce qui est trouvé, puis envoie le pull.
- Une nouvelle session par grosse étape : CLAUDE.md et le journal de développement suffisent à reprendre le contexte, et une conversation plus courte consomme beaucoup moins.

## Questions ouvertes

(à remplir au fur et à mesure)

