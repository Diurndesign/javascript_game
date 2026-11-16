"use strict";
/* =====================================================================
   DONNÉES : ateliers et missions
   ===================================================================== */
const CHAPTERS = [
  { n: 1, title: "Le réveil", piece: "Les yeux", notions: ["console.log", "règles d’écriture", "types"] },
  { n: 2, title: "Les boîtes", piece: "L’antenne", notions: ["let", "const", "opérateurs", "==="] },
  { n: 3, title: "La réserve", piece: "Les bras", notions: ["tableaux", "objets", "length", "push"] },
  { n: 4, title: "L’usine", piece: "L’écran", notions: ["function", "return", "=>"] },
  { n: 5, title: "Le carrefour", piece: "Les roues", notions: ["if", "else", "else if"] },
  { n: 6, title: "Le tapis roulant", piece: "La carrosserie", notions: ["forEach", "filter"] },
  { n: 7, title: "La vitrine", piece: "Le cœur", notions: ["querySelector", "createElement", "addEventListener"] }
];

const CAT_A = `const catalogue = [
  { nom: "Roue", prix: 8, categorie: "moteur" },
  { nom: "Antenne", prix: 12, categorie: "capteur" },
  { nom: "Ressort", prix: 3, categorie: "moteur" },
  { nom: "Caméra", prix: 25, categorie: "capteur" }
];`;
const CAT_B = `const catalogue = [
  { nom: "Vis", prix: 1, categorie: "moteur" },
  { nom: "Radar", prix: 30, categorie: "capteur" },
  { nom: "Roue", prix: 8, categorie: "moteur" },
  { nom: "Micro", prix: 9, categorie: "capteur" },
  { nom: "Turbo", prix: 40, categorie: "moteur" }
];`;
const CAT_BOSS = `const catalogue = [
  { nom: "Roue", prix: 8, categorie: "moteur" },
  { nom: "Antenne", prix: 12, categorie: "capteur" },
  { nom: "Ressort", prix: 3, categorie: "moteur" },
  { nom: "Caméra", prix: 25, categorie: "capteur" },
  { nom: "Turbo", prix: 40, categorie: "moteur" }
];`;

/* --- petits outils de vérification --- */
const norm = s => String(s).replace(/\s+/g, " ").trim();
const logTexts = r => r ? r.logs.map(l => norm(l.text)) : [];
const hasText = (r, s) => logTexts(r).includes(norm(s));
const hasArg = (r, pred) => !!r && r.logs.some(l => l.args.some(a => { try { return pred(a); } catch (e) { return false; } }));
const V = (r, name) => (r && r.vars ? r.vars[name] : undefined);
const near = (a, b) => typeof a === "number" && Math.abs(a - b) < 1e-9;
const txt = (stage, sel) => { const el = stage && stage.querySelector(sel); return el ? norm(el.textContent) : null; };
function allRuns(c, fn) {
  for (const r of c.runs) { const res = fn(r, r.scenario || {}); if (res !== true) return res || false; }
  return true;
}
function branchGoal(i, expected, all) {
  return c => {
    const r = c.runs[i]; if (!r) return false;
    const ts = logTexts(r);
    const shown = all.filter(m => ts.includes(m));
    if (shown.length === 1 && shown[0] === expected) return true;
    if (shown.length > 1) return "Plusieurs messages s’affichent : un seul bloc doit s’exécuter. Vérifie tes else.";
    if (shown.length === 1) return "Ton code affiche « " + shown[0] + " ».";
    return false;
  };
}
const cardNames = stage => [...stage.querySelectorAll(".galerie .carte")].map(e => norm(e.textContent));

const LEVELS = [
/* ------------------------------ ATELIER 1 ------------------------------ */
{
  id: "console", ch: 1, title: "Dire bonjour", notion: "console.log",
  bip: "Bzzt… Je viens de m’allumer, mais je ne vois rien. Mon seul écran, c’est la console. Écris-moi quelque chose dedans !",
  lesson: {
    what: "La **console** est une zone où JavaScript affiche des messages. Le visiteur du site ne la voit pas : elle sert au développeur pour vérifier ce que fait son code. Dans Chrome, on l’ouvre avec F12 (ou Cmd + Option + J sur Mac), onglet Console. Ici, elle est sous l’éditeur.",
    code: `console.log("Bonjour");`,
    pieces: [["console", "la console du navigateur"], [".log", "l’action « afficher »"], ["( )", "entre les parenthèses : ce qu’on veut afficher"], ["\"Bonjour\"", "du texte, toujours entre guillemets"], [";", "la fin de l’instruction"]],
    example: { code: `console.log("Salut");\nconsole.log(2026);`, out: "Salut\n2026" },
    trap: "Sans guillemets, `console.log(Bonjour)` provoque une erreur : JavaScript croit que `Bonjour` est le nom d’une variable qu’il ne connaît pas."
  },
  steps: ["Affiche le texte `Bonjour Bip` dans la console.", "Ajoute une deuxième ligne qui affiche un message de ton choix.", "Clique sur **Lancer**."],
  starter: `// Écris ton code sous cette ligne\n`,
  goals: [
    { label: "La console affiche `Bonjour Bip`", test: c => logTexts(c.main).some(t => t.toLowerCase().replace(/[!.,]/g, "").trim() === "bonjour bip") || (hasArg(c.main, a => typeof a === "string" && /bonjour/i.test(a)) ? "Presque ! Le message doit être exactement Bonjour Bip." : false) },
    { label: "La console affiche au moins 2 messages", test: c => c.main.logs.length >= 2 }
  ],
  hints: ["Commence ta ligne par `console.log(` et termine-la par `);`", "Le texte se met entre guillemets : `\"Bonjour Bip\"`", "Pour le deuxième message, écris une nouvelle ligne `console.log(...)` en dessous."],
  solution: `console.log("Bonjour Bip");\nconsole.log("Je suis réveillé !");`,
  debrief: "Tu as donné deux ordres à JavaScript, un par ligne. Il les a exécutés **de haut en bas, dans l’ordre** : c’est toujours comme ça qu’il lit un fichier. `console.log` est ton meilleur outil pour comprendre ton code : en cas de doute, affiche !"
},
{
  id: "regles", ch: 1, title: "Le code cassé", notion: "règles d’écriture",
  bip: "Quelqu’un a écrit mon programme de démarrage… avec trois fautes. Répare-le et je pourrai enfin me lever !",
  lesson: {
    what: "JavaScript est très strict sur l’écriture : une seule faute et tout le programme s’arrête. Bonne nouvelle, il te dit pourquoi dans un message d’erreur. Les règles de base :",
    code: `// Ceci est un commentaire, JS l’ignore\nconsole.log("Texte entre guillemets");`,
    pieces: [["console ≠ Console", "les majuscules comptent : `console` s’écrit tout en minuscules"], ["\" … \"", "un texte s’ouvre ET se ferme avec le même guillemet"], ["( )", "chaque parenthèse ouverte doit être fermée"], [";", "une instruction par ligne, terminée par un point-virgule"], ["//", "un commentaire : une note pour les humains, ignorée par JS"]],
    example: { code: `// Démarrage\nconsole.log("Prêt");`, out: "Prêt" },
    trap: "Les guillemets typographiques « » ou “ ” (ceux de Word ou du téléphone) ne marchent pas en code. Utilise toujours les guillemets droits du clavier : `\"`."
  },
  steps: ["Clique sur **Lancer** pour voir la première erreur.", "Lis le message, regarde la ligne en rouge, corrige, relance.", "Recommence jusqu’à ce que les 4 messages s’affichent."],
  starter: `// Programme de démarrage de Bip\nConsole.log("Démarrage...");\nconsole.log("Moteurs : OK);\nconsole.log("Batterie : 100 %";\nconsole.log("Bip est debout !");\n`,
  goals: [
    { label: "Message 1 : `Démarrage...`", test: c => hasText(c.main, "Démarrage...") },
    { label: "Message 2 : `Moteurs : OK`", test: c => hasText(c.main, "Moteurs : OK") },
    { label: "Message 3 : `Batterie : 100 %`", test: c => hasText(c.main, "Batterie : 100 %") },
    { label: "Message 4 : `Bip est debout !`", test: c => hasText(c.main, "Bip est debout !") }
  ],
  hints: ["Il y a une faute de majuscule, un guillemet oublié et une parenthèse oubliée.", "Ligne 2 : `console` s’écrit tout en minuscules.", "Ligne 3 : il manque `\"` après OK. Ligne 4 : il manque `)` avant le `;`."],
  solution: `// Programme de démarrage de Bip\nconsole.log("Démarrage...");\nconsole.log("Moteurs : OK");\nconsole.log("Batterie : 100 %");\nconsole.log("Bip est debout !");`,
  debrief: "Un programme qui plante, ce n’est pas grave : le message d’erreur te dit **quoi** et souvent **où**. Lire l’erreur, corriger, relancer : c’est une grande partie du métier de développeur."
},
{
  id: "types", ch: 1, title: "Trier les valeurs", notion: "types",
  bip: "Mes capteurs reçoivent plein de valeurs, mais je ne sais pas les ranger. Apprends-moi la différence entre du texte, un nombre et un vrai/faux.",
  lesson: {
    what: "Une **valeur** est une donnée : un mot, un nombre, une réponse oui/non. Chaque valeur a un **type**, et JavaScript ne la traite pas pareil selon son type. Les trois types de base :",
    code: `"Bip"      // string  : du texte\n42         // number  : un nombre\ntrue       // boolean : vrai ou faux\n\ntypeof 42  // donne "number"`,
    pieces: [["string", "du texte, toujours entre guillemets : `\"Bip\"`, `\"42\"`"], ["number", "un nombre, sans guillemets : `42`, `3.5`, `-10`"], ["boolean", "un booléen : seulement `true` (vrai) ou `false` (faux), sans guillemets"], ["typeof", "un mot-clé qui donne le type d’une valeur"]],
    example: { code: `console.log(typeof "Bip");\nconsole.log(typeof 42);\nconsole.log(typeof false);`, out: "string\nnumber\nboolean" },
    trap: "`\"42\"` et `42` ne sont pas la même chose : le premier est du texte. Résultat : `\"5\" + 1` donne `\"51\"` (le texte est collé), alors que `5 + 1` donne `6`."
  },
  steps: ["Affiche un **texte** avec `console.log`.", "Affiche un **nombre**.", "Affiche un **booléen**.", "Affiche `typeof \"42\"` pour vérifier le type de `\"42\"`."],
  starter: ``,
  goals: [
    { label: "Un texte (string) est affiché", test: c => hasArg(c.main, a => typeof a === "string") },
    { label: "Un nombre (number) est affiché", test: c => hasArg(c.main, a => typeof a === "number") || (hasArg(c.main, a => typeof a === "string" && /^-?\d+([.,]\d+)?$/.test(a.trim())) ? "Ton nombre est entre guillemets : c’est donc du texte !" : false) },
    { label: "Un booléen (boolean) est affiché", test: c => hasArg(c.main, a => typeof a === "boolean") || (hasArg(c.main, a => a === "true" || a === "false") ? "`\"true\"` entre guillemets, c’est du texte. Enlève les guillemets." : false) },
    { label: "`typeof \"42\"` est affiché", test: c => /typeof\s*\(?\s*["']42["']/.test(c.code) && hasArg(c.main, a => a === "string") }
  ],
  hints: ["Une ligne `console.log(...)` par valeur.", "Texte avec guillemets, nombre et booléen sans : `console.log(7);` `console.log(true);`", "Dernière ligne : `console.log(typeof \"42\");`"],
  solution: `console.log("Bip");\nconsole.log(7);\nconsole.log(true);\nconsole.log(typeof "42");`,
  debrief: "Dans ce jeu, chaque type a sa couleur dans la console. Retiens surtout que les guillemets transforment n’importe quoi en texte. C’est le piège classique des formulaires : ce qu’on tape dans un champ arrive **toujours** en texte."
},
{
  id: "quiz1", ch: 1, quiz: true, title: "Contrôle technique n°1", notion: "quiz",
  bip: "Avant de passer à l’atelier suivant, petit contrôle technique. Tout juste, et mes yeux s’allument pour de bon !",
  questions: [
    { q: "Dans ton fichier HTML, quelle ligne charge correctement `script.js` ?", opts: ["`<link rel=\"stylesheet\" href=\"script.js\">`", "`<script src=\"script.js\" defer><\/script>`", "`<script>script.js<\/script>`"], a: 1, why: "La balise `script` avec `src` indique le fichier à charger. `defer` demande au navigateur de lire tout le HTML avant de lancer le JS : sans lui, `querySelector` risque de chercher des éléments qui n’existent pas encore. `link` sert au CSS." },
    { q: "Quel est le type de la valeur `\"42\"` ?", opts: ["number (nombre)", "boolean (vrai/faux)", "string (texte)"], a: 2, why: "Les guillemets transforment tout en texte, même des chiffres." },
    { q: "Qu’affiche `console.log(\"5\" + 1)` ?", opts: ["`51`", "`6`", "Une erreur"], a: 0, why: "Avec du texte, `+` colle : \"5\" et 1 deviennent \"51\". Pour additionner, il faut deux nombres." },
    { q: "Où lit-on les messages de `console.log` sur un vrai site ?", opts: ["En haut de la page, pour le visiteur", "Dans les outils de développement (F12), onglet Console", "Dans le fichier HTML"], a: 1, why: "La console est réservée au développeur. Le visiteur ne la voit pas, sauf s’il ouvre lui-même les outils." }
  ],
  debrief: "Tu connais le trajet complet : le HTML charge le script, le script parle dans la console, et chaque valeur a un type."
},
/* ------------------------------ ATELIER 2 ------------------------------ */
{
  id: "let", ch: 2, title: "Ma première boîte", notion: "variables",
  bip: "J’oublie tout dès qu’une ligne est finie ! Donne-moi des boîtes avec une étiquette pour ranger mes infos.",
  lesson: {
    what: "Une **variable** est un nom qui garde une valeur en mémoire, pour la réutiliser plus loin. Créer une variable s’appelle la **déclarer**.",
    code: `let nomDuRobot = "Bip";\nconsole.log(nomDuRobot);`,
    pieces: [["let", "« je crée une variable »"], ["nomDuRobot", "son nom : pas d’espace, pas d’accent, commence par une lettre. Plusieurs mots ? On colle avec des majuscules (camelCase)"], ["=", "« reçoit » : range la valeur de droite dans la variable de gauche. Ce n’est pas le « égal » des maths"], ["\"Bip\"", "la valeur rangée"], ["nomDuRobot", "ensuite, on écrit juste le nom, sans `let` et sans guillemets"]],
    example: { code: `let ville = "Nice";\nlet annee = 2026;\nconsole.log(ville);\nconsole.log(annee);`, out: "Nice\n2026" },
    trap: "`console.log(\"ville\")` affiche le mot ville. `console.log(ville)` affiche ce qu’il y a dans la variable : Nice."
  },
  steps: ["Crée une variable `pseudo` qui contient ton prénom (du texte).", "Crée une variable `age` qui contient un nombre.", "Affiche `pseudo` puis `age` avec `console.log`.", "Ouvre l’onglet **Mémoire** pour voir tes boîtes."],
  starter: ``,
  goals: [
    { label: "`pseudo` contient un texte", test: c => typeof V(c.main, "pseudo") === "string" && V(c.main, "pseudo").trim() !== "" },
    { label: "`age` contient un nombre", test: c => { const a = V(c.main, "age"); if (typeof a === "number") return true; if (typeof a === "string") return "`age` contient du texte : enlève les guillemets autour du nombre."; return false; } },
    { label: "La console affiche la valeur de `pseudo`", test: c => { if (/console\.log\(\s*["'`]pseudo/.test(c.code)) return "Tu affiches le mot « pseudo » : enlève les guillemets pour afficher la valeur."; const p = V(c.main, "pseudo"); return typeof p === "string" && hasArg(c.main, a => a === p); } },
    { label: "La console affiche la valeur de `age`", test: c => { const a = V(c.main, "age"); return a !== undefined && hasArg(c.main, x => x === a); } }
  ],
  hints: ["Une variable se crée avec `let`, un nom, `=` et une valeur.", "Le texte prend des guillemets, le nombre non : `let age = 20;`", "Pour afficher, mets le nom sans guillemets : `console.log(pseudo);`"],
  solution: `let pseudo = "Léa";\nlet age = 20;\nconsole.log(pseudo);\nconsole.log(age);`,
  debrief: "Dans l’onglet Mémoire, chaque boîte a un nom, une valeur et un type. Quand tu écris `pseudo`, JavaScript va chercher ce qu’il y a dedans. Change la valeur à un seul endroit, et tout le code qui utilise `pseudo` suit."
},
{
  id: "const", ch: 2, title: "let ou const ?", notion: "let, const, var",
  bip: "Aïe ! Je suis tombé de l’établi et j’ai perdu une vie. Mais mon compteur refuse de changer… Il y a du rouge partout !",
  lesson: {
    what: "Il existe trois mots pour créer une variable. `const` crée une variable qu’on ne pourra **pas réassigner**. `let` crée une variable qui **peut changer**. `var` est l’ancienne façon, à éviter aujourd’hui (ses règles de portée sont piégeuses).",
    code: `const nom = "Bip";   // ne changera jamais\nlet vies = 3;        // va changer\n\nvies = vies - 1;     // pas de let ici !`,
    pieces: [["const", "valeur fixe. La bonne habitude : `const` par défaut"], ["let", "seulement si la valeur doit changer"], ["vies = …", "pour changer une variable, on réutilise son nom, **sans** remettre `let`"], ["vies - 1", "JS lit l’ancienne valeur (3), calcule (2), puis range le résultat dans `vies`"]],
    example: { code: `let score = 0;\nscore = score + 10;\nconsole.log(score);`, out: "10" },
    trap: "Écrire `let vies` une deuxième fois provoque l’erreur « already declared » : la boîte existe déjà, on ne la recrée pas."
  },
  steps: ["Lance le code et lis l’erreur.", "Corrige la déclaration de `vies` pour qu’elle puisse changer.", "Garde `nom` en `const` : il ne change jamais."],
  starter: `const nom = "Bip";\nconst vies = 3;\n\n// Bip tombe de l'établi\nvies = vies - 1;\n\nconsole.log(nom + " a " + vies + " vies");\n`,
  goals: [
    { label: "Le code tourne sans erreur", test: c => !c.main.error },
    { label: "`vies` vaut 2 à la fin", test: c => V(c.main, "vies") === 2 },
    { label: "`vies` est créée avec `let`", test: c => /\blet\s+vies\b/.test(c.code) },
    { label: "`nom` reste en `const`", test: c => /\bconst\s+nom\b/.test(c.code) }
  ],
  hints: ["L’erreur dit qu’on essaie de changer une constante.", "Remplace `const` par `let` devant `vies` seulement.", "Ligne 2 : `let vies = 3;`"],
  solution: `const nom = "Bip";\nlet vies = 3;\n\n// Bip tombe de l'établi\nvies = vies - 1;\n\nconsole.log(nom + " a " + vies + " vies");`,
  debrief: "Tu as vu la vraie différence : `const` protège une valeur, `let` l’autorise à bouger. Et le message « Bip a 2 vies » a été fabriqué en collant du texte et des variables avec `+` : c’est la mission suivante."
},
{
  id: "operateurs", ch: 2, title: "Les calculs", notion: "opérateurs",
  bip: "Pour me réparer, il me faut des vis et une batterie neuve. Aide-moi à calculer le total, je suis nul en maths.",
  prelude: `const prixVis = 2;\nconst nbVis = 12;\nconst prixBatterie = 15;`,
  scenarios: [
    { prelude: `const prixVis = 2;\nconst nbVis = 12;\nconst prixBatterie = 15;`, total: 39 },
    { prelude: `const prixVis = 3;\nconst nbVis = 10;\nconst prixBatterie = 20;`, total: 50, hidden: true }
  ],
  lesson: {
    what: "Les **opérateurs** font des calculs. Ce sont ceux des maths, avec deux surprises : la multiplication s’écrit `*`, et le `+` sert aussi à **coller du texte** (on dit concaténer).",
    code: `const total = 2 * 12 + 15;   // 39\nconst message = "Total : " + total + " euros";`,
    pieces: [["+  -", "addition, soustraction"], ["*  /", "multiplication, division (prioritaires sur + et -, comme en maths)"], ["( )", "pour forcer un ordre de calcul"], ["%", "le reste d’une division : `7 % 2` donne 1"], ["\"…\" + total", "avec du texte, `+` colle les morceaux. Pense aux espaces dans les guillemets !"]],
    example: { code: `const prix = 10;\nconsole.log("Prix : " + prix + " €");`, out: "Prix : 10 €" },
    trap: "Si tu écris directement `39` au lieu de calculer avec les variables, ton code ne marche que pour ces prix-là. Le jeu va tester avec d’autres prix !"
  },
  steps: ["Crée une constante `total` : le prix de toutes les vis, plus le prix de la batterie. Calcule avec les variables déjà écrites.", "Affiche `Total : 39 euros` en collant le texte et `total` avec `+`."],
  starter: ``,
  goals: [
    { label: "`total` vaut 39 avec ces prix", test: c => { const t = V(c.runs[0], "total"); if (t === 39) return true; return t === undefined ? false : "`total` vaut " + fmt(t, false) + " au lieu de 39."; } },
    { label: "`total` est juste avec d’autres prix (test caché)", test: c => { const t = V(c.runs[1], "total"); if (t === 50) return true; return t === 39 ? "Avec d’autres prix, `total` vaut toujours 39 : tu as écrit le nombre au lieu du calcul." : false; } },
    { label: "La console affiche `Total : 39 euros`", test: c => { const ts = logTexts(c.runs[0]); if (ts.some(t => /^total ?: ?39 euros$/i.test(t))) return true; if (ts.some(t => t.replace(/\s/g, "").toLowerCase() === "total:39euros")) return "Presque ! Vérifie les espaces à l’intérieur de tes guillemets."; return false; } }
  ],
  hints: ["Le prix des vis, c’est `prixVis * nbVis`.", "`const total = prixVis * nbVis + prixBatterie;`", "Pour le message : `\"Total : \" + total + \" euros\"`. Garde les espaces à l’intérieur des guillemets."],
  solution: `const total = prixVis * nbVis + prixBatterie;\nconsole.log("Total : " + total + " euros");`,
  debrief: "Le jeu a lancé ton code deux fois, avec des prix différents. Comme tu as calculé avec les **noms** des variables, ton code marche pour n’importe quel prix. C’est tout l’intérêt des variables."
},
{
  id: "comparer", ch: 2, title: "= ou === ?", notion: "comparaisons",
  bip: "La porte de l’atelier a un cadenas à code, et ma batterie a une alarme. Comment je vérifie si deux valeurs sont pareilles ?",
  prelude: `const codeSecret = 2049;\nconst codeTape = 2049;\nconst batterie = 50;`,
  scenarios: [
    { prelude: `const codeSecret = 2049;\nconst codeTape = 2049;\nconst batterie = 50;`, code: true, faible: false, label: "codeTape = 2049 et batterie = 50" },
    { prelude: `const codeSecret = 2049;\nconst codeTape = 1234;\nconst batterie = 10;`, code: false, faible: true, label: "codeTape = 1234 et batterie = 10" },
    { prelude: `const codeSecret = 2049;\nconst codeTape = "2049";\nconst batterie = 20;`, code: false, faible: false, label: "codeTape = \"2049\" (du texte) et batterie = 20" }
  ],
  lesson: {
    what: "Un seul `=` **range** une valeur. Pour **comparer** deux valeurs, on utilise `===`. Une comparaison donne toujours un booléen : `true` ou `false`.",
    code: `const age = 20;\nconst majeur = age >= 18;     // true\nconst pareil = age === 20;    // true`,
    pieces: [["=", "range (on dit « affectation »)"], ["===", "strictement égal : même valeur ET même type"], ["!==", "différent"], [">  <", "plus grand, plus petit"], [">=  <=", "plus grand ou égal, plus petit ou égal"]],
    example: { code: `console.log(5 === 5);\nconsole.log("5" === 5);\nconsole.log(3 !== 4);`, out: "true\nfalse\ntrue" },
    trap: "Il existe aussi `==` et `!=`, mais ils convertissent les types en cachette : `\"5\" == 5` donne `true`. Avec `===`, pas de surprise. Prends l’habitude des trois signes."
  },
  steps: ["Crée `codeCorrect` : le résultat de la comparaison entre `codeTape` et `codeSecret`, avec `===`.", "Crée `tropFaible` : `true` si `batterie` est plus petite que 20.", "Affiche les deux."],
  starter: ``,
  goals: [
    { label: "`codeCorrect` est juste dans les 3 tests", test: c => allRuns(c, (r, s) => { const x = V(r, "codeCorrect"); if (x === s.code) return true; if (x === undefined) return false; if (typeof x !== "boolean") return "`codeCorrect` doit contenir `true` ou `false` : le résultat d’une comparaison."; return "Avec " + s.label + ", `codeCorrect` devrait valoir " + s.code + "."; }) },
    { label: "`tropFaible` est juste dans les 3 tests", test: c => allRuns(c, (r, s) => { const x = V(r, "tropFaible"); if (x === s.faible) return true; if (x === undefined) return false; return "Avec " + s.label + ", `tropFaible` devrait valoir " + s.faible + "."; }) },
    { label: "Tu compares avec `===`", test: c => /===/.test(c.code) && !/[^=!<>]==[^=]/.test(c.code) },
    { label: "Les deux résultats sont affichés", test: c => c.main.logs.reduce((n, l) => n + l.args.filter(a => typeof a === "boolean").length, 0) >= 2 }
  ],
  hints: ["Une comparaison se range comme n’importe quelle valeur : `const codeCorrect = ... === ...;`", "`const codeCorrect = codeTape === codeSecret;`", "`const tropFaible = batterie < 20;` puis deux `console.log`."],
  solution: `const codeCorrect = codeTape === codeSecret;\nconst tropFaible = batterie < 20;\nconsole.log(codeCorrect);\nconsole.log(tropFaible);`,
  debrief: "Dans le 3e test, `codeTape` valait `\"2049\"` en texte : `===` a vu que les types étaient différents et a répondu `false`. C’est ce qui se passe avec un champ de formulaire : on compare toujours du texte avec du texte."
},
/* ------------------------------ ATELIER 3 ------------------------------ */
{
  id: "tableaux", ch: 3, title: "La liste de pièces", notion: "tableaux",
  bip: "J’ai trouvé des pièces détachées partout dans l’atelier. Range-les toutes dans une seule boîte : une liste !",
  lesson: {
    what: "Un **tableau** (array) est une liste ordonnée de valeurs. Chaque case a un numéro, l’**index**, qui commence à **0**.",
    code: `const pieces = ["roue", "antenne", "ressort"];\n\npieces[0]        // "roue"\npieces.length    // 3\npieces.push("vis");`,
    pieces: [["[ ]", "les crochets créent le tableau, les virgules séparent les valeurs"], ["pieces[0]", "la première case. La deuxième est `pieces[1]`"], [".length", "une **propriété** : le nombre d’éléments (sans parenthèses)"], [".push( )", "une **méthode** : une action, ici ajouter un élément à la fin (avec parenthèses)"]],
    example: { code: `const notes = [12, 15, 9];\nconsole.log(notes[1]);\nconsole.log(notes.length);`, out: "15\n3" },
    trap: "Le dernier élément n’est pas `pieces[pieces.length]` (case vide : `undefined`) mais `pieces[pieces.length - 1]`."
  },
  steps: ["Crée une constante `pieces` : un tableau avec au moins 3 textes.", "Affiche la **première** pièce.", "Affiche le **nombre** de pièces avec `length`.", "Ajoute `\"batterie\"` à la fin avec `push`."],
  starter: ``,
  goals: [
    { label: "`pieces` est un tableau d’au moins 3 éléments", test: c => Array.isArray(V(c.main, "pieces")) && V(c.main, "pieces").length >= 3 },
    { label: "La console affiche la première pièce", test: c => { const p = V(c.main, "pieces"); if (!Array.isArray(p)) return false; if (/pieces\[1\]/.test(c.code) && !/pieces\[0\]/.test(c.code)) return "`pieces[1]` est la deuxième case : la première, c’est `pieces[0]`."; return /pieces\[0\]/.test(c.code) && hasArg(c.main, a => a === p[0]); } },
    { label: "La console affiche le nombre de pièces", test: c => /pieces\.length/.test(c.code) && hasArg(c.main, a => typeof a === "number") },
    { label: "`\"batterie\"` est ajoutée avec `push`", test: c => /pieces\.push\s*\(/.test(c.code) && Array.isArray(V(c.main, "pieces")) && V(c.main, "pieces").includes("batterie") }
  ],
  hints: ["Un tableau s’écrit entre crochets : `[\"roue\", \"antenne\", \"ressort\"]`", "Première pièce : `pieces[0]`. Nombre : `pieces.length`.", "Pour ajouter : `pieces.push(\"batterie\");`"],
  solution: `const pieces = ["roue", "antenne", "ressort"];\nconsole.log(pieces[0]);\nconsole.log(pieces.length);\npieces.push("batterie");`,
  debrief: "Regarde l’onglet Mémoire : chaque pièce a son numéro de case. Le tableau est une `const`, et pourtant `push` a marché ! `const` interdit de remplacer la boîte entière, pas de changer ce qu’il y a dedans."
},
{
  id: "objets", ch: 3, title: "La fiche de Bip", notion: "objets",
  bip: "Une liste, c’est bien pour des choses du même genre. Pour me décrire, moi, il me faut une fiche avec des étiquettes.",
  lesson: {
    what: "Pour décrire **une seule chose** avec plusieurs infos, on utilise un **objet** : des valeurs rangées sous des étiquettes, appelées **propriétés**.",
    code: `const projet = {\n  title: "Villa Aurelia",\n  year: 2021,\n  online: true\n};\n\nprojet.title         // "Villa Aurelia"\nprojet.year = 2022;`,
    pieces: [["{ }", "les accolades créent l’objet"], ["title: \"Villa…\"", "une propriété : un nom, deux-points, une valeur"], [",", "une virgule entre chaque propriété"], ["projet.title", "le point permet de lire une propriété"], ["projet.year = …", "…et de la modifier"]],
    example: { code: `const chat = { nom: "Mochi", age: 3 };\nconsole.log(chat.nom);`, out: "Mochi" },
    trap: "Oublier la virgule entre deux propriétés donne l’erreur « Unexpected identifier ». Et dans les accolades, c’est `nom: \"Bip\"`, pas `nom = \"Bip\"`."
  },
  steps: ["Crée une constante `robot` : un objet avec `nom` (texte), `niveau` (nombre) et `enMarche` (booléen).", "Affiche `robot.nom`.", "Augmente `robot.niveau` de 1."],
  starter: ``,
  goals: [
    { label: "`robot` a `nom` (texte), `niveau` (nombre) et `enMarche` (booléen)", test: c => { const r = V(c.main, "robot"); if (!r || typeof r !== "object") return false; const miss = []; if (typeof r.nom !== "string") miss.push("`nom` doit être un texte"); if (typeof r.niveau !== "number") miss.push("`niveau` doit être un nombre"); if (typeof r.enMarche !== "boolean") miss.push("`enMarche` doit être true ou false"); return miss.length ? miss.join(", ") + "." : true; } },
    { label: "La console affiche `robot.nom`", test: c => { const r = V(c.main, "robot"); return !!r && /robot\.nom/.test(c.code) && hasArg(c.main, a => a === r.nom); } },
    { label: "`robot.niveau` augmente de 1", test: c => /robot\.niveau\s*(=[^=]|\+=|\+\+)/.test(c.code) }
  ],
  hints: ["Un objet : `const robot = { nom: \"Bip\", niveau: 1, enMarche: true };`", "Pour lire : `robot.nom`.", "Pour augmenter : `robot.niveau = robot.niveau + 1;`"],
  solution: `const robot = {\n  nom: "Bip",\n  niveau: 1,\n  enMarche: true\n};\n\nconsole.log(robot.nom);\nrobot.niveau = robot.niveau + 1;`,
  debrief: "Un objet, c’est une fiche. Les projets du site Valmont sont exactement ça : `{ title, place, year, category, image }`. Et une liste de fiches, c’est la mission suivante."
},
{
  id: "catalogue", ch: 3, title: "Le catalogue", notion: "tableau d’objets",
  bip: "Voici le catalogue des pièces de l’atelier : un tableau qui contient des fiches. Trouve-moi ce qu’il me faut.",
  prelude: CAT_A,
  scenarios: [{ prelude: CAT_A }, { prelude: CAT_B, hidden: true }],
  lesson: {
    what: "On combine les deux : un tableau qui contient des objets. C’est la forme de presque toutes les données d’un site : les projets d’un portfolio, les produits d’une boutique, les articles d’un CMS.",
    code: `catalogue[1]          // la 2e fiche (un objet)\ncatalogue[1].nom      // le nom de la 2e fiche\ncatalogue.length      // le nombre de fiches`,
    pieces: [["catalogue[1]", "d’abord on choisit la case du tableau…"], [".nom", "…puis la propriété de l’objet qui est dedans"], ["catalogue.length - 1", "l’index de la dernière fiche, quelle que soit la taille"]],
    example: { code: `const projets = [\n  { title: "Villa Aurelia", year: 2021 },\n  { title: "Hôtel Saleya", year: 2019 }\n];\nconsole.log(projets[1].title);`, out: "Hôtel Saleya" },
    trap: "`catalogue.nom` ne marche pas : le tableau n’a pas de nom, ce sont ses fiches qui en ont. Il faut d’abord choisir une case : `catalogue[0].nom`."
  },
  steps: ["Affiche le **nom** de la 2e pièce du catalogue.", "Affiche le **prix** de la dernière pièce.", "Crée `nbPieces` qui contient le nombre de pièces du catalogue."],
  starter: ``,
  goals: [
    { label: "La console affiche le nom de la 2e pièce", test: c => allRuns(c, r => { const cat = V(r, "catalogue"); return hasArg(r, a => a === cat[1].nom) || "Rappel : la 2e case, c’est `catalogue[1]`."; }) },
    { label: "La console affiche le prix de la dernière pièce", test: c => allRuns(c, (r, s) => { const cat = V(r, "catalogue"); if (hasArg(r, a => a === cat[cat.length - 1].prix)) return true; return s.hidden ? "Dans le test caché, le catalogue a 5 pièces : vise la dernière avec `catalogue.length - 1`." : false; }) },
    { label: "`nbPieces` contient le nombre de pièces", test: c => allRuns(c, (r, s) => { const cat = V(r, "catalogue"); if (V(r, "nbPieces") === cat.length) return true; return s.hidden && V(r, "nbPieces") === 4 ? "`nbPieces` doit suivre la taille du catalogue : utilise `catalogue.length`." : false; }) }
  ],
  hints: ["Le nom de la 2e : `catalogue[1].nom`", "La dernière case : `catalogue[catalogue.length - 1]`, puis `.prix`.", "`const nbPieces = catalogue.length;`"],
  solution: `console.log(catalogue[1].nom);\nconsole.log(catalogue[catalogue.length - 1].prix);\nconst nbPieces = catalogue.length;`,
  debrief: "Tu sais naviguer dans des données comme celles d’un vrai site. `catalogue[catalogue.length - 1]` marche même si on ajoute des pièces : ton code ne dépend plus de la taille de la liste."
},
/* ------------------------------ ATELIER 4 ------------------------------ */
{
  id: "fonctions", ch: 4, title: "Ma première machine", notion: "fonctions",
  bip: "Je répète toujours les mêmes phrases. Construis-moi une machine : je lui donne un prénom, elle me rend une phrase toute prête.",
  lesson: {
    what: "Une **fonction** est un morceau de code avec un nom, qu’on peut lancer autant de fois qu’on veut. On lui donne des valeurs d’entrée (les **paramètres**) et elle peut **renvoyer** un résultat avec `return`.",
    code: `function saluer(prenom) {\n  return "Bonjour " + prenom + " !";\n}\n\nconst message = saluer("Léa");\nconsole.log(message);   // Bonjour Léa !`,
    pieces: [["function", "« je crée une fonction »"], ["saluer", "son nom (souvent un verbe : afficher, calculer…)"], ["(prenom)", "le paramètre : une variable qui recevra la valeur donnée à l’appel"], ["{ … }", "le corps : le code exécuté à chaque appel"], ["return", "renvoie le résultat et arrête la fonction"], ["saluer(\"Léa\")", "l’**appel** : c’est là que la fonction s’exécute, avec prenom = \"Léa\""]],
    example: { code: `function carre(n) {\n  return n * n;\n}\nconsole.log(carre(4));\nconsole.log(carre(10));`, out: "16\n100" },
    trap: "Écrire la fonction ne la lance pas : il faut l’appeler. Et `console.log` dans une fonction **affiche** seulement, alors que `return` **renvoie** une valeur qu’on peut ranger dans une variable."
  },
  steps: ["Écris une fonction `saluer` qui reçoit un `prenom` et renvoie `\"Bonjour \" + prenom + \" !\"`.", "Appelle-la avec ton prénom et affiche le résultat."],
  starter: ``,
  goals: [
    { label: "`saluer` est une fonction", test: c => typeof V(c.runs[0], "saluer") === "function" },
    { label: "`saluer(\"Léa\")` renvoie `Bonjour Léa !`", test: c => { const f = V(c.runs[0], "saluer"); if (typeof f !== "function") return false; const r = f("Léa"); if (r === "Bonjour Léa !") return true; if (r === undefined) return "`saluer(\"Léa\")` renvoie undefined : il manque sûrement `return`."; return "`saluer(\"Léa\")` renvoie " + fmt(r, false) + ". Vérifie les espaces et le « ! »."; } },
    { label: "Ça marche aussi avec un autre prénom", test: c => { const f = V(c.runs[0], "saluer"); return typeof f === "function" && f("Axel") === "Bonjour Axel !"; } },
    { label: "La console affiche une salutation", test: c => hasArg(c.main, a => typeof a === "string" && /^Bonjour /.test(a)) }
  ],
  hints: ["Le squelette : `function saluer(prenom) { ... }`", "Dans les accolades : `return \"Bonjour \" + prenom + \" !\";`", "Pour l’appeler et afficher : `console.log(saluer(\"Léa\"));`"],
  solution: `function saluer(prenom) {\n  return "Bonjour " + prenom + " !";\n}\n\nconsole.log(saluer("Léa"));`,
  debrief: "Le jeu a appelé ta fonction lui-même, avec « Léa » puis « Axel ». Même machine, deux résultats. Une fonction, c’est du code qu’on écrit une fois et qu’on réutilise partout."
},
{
  id: "fleche", ch: 4, title: "Machines express", notion: "fonctions fléchées",
  bip: "Les développeurs écrivent souvent les petites machines en version courte, avec une flèche. Montre-moi !",
  lesson: {
    what: "Une **fonction fléchée** est une écriture plus courte d’une fonction. On la range dans une `const`. Tu la croiseras partout, surtout avec `forEach` et `filter`.",
    code: `const double = (n) => n * 2;\n\n// c’est la même chose que :\nfunction double(n) {\n  return n * 2;\n}`,
    pieces: [["const double", "on range la fonction dans une constante"], ["(n)", "les paramètres, comme d’habitude"], ["=>", "la flèche : « donne »"], ["n * 2", "sans accolades, le résultat est renvoyé automatiquement (return implicite)"], ["=> { return … }", "avec des accolades, il faut écrire `return`"]],
    example: { code: `const ajouter = (a, b) => a + b;\nconsole.log(ajouter(2, 3));`, out: "5" },
    trap: "Avec accolades et sans `return`, la fonction renvoie `undefined` : `(n) => { n * 2 }` ne renvoie rien !"
  },
  steps: ["Crée `prixTTC` en fonction fléchée : elle reçoit `prix` et renvoie `prix * 1.2`.", "Crée `estPair` en fonction fléchée : elle reçoit `n` et renvoie `n % 2 === 0`.", "Affiche `prixTTC(10)`."],
  starter: ``,
  goals: [
    { label: "`prixTTC(10)` renvoie 12", test: c => { const f = V(c.runs[0], "prixTTC"); if (typeof f !== "function") return false; const r = f(10); if (!near(r, 12) || !near(f(5), 6)) return r === undefined ? "`prixTTC` renvoie undefined : sans accolades, ou avec `return`." : "`prixTTC(10)` renvoie " + fmt(r, false) + " au lieu de 12."; return /prixTTC\s*=\s*(\([^)]*\)|\w+)\s*=>/.test(c.code) || "Ça marche, mais écris-la en fonction fléchée : `const prixTTC = (prix) => ...`"; } },
    { label: "`estPair` répond true pour 4 et false pour 7", test: c => { const f = V(c.runs[0], "estPair"); if (typeof f !== "function") return false; if (f(4) !== true || f(7) !== false || f(0) !== true) return "`estPair(4)` donne " + fmt(f(4), false) + " et `estPair(7)` donne " + fmt(f(7), false) + "."; return /estPair\s*=\s*(\([^)]*\)|\w+)\s*=>/.test(c.code) || "Écris-la en fonction fléchée : `const estPair = (n) => ...`"; } },
    { label: "La console affiche 12", test: c => hasArg(c.main, a => near(a, 12)) }
  ],
  hints: ["Modèle : `const double = (n) => n * 2;`", "`const prixTTC = (prix) => prix * 1.2;`", "`const estPair = (n) => n % 2 === 0;` puis `console.log(prixTTC(10));`"],
  solution: `const prixTTC = (prix) => prix * 1.2;\nconst estPair = (n) => n % 2 === 0;\n\nconsole.log(prixTTC(10));`,
  debrief: "`estPair` renvoie un booléen : c’est une **question** sous forme de fonction. Tu vas t’en resservir avec `filter`, qui attend justement une fonction qui répond true ou false."
},
/* ------------------------------ ATELIER 5 ------------------------------ */
{
  id: "si", ch: 5, title: "Si… sinon", notion: "if / else",
  bip: "Ma batterie baisse. Apprends-moi à décider : si elle est faible je recharge, sinon je travaille.",
  prelude: `const batterie = 30;`,
  scenarios: [{ prelude: `const batterie = 30;` }, { prelude: `const batterie = 80;`, hidden: true }, { prelude: `const batterie = 50;`, hidden: true }],
  lesson: {
    what: "Une **condition** permet au code de choisir. Si la condition est vraie, un bloc s’exécute ; sinon, c’est l’autre. Jamais les deux.",
    code: `if (batterie < 50) {\n  console.log("Je recharge");\n} else {\n  console.log("Je travaille");\n}`,
    pieces: [["if", "« si »"], ["(batterie < 50)", "la condition, entre parenthèses. Elle donne true ou false"], ["{ … }", "le bloc exécuté si c’est true"], ["else", "« sinon » : le bloc exécuté si c’est false (facultatif)"]],
    example: { code: `const age = 15;\nif (age >= 18) {\n  console.log("Entrée libre");\n} else {\n  console.log("Accompagné");\n}`, out: "Accompagné" },
    trap: "`if (batterie = 30)` range 30 dans batterie au lieu de comparer ! Pour comparer : `===`, `<`, `>`… Et pas de point-virgule juste après la parenthèse du `if`."
  },
  steps: ["Si `batterie` est plus petite que 50, affiche `Je recharge`.", "Sinon, affiche `Je travaille`."],
  starter: ``,
  goals: [
    { label: "Avec batterie = 30 : `Je recharge`", test: branchGoal(0, "Je recharge", ["Je recharge", "Je travaille"]) },
    { label: "Avec batterie = 80 : `Je travaille` (test caché)", test: branchGoal(1, "Je travaille", ["Je recharge", "Je travaille"]) },
    { label: "Avec batterie = 50, pile la limite : `Je travaille` (test caché)", test: branchGoal(2, "Je travaille", ["Je recharge", "Je travaille"]) }
  ],
  hints: ["Le squelette : `if (...) { ... } else { ... }`", "La condition : `batterie < 50`", "Dans chaque bloc, un `console.log` avec le bon message."],
  solution: `if (batterie < 50) {\n  console.log("Je recharge");\n} else {\n  console.log("Je travaille");\n}`,
  debrief: "Ton code a pris des chemins différents selon la valeur de `batterie`. Le cas 50 est un piège classique : `50 < 50` est faux, donc on passe dans le else. Toujours tester les limites !"
},
{
  id: "motdepasse", ch: 5, title: "La porte à code", notion: "else if",
  bip: "La porte de l’atelier demande un mot de passe. Trois cas possibles : le bon, un champ vide, ou un mauvais.",
  prelude: `const motDePasse = "valmont";`,
  scenarios: [{ prelude: `const motDePasse = "valmont";` }, { prelude: `const motDePasse = "";`, hidden: true }, { prelude: `const motDePasse = "abc";`, hidden: true }],
  lesson: {
    what: "Quand il y a plus de deux cas, on enchaîne avec `else if`. JavaScript teste les conditions **dans l’ordre** et exécute seulement le premier bloc dont la condition est vraie.",
    code: `if (note >= 16) {\n  console.log("Très bien");\n} else if (note >= 10) {\n  console.log("Validé");\n} else {\n  console.log("À retravailler");\n}`,
    pieces: [["else if (…)", "« sinon, si… » : un cas de plus"], ["else", "le cas par défaut, quand rien n’a marché"], ["\"\"", "une chaîne vide : du texte sans aucun caractère"], ["&&  ||  !", "et, ou, non : pour combiner des conditions"]],
    example: { code: `const heure = 14;\nif (heure < 12) {\n  console.log("Bonjour");\n} else if (heure < 18) {\n  console.log("Bon après-midi");\n} else {\n  console.log("Bonsoir");\n}`, out: "Bon après-midi" },
    trap: "L’ordre compte : si tu testes `note >= 10` avant `note >= 16`, un 18 affichera « Validé ». Mets toujours le cas le plus précis en premier."
  },
  steps: ["Si `motDePasse` est égal à `\"valmont\"`, affiche `Accès autorisé`.", "Sinon, si `motDePasse` est vide (`\"\"`), affiche `Tape un mot de passe`.", "Sinon, affiche `Mot de passe incorrect`."],
  starter: ``,
  goals: [
    { label: "Avec \"valmont\" : `Accès autorisé`", test: branchGoal(0, "Accès autorisé", ["Accès autorisé", "Tape un mot de passe", "Mot de passe incorrect"]) },
    { label: "Avec un champ vide : `Tape un mot de passe` (test caché)", test: branchGoal(1, "Tape un mot de passe", ["Accès autorisé", "Tape un mot de passe", "Mot de passe incorrect"]) },
    { label: "Avec \"abc\" : `Mot de passe incorrect` (test caché)", test: branchGoal(2, "Mot de passe incorrect", ["Accès autorisé", "Tape un mot de passe", "Mot de passe incorrect"]) }
  ],
  hints: ["Trois blocs : `if (...) { } else if (...) { } else { }`", "Première condition : `motDePasse === \"valmont\"`. Deuxième : `motDePasse === \"\"`.", "Chaque bloc contient un seul `console.log` avec le message exact."],
  solution: `if (motDePasse === "valmont") {\n  console.log("Accès autorisé");\n} else if (motDePasse === "") {\n  console.log("Tape un mot de passe");\n} else {\n  console.log("Mot de passe incorrect");\n}`,
  debrief: "C’est la logique de la connexion du site Valmont. Ici elle est simulée : un vrai mot de passe ne s’écrit jamais dans le JS d’une page, car n’importe qui peut lire ce code avec F12."
},
{
  id: "quiz2", ch: 5, quiz: true, title: "Contrôle technique n°2", notion: "quiz",
  bip: "Deuxième contrôle technique avant le tapis roulant. Variables, tableaux, fonctions, conditions : on vérifie que tout tient.",
  questions: [
    { q: "Après ces deux lignes, que vaut `x` ?", code: `let x = 5;\nx = x + 1;`, opts: ["`5`", "`6`", "`\"x + 1\"`"], a: 1, why: "JS lit la valeur actuelle de x (5), ajoute 1, puis range 6 dans x." },
    { q: "Que vaut `\"5\" === 5` ?", opts: ["`true`", "Une erreur", "`false`"], a: 2, why: "`===` compare la valeur ET le type. Un texte et un nombre : false." },
    { q: "Avec `const notes = [12, 15, 9];`, comment lit-on la valeur 9 ?", opts: ["`notes[3]`", "`notes[2]`", "`notes(9)`"], a: 1, why: "Les index commencent à 0 : 12 est en 0, 15 en 1, 9 en 2." },
    { q: "Laquelle de ces fonctions renvoie bien le double de `n` ?", opts: ["`function double(n) { n * 2; }`", "`const double = n * 2;`", "`const double = (n) => n * 2;`"], a: 2, why: "La première oublie `return` : elle renvoie undefined. La deuxième n’est pas une fonction. La fléchée sans accolades renvoie son résultat automatiquement." },
    { q: "Avec `const note = 12;`, qu’affiche ce code ?", code: `if (note >= 16) {\n  console.log("Très bien");\n} else if (note >= 10) {\n  console.log("Validé");\n} else {\n  console.log("À retravailler");\n}`, opts: ["Validé", "Très bien", "Validé, puis À retravailler"], a: 0, why: "12 n’est pas >= 16, mais il est >= 10 : le deuxième bloc s’exécute, et seulement lui." }
  ],
  debrief: "Variables, comparaisons, tableaux, fonctions, conditions : c’est la base de tout programme. Place au tapis roulant !"
},
/* ------------------------------ ATELIER 6 ------------------------------ */
{
  id: "foreach", ch: 6, title: "Pour chaque pièce", notion: "forEach",
  bip: "J’ai 5 pièces à vérifier. Je ne vais pas écrire 5 lignes ! Fais-les passer une par une sur le tapis roulant.",
  prelude: `const pieces = ["roue", "antenne", "ressort", "caméra", "batterie"];`,
  scenarios: [{ prelude: `const pieces = ["roue", "antenne", "ressort", "caméra", "batterie"];` }, { prelude: `const pieces = ["vis", "radar"];`, hidden: true }],
  lesson: {
    what: "`forEach` lance une même fonction **pour chaque élément** d’un tableau, dans l’ordre. Plus besoin d’écrire une ligne par élément : 5 éléments ou 500, c’est le même code.",
    code: `pieces.forEach((piece) => {\n  console.log(piece);\n});`,
    pieces: [["pieces.forEach( )", "« pour chaque élément de pieces… »"], ["(piece) =>", "une fonction fléchée. `piece` prend la valeur de l’élément en cours : \"roue\", puis \"antenne\"…"], ["{ … }", "le code répété à chaque tour"], ["piece", "le nom est libre : `projet`, `item`… Choisis le singulier du tableau"]],
    example: { code: `const prenoms = ["Léo", "Axel"];\nprenoms.forEach((prenom) => {\n  console.log("Salut " + prenom);\n});`, out: "Salut Léo\nSalut Axel" },
    trap: "Le tableau est au pluriel (`pieces`), le paramètre au singulier (`piece`). Si tu écris `pieces` dans la boucle, tu utilises tout le tableau à chaque tour !"
  },
  steps: ["Avec `forEach`, affiche chaque pièce sous la forme `Vérifié : roue`."],
  starter: ``,
  goals: [
    { label: "Les 5 pièces sont vérifiées, dans l’ordre", test: c => { const r = c.runs[0], p = V(r, "pieces"); const ts = logTexts(r).filter(t => t.startsWith("Vérifié")); if (ts.some(t => t.includes(","))) return "Tu affiches tout le tableau d’un coup : utilise le paramètre (au singulier) dans la boucle."; return JSON.stringify(ts) === JSON.stringify(p.map(x => "Vérifié : " + x)); } },
    { label: "Ça marche avec une autre liste (test caché)", test: c => { const r = c.runs[1], p = V(r, "pieces"); return JSON.stringify(logTexts(r).filter(t => t.startsWith("Vérifié"))) === JSON.stringify(p.map(x => "Vérifié : " + x)); } },
    { label: "Tu utilises `forEach`", test: c => /\.forEach\s*\(/.test(c.code) }
  ],
  hints: ["Le squelette : `pieces.forEach((piece) => { ... });`", "Dans la boucle : `console.log(\"Vérifié : \" + piece);`", "Attention à l’espace après les deux-points, dans les guillemets."],
  solution: `pieces.forEach((piece) => {\n  console.log("Vérifié : " + piece);\n});`,
  debrief: "Le jeu a testé ta boucle avec une liste de 2 pièces : ton code s’est adapté tout seul. C’est le principe de la galerie Valmont : un `forEach` sur les projets, une carte par projet."
},
{
  id: "filter", ch: 6, title: "Le grand tri", notion: "filter",
  bip: "Je ne veux que les pièces de moteur, et les pas chères. Trie le catalogue pour moi.",
  prelude: CAT_A,
  scenarios: [{ prelude: CAT_A }, { prelude: CAT_B, hidden: true }],
  lesson: {
    what: "`filter` fabrique un **nouveau tableau** avec seulement les éléments qui passent un test. Le test est une fonction qui renvoie `true` (je garde) ou `false` (je jette). Le tableau d’origine ne change pas.",
    code: `const maisons = projets.filter((projet) => projet.category === "Maisons");`,
    pieces: [["projets.filter( )", "« garde seulement les éléments de projets qui… »"], ["(projet) =>", "chaque élément passe à son tour dans la fonction"], ["projet.category === \"Maisons\"", "le test : true, on garde ; false, on jette"], ["const maisons", "le résultat est un nouveau tableau, qu’on range"]],
    example: { code: `const notes = [8, 14, 11, 6];\nconst reussies = notes.filter((n) => n >= 10);\nconsole.log(reussies);`, out: "[14, 11]" },
    trap: "`filter` ne modifie pas le tableau : si tu ne ranges pas le résultat dans une variable, il est perdu."
  },
  steps: ["Crée `moteurs` : seulement les pièces dont la `categorie` est `\"moteur\"`.", "Crée `pasCher` : seulement les pièces dont le `prix` est inférieur à 10.", "Affiche `moteurs.length`."],
  starter: ``,
  goals: [
    { label: "`moteurs` contient seulement les pièces moteur", test: c => allRuns(c, (r, s) => { const cat = V(r, "catalogue"), m = V(r, "moteurs"); if (!Array.isArray(m)) return false; const ok = JSON.stringify(m.map(p => p && p.nom)) === JSON.stringify(cat.filter(p => p.categorie === "moteur").map(p => p.nom)); return ok || (s.hidden ? "Ça ne marche pas avec le catalogue caché : as-tu écrit les pièces à la main ?" : "`moteurs` n’a pas les bonnes pièces."); }) },
    { label: "`pasCher` contient les pièces à moins de 10", test: c => allRuns(c, r => { const cat = V(r, "catalogue"), m = V(r, "pasCher"); return Array.isArray(m) && JSON.stringify(m.map(p => p && p.nom)) === JSON.stringify(cat.filter(p => p.prix < 10).map(p => p.nom)); }) },
    { label: "La console affiche `moteurs.length`", test: c => { const m = V(c.main, "moteurs"); return Array.isArray(m) && /moteurs\.length/.test(c.code) && hasArg(c.main, a => a === m.length); } },
    { label: "Tu utilises `filter`", test: c => /\.filter\s*\(/.test(c.code) }
  ],
  hints: ["Modèle : `const resultat = tableau.filter((element) => condition);`", "`const moteurs = catalogue.filter((piece) => piece.categorie === \"moteur\");`", "Pour pasCher, la condition devient `piece.prix < 10`."],
  solution: `const moteurs = catalogue.filter((piece) => piece.categorie === "moteur");\nconst pasCher = catalogue.filter((piece) => piece.prix < 10);\n\nconsole.log(moteurs.length);`,
  debrief: "Tu viens d’écrire le cœur du filtre Valmont. Sur le site, le clic sur « Maisons » fait exactement ça, puis redessine la galerie avec le résultat."
},
/* ------------------------------ ATELIER 7 ------------------------------ */
{
  id: "dom", ch: 7, title: "Toucher la page", notion: "querySelector",
  bip: "Jusqu’ici je parlais seulement dans la console. Maintenant, je veux changer ce que les gens voient sur la page !",
  stage: `<div class="panneau">\n  <p class="etiquette">Atelier n°7</p>\n  <h2 class="titre">Atelier fermé</h2>\n  <p class="statut">Bip dort.</p>\n</div>`,
  lesson: {
    what: "Le **DOM**, c’est la page HTML vue par JavaScript : chaque balise devient un objet qu’on peut lire et modifier. On attrape un élément avec `document.querySelector`, en lui donnant un sélecteur CSS.",
    code: `const titre = document.querySelector(".titre");\ntitre.textContent = "Nouveau titre";\ntitre.classList.add("actif");`,
    pieces: [["document", "la page"], [".querySelector(\".titre\")", "trouve le premier élément qui correspond au sélecteur, comme en CSS : `.classe`, `#id`, `h2`"], [".textContent = …", "remplace le texte de l’élément"], [".classList.add(\"actif\")", "ajoute une classe : le CSS fait le reste"], [".classList.remove( )", "retire une classe"]],
    example: { code: `const bouton = document.querySelector(".button");\nbouton.textContent = "Envoyé";`, out: "(le texte du bouton change sur la page)" },
    trap: "`querySelector(\"titre\")` sans le point cherche une balise `<titre>`, qui n’existe pas. Résultat : `null`, puis l’erreur « Cannot read properties of null ». Vérifie toujours ton sélecteur."
  },
  steps: ["Regarde l’onglet **Page** : voici le HTML que tu vas modifier.", "Change le texte de `.titre` en `Atelier ouvert`.", "Change le texte de `.statut` en `Bip est réveillé !`.", "Ajoute la classe `ouvert` à `.panneau`."],
  starter: `// Le HTML de la page est visible dans l'onglet Page\n`,
  goals: [
    { label: "`.titre` affiche `Atelier ouvert`", test: c => txt(c.runs[0].stage, ".titre") === "Atelier ouvert" },
    { label: "`.statut` affiche `Bip est réveillé !`", test: c => txt(c.runs[0].stage, ".statut") === "Bip est réveillé !" },
    { label: "`.panneau` a la classe `ouvert`", test: c => { const p = c.runs[0].stage.querySelector(".panneau"); return !!p && p.classList.contains("ouvert"); } }
  ],
  hints: ["D’abord attraper : `const titre = document.querySelector(\".titre\");`", "Puis changer : `titre.textContent = \"Atelier ouvert\";`", "Pour la classe : `document.querySelector(\".panneau\").classList.add(\"ouvert\");`"],
  solution: `const titre = document.querySelector(".titre");\nconst statut = document.querySelector(".statut");\nconst panneau = document.querySelector(".panneau");\n\ntitre.textContent = "Atelier ouvert";\nstatut.textContent = "Bip est réveillé !";\npanneau.classList.add("ouvert");`,
  debrief: "JavaScript ne change pas le fichier HTML : il change la page **affichée**. Recharge et tout revient. Pour le style, la bonne pratique : JS ajoute une classe, le CSS décide du look."
},
{
  id: "creer", ch: 7, title: "Fabriquer des éléments", notion: "createElement",
  bip: "Affiche ma liste de pièces sur la page, une ligne par pièce. Comme la galerie de Valmont, mais en petit.",
  prelude: `const pieces = ["roue", "antenne", "ressort", "caméra", "batterie"];`,
  scenarios: [{ prelude: `const pieces = ["roue", "antenne", "ressort", "caméra", "batterie"];` }, { prelude: `const pieces = ["vis", "radar", "micro"];`, hidden: true }],
  stage: `<h2>Mes pièces</h2>\n<ul class="liste"></ul>\n<p class="compteur">0 pièce</p>`,
  lesson: {
    what: "JavaScript peut aussi **fabriquer** des éléments. On les crée, on les remplit, puis on les accroche dans la page. Avec `forEach`, on fabrique un élément par donnée : c’est comme ça qu’on affiche une galerie, des produits, des articles.",
    code: `const liste = document.querySelector(".liste");\n\nconst li = document.createElement("li");\nli.textContent = "roue";\nliste.appendChild(li);`,
    pieces: [["document.createElement(\"li\")", "crée une balise `<li>`. Elle existe en mémoire, mais pas encore sur la page"], ["li.textContent = …", "on la remplit"], ["liste.appendChild(li)", "on l’ajoute à la fin de `liste` : maintenant elle s’affiche"], ["li.classList.add(\"card\")", "on peut aussi lui donner une classe pour le CSS"]],
    example: { code: `const p = document.createElement("p");\np.textContent = "Coucou";\ndocument.body.appendChild(p);`, out: "(un paragraphe « Coucou » apparaît)" },
    trap: "Créer l’élément ne suffit pas : sans `appendChild`, il reste invisible. Et crée le `li` **dans** le `forEach`, pour en avoir un nouveau à chaque tour."
  },
  steps: ["Attrape la liste `.liste`.", "Pour chaque pièce (`forEach`), crée un `li` avec `document.createElement`, mets le nom de la pièce dedans et ajoute-le à la liste avec `appendChild`.", "Affiche le nombre de pièces dans `.compteur`, sous la forme `5 pièces`."],
  starter: `const liste = document.querySelector(".liste");\nconst compteur = document.querySelector(".compteur");\n\n`,
  goals: [
    { label: "La liste affiche les 5 pièces, dans l’ordre", test: c => { const r = c.runs[0]; const lis = [...r.stage.querySelectorAll(".liste li")].map(e => norm(e.textContent)); if (lis.length === 1 && V(r, "pieces").length > 1) return "Un seul `li` : as-tu créé l’élément dans le forEach ?"; return JSON.stringify(lis) === JSON.stringify(V(r, "pieces")); } },
    { label: "Ça marche avec une autre liste (test caché)", test: c => { const r = c.runs[1]; return JSON.stringify([...r.stage.querySelectorAll(".liste li")].map(e => norm(e.textContent))) === JSON.stringify(V(r, "pieces")); } },
    { label: "`.compteur` affiche le nombre de pièces", test: c => allRuns(c, r => { const t = txt(r.stage, ".compteur"); const n = V(r, "pieces").length; if (t === n + " pièces") return true; return t && t.startsWith(String(n)) ? "Presque : le texte doit être exactement « " + n + " pièces »." : false; }) }
  ],
  hints: ["Le squelette : `pieces.forEach((piece) => { ... });`", "Dans la boucle : `const li = document.createElement(\"li\");` puis `li.textContent = piece;` puis `liste.appendChild(li);`", "Après la boucle : `compteur.textContent = pieces.length + \" pièces\";`"],
  solution: `const liste = document.querySelector(".liste");\nconst compteur = document.querySelector(".compteur");\n\npieces.forEach((piece) => {\n  const li = document.createElement("li");\n  li.textContent = piece;\n  liste.appendChild(li);\n});\n\ncompteur.textContent = pieces.length + " pièces";`,
  debrief: "C’est l’étape 2 de Valmont en miniature : un tableau de données, un `forEach`, un `createElement` par élément. Change les données, la page suit."
},
{
  id: "clic", ch: 7, title: "Le bouton", notion: "addEventListener",
  bip: "Une page vivante réagit quand on clique. Donne-moi un bouton pour me recharger !",
  stage: `<div class="chargeur">\n  <p class="batterie">Batterie : 0 %</p>\n  <button class="recharger">Recharger</button>\n</div>`,
  lesson: {
    what: "Un **événement**, c’est quelque chose qui arrive sur la page : un clic, une touche, un formulaire envoyé. `addEventListener` dit à un élément : « quand cet événement arrive, lance cette fonction ».",
    code: `const bouton = document.querySelector(".recharger");\n\nbouton.addEventListener("click", () => {\n  console.log("Clic !");\n});`,
    pieces: [["bouton.addEventListener( )", "« écoute ce bouton »"], ["\"click\"", "le nom de l’événement. Autres : `\"input\"`, `\"submit\"`, `\"mouseenter\"`"], ["() => { … }", "la fonction lancée **à chaque clic**, et seulement au clic"]],
    example: { code: `let clics = 0;\nbouton.addEventListener("click", () => {\n  clics = clics + 1;\n  console.log(clics);\n});`, out: "(1, puis 2, puis 3… à chaque clic)" },
    trap: "Le code dans la fonction ne s’exécute pas au chargement, seulement au clic. Si ta variable est créée **dans** la fonction, elle repart de 0 à chaque clic : crée-la avant, dehors."
  },
  steps: ["Crée une variable `batterie` qui vaut 0 (elle va changer : `let` ou `const` ?).", "Au clic sur `.recharger` : ajoute 25 à `batterie` et affiche `Batterie : 25 %` dans `.batterie`.", "Si `batterie` atteint 100, le texte du bouton devient `Plein !`.", "Clique sur le bouton dans l’onglet **Page** pour tester toi-même."],
  starter: `const texte = document.querySelector(".batterie");\nconst bouton = document.querySelector(".recharger");\n\n`,
  goals: [
    { label: "Après 1 clic : `Batterie : 25 %`", test: c => { const r = freshRun(c); const b = r.stage.querySelector(".recharger"); if (!b) return false; b.click(); const t = txt(r.stage, ".batterie"); if (t === "Batterie : 25 %") return true; if (t === "Batterie : 0 %") return "Après un clic, le texte n’a pas changé."; return t && t.includes("25") ? "Presque : le texte doit être exactement « Batterie : 25 % »." : false; } },
    { label: "Après 4 clics : `Batterie : 100 %`", test: c => { const r = freshRun(c); const b = r.stage.querySelector(".recharger"); if (!b) return false; for (let i = 0; i < 4; i++) b.click(); const t = txt(r.stage, ".batterie"); if (t === "Batterie : 100 %") return true; return t === "Batterie : 25 %" ? "Après 4 clics on lit encore 25 % : ta variable est sûrement créée dans la fonction du clic." : false; } },
    { label: "À 100, le bouton affiche `Plein !` (pas avant)", test: c => { const r = freshRun(c); const b = r.stage.querySelector(".recharger"); if (!b) return false; b.click(); if (norm(b.textContent) === "Plein !") return "Le bouton affiche « Plein ! » dès le premier clic : vérifie ta condition."; for (let i = 0; i < 3; i++) b.click(); return norm(b.textContent) === "Plein !"; } },
    { label: "Tu utilises `addEventListener`", test: c => /addEventListener\s*\(\s*["']click["']/.test(c.code) }
  ],
  hints: ["Dehors : `let batterie = 0;` puis `bouton.addEventListener(\"click\", () => { ... });`", "Dans la fonction : `batterie = batterie + 25;` puis `texte.textContent = \"Batterie : \" + batterie + \" %\";`", "Toujours dans la fonction : `if (batterie >= 100) { bouton.textContent = \"Plein !\"; }`"],
  solution: `const texte = document.querySelector(".batterie");\nconst bouton = document.querySelector(".recharger");\n\nlet batterie = 0;\n\nbouton.addEventListener("click", () => {\n  batterie = batterie + 25;\n  texte.textContent = "Batterie : " + batterie + " %";\n\n  if (batterie >= 100) {\n    bouton.textContent = "Plein !";\n  }\n});`,
  debrief: "Ta page réagit aux humains. Variable dehors, mise à jour dedans, affichage dans le DOM : ce trio est la base de toute interface, du bouton « J’aime » au panier d’une boutique."
},
{
  id: "boss", ch: 7, boss: true, title: "La galerie de Bip", notion: "tout ensemble",
  bip: "Dernière mission. Construis ma galerie avec des boutons de filtre. Si tu y arrives, tu sais faire le cœur du projet Valmont !",
  prelude: CAT_BOSS,
  stage: `<div class="filtres">\n  <button class="btn-tout">Tout</button>\n  <button class="btn-moteur">Moteur</button>\n  <button class="btn-capteur">Capteur</button>\n</div>\n<div class="galerie"></div>`,
  lesson: {
    what: "Pas de nouvelle notion : tu as déjà tout. Le secret, c’est une fonction `afficher` qui **vide** la galerie puis la **redessine** à partir d’une liste. Chaque bouton lui donne une liste différente.",
    code: `function afficher(liste) {\n  galerie.innerHTML = "";        // 1. on vide\n  liste.forEach((piece) => {     // 2. on redessine\n    // créer, remplir, ajouter\n  });\n}\n\nafficher(catalogue);           // au départ : tout`,
    pieces: [["galerie.innerHTML = \"\"", "vide la galerie, sinon les cartes s’empilent à chaque clic"], ["afficher(catalogue)", "tout le catalogue"], ["catalogue.filter(…)", "une liste réduite, donnée à la même fonction"], ["addEventListener(\"click\", …)", "chaque bouton appelle `afficher` avec sa liste"]],
    example: { code: `btnMoteur.addEventListener("click", () => {\n  const moteurs = catalogue.filter((p) => p.categorie === "moteur");\n  afficher(moteurs);\n});`, out: "(la galerie n’affiche plus que les moteurs)" },
    trap: "Si les cartes se dupliquent à chaque clic, c’est que la galerie n’est pas vidée au début de `afficher`."
  },
  steps: ["Complète `afficher(liste)` : pour chaque pièce, crée une `div`, donne-lui la classe `carte`, mets le nom de la pièce dedans et ajoute-la à `galerie`.", "Appelle `afficher(catalogue)` pour tout montrer au chargement.", "Au clic sur `.btn-moteur`, affiche seulement les pièces `\"moteur\"` (avec `filter`). Pareil pour `.btn-capteur`.", "Au clic sur `.btn-tout`, réaffiche tout le catalogue."],
  starter: `const galerie = document.querySelector(".galerie");\nconst btnTout = document.querySelector(".btn-tout");\nconst btnMoteur = document.querySelector(".btn-moteur");\nconst btnCapteur = document.querySelector(".btn-capteur");\n\n// 1. La fonction qui dessine une liste de pièces\nfunction afficher(liste) {\n  galerie.innerHTML = "";\n  // À toi : pour chaque pièce, une div.carte avec son nom\n}\n\n// 2. Tout afficher au départ\n\n\n// 3. Les boutons\n\n`,
  goals: [
    { label: "Au départ, la galerie montre les 5 pièces", test: c => { const r = freshRun(c); const names = cardNames(r.stage); if (names.length === 5 && names.join() === "Roue,Antenne,Ressort,Caméra,Turbo") return true; const any = r.stage.querySelectorAll(".galerie > *").length; if (any && !names.length) return "Les cartes n’ont pas la classe `carte`."; return any ? false : "La galerie est vide : as-tu appelé `afficher(catalogue)` ?"; } },
    { label: "Le bouton Moteur montre les 3 moteurs", test: c => { const r = freshRun(c); const b = r.stage.querySelector(".btn-moteur"); b.click(); const n = cardNames(r.stage); if (n.join() === "Roue,Ressort,Turbo") return true; return n.length === 8 ? "Les cartes s’ajoutent au lieu de se remplacer : la galerie doit être vidée au début d’`afficher`." : false; } },
    { label: "Le bouton Capteur montre les 2 capteurs", test: c => { const r = freshRun(c); r.stage.querySelector(".btn-capteur").click(); return cardNames(r.stage).join() === "Antenne,Caméra"; } },
    { label: "Le bouton Tout réaffiche les 5 pièces", test: c => { const r = freshRun(c); r.stage.querySelector(".btn-moteur").click(); r.stage.querySelector(".btn-tout").click(); return cardNames(r.stage).length === 5; } }
  ],
  hints: ["Dans `afficher` : `liste.forEach((piece) => { const carte = document.createElement(\"div\"); ... });`", "Dans la boucle : `carte.classList.add(\"carte\");` `carte.textContent = piece.nom;` `galerie.appendChild(carte);` Puis, après la fonction : `afficher(catalogue);`", "Un bouton : `btnMoteur.addEventListener(\"click\", () => { afficher(catalogue.filter((p) => p.categorie === \"moteur\")); });`"],
  solution: `const galerie = document.querySelector(".galerie");\nconst btnTout = document.querySelector(".btn-tout");\nconst btnMoteur = document.querySelector(".btn-moteur");\nconst btnCapteur = document.querySelector(".btn-capteur");\n\n// 1. La fonction qui dessine une liste de pièces\nfunction afficher(liste) {\n  galerie.innerHTML = "";\n  liste.forEach((piece) => {\n    const carte = document.createElement("div");\n    carte.classList.add("carte");\n    carte.textContent = piece.nom;\n    galerie.appendChild(carte);\n  });\n}\n\n// 2. Tout afficher au départ\nafficher(catalogue);\n\n// 3. Les boutons\nbtnTout.addEventListener("click", () => {\n  afficher(catalogue);\n});\n\nbtnMoteur.addEventListener("click", () => {\n  const moteurs = catalogue.filter((p) => p.categorie === "moteur");\n  afficher(moteurs);\n});\n\nbtnCapteur.addEventListener("click", () => {\n  const capteurs = catalogue.filter((p) => p.categorie === "capteur");\n  afficher(capteurs);\n});`,
  debrief: "Données, fonction, boucle, filtre, DOM et événements : tout fonctionne ensemble. C’est l’architecture de la galerie Valmont, et celle de n’importe quel CMS : une collection, un template, des filtres."
}
];

const SANDBOX = {
  id: "bac-a-sable", sandbox: true, ch: 0, title: "Bac à sable", notion: "essais libres",
  bip: "Ici, pas de mission : essaie ce que tu veux. La console, la mémoire et la page te montrent tout ce que fait ton code.",
  stage: `<h2 class="titre">Ma page de test</h2>\n<p class="texte">Modifie-moi avec JavaScript.</p>\n<button class="bouton">Un bouton</button>\n<ul class="liste"></ul>`,
  starter: `// Essaie ce que tu veux ici, puis clique sur Lancer\nconst prenoms = ["Inès", "Tom", "Yanis"];\n\nprenoms.forEach((prenom) => {\n  console.log("Salut " + prenom);\n});\n\nconst bouton = document.querySelector(".bouton");\nbouton.addEventListener("click", () => {\n  bouton.textContent = "Cliqué !";\n});\n`
};

/* =====================================================================
   ÉTAT ET SAUVEGARDE
   ===================================================================== */
const KEY = "mission-bip-v1";
let store = { progress: {}, drafts: {}, unlockAll: false };
try { const raw = localStorage.getItem(KEY); if (raw) store = Object.assign(store, JSON.parse(raw)); } catch (e) { /* pas de stockage : on joue sans sauvegarde */ }
function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* rien */ } }

let current = null;
let session = null;
let silent = false;
const silentErrors = [];
let liveRun = null;

/* =====================================================================
   OUTILS
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
const md = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
const levelIndex = id => LEVELS.findIndex(l => l.id === id);
const isDone = id => !!store.progress[id];
const isUnlocked = i => store.unlockAll || i === 0 || isDone(LEVELS[i - 1].id) || isDone(LEVELS[i].id);
const chapterDone = n => LEVELS.filter(l => l.ch === n).every(l => isDone(l.id));
const doneChapters = () => new Set(CHAPTERS.filter(c => chapterDone(c.n)).map(c => c.n));
const totalStars = () => Object.values(store.progress).reduce((s, p) => s + (p.stars || 0), 0);
const nextLevel = () => LEVELS.find((l, i) => !isDone(l.id) && isUnlocked(i)) || null;
const starsHTML = n => "★".repeat(n) + `<span class="off">${"★".repeat(3 - n)}</span>`;

/* ---------- Coloration du code ---------- */
const KW = new Set(["let", "const", "var", "function", "return", "if", "else", "true", "false", "null", "undefined", "new", "typeof", "of", "in"]);
function highlight(src) {
  const re = /(\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|`(?:[^`\\]|\\.)*`?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$À-ÿ][\w$À-ÿ]*)|(=>|===|!==|>=|<=|&&|\|\||[=+\-*/%<>!])/g;
  let out = "", last = 0, m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index));
    const t = m[0];
    let cls = "o";
    if (m[1]) cls = "c";
    else if (m[2]) cls = "s";
    else if (m[3]) cls = "n";
    else if (m[4]) {
      if (KW.has(t)) cls = "k";
      else {
        const prev = src[m.index - 1];
        const call = /^\s*\(/.test(src.slice(re.lastIndex));
        cls = prev === "." ? (call ? "m" : "p") : (call ? "f" : "v");
      }
    }
    out += `<span class="t-${cls}">${esc(t)}</span>`;
    last = re.lastIndex;
  }
  return out + esc(src.slice(last));
}

/* ---------- Affichage des valeurs ---------- */
const isEl = v => typeof Node !== "undefined" && v instanceof Node;
function fmt(v, top, d = 0) {
  if (typeof v === "string") return top ? v : JSON.stringify(v);
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "function") return "ƒ " + (v.name || "anonyme") + "()";
  if (isEl(v)) return elLabel(v);
  if (Array.isArray(v)) return d > 2 ? "[…]" : "[" + v.map(x => fmt(x, false, d + 1)).join(", ") + "]";
  if (typeof v === "object") { if (d > 2) return "{…}"; const e = Object.entries(v); return e.length ? "{ " + e.map(([k, x]) => k + ": " + fmt(x, false, d + 1)).join(", ") + " }" : "{}"; }
  return String(v);
}
function elLabel(v) {
  if (v.nodeType !== 1) return "#texte";
  const cls = v.className && typeof v.className === "string" && v.className.trim() ? " class=\"" + v.className.trim() + "\"" : "";
  return "<" + v.tagName.toLowerCase() + cls + ">";
}
function fmtHTML(v, top, d = 0) {
  const s = (c, t) => `<span class="${c}">${esc(t)}</span>`;
  if (typeof v === "string") return s("v-str", top ? v : JSON.stringify(v));
  if (v === null || v === undefined) return s("v-null", String(v));
  if (typeof v === "number") return s("v-num", String(v));
  if (typeof v === "boolean") return s("v-bool", String(v));
  if (typeof v === "function") return s("v-fn", "ƒ " + (v.name || "anonyme") + "()");
  if (isEl(v)) return s("v-el", elLabel(v));
  if (Array.isArray(v)) return d > 2 ? s("v-punc", "[…]") : s("v-punc", "[") + v.map(x => fmtHTML(x, false, d + 1)).join(s("v-punc", ", ")) + s("v-punc", "]");
  if (typeof v === "object") {
    if (d > 2) return s("v-punc", "{…}");
    const e = Object.entries(v);
    return e.length ? s("v-punc", "{ ") + e.map(([k, x]) => esc(k) + s("v-punc", ": ") + fmtHTML(x, false, d + 1)).join(s("v-punc", ", ")) + s("v-punc", " }") : s("v-punc", "{}");
  }
  return esc(String(v));
}
function typeInfo(v) {
  if (typeof v === "string") return ["string · texte", "var(--t-str)"];
  if (typeof v === "number") return ["number · nombre", "var(--t-num)"];
  if (typeof v === "boolean") return ["boolean · vrai/faux", "var(--t-bool)"];
  if (typeof v === "function") return ["function · fonction", "var(--t-fn)"];
  if (v === null) return ["null · vide", "var(--t-null)"];
  if (isEl(v)) return ["élément HTML", "var(--t-el)"];
  if (Array.isArray(v)) return ["array · tableau", "var(--t-arr)"];
  return ["object · objet", "var(--t-obj)"];
}
function snap(v) {
  if (v && typeof v === "object" && !isEl(v)) { try { return structuredClone(v); } catch (e) { return v; } }
  return v;
}

/* =====================================================================
   EXÉCUTION DU CODE DES ÉLÈVES
   ===================================================================== */
function declaredNames(src) {
  const clean = src.replace(/\/\/[^\n]*/g, "").replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, "\"\"");
  const names = [];
  const re = /\b(?:let|const|var|function)\s+([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = re.exec(clean))) if (!names.includes(m[1]) && !["console", "document", "alert"].includes(m[1])) names.push(m[1]);
  return names;
}
function makeDoc(stage) {
  return {
    querySelector: s => stage.querySelector(s),
    querySelectorAll: s => stage.querySelectorAll(s),
    getElementById: id => stage.querySelector("#" + CSS.escape(id)),
    createElement: t => document.createElement(t),
    createTextNode: t => document.createTextNode(t),
    body: stage
  };
}
function makeConsole(logs, live) {
  const add = kind => (...args) => {
    const entry = { kind, args: args.map(snap), text: args.map(a => fmt(a, true)).join(" "), html: args.map(a => fmtHTML(a, true)).join(" ") };
    logs.push(entry);
    if (live && liveRun && liveRun.logs === logs && liveRun.ready) appendLog(entry, true);
  };
  return { log: add("log"), info: add("log"), warn: add("warn"), error: add("error"), table: add("log") };
}
function execute(L, code, scen, stage, live) {
  const logs = [];
  const con = makeConsole(logs, live);
  const prelude = (scen && scen.prelude) || L.prelude || "";
  const preludeLines = prelude.split("\n").length;
  const names = declaredNames(prelude + "\n" + code);
  const body = "\"use strict\";\n" + prelude + "\n" + code + "\n;return {" + names.map(n => JSON.stringify(n) + ": (typeof " + n + " !== \"undefined\" ? " + n + " : undefined)").join(", ") + "};";
  let vars = {}, error = null;
  try {
    const fn = new Function("console", "document", "alert", body);
    vars = fn(con, makeDoc(stage), m => con.log("[alerte] " + m)) || {};
  } catch (e) { error = e; }
  return { logs, vars, error, stage, scenario: scen, preludeNames: declaredNames(prelude), preludeLines };
}
function freshRun(c) {
  const st = document.createElement("div");
  st.innerHTML = c.L.stage || "";
  return execute(c.L, c.code, c.L.scenarios ? c.L.scenarios[0] : null, st, false);
}

/* ---------- Erreurs expliquées ---------- */
const ERRORS = [
  [/^(.+) is not defined$/, m => "JavaScript ne connaît pas `" + m[1] + "`. Trois causes possibles : une faute de frappe (les majuscules comptent), une variable pas encore créée avec `let` ou `const`, ou du texte oublié sans guillemets."],
  [/Assignment to constant variable/, () => "Tu essaies de changer une variable créée avec `const`. Si sa valeur doit changer, crée-la avec `let`."],
  [/Identifier '(.+)' has already been declared/, m => "`" + m[1] + "` existe déjà. On écrit `let` ou `const` une seule fois ; ensuite on utilise juste le nom. Attention : une variable déjà écrite par le jeu ne se recrée pas."],
  [/Cannot (?:read|set) properties of null \(\w+ '(.+)'\)/, m => "Tu utilises `." + m[1] + "` sur quelque chose qui vaut `null` (rien). Le plus souvent, `querySelector` n’a pas trouvé l’élément : vérifie le sélecteur (un point pour une classe, # pour un id) dans l’onglet Page."],
  [/Cannot (?:read|set) properties of undefined \(\w+ '(.+)'\)/, m => "Tu utilises `." + m[1] + "` sur une valeur `undefined`. Vérifie le nom de la variable ou l’index du tableau (on commence à 0)."],
  [/^(.+) is not a function$/, m => "`" + m[1] + "` n’est pas une fonction. Vérifie l’orthographe (`querySelector`, `addEventListener`, `forEach`…) ou retire les parenthèses si c’est une propriété comme `length`."],
  [/is not a valid selector/, () => "Le sélecteur n’est pas valide. Il doit ressembler à du CSS : `.classe`, `#id` ou une balise comme `h2`."],
  [/missing \) after argument list/, () => "Il manque une parenthèse fermante `)`, ou un `+` / une virgule entre deux morceaux."],
  [/Invalid or unexpected token/, () => "Un caractère pose problème. Souvent : un texte dont le guillemet n’est pas refermé, ou des guillemets typographiques « » ou “ ” au lieu de `\"`."],
  [/Unexpected end of input/, () => "Le code s’arrête trop tôt : il manque sûrement une accolade `}` ou une parenthèse `)` de fermeture."],
  [/Unexpected token '(.+)'/, m => "JavaScript ne s’attendait pas à `" + m[1] + "` ici. Regarde juste avant : parenthèse, virgule, accolade ou guillemet manquant ou en trop."],
  [/Unexpected identifier/, () => "Un mot est mal placé. Il manque souvent un `+`, une virgule, un point ou des guillemets juste avant."],
  [/Unexpected string/, () => "Un texte est mal placé : il manque souvent un `+` ou une virgule juste avant."],
  [/Unexpected number/, () => "Un nombre est mal placé : il manque souvent un opérateur (`+`, `*`…) ou une virgule juste avant."],
  [/Unexpected token/, () => "Il y a un symbole inattendu. Vérifie les parenthèses, accolades, virgules et guillemets."],
  [/is not iterable|forEach/, () => "Tu essaies de parcourir quelque chose qui n’est pas un tableau."]
];
function explain(err) {
  const msg = String(err && err.message || err);
  for (const [re, fn] of ERRORS) { const m = msg.match(re); if (m) return fn(m); }
  return "JavaScript s’est arrêté sur une erreur. Lis le message d’origine ci-dessous : il dit souvent quel mot pose problème.";
}
function errorLine(err, code, preludeLines) {
  if (err instanceof SyntaxError) {
    if (window.acorn) {
      try { window.acorn.parse(code, { ecmaVersion: "latest", sourceType: "script" }); }
      catch (e) { if (e.loc) return e.loc.line; }
    }
    return null;
  }
  const m = String(err && err.stack || "").match(/<anonymous>:(\d+):\d+/);
  if (m) { const n = +m[1] - 3 - preludeLines; if (n >= 1 && n <= code.split("\n").length) return n; }
  return null;
}

window.addEventListener("error", ev => {
  if (!ev.error) return;
  if (silent) { silentErrors.push(ev.error); ev.preventDefault(); return; }
  if (liveRun && liveRun.ready) {
    ev.preventDefault();
    const box = $("#console-out");
    if (box) { box.appendChild(errorBox(ev.error, null, "pendant un clic")); setBadges(true); setMood("oops"); }
  }
});

/* =====================================================================
   BIP
   ===================================================================== */
function bipSVG(done, mood) {
  const has = n => done.has(n);
  const g = (n, cls) => has(n) ? "part " + (cls || "") : "ghost";
  let eyes, mouth;
  const m = mood || (has(1) ? "idle" : "sleep");
  if (m === "happy") { eyes = `<path class="lid" d="M66 88 q12 -16 24 0"/><path class="lid" d="M110 88 q12 -16 24 0"/>`; mouth = `<path class="mouth" d="M84 102 q16 16 32 0"/>`; }
  else if (m === "oops") { eyes = `<path class="x" d="M70 74 l16 16 M86 74 l-16 16"/><path class="x" d="M114 74 l16 16 M130 74 l-16 16"/>`; mouth = `<path class="mouth" d="M88 112 q12 -9 24 0"/>`; }
  else if (m === "sleep") { eyes = `<path class="lid" d="M68 84 h20"/><path class="lid" d="M112 84 h20"/>`; mouth = `<path class="mouth" d="M92 106 h16"/>`; }
  else { eyes = `<circle class="eye" cx="78" cy="82" r="11"/><circle class="glint" cx="82" cy="78" r="3.5"/><circle class="eye" cx="122" cy="82" r="11"/><circle class="glint" cx="126" cy="78" r="3.5"/>`; mouth = `<path class="mouth" d="M88 104 q12 9 24 0"/>`; }
  return `<svg class="bip" viewBox="0 0 200 232" aria-hidden="true">
    <g class="${g(2)}"><line x1="100" y1="42" x2="100" y2="18" stroke-width="5" stroke-linecap="round"/><circle class="tip" cx="100" cy="14" r="8"/></g>
    <g class="${g(3)}"><rect x="34" y="142" width="22" height="50" rx="11"/><rect x="144" y="142" width="22" height="50" rx="11"/></g>
    <g class="${g(5, "wheels")}"><circle cx="76" cy="212" r="15"/><circle cx="124" cy="212" r="15"/>${has(5) ? `<circle class="hub" cx="76" cy="212" r="5"/><circle class="hub" cx="124" cy="212" r="5"/>` : ""}</g>
    <rect class="neck" x="88" y="124" width="24" height="14"/>
    <rect class="body ${has(6) ? "painted" : ""}" x="58" y="134" width="84" height="66" rx="16"/>
    <g class="${g(4, "screen")}"><rect x="74" y="146" width="52" height="30" rx="7"/>${has(4) ? `<text x="100" y="166" text-anchor="middle">&lt;/&gt;</text>` : ""}</g>
    ${has(7) ? `<path class="heart" d="M100 194 c-7 -5 -11 -8 -11 -12 a5.5 5.5 0 0 1 11 -2 a5.5 5.5 0 0 1 11 2 c0 4 -4 7 -11 12z"/>` : `<g class="ghost"><path d="M100 194 c-7 -5 -11 -8 -11 -12 a5.5 5.5 0 0 1 11 -2 a5.5 5.5 0 0 1 11 2 c0 4 -4 7 -11 12z"/></g>`}
    <rect class="head" x="36" y="40" width="128" height="88" rx="30"/>
    ${eyes}${mouth}
    ${has(7) ? `<ellipse class="cheek" cx="58" cy="100" rx="8" ry="5"/><ellipse class="cheek" cx="142" cy="100" rx="8" ry="5"/>` : ""}
  </svg>`;
}
function setMood(mood) { const s = $("#says-bip"); if (s) s.innerHTML = bipSVG(doneChapters(), mood); }

/* =====================================================================
   NAVIGATION
   ===================================================================== */
function setView(name) {
  ["map", "level", "notebook"].forEach(v => { $("#view-" + v).hidden = v !== name; });
  $("#nav-map").toggleAttribute("aria-current", name === "map");
  $("#nav-notebook").toggleAttribute("aria-current", name === "notebook");
  $("#nav-sandbox").toggleAttribute("aria-current", !!(name === "level" && current && current.sandbox));
  ["nav-map", "nav-notebook", "nav-sandbox"].forEach(id => { const b = $("#" + id); if (b.hasAttribute("aria-current")) b.setAttribute("aria-current", "page"); });
  if (name !== "level") liveRun = null;
  window.scrollTo(0, 0);
}
function setHash(h) { if (location.hash !== "#" + h) history.replaceState(null, "", "#" + h); }
function route() {
  const h = location.hash.slice(1);
  if (h === "carnet") return showNotebook();
  if (h === SANDBOX.id) return openLevel(SANDBOX.id);
  if (h.startsWith("mission-")) { const id = h.slice(8); const i = levelIndex(id); if (i >= 0 && isUnlocked(i)) return openLevel(id); }
  showMap();
}
function updateStats() {
  $("#stat-stars").textContent = totalStars();
  $("#stat-max").textContent = LEVELS.length * 3;
  $("#stat-done").textContent = LEVELS.filter(l => isDone(l.id)).length;
  $("#stat-total").textContent = LEVELS.length;
  $("#brand-bip").innerHTML = bipSVG(doneChapters());
}

/* =====================================================================
   VUE : CARTE
   ===================================================================== */
function showMap() {
  current = null; setHash("carte");
  const done = doneChapters();
  const nb = LEVELS.filter(l => isDone(l.id)).length;
  const pct = Math.round(nb / LEVELS.length * 100);
  const nxt = nextLevel();
  const nxtIdx = nxt ? levelIndex(nxt.id) + 1 : 0;
  const allDone = nb === LEVELS.length;
  $("#view-map").innerHTML = `
  <section class="hero">
    <div>
      <p class="kicker">JavaScript pour débutants · ${LEVELS.length} missions</p>
      <h1>Mission <span>Bip</span></h1>
      <p class="lead">Bip est un robot rangé au fond d’un atelier. Il ne comprend qu’une langue : le JavaScript. Écris du vrai code, regarde ce qu’il fait, et rends à Bip une pièce à chaque atelier terminé.</p>
      <div class="hero-actions">
        ${allDone ? `<button class="btn btn-primary" type="button" data-open="${SANDBOX.id}">Bip est réparé ! Ouvrir le bac à sable</button>` : `<button class="btn btn-primary" type="button" data-open="${nxt.id}">${nb ? "Continuer" : "Commencer"} : mission ${nxtIdx}</button>`}
        <button class="btn" type="button" data-open="${SANDBOX.id}">Bac à sable</button>
      </div>
      <div class="progress">
        <div class="progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progression"><span style="width: ${pct}%"></span></div>
        <p>${nb} / ${LEVELS.length} missions · ${totalStars()} ★ sur ${LEVELS.length * 3} · ${done.size} / 7 pièces</p>
      </div>
    </div>
    <div class="hero-bip">
      <div class="bob">${bipSVG(done, allDone ? "happy" : null)}</div>
      <ul class="parts">${CHAPTERS.map(c => `<li class="${done.has(c.n) ? "got" : ""}">${done.has(c.n) ? "✓ " : ""}${esc(c.piece)}</li>`).join("")}</ul>
    </div>
  </section>
  <section class="howto" aria-label="Comment jouer">
    <div><b>1</b><p>Lis ce que demande Bip, la mission et la petite leçon.</p></div>
    <div><b>2</b><p>Écris ton code et clique sur <strong>Lancer</strong> (ou Ctrl + Entrée).</p></div>
    <div><b>3</b><p>Regarde la <strong>Console</strong>, la <strong>Mémoire</strong> et la <strong>Page</strong> pour comprendre ce qui s’est passé.</p></div>
    <div><b>★</b><p>3 étoiles sans indice, 2 avec un indice, 1 avec la solution.</p></div>
  </section>
  <div class="section-title"><h2>Les 7 ateliers</h2><p>Chaque atelier terminé rend une pièce à Bip.</p></div>
  <section class="chapters">
    ${CHAPTERS.map(c => `
      <article class="chap ${done.has(c.n) ? "done" : ""}">
        <div class="chap-top"><span>Atelier ${c.n}</span><span class="chap-piece ${done.has(c.n) ? "got" : ""}">${done.has(c.n) ? "✓ " : "Pièce : "}${esc(c.piece)}</span></div>
        <h3>${esc(c.title)}</h3>
        <div class="chips">${c.notions.map(n => `<code>${esc(n)}</code>`).join("")}</div>
        <ol class="nodes">
          ${LEVELS.map((l, i) => ({ l, i })).filter(o => o.l.ch === c.n).map(({ l, i }) => {
            const p = store.progress[l.id]; const unlocked = isUnlocked(i);
            const cls = p ? "done" : (nxt && nxt.id === l.id ? "next" : "");
            return `<li><button class="node ${cls}" type="button" data-open="${l.id}" ${unlocked ? "" : "disabled"} aria-label="Mission ${i + 1} : ${esc(l.title)}${unlocked ? "" : " (verrouillée)"}">
              <span class="node-num">${l.quiz ? "?" : i + 1}</span>
              <span class="node-title">${esc(l.title)}<small>${l.quiz ? "Quiz" : l.boss ? "Mission finale" : esc(l.notion)}</small></span>
              <span class="node-stars">${p ? starsHTML(p.stars) : (unlocked ? "" : "🔒")}</span>
            </button></li>`;
          }).join("")}
        </ol>
      </article>`).join("")}
  </section>`;
  setView("map");
  updateStats();
}

/* =====================================================================
   VUE : MISSION
   ===================================================================== */
function openLevel(id) {
  const L = id === SANDBOX.id ? SANDBOX : LEVELS.find(l => l.id === id);
  if (!L) return showMap();
  current = L;
  session = { hints: 0, solution: false, attempts: 0, results: null, answers: {} };
  setHash(L.sandbox ? SANDBOX.id : "mission-" + L.id);
  const i = levelIndex(L.id);
  const ch = CHAPTERS.find(c => c.n === L.ch);
  const prev = i > 0 ? LEVELS[i - 1] : null;
  const next = i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
  const p = store.progress[L.id];
  const hasStage = L.stage != null;

  const head = `
  <div class="level-head">
    <button class="btn btn-small btn-ghost" type="button" data-go="map">← Carte</button>
    <div class="level-title">
      <span class="where">${L.sandbox ? "Mode libre" : `Atelier ${L.ch} · ${esc(ch.title)} · Mission ${i + 1} / ${LEVELS.length}`}</span>
      <h2>${esc(L.title)} ${p ? `<span class="node-stars" style="font-size:1.1rem">${starsHTML(p.stars)}</span>` : ""}</h2>
    </div>
    ${L.sandbox ? "" : `<div class="level-nav">
      <button class="btn btn-small" type="button" ${prev ? `data-open="${prev.id}"` : "disabled"} aria-label="Mission précédente">◀</button>
      <button class="btn btn-small" type="button" ${next && isUnlocked(i + 1) ? `data-open="${next.id}"` : "disabled"} aria-label="Mission suivante">▶</button>
    </div>`}
  </div>`;

  const says = `<div class="says"><div id="says-bip">${bipSVG(doneChapters())}</div><p class="bubble">${md(L.bip)}</p></div>`;

  let brief, bench;
  if (L.quiz) {
    brief = says + `<section class="card mission"><p class="card-kicker">Ta mission</p><h3>Réponds juste à toutes les questions</h3><p>Choisis une réponse par question, puis clique sur <strong>Vérifier</strong>. Les explications s’affichent après.</p></section>`;
    bench = quizHTML(L);
  } else if (L.sandbox) {
    brief = says + `<section class="card mission"><p class="card-kicker">Idées d’essais</p>
      <ul class="steps">
        <li>Crée des variables et regarde l’onglet <strong>Mémoire</strong>.</li>
        <li>Fais une erreur exprès (oublie un guillemet) et lis l’explication.</li>
        <li>Change le texte de <code>.titre</code> ou ajoute des <code>li</code> dans <code>.liste</code> (onglet Page).</li>
        <li>Recopie un exemple du <strong>Carnet</strong> et modifie-le.</li>
      </ul></section>`;
    bench = benchHTML(L, hasStage);
  } else {
    brief = says + `
      <section class="card mission"><p class="card-kicker">Ta mission</p><ol class="steps">${L.steps.map(s => `<li>${md(s)}</li>`).join("")}</ol></section>
      ${lessonHTML(L)}
      <section class="card help" id="help" hidden><p class="card-kicker">Indices</p><ol class="hint-list" id="hint-list"></ol><div id="solution-box" hidden><p class="mini-label">Solution</p><pre class="code-block">${highlight(L.solution)}</pre><button class="btn btn-small" type="button" id="copy-solution">Copier dans l’éditeur</button></div></section>`;
    bench = benchHTML(L, hasStage);
  }
  $("#view-level").innerHTML = head + `<div class="level-grid"><div class="brief">${brief}</div><div class="workbench">${bench}</div></div>`;
  setView("level");
  updateStats();
  if (L.quiz) return bindQuiz(L);

  const ta = $("#code");
  ta.value = store.drafts[L.id] != null ? store.drafts[L.id] : L.starter;
  bindEditor(ta);
  if (hasStage) $("#stage").innerHTML = L.stage;
  renderGoals(null);
  liveRun = null;
  selectTab(L.sandbox ? "console" : "goals");
}

function lessonHTML(L) {
  const s = L.lesson;
  return `<section class="card lesson">
    <p class="card-kicker">La leçon · ${esc(L.notion)}</p>
    <p>${md(s.what)}</p>
    <pre class="code-block">${highlight(s.code)}</pre>
    <dl class="pieces">${s.pieces.map(([k, d]) => `<div><dt><code>${esc(k)}</code></dt><dd>${md(d)}</dd></div>`).join("")}</dl>
    <div class="example"><p class="mini-label">Exemple</p><pre class="code-block">${highlight(s.example.code)}</pre><p class="mini-label">Résultat</p><pre class="out-block">${esc(s.example.out)}</pre></div>
    <div class="trap"><p class="mini-label">Piège à éviter</p><p>${md(s.trap)}</p></div>
  </section>`;
}

function benchHTML(L, hasStage) {
  const pre = L.prelude ? `<div class="prelude"><div class="prelude-head"><span>Déjà écrit par le jeu (lecture seule)</span><span>${L.scenarios && L.scenarios.some(s => s.hidden) ? "Le jeu testera aussi ton code avec d’autres valeurs" : "Tu peux utiliser ces variables"}</span></div><pre>${highlight(L.prelude)}</pre></div>` : "";
  return `${pre}
  <div class="editor"><div class="gutter" id="gutter" aria-hidden="true"></div><div class="code-wrap"><pre class="hl" id="hl" aria-hidden="true"></pre><textarea id="code" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Éditeur de code JavaScript"></textarea></div></div>
  <div class="actions">
    <button class="btn btn-primary" type="button" id="run">▶ Lancer</button>
    ${L.sandbox ? "" : `<button class="btn" type="button" id="hint">Indice (${L.hints.length})</button><button class="btn btn-ghost" type="button" id="show-solution">Solution</button>`}
    <button class="btn btn-ghost" type="button" id="reset">Recommencer</button>
    <span class="kbd">Ctrl + Entrée pour lancer</span>
  </div>
  <div class="results">
    <div class="tabs" role="tablist">
      ${L.goals ? `<button class="tab" role="tab" id="tab-goals" data-tab="goals">Objectifs <span class="badge" id="badge-goals">0 / ${L.goals.length}</span></button>` : ""}
      <button class="tab" role="tab" id="tab-console" data-tab="console">Console <span class="badge" id="badge-console" hidden></span></button>
      <button class="tab" role="tab" id="tab-memory" data-tab="memory">Mémoire</button>
      ${hasStage ? `<button class="tab" role="tab" id="tab-page" data-tab="page">Page</button>` : ""}
    </div>
    ${L.goals ? `<div class="panel" role="tabpanel" id="panel-goals"><ul class="goals" id="goals"></ul><p class="goals-note" id="goals-note"></p></div>` : ""}
    <div class="panel" role="tabpanel" id="panel-console"><div class="console" id="console-out"><p class="empty">Clique sur <strong>Lancer</strong> pour exécuter ton code. Ce que tu affiches avec <code>console.log</code> apparaîtra ici.</p></div></div>
    <div class="panel" role="tabpanel" id="panel-memory"><div class="memory" id="memory-out"><p class="memory-note">Après avoir lancé ton code, tu verras ici chaque variable : son nom, sa valeur et son type.</p></div></div>
    ${hasStage ? `<div class="panel" role="tabpanel" id="panel-page"><div class="browser"><div class="browser-bar"><i></i><i></i><i></i><span>ma-page.html</span></div><div class="stage" id="stage"></div></div><p class="page-note">C’est la page que ton code manipule avec <code>document</code>. Elle est remise à zéro à chaque lancement.</p></div>` : ""}
  </div>`;
}

function selectTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", String(t.dataset.tab === name)));
  document.querySelectorAll("#view-level .panel").forEach(p => { p.hidden = p.id !== "panel-" + name; });
}

/* ---------- Éditeur ---------- */
function bindEditor(ta) {
  const hl = $("#hl"), gutter = $("#gutter");
  const paint = () => {
    const lines = ta.value.split("\n").length;
    const err = session && session.errLine;
    hl.innerHTML = `<div class="hl-inner">${err ? `<div class="errbar" style="top:${(err - 1) * 22}px"></div>` : ""}${highlight(ta.value)}\n</div>`;
    let g = "";
    for (let n = 1; n <= Math.max(lines, 1); n++) g += `<div class="${n === err ? "err" : ""}">${n}</div>`;
    gutter.innerHTML = g;
    sync();
  };
  const sync = () => {
    const inner = hl.firstElementChild;
    if (inner) inner.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
    gutter.scrollTop = ta.scrollTop;
  };
  const insert = t => { if (!document.execCommand || !document.execCommand("insertText", false, t)) { ta.setRangeText(t, ta.selectionStart, ta.selectionEnd, "end"); ta.dispatchEvent(new Event("input")); } };
  ta.addEventListener("input", () => {
    if (session.errLine) session.errLine = null;
    paint();
    if (current) { store.drafts[current.id] = ta.value; save(); }
  });
  ta.addEventListener("scroll", sync);
  ta.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runCode(); return; }
    if (e.key === "Tab" && !e.shiftKey && !e.altKey) { e.preventDefault(); insert("  "); return; }
    if (e.key === "Enter" && !e.shiftKey) {
      const line = ta.value.slice(0, ta.selectionStart).split("\n").pop();
      let ind = line.match(/^\s*/)[0];
      if (/[{(\[]\s*$/.test(line)) ind += "  ";
      e.preventDefault(); insert("\n" + ind);
    }
  });
  ta._paint = paint;
  paint();
}

/* ---------- Lancer ---------- */
function runCode() {
  const L = current; if (!L || L.quiz) return;
  const ta = $("#code"); const code = ta.value;
  store.drafts[L.id] = code; save();
  const hasStage = L.stage != null;
  const stage = hasStage ? $("#stage") : document.createElement("div");
  stage.innerHTML = L.stage || "";
  const scen0 = L.scenarios ? L.scenarios[0] : null;

  // 1. tests silencieux (une exécution par scénario, sur une page invisible)
  let results = null;
  if (L.goals) {
    silent = true; silentErrors.length = 0;
    const runs = (L.scenarios || [null]).map(s => { const st = document.createElement("div"); st.innerHTML = L.stage || ""; return execute(L, code, s, st, false); });
    const c = { runs, code, L, main: null };
    // 2. exécution visible
    silent = false;
    liveRun = null;
    const main = execute(L, code, scen0, stage, true);
    c.main = main;
    silent = true;
    results = L.goals.map(g => { let r; try { r = g.test(c); } catch (e) { r = false; } return { ok: r === true, detail: typeof r === "string" ? r : null }; });
    silent = false;
    showRun(main, code);
  } else {
    liveRun = null;
    const main = execute(L, code, scen0, stage, true);
    showRun(main, code);
  }
  session.results = results;
  if (L.goals) renderGoals(results);
  const main = liveRun;
  if (main.error) { selectTab("console"); setMood("oops"); }
  else if (results && results.every(r => r.ok)) { setMood("happy"); setTimeout(() => success(L), 350); }
  else if (results) { selectTab("goals"); setMood(null); }
  else { selectTab("console"); setMood(null); }
}

function showRun(run, code) {
  liveRun = run;
  session.errLine = run.error ? errorLine(run.error, code, run.preludeLines) : null;
  $("#code")._paint();
  const box = $("#console-out"); box.innerHTML = "";
  run.logs.forEach(e => appendLog(e, false));
  if (run.error) box.appendChild(errorBox(run.error, session.errLine));
  if (!run.logs.length && !run.error) box.innerHTML = `<p class="empty">Ton code s’est exécuté sans erreur, mais n’a rien affiché. Pour voir une valeur, utilise <code>console.log()</code>.</p>`;
  run.ready = true;
  setBadges(!!run.error);
  renderMemory(run);
}
function appendLog(entry, live) {
  const box = $("#console-out"); if (!box) return;
  const empty = box.querySelector(".empty"); if (empty) empty.remove();
  const d = document.createElement("div");
  d.className = "log" + (live ? " live" : "");
  d.innerHTML = `<span class="log-arrow">›</span><span>${entry.html}</span>`;
  box.appendChild(d);
  if (live) { setBadges(false); d.scrollIntoView({ block: "nearest" }); }
}
function errorBox(err, line, when) {
  const d = document.createElement("div");
  d.className = "err-box";
  d.innerHTML = `<p class="err-title">${line ? "Erreur à la ligne " + line : "Erreur" + (when ? " " + when : "")}</p><p>${md(explain(err))}</p><p class="err-raw">Message d’origine : <code>${esc((err.name || "Error") + ": " + err.message)}</code></p>`;
  return d;
}
function setBadges(err) {
  const b = $("#badge-console"); if (!b || !liveRun) return;
  const n = liveRun.logs.length;
  b.hidden = !n && !err;
  b.textContent = err ? "!" : n;
  b.className = "badge" + (err ? " red" : "");
}
function renderGoals(results) {
  const L = current; if (!L.goals) return;
  $("#goals").innerHTML = L.goals.map((g, i) => {
    const r = results && results[i];
    const st = !r ? "todo" : r.ok ? "ok" : "ko";
    return `<li class="goal ${st}"><span class="goal-icon" aria-hidden="true">${st === "ok" ? "✓" : st === "ko" ? "✗" : "○"}</span><span><span>${md(g.label)}</span>${r && r.detail ? `<span class="goal-detail">${md(r.detail)}</span>` : ""}</span></li>`;
  }).join("");
  const okN = results ? results.filter(r => r.ok).length : 0;
  const b = $("#badge-goals"); b.textContent = okN + " / " + L.goals.length; b.className = "badge" + (results && okN === L.goals.length ? " green" : "");
  $("#goals-note").textContent = !results ? "Lance ton code : le jeu vérifie chaque objectif." : (L.scenarios && L.scenarios.length > 1 ? "Les tests cachés lancent ton code avec d’autres valeurs que celles affichées." : "");
}
function renderMemory(run) {
  const out = $("#memory-out");
  if (run.error) { out.innerHTML = `<p class="memory-note">Le code s’est arrêté sur une erreur avant la fin : corrige-la (onglet Console) et relance pour voir la mémoire.</p>`; return; }
  const names = Object.keys(run.vars).filter(n => run.vars[n] !== undefined);
  names.sort((a, b) => (run.preludeNames.includes(b) ? 1 : 0) - (run.preludeNames.includes(a) ? 1 : 0));
  if (!names.length) { out.innerHTML = `<p class="memory-note">Aucune variable pour l’instant. Crée-en une avec <code>let</code> ou <code>const</code> et relance !</p>`; return; }
  out.innerHTML = names.map(n => {
    const v = run.vars[n]; const [label, color] = typeInfo(v);
    let val, wide = false;
    if (Array.isArray(v)) {
      wide = v.some(x => x && typeof x === "object") || v.length > 4;
      val = v.length ? (v.some(x => x && typeof x === "object")
        ? `<div class="rows">${v.slice(0, 12).map((x, i) => `<div class="row"><span class="key">[${i}]</span><span>${fmtHTML(x, false)}</span></div>`).join("")}</div>`
        : `<div class="cells">${v.slice(0, 16).map((x, i) => `<div class="cell"><span class="idx">${i}</span><span class="cv">${fmtHTML(x, false)}</span></div>`).join("")}</div>`)
        : `<span class="v-punc">[] (tableau vide)</span>`;
      val += `<div style="margin-top:6px;color:var(--ink-soft);font-size:12px">length : ${v.length}</div>`;
    } else if (v && typeof v === "object" && !isEl(v)) {
      val = `<div class="rows">${Object.entries(v).map(([k, x]) => `<div class="row"><span class="key">${esc(k)}</span><span>${fmtHTML(x, false)}</span></div>`).join("")}</div>`;
    } else if (typeof v === "function") {
      const src = String(v).split("\n")[0];
      val = `<span class="v-fn">${esc(src.length > 60 ? src.slice(0, 60) + "…" : src)}</span>`;
    } else val = fmtHTML(v, false);
    return `<div class="mem ${wide ? "wide" : ""}"><div class="mem-head"><span class="mem-name">${esc(n)}</span><span class="mem-type" style="background:${color}">${label}</span>${run.preludeNames.includes(n) ? `<span class="mem-given">écrite par le jeu</span>` : ""}</div><div class="mem-val">${val}</div></div>`;
  }).join("");
}

/* ---------- Indices et solution ---------- */
function showHint() {
  const L = current; if (session.hints >= L.hints.length) return;
  session.hints++;
  $("#help").hidden = false;
  $("#hint-list").innerHTML = L.hints.slice(0, session.hints).map(h => `<li>${md(h)}</li>`).join("");
  const left = L.hints.length - session.hints;
  const b = $("#hint"); b.textContent = left ? `Indice (${left})` : "Plus d’indice"; b.disabled = !left;
  $("#help").scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function twoStep(btn, ask, action) {
  if (btn.classList.contains("confirming")) { btn.classList.remove("confirming"); btn.textContent = btn.dataset.label; action(); return; }
  btn.dataset.label = btn.textContent; btn.textContent = ask; btn.classList.add("confirming");
  setTimeout(() => { if (btn.classList.contains("confirming")) { btn.classList.remove("confirming"); btn.textContent = btn.dataset.label; } }, 4000);
}

/* =====================================================================
   QUIZ
   ===================================================================== */
function quizHTML(L) {
  return `<div class="quiz">${L.questions.map((q, qi) => `
    <fieldset class="q" id="q-${qi}">
      <legend>Question ${qi + 1} / ${L.questions.length}</legend>
      <p class="q-text">${md(q.q)}</p>
      ${q.code ? `<pre class="code-block">${highlight(q.code)}</pre>` : ""}
      <div class="opts" role="radiogroup" aria-label="Question ${qi + 1}">${q.opts.map((o, oi) => `<button type="button" class="opt" role="radio" aria-checked="false" data-q="${qi}" data-o="${oi}">${md(o)}</button>`).join("")}</div>
      <p class="q-why" hidden></p>
    </fieldset>`).join("")}
    <div class="quiz-foot"><button class="btn btn-primary" type="button" id="quiz-check">Vérifier mes réponses</button><span id="quiz-msg" aria-live="polite"></span></div>
  </div>`;
}
function bindQuiz(L) {
  document.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
    const qi = +b.dataset.q;
    session.answers[qi] = +b.dataset.o;
    document.querySelectorAll(`.opt[data-q="${qi}"]`).forEach(o => { o.setAttribute("aria-checked", String(o === b)); o.classList.remove("right", "wrong"); });
  }));
  $("#quiz-check").addEventListener("click", () => {
    const msg = $("#quiz-msg");
    if (Object.keys(session.answers).length < L.questions.length) { msg.textContent = "Réponds d’abord à toutes les questions."; return; }
    session.attempts++;
    let good = 0;
    L.questions.forEach((q, qi) => {
      const chosen = session.answers[qi];
      const ok = chosen === q.a; if (ok) good++;
      document.querySelectorAll(`.opt[data-q="${qi}"]`).forEach(o => { o.classList.remove("right", "wrong"); if (+o.dataset.o === chosen) o.classList.add(ok ? "right" : "wrong"); });
      const why = $(`#q-${qi} .q-why`); why.hidden = false; why.innerHTML = (ok ? "<strong>Juste.</strong> " : "<strong>Pas tout à fait.</strong> ") + md(q.why);
    });
    if (good === L.questions.length) { msg.textContent = "Tout est juste !"; setMood("happy"); setTimeout(() => success(L), 400); }
    else { msg.textContent = `${good} / ${L.questions.length} bonnes réponses. Lis les explications et corrige.`; setMood("oops"); }
  });
}

/* =====================================================================
   RÉUSSITE
   ===================================================================== */
function success(L) {
  if (L.sandbox) return;
  const stars = L.quiz ? (session.attempts <= 1 ? 3 : session.attempts === 2 ? 2 : 1) : (session.solution ? 1 : session.hints > 0 ? 2 : 3);
  const before = store.progress[L.id];
  const chapterBefore = chapterDone(L.ch);
  store.progress[L.id] = { stars: Math.max(before ? before.stars : 0, stars) };
  save(); updateStats();
  const newPiece = !chapterBefore && chapterDone(L.ch);
  const allDone = LEVELS.every(l => isDone(l.id));
  const i = levelIndex(L.id);
  const next = LEVELS[i + 1];
  const ch = CHAPTERS.find(c => c.n === L.ch);
  $("#dialog").innerHTML = `
    <div class="dialog-top">${bipSVG(doneChapters(), "happy")}<div><p class="card-kicker">Mission ${i + 1} réussie</p><h2 id="modal-title">${allDone ? "Bip est réparé !" : "Bien joué !"}</h2><div class="big-stars" aria-label="${stars} étoiles sur 3">${starsHTML(stars)}</div></div></div>
    ${newPiece ? `<p class="new-piece">Nouvelle pièce pour Bip : ${esc(ch.piece)} ! Atelier ${ch.n} terminé.</p>` : ""}
    <div><p class="mini-label">Ce qui s’est passé</p><p>${md(L.debrief)}</p></div>
    ${stars < 3 ? `<p style="color:var(--ink-soft);font-size:.92rem">Tu peux rejouer la mission plus tard sans indice pour gagner 3 étoiles.</p>` : ""}
    <div class="dialog-actions">
      <button class="btn btn-ghost" type="button" id="modal-stay">Rester ici</button>
      ${next && !allDone ? `<button class="btn btn-primary" type="button" id="modal-next">Mission suivante →</button>` : `<button class="btn btn-primary" type="button" id="modal-map">Voir Bip sur la carte</button>`}
    </div>`;
  $("#modal").hidden = false;
  const close = () => { $("#modal").hidden = true; };
  $("#modal-stay").addEventListener("click", close);
  if ($("#modal-next")) { $("#modal-next").addEventListener("click", () => { close(); openLevel(next.id); }); $("#modal-next").focus(); }
  if ($("#modal-map")) { $("#modal-map").addEventListener("click", () => { close(); showMap(); }); $("#modal-map").focus(); }
  confetti(newPiece || allDone ? 160 : 70);
}
function confetti(n) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = $("#confetti"); cv.hidden = false;
  const ctx = cv.getContext("2d"); cv.width = innerWidth; cv.height = innerHeight;
  const colors = ["#FFC93C", "#FF6B4A", "#3D7BF7", "#138A5B", "#1B2440"];
  const ps = Array.from({ length: n }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 12 - 4, r: Math.random() * 6 + 4, c: colors[Math.floor(Math.random() * colors.length)], a: Math.random() * 6 }));
  const t0 = performance.now();
  const tick = t => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .45; p.a += .2; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
    if (t - t0 < 1800) requestAnimationFrame(tick); else { ctx.clearRect(0, 0, cv.width, cv.height); cv.hidden = true; }
  };
  requestAnimationFrame(tick);
}

/* =====================================================================
   VUE : CARNET
   ===================================================================== */
function showNotebook() {
  current = null; setHash("carnet");
  const items = LEVELS.map((l, i) => ({ l, i })).filter(o => !o.l.quiz && !o.l.boss);
  $("#view-notebook").innerHTML = `
    <div class="section-title"><div><p class="kicker">Antisèche</p><h2>Mon carnet</h2></div><p>Toutes les notions débloquées, à garder ouvertes pendant tes projets.</p></div>
    <div class="notebook">${items.map(({ l, i }) => {
      const open = isUnlocked(i);
      if (!open) return `<div class="note locked"><p class="card-kicker">Mission ${i + 1}</p><h3>${esc(l.notion)}</h3><p>À débloquer en jouant.</p></div>`;
      return `<div class="note"><p class="card-kicker">Mission ${i + 1} · ${esc(l.title)}</p><h3>${esc(l.notion)}</h3><pre class="code-block">${highlight(l.lesson.code)}</pre><dl class="pieces">${l.lesson.pieces.map(([k, d]) => `<div><dt><code>${esc(k)}</code></dt><dd>${md(d)}</dd></div>`).join("")}</dl><div class="trap"><p class="mini-label">Piège</p><p>${md(l.lesson.trap)}</p></div></div>`;
    }).join("")}</div>
    <section class="prof">
      <p class="card-kicker">Options</p>
      <label for="unlock-all"><input type="checkbox" id="unlock-all" ${store.unlockAll ? "checked" : ""}> Débloquer toutes les missions (pour le formateur, ou pour réviser)</label>
      <div><button class="btn btn-small btn-ghost" type="button" id="reset-all">Effacer ma progression</button></div>
      <p style="font-size:.9rem;color:var(--ink-soft)">La progression est enregistrée dans ce navigateur uniquement.</p>
    </section>`;
  setView("notebook");
  $("#nav-notebook").setAttribute("aria-current", "page");
  $("#unlock-all").addEventListener("change", e => { store.unlockAll = e.target.checked; save(); showNotebook(); });
  $("#reset-all").addEventListener("click", e => twoStep(e.currentTarget, "Sûr ? Clique encore", () => { store = { progress: {}, drafts: {}, unlockAll: false }; save(); updateStats(); showNotebook(); }));
  updateStats();
}

/* =====================================================================
   ÉVÉNEMENTS GLOBAUX
   ===================================================================== */
document.addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.open) { openLevel(t.dataset.open); return; }
  if (t.dataset.go === "map") { showMap(); return; }
  if (t.dataset.tab) { selectTab(t.dataset.tab); return; }
  switch (t.id) {
    case "run": runCode(); break;
    case "hint": showHint(); break;
    case "show-solution": twoStep(t, "Sûr ? (1 étoile)", () => { session.solution = true; $("#help").hidden = false; $("#solution-box").hidden = false; $("#solution-box").scrollIntoView({ block: "nearest", behavior: "smooth" }); }); break;
    case "copy-solution": { const ta = $("#code"); ta.value = current.solution; ta.dispatchEvent(new Event("input")); ta.focus(); break; }
    case "reset": twoStep(t, "Sûr ? Clique encore", () => { const ta = $("#code"); ta.value = current.starter; delete store.drafts[current.id]; save(); session.errLine = null; ta._paint(); }); break;
  }
});
$("#brand").addEventListener("click", showMap);
$("#nav-map").addEventListener("click", showMap);
$("#nav-notebook").addEventListener("click", showNotebook);
$("#nav-sandbox").addEventListener("click", () => openLevel(SANDBOX.id));
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#modal").hidden) $("#modal").hidden = true; });
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") $("#modal").hidden = true; });
window.addEventListener("hashchange", route);

if (window.claude && window.claude.hot) window.claude.hot.snapshot(() => ({ hash: location.hash }));
const start = data => { if (data && data.hash && !location.hash) history.replaceState(null, "", data.hash); route(); };
window.claude && window.claude.hot && window.claude.hot.ready ? window.claude.hot.ready(start) : start((window.claude && window.claude.hot && window.claude.hot.data) || {});

