"use strict";
/* =====================================================================
   ESPACE FORMATEUR : voir la progression des élèves dans tous les jeux de code :
   La maison de Bip (HTML), Mission Kami (CSS), Kami et les lucioles (Flexbox),
   Le potager de Kami (Grid), Mission Bip et Bip Agence (JavaScript)
   Lecture seule. L'accès est réservé par les règles Firestore à l'UID du formateur.
   ===================================================================== */
const FB_CONFIG = {
  apiKey: "AIzaSyDF6idRWnpsezjXYQ_f_7_58O2prxvA9Gc",
  authDomain: "bip-jeux.firebaseapp.com",
  projectId: "bip-jeux",
  storageBucket: "bip-jeux.firebasestorage.app",
  messagingSenderId: "518939054835",
  appId: "1:518939054835:web:737987fffa793c14a25d86"
};
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
const DAY = 86400000;
/* l’ordre du parcours ; les jeux absents de JEUX sont ignorés */
const ORDRE = ["maison-bip", "mission-kami", "kami-lucioles", "kami-potager", "mission-bip", "bip-agence"];
const COURT = { "mission-bip": "JS", "bip-agence": "JS+" };
const jeuxDansLOrdre = () => [...ORDRE.filter(j => JEUX[j]), ...Object.keys(JEUX).filter(j => !ORDRE.includes(j))];
const court = jeu => (JEUX[jeu] && JEUX[jeu].court) || COURT[jeu] || jeu;
let auth = null, db = null, me = null, eleves = [], vue = { tri: "activite", filtre: "", detail: null };

/* ---------- outils d'affichage ---------- */
function duree(ms) {
  if (!ms) return "—";
  const m = Math.round(ms / 60000);
  if (m < 1) return "< 1 min";
  if (m < 60) return m + " min";
  return Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0");
}
function depuis(t) {
  if (!t) return "jamais";
  const d = Date.now() - t;
  if (d < 60000) return "à l’instant";
  if (d < 3600000) return "il y a " + Math.round(d / 60000) + " min";
  if (d < DAY) return "il y a " + Math.round(d / 3600000) + " h";
  const j = Math.round(d / DAY);
  return j === 1 ? "hier" : "il y a " + j + " jours";
}
const etoiles = n => n ? "★".repeat(n) + "☆".repeat(3 - n) : "";
const nomEleve = e => e.email ? e.email.split("@")[0] : e.uid.slice(0, 8);

/* ---------- lecture d'une progression ---------- */
function analyse(jeu, data) {
  const J = JEUX[jeu]; const prog = (data && data.progress) || {}; const T = (data && data.track) || {}; const lv = T.levels || {};
  const faites = J.missions.filter(m => prog[m.id]);
  const etoilesTot = faites.reduce((s, m) => s + (prog[m.id].stars || 0), 0);
  const suivante = J.missions.find(m => !prog[m.id]);
  const cur = T.cur && J.missions.find(m => m.id === T.cur);
  let hints = 0, sols = 0, wrong = 0, temps = 0;
  for (const [id, x] of Object.entries(lv)) { hints += x.hints || 0; sols += x.solution ? 1 : 0; wrong += x.wrong || 0; temps += x.time || 0; }
  // bloqué : la mission en cours n'est pas finie et l'élève a beaucoup essayé ou passé du temps dessus
  const encours = cur && !prog[cur.id] ? cur : suivante;
  const L = encours ? (lv[encours.id] || {}) : {};
  const essais = (L.runs || 0) + (L.wrong || 0);
  const bloque = !!(encours && !prog[encours.id] && (essais >= 6 || (L.time || 0) >= 15 * 60000 || (L.errors || 0) >= 4));
  return { J, data: data || {}, prog, lv, faites: faites.length, total: J.missions.length, etoiles: etoilesTot, encours, L, bloque, hints, sols, wrong, temps, dernier: T.last || 0, projet: data && data.projet };
}

/* ---------- connexion ---------- */
function ecranConnexion(msg) {
  $("#app").innerHTML = `<section class="carte connexion">
    <p class="surtitre">Espace formateur</p><h1>Connexion</h1>
    <p>Connecte-toi avec <b>ton</b> compte des jeux (le même e-mail et mot de passe que dans La maison de Bip, Mission Kami, Mission Bip ou Bip Agence).</p>
    <form id="f-co" class="form" novalidate>
      <label>E-mail<input id="co-email" type="email" autocomplete="email" required></label>
      <label>Mot de passe<input id="co-pass" type="password" autocomplete="current-password" required></label>
      <p class="err" id="co-err">${esc(msg || "")}</p>
      <button class="btn btn-p" type="submit">Me connecter</button>
    </form></section>`;
  $("#f-co").addEventListener("submit", async ev => {
    ev.preventDefault();
    const err = $("#co-err"); err.textContent = "Connexion…";
    try { await auth.signInWithEmailAndPassword($("#co-email").value.trim(), $("#co-pass").value); }
    catch (e) { err.textContent = /invalid-credential|wrong-password|user-not-found/.test(e.code) ? "E-mail ou mot de passe incorrect." : "Erreur : " + (e.code || e.message); }
  });
}
function regles(uid) {
  return `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function estFormateur() {
      return request.auth != null && request.auth.uid == "${uid}";
    }
    match /eleves/{uid}/jeux/{jeu} {
      allow read, write: if request.auth != null && request.auth.uid == uid
        && jeu in ['mission-bip', 'bip-agence', 'maison-bip', 'mission-kami', 'kami-lucioles', 'kami-potager'];
    }
    match /eleves/{uid}/atelier/{doc} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      allow read: if estFormateur();
    }
    match /{chemin=**}/jeux/{jeu} {
      allow read: if estFormateur();
    }
  }
}`;
}
function ecranAcces() {
  $("#app").innerHTML = `<section class="carte">
    <p class="surtitre">Une dernière étape</p><h1>Ton compte n’est pas encore formateur</h1>
    <p>Tu es connecté avec <b>${esc(me.email)}</b>, mais Firestore ne t’autorise pas encore à lire la progression des élèves. C’est normal la première fois.</p>
    <ol class="etapes">
      <li>Ouvre <b>console.firebase.google.com</b>, projet <b>bip-jeux</b>, puis <b>Firestore Database › Règles</b>.</li>
      <li>Remplace tout le texte par celui-ci (il contient déjà ton identifiant) :</li>
    </ol>
    <textarea class="regles" id="regles" readonly rows="16">${esc(regles(me.uid))}</textarea>
    <div class="actions"><button class="btn" type="button" id="copier">Copier les règles</button><button class="btn btn-p" type="button" id="reessayer">C’est publié, réessayer</button></div>
    <p class="note">Ton identifiant : <code>${esc(me.uid)}</code>. Les élèves gardent leur accès : chacun ne voit que sa progression. Toi seul peux tout lire, sans rien modifier.</p>
  </section>`;
  $("#copier").addEventListener("click", async () => { try { await navigator.clipboard.writeText(regles(me.uid)); $("#copier").textContent = "Copié !"; } catch (e) { $("#regles").select(); } });
  $("#reessayer").addEventListener("click", charger);
}

/* ---------- chargement ---------- */
async function charger() {
  $("#app").innerHTML = `<p class="chargement">Chargement des élèves…</p>`;
  let snap;
  try { snap = await db.collectionGroup("jeux").get(); }
  catch (e) { if (/permission/.test(String(e.code || e.message))) return ecranAcces(); $("#app").innerHTML = `<section class="carte"><h1>Impossible de charger</h1><p class="err">${esc(e.code || e.message)}</p><button class="btn btn-p" id="reessayer">Réessayer</button></section>`; $("#reessayer").addEventListener("click", charger); return; }
  const parUid = new Map();
  snap.forEach(doc => {
    const uid = doc.ref.parent.parent ? doc.ref.parent.parent.id : "?";
    const jeu = doc.id; if (!JEUX[jeu]) return;
    const d = doc.data(); let data = {};
    try { data = JSON.parse(d.data || "{}"); } catch (e) { /* illisible */ }
    const e = parUid.get(uid) || { uid, email: "", jeux: {} };
    if (d.email) e.email = d.email;
    e.jeux[jeu] = analyse(jeu, data);
    e.jeux[jeu].maj = d.updatedAt && d.updatedAt.toDate ? d.updatedAt.toDate().getTime() : 0;
    parUid.set(uid, e);
  });
  eleves = [...parUid.values()].map(e => {
    e.dernier = Math.max(...Object.values(e.jeux).map(g => Math.max(g.dernier || 0, g.maj || 0)), 0);
    e.bloque = Object.values(e.jeux).some(g => g.bloque);
    e.moi = e.uid === me.uid;
    return e;
  });
  $("#maj").textContent = "Mis à jour " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  vue.detail ? afficherDetail(vue.detail) : afficherListe();
}

/* ---------- vue d'ensemble ---------- */
function barre(g) {
  if (!g) return `<span class="vide">pas commencé</span>`;
  const pct = Math.round(g.faites / g.total * 100);
  return `<div class="prog"><div class="prog-bar"><span style="width:${pct}%"></span></div><span><b>${g.faites}</b> / ${g.total} · ${g.etoiles} ★</span></div>`;
}
/* une petite barre par jeu commencé, dans l’ordre du parcours */
function parcours(e) {
  const l = jeuxDansLOrdre().filter(j => e.jeux[j]);
  if (!l.length) return `<span class="vide">pas commencé</span>`;
  return `<div class="parcours">${l.map(j => { const g = e.jeux[j]; const pct = Math.round(g.faites / g.total * 100);
    return `<div class="pj" title="${esc(JEUX[j].titre)}"><span class="pj-nom">${esc(court(j))}</span><div class="prog-bar"><span style="width:${pct}%"></span></div><span class="pj-n"><b>${g.faites}</b>/${g.total}</span></div>`; }).join("")}
    ${e.jeux["bip-agence"] && e.jeux["bip-agence"].projet ? `<small class="projet-mini">Projet bonus : ${Object.keys(e.jeux["bip-agence"].projet.steps || {}).length} / 7 étapes</small>` : ""}</div>`;
}
function alertes(e) {
  const out = [];
  for (const [jeu, g] of Object.entries(e.jeux)) {
    if (g.bloque) out.push(`<span class="tag rouge" title="${esc(JEUX[jeu].titre)}">Bloqué : ${esc(g.encours.titre)}</span>`);
    if (g.sols) out.push(`<span class="tag orange">${g.sols} solution${g.sols > 1 ? "s" : ""} (${esc(court(jeu))})</span>`);
  }
  if (e.dernier && Date.now() - e.dernier > 5 * DAY) out.push(`<span class="tag gris">Inactif ${depuis(e.dernier)}</span>`);
  return out.join(" ") || `<span class="tag vert">RAS</span>`;
}
function encours(e) {
  const g = Object.entries(e.jeux).sort((a, b) => (b[1].dernier || 0) - (a[1].dernier || 0))[0];
  if (!g) return "—";
  const [jeu, x] = g;
  if (!x.encours) return `${esc(JEUX[jeu].titre)} : terminé`;
  return `<small>${esc(JEUX[jeu].titre)}</small><br>${x.encours.num}. ${esc(x.encours.titre)}`;
}
function afficherListe() {
  vue.detail = null;
  let liste = eleves.filter(e => !vue.filtre || (e.email || e.uid).toLowerCase().includes(vue.filtre.toLowerCase()));
  const score = e => Object.values(e.jeux).reduce((s, g) => s + g.faites, 0);
  liste.sort(vue.tri === "nom" ? (a, b) => nomEleve(a).localeCompare(nomEleve(b)) : vue.tri === "avance" ? (a, b) => score(b) - score(a) : vue.tri === "bloques" ? (a, b) => (b.bloque - a.bloque) || (b.dernier - a.dernier) : (a, b) => b.dernier - a.dernier);
  const vrais = eleves.filter(e => !e.moi);
  const actifs = vrais.filter(e => Date.now() - e.dernier < DAY).length;
  const moy = jeu => { const l = vrais.filter(e => e.jeux[jeu]); return l.length ? Math.round(l.reduce((s, e) => s + e.jeux[jeu].faites, 0) / l.length) : 0; };
  $("#app").innerHTML = `
    <section class="chiffres">
      <div><b>${vrais.length}</b><span>élève${vrais.length > 1 ? "s" : ""} inscrit${vrais.length > 1 ? "s" : ""}</span></div>
      <div><b>${actifs}</b><span>actif${actifs > 1 ? "s" : ""} ces 24 h</span></div>
      <div class="${vrais.some(e => e.bloque) ? "alerte" : ""}"><b>${vrais.filter(e => e.bloque).length}</b><span>bloqué${vrais.filter(e => e.bloque).length > 1 ? "s" : ""} en ce moment</span></div>
      ${jeuxDansLOrdre().filter(j => vrais.some(e => e.jeux[j]) || j === "mission-bip").map(j => `<div><b>${moy(j)} / ${JEUX[j].missions.length}</b><span>moyenne ${esc(JEUX[j].titre)}</span></div>`).join("")}
    </section>
    <section class="carte">
      <div class="outils"><h2>Les élèves</h2>
        <input id="filtre" type="search" placeholder="Chercher un élève" value="${esc(vue.filtre)}">
        <label>Trier <select id="tri"><option value="activite">dernière activité</option><option value="avance">les plus avancés</option><option value="bloques">les bloqués d’abord</option><option value="nom">nom</option></select></label>
      </div>
      ${liste.length ? `<div class="table-wrap"><table class="table">
        <thead><tr><th>Élève</th><th>Parcours</th><th>En ce moment</th><th>Dernière activité</th><th>Alertes</th></tr></thead>
        <tbody>${liste.map(e => `<tr data-uid="${esc(e.uid)}" tabindex="0">
          <td><b>${esc(nomEleve(e))}</b>${e.moi ? ` <span class="tag gris">toi</span>` : ""}<br><small>${esc(e.email)}</small></td>
          <td>${parcours(e)}</td>
          <td>${encours(e)}</td>
          <td>${depuis(e.dernier)}</td>
          <td>${alertes(e)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="vide-gros">Aucun élève pour l’instant. Ils apparaissent ici dès qu’ils créent leur compte dans un des jeux.</p>`}
    </section>
    ${difficiles()}`;
  $("#tri").value = vue.tri;
  $("#tri").addEventListener("change", e => { vue.tri = e.target.value; afficherListe(); });
  $("#filtre").addEventListener("input", e => { vue.filtre = e.target.value; const pos = e.target.selectionStart; afficherListe(); const f = $("#filtre"); f.focus(); f.setSelectionRange(pos, pos); });
  document.querySelectorAll("tr[data-uid]").forEach(tr => { const go = () => afficherDetail(tr.dataset.uid); tr.addEventListener("click", go); tr.addEventListener("keydown", ev => { if (ev.key === "Enter") go(); }); });
}

/* ---------- les missions qui posent problème à la classe ---------- */
function difficiles() {
  const lignes = [];
  for (const [jeu, J] of Object.entries(JEUX)) {
    for (const m of J.missions) {
      let commences = 0, finis = 0, essais = 0, sols = 0, temps = 0, n = 0;
      for (const e of eleves) {
        if (e.moi) continue;
        const g = e.jeux[jeu]; if (!g) continue;
        const x = g.lv[m.id]; if (!x && !g.prog[m.id]) continue;
        commences++; if (g.prog[m.id]) finis++;
        if (x) { essais += (x.runs || 0) + (x.wrong || 0); sols += x.solution ? 1 : 0; temps += x.time || 0; n++; }
      }
      if (commences < 1) continue;
      const score = (commences - finis) * 3 + (n ? essais / n : 0) + sols * 2 + (n ? temps / n / 120000 : 0);
      lignes.push({ jeu, m, commences, finis, essaisMoy: n ? (essais / n).toFixed(1) : "—", sols, tempsMoy: n ? temps / n : 0, score });
    }
  }
  lignes.sort((a, b) => b.score - a.score);
  const top = lignes.filter(l => l.commences > l.finis || parseFloat(l.essaisMoy) >= 4 || l.sols > 0 || l.tempsMoy >= 10 * 60000).slice(0, 8);
  if (!top.length) return "";
  return `<section class="carte"><h2>Les missions qui posent le plus de problèmes</h2><p class="note">Calculé sur toute la classe : élèves bloqués dessus, nombre d’essais, solutions utilisées, temps passé. Une bonne base pour choisir quoi reprendre en cours.</p>
    <div class="table-wrap"><table class="table table-petit"><thead><tr><th>Mission</th><th>Ont commencé</th><th>Ont fini</th><th>Essais (moy.)</th><th>Temps (moy.)</th><th>Solutions vues</th></tr></thead>
    <tbody>${top.map(l => `<tr><td><small>${esc(JEUX[l.jeu].titre)} · ${esc(JEUX[l.jeu].groupes.find(g => g.n === l.m.g).nom)}</small><br>${l.m.num}. ${esc(l.m.titre)}</td><td>${l.commences}</td><td>${l.finis}</td><td>${l.essaisMoy}</td><td>${duree(l.tempsMoy)}</td><td>${l.sols}</td></tr>`).join("")}</tbody></table></div></section>`;
}

/* ---------- le détail d'un élève ---------- */
function codeDe(data, id) {
  const d = data && data.drafts && data.drafts[id];
  if (d == null) return null;
  return typeof d === "string" ? d : JSON.stringify(d, null, 2);
}
function afficherDetail(uid) {
  const e = eleves.find(x => x.uid === uid); if (!e) return afficherListe();
  vue.detail = uid;
  const pasCommences = jeuxDansLOrdre().filter(j => !e.jeux[j]);
  const blocs = jeuxDansLOrdre().filter(j => e.jeux[j]).map(jeu => {
    const g = e.jeux[jeu]; const J = JEUX[jeu];
    const groupes = J.groupes.map(gr => {
      const ms = J.missions.filter(m => m.g === gr.n);
      const faites = ms.filter(m => g.prog[m.id]).length;
      return `<details class="groupe" ${ms.some(m => g.encours && m.id === g.encours.id) ? "open" : ""}><summary><b>${esc(gr.nom)}</b><span>${faites} / ${ms.length}</span></summary>
        <table class="table table-petit"><thead><tr><th>Mission</th><th>État</th><th>Essais</th><th>Erreurs</th><th>Indices</th><th>Mauvaises réponses</th><th>Solution</th><th>Temps</th><th></th></tr></thead><tbody>
        ${ms.map(m => {
          const x = g.lv[m.id] || {}; const p = g.prog[m.id];
          const etat = p ? `<span class="ok">${etoiles(p.stars)}</span>` : (x.runs || x.opens) ? `<span class="tag ${g.bloque && g.encours && g.encours.id === m.id ? "rouge" : "jaune"}">en cours${x.goals ? " · " + x.goals[0] + "/" + x.goals[1] + " objectifs" : ""}</span>` : `<span class="vide">—</span>`;
          const code = codeDe(g.data, m.id);
          return `<tr class="${g.encours && g.encours.id === m.id && !p ? "actuelle" : ""}"><td>${m.num}. ${esc(m.titre)}</td><td>${etat}</td><td>${x.runs || 0}</td><td>${x.errors || 0}</td><td>${x.hints || 0}</td><td>${x.wrong || 0}</td><td>${x.solution ? `<span class="tag orange">oui</span>` : "non"}</td><td>${duree(x.time)}</td>
            <td>${code || x.lastErr ? `<button class="btn btn-mini" type="button" data-voir="${esc(jeu + "|" + m.id)}">Voir</button>` : ""}</td></tr>
            <tr class="code-ligne" id="code-${esc(jeu + "-" + m.id)}" hidden><td colspan="9">${x.lastErr ? `<p class="err">Dernière erreur : ${esc(x.lastErr)}</p>` : ""}${code ? `<pre class="code">${esc(code)}</pre>` : `<p class="vide">Pas de code enregistré pour cette mission.</p>`}</td></tr>`;
        }).join("")}</tbody></table></details>`;
    }).join("");
    let projet = "";
    if (jeu === "bip-agence" && g.projet) {
      const P = J.projets[g.projet.type] || { nom: g.projet.type, genre: "", etapes: [] };
      projet = `<details class="groupe" open><summary><b>Projet bonus · ${esc(P.nom)}</b><span>${Object.keys(g.projet.steps || {}).length} / 7</span></summary>
        <div class="projet">${P.etapes.map((t, i) => { const s = (g.projet.steps || {})[i + 1]; const x = g.lv["projet-" + (i + 1)] || {};
          return `<div class="etape ${s ? "faite" : ""}"><p><b>${i + 1}. ${esc(t)}</b> ${s ? `<span class="ok">${etoiles(s.stars)}</span>` : x.runs ? `<span class="tag jaune">en cours · ${x.runs} essais</span>` : ""}</p>${s && s.explain ? `<p class="explication">« ${esc(s.explain)} »</p>` : ""}</div>`; }).join("")}
        ${g.projet.learned ? `<p class="explication"><b>Ce que j’ai appris :</b> « ${esc(g.projet.learned)} »</p>` : ""}
        ${g.projet.files && g.projet.files.js ? `<details><summary>Voir son script.js</summary><pre class="code">${esc(g.projet.files.js)}</pre></details>` : ""}</div></details>`;
    }
    return `<section class="carte"><div class="outils"><h2>${esc(J.titre)}</h2>${barre(g)}</div>
      <p class="resume">Temps passé : <b>${duree(g.temps)}</b> · Indices : <b>${g.hints}</b> · Mauvaises réponses : <b>${g.wrong}</b> · Solutions vues : <b>${g.sols}</b>${g.encours ? ` · En cours : <b>${g.encours.num}. ${esc(g.encours.titre)}</b>` : " · <b>Terminé</b>"}</p>
      ${groupes}${projet}</section>`;
  }).join("");
  $("#app").innerHTML = `<p><button class="btn" type="button" id="retour">← Tous les élèves</button></p>
    <section class="carte entete-eleve"><div><p class="surtitre">Élève</p><h1>${esc(nomEleve(e))}</h1><p>${esc(e.email)} · dernière activité ${depuis(e.dernier)}</p></div><div>${alertes(e)}</div></section>${blocs}
    ${pasCommences.length ? `<section class="carte"><h2>Pas encore commencé</h2><p class="vide">${pasCommences.map(j => esc(JEUX[j].titre)).join(" · ")} (ou joué sans compte).</p></section>` : ""}`;
  $("#retour").addEventListener("click", afficherListe);
  document.querySelectorAll("[data-voir]").forEach(b => b.addEventListener("click", () => { const [jeu, id] = b.dataset.voir.split("|"); const row = document.getElementById("code-" + jeu + "-" + id); row.hidden = !row.hidden; b.textContent = row.hidden ? "Voir" : "Cacher"; }));
  window.scrollTo(0, 0);
}

/* ---------- démarrage ---------- */
function init() {
  if (!window.firebase) { $("#app").innerHTML = `<section class="carte"><h1>Firebase n’a pas pu se charger</h1><p>Vérifie ta connexion internet, puis recharge la page.</p></section>`; return; }
  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FB_CONFIG);
  auth = app.auth(); db = app.firestore(); auth.languageCode = "fr";
  auth.onAuthStateChanged(u => {
    me = u;
    $("#qui").innerHTML = u ? `${esc(u.email)} · <button class="lien" type="button" id="deco">Déconnexion</button> · <button class="lien" type="button" id="actu">Actualiser</button> · <span id="maj"></span>` : "";
    if (u) { $("#deco").addEventListener("click", () => auth.signOut()); $("#actu").addEventListener("click", charger); charger(); }
    else ecranConnexion();
  });
}
init();
