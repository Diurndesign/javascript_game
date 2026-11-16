# Mission Bip · javascript_game

Un jeu pour apprendre les bases du JavaScript en écrivant du vrai code.

Bip est un robot rangé au fond d'un atelier. Il ne comprend qu'une langue : le JavaScript. Chaque mission réussie l'aide à se réparer, et chaque atelier terminé lui rend une pièce (les yeux, l'antenne, les bras…).

## Jouer

- **En local** : ouvre `index.html` dans Chrome, ou lance-le avec l'extension Live Server de VS Code.
- **En ligne** : active GitHub Pages (Settings › Pages › Branch `main`, dossier `/ (root)`). Le jeu sera disponible à l'adresse `https://diurndesign.github.io/javascript_game/`.

La progression est enregistrée dans le navigateur de chaque joueur (localStorage).

## Comment ça marche

À chaque clic sur **Lancer** (ou Ctrl + Entrée), le code de l'élève est exécuté et le jeu affiche :

| Onglet | Ce qu'on y voit |
|---|---|
| Objectifs | Chaque critère réussi ou raté, avec une explication quand c'est faux |
| Console | Les `console.log`, colorés par type, et les erreurs expliquées en français (ligne en rouge dans l'éditeur) |
| Mémoire | Chaque variable : son nom, sa valeur et son type |
| Page | Une mini page HTML que le code modifie (missions sur le DOM) |

Certaines missions relancent le code avec d'autres valeurs (tests cachés), pour vérifier que l'élève calcule au lieu d'écrire le résultat à la main.

Étoiles : 3 sans indice, 2 avec un indice, 1 avec la solution.

## Les 22 missions

| Atelier | Notions |
|---|---|
| 1. Le réveil | `console.log`, règles d'écriture, types, quiz (`script` + `defer`) |
| 2. Les boîtes | `let`, `const`, opérateurs, `===` |
| 3. La réserve | tableaux, `length`, `push`, objets, tableau d'objets |
| 4. L'usine | `function`, `return`, fonctions fléchées |
| 5. Le carrefour | `if`, `else`, `else if`, quiz |
| 6. Le tapis roulant | `forEach`, `filter` |
| 7. La vitrine | `querySelector`, `createElement`, `addEventListener`, galerie filtrable |

En plus : un **Carnet** (antisèche des notions débloquées) et un **Bac à sable** pour tester librement. Dans le Carnet, l'option « Débloquer toutes les missions » permet au formateur d'ouvrir toutes les missions.

## Fichiers

```
index.html   la structure de la page
style.css    le design (variables CSS dans :root)
script.js    les missions (tableau LEVELS) et le moteur du jeu
```

Pour ajouter ou modifier une mission, édite le tableau `LEVELS` dans `script.js`. Chaque mission contient : le texte de Bip, la leçon, les étapes, le code de départ, les objectifs (`goals`, avec une fonction `test`), les indices et la solution.

La bibliothèque [acorn](https://github.com/acornjs/acorn) est chargée depuis jsDelivr pour indiquer la ligne des erreurs de syntaxe. Sans connexion, le jeu marche quand même : il affiche juste l'erreur sans numéro de ligne.

---

Créé par Diurn Studio pour le module Intégration & Développement Web (ITECOM Art Design, Nice).
