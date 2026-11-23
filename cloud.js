"use strict";
/* =====================================================================
   SAUVEGARDE EN LIGNE (Firebase) : un compte e-mail + mot de passe,
   la progression suit l'élève sur n'importe quel ordinateur.
   Le même compte sert pour Mission Bip et Bip Agence.
   Sans compte, le jeu marche comme avant (sauvegarde dans le navigateur).
   ===================================================================== */
const BipCloud = (() => {
  // clés publiques du projet Firebase « bip-jeux » (faites pour être dans la page)
  const FB_CONFIG = {
    apiKey: "AIzaSyDF6idRWnpsezjXYQ_f_7_58O2prxvA9Gc",
    authDomain: "bip-jeux.firebaseapp.com",
    projectId: "bip-jeux",
    storageBucket: "bip-jeux.firebasestorage.app",
    messagingSenderId: "518939054835",
    appId: "1:518939054835:web:737987fffa793c14a25d86"
  };
  const LOCAL_ONLY = ["teacher", "unlockAll", "owner"];
  let cfg = null, auth = null, db = null, user = null, timer = null, busy = false, status = "off", lastPull = 0, ready = false;

  /* ---------- petits outils ---------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  const clean = st => { const o = {}; for (const k in st) if (!LOCAL_ONLY.includes(k)) o[k] = st[k]; return o; };
  function note(msg, ms) {
    let n = $("#cloud-note");
    if (!n) { n = document.createElement("div"); n.id = "cloud-note"; n.setAttribute("role", "status"); document.body.appendChild(n); }
    n.textContent = msg; n.classList.add("show");
    clearTimeout(note.t); note.t = setTimeout(() => n.classList.remove("show"), ms || 3200);
  }
  function french(err) {
    const code = String(err && err.code || ""), m = String(err && err.message || err || "");
    if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(code)) return "E-mail ou mot de passe incorrect.";
    if (/email-already-in-use/.test(code)) return "Un compte existe déjà avec cet e-mail : connecte-toi plutôt.";
    if (/weak-password/.test(code)) return "Le mot de passe doit faire au moins 6 caractères.";
    if (/invalid-email|missing-email/.test(code)) return "Cette adresse e-mail n’est pas valide.";
    if (/too-many-requests|quota/.test(code)) return "Trop d’essais en peu de temps : attends quelques minutes, ou préviens ton formateur.";
    if (/network-request-failed|unavailable/.test(code) || /Failed to fetch|NetworkError|offline/i.test(m)) return "Impossible de joindre le serveur : vérifie ta connexion internet.";
    if (/permission-denied/.test(code)) return "La base refuse l’accès : préviens ton formateur (règles de sécurité Firestore).";
    if (/operation-not-allowed/.test(code)) return "La connexion par e-mail n’est pas activée : préviens ton formateur.";
    if (/unauthorized-domain/.test(code)) return "Ce site n’est pas autorisé à se connecter : préviens ton formateur.";
    return "Erreur : " + (code || m);
  }

  /* ---------- état affiché dans la barre ---------- */
  function setStatus(s) {
    status = s;
    const b = $("#nav-account"); if (!b) return;
    const label = { off: "Se connecter", saving: "Sauvegarde…", saved: "Sauvegardé", error: "Hors ligne", pending: "Sauvegarde…" }[s] || "Mon compte";
    b.innerHTML = user ? `<span class="cloud-dot ${s}" aria-hidden="true"></span>${label}` : `<span class="cloud-dot off" aria-hidden="true"></span>Se connecter`;
    b.title = user ? "Connecté : " + user.email : "Crée un compte pour retrouver ta progression sur n’importe quel ordinateur";
  }

  /* ---------- fusion de deux progressions ---------- */
  function projScore(p) { return p ? Object.keys(p.steps || {}).length * 1e6 + String((p.files && p.files.js) || "").length : -1; }
  function merge(local, remote) {
    const out = Object.assign({}, remote, local);
    out.progress = Object.assign({}, remote.progress);
    for (const [id, v] of Object.entries(local.progress || {})) {
      const r = out.progress[id];
      out.progress[id] = !r ? v : { ...r, ...v, stars: Math.max(r.stars || 0, v.stars || 0) };
    }
    out.drafts = Object.assign({}, remote.drafts, local.drafts);
    if ("projet" in local || "projet" in remote) out.projet = projScore(local.projet) >= projScore(remote.projet) ? local.projet : remote.projet;
    if (local.suiteShown || remote.suiteShown) out.suiteShown = true;
    if (local.track || remote.track) {
      const a = (local.track && local.track.levels) || {}, b = (remote.track && remote.track.levels) || {}, lv = {};
      for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
        const x = a[id] || {}, y = b[id] || {}, m = {};
        for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
          const vx = x[k], vy = y[k];
          if (typeof vx === "number" && typeof vy === "number") m[k] = k === "first" ? Math.min(vx, vy) : Math.max(vx, vy);
          else m[k] = vx !== undefined ? vx : vy;
        }
        lv[id] = m;
      }
      const lt = local.track || {}, rt = remote.track || {};
      out.track = Object.assign({}, rt, lt, { levels: lv, last: Math.max(lt.last || 0, rt.last || 0) });
      out.track.cur = (lt.last || 0) >= (rt.last || 0) ? lt.cur : rt.cur;
    }
    return out;
  }

  /* ---------- lecture / écriture en ligne ---------- */
  const ref = () => db.collection("eleves").doc(user.uid).collection("jeux").doc(cfg.game);
  async function pull() {
    const d = await ref().get();
    lastPull = Date.now();
    if (!d.exists) return null;
    try { return JSON.parse(d.data().data); } catch (e) { return null; }
  }
  async function push() {
    if (!user) return;
    clearTimeout(timer); timer = null;
    if (busy) { timer = setTimeout(push, 800); return; }
    busy = true; setStatus("saving");
    try {
      await ref().set({ data: JSON.stringify(clean(cfg.getStore())), email: user.email || "", jeu: cfg.game, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      setStatus("saved");
    } catch (e) {
      setStatus("error");
      if (/permission-denied/.test(String(e && e.code))) note(french(e));
      timer = setTimeout(push, 15000); // on réessaie plus tard
    } finally { busy = false; }
  }
  function queue() { if (!user || !ready) return; setStatus("pending"); clearTimeout(timer); timer = setTimeout(push, 1200); }

  /* ---------- mots du formateur (lecture seule pour l'élève) ---------- */
  let notes = {}, notesOff = null;
  const SEEN = () => "bip-notes-vues-" + cfg.game;
  function seen() { try { return JSON.parse(localStorage.getItem(SEEN()) || "{}"); } catch (e) { return {}; } }
  function noteTime(n) { return n && n.at && n.at.toMillis ? n.at.toMillis() : 0; }
  function titre(id) { try { const i = LEVELS.findIndex(l => l.id === id); return i < 0 ? "" : "la mission " + (i + 1) + " « " + LEVELS[i].title + " »"; } catch (e) { return ""; } }
  function paintNote() {
    const el = document.getElementById("prof-note"); if (!el) return;
    const n = notes[el.dataset.id];
    if (!n || !n.text) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    el.innerHTML = `<p class="prof-note-k">Mot du formateur</p><div class="prof-note-t">${esc(n.text)}</div>`;
    const vu = seen(); vu[el.dataset.id] = noteTime(n) || Date.now();
    try { localStorage.setItem(SEEN(), JSON.stringify(vu)); } catch (e) { /* rien */ }
  }
  function listenNotes() {
    if (notesOff) { notesOff(); notesOff = null; }
    notes = {}; paintNote();
    if (!user || !db) return;
    notesOff = db.collection("eleves").doc(user.uid).collection("notes").doc(cfg.game).onSnapshot(snap => {
      notes = (snap.exists && snap.data().notes) || {};
      const vu = seen();
      const cur = document.getElementById("prof-note");
      const nouveaux = Object.keys(notes).filter(id => notes[id] && notes[id].text && noteTime(notes[id]) > (vu[id] || 0) && !(cur && cur.dataset.id === id));
      paintNote();
      if (nouveaux.length) note(nouveaux.length === 1 ? "Ton formateur t’a laissé un mot sur " + (titre(nouveaux[0]) || "une mission") + ". Ouvre-la pour le lire." : "Ton formateur t’a laissé " + nouveaux.length + " mots sur tes missions. Ouvre-les pour les lire.", 9000);
    }, () => { /* règles pas encore à jour : on ignore */ });
  }

  /* ---------- connexion : on récupère la progression du compte ---------- */
  async function adopt(u, { silent } = {}) {
    user = u; setStatus("saving");
    let remote = null;
    try { remote = await pull(); } catch (e) { setStatus("error"); note(french(e)); return; }
    const cur = cfg.getStore();
    const local = clean(cur);
    let next;
    if (cur.owner && cur.owner !== u.uid) next = Object.assign(cfg.empty(), remote || {});        // progression d'un autre élève sur ce PC : on ne mélange pas
    else next = remote ? merge(local, Object.assign(cfg.empty(), remote)) : local;                 // ce que tu as fait sans compte rejoint ton compte
    for (const k of ["teacher", "unlockAll"]) if (k in cur) next[k] = cur[k];
    next.owner = u.uid;
    cfg.setStore(next);
    ready = true;
    cfg.persist();
    cfg.refresh();
    await push();
    listenNotes();
    if (!silent) note(remote ? "Progression récupérée : bon retour !" : "Compte prêt : ta progression est sauvegardée en ligne.");
  }
  async function logout() {
    if (timer || status !== "saved") await push();
    user = null; ready = false; listenNotes();
    await auth.signOut();
    const cur = cfg.getStore(); const next = cfg.empty();
    for (const k of ["teacher", "unlockAll"]) if (k in cur) next[k] = cur[k];
    cfg.setStore(next); cfg.persist(); cfg.refresh();
    setStatus("off");
    note("Déconnecté. Ta progression t’attend en ligne.");
  }

  /* ---------- fenêtres ---------- */
  function open(html, focusSel) {
    $("#dialog").innerHTML = `<div class="cloud-box">${html}</div>`;
    $("#modal").hidden = false;
    const f = focusSel && $(focusSel); if (f) f.focus();
  }
  const close = () => { $("#modal").hidden = true; };
  const REMINDER = `<p class="cloud-remind"><b>Important</b> Note ton e-mail et ton mot de passe quelque part (carnet, téléphone). Ce sont eux qui te permettent de retrouver ta progression sur un autre ordinateur.</p>`;
  const other = () => cfg.game === "bip-agence" ? "Mission Bip" : "Bip Agence";
  const ONE = () => `<p class="cloud-one"><b>Un seul compte pour les deux jeux</b> Mission Bip et Bip Agence utilisent le même compte. Si tu en as déjà créé un dans ${other()}, ne recrée rien : connecte-toi avec le même e-mail et le même mot de passe.</p>`;
  const head = (t, sub) => `<p class="card-kicker">Ma sauvegarde en ligne</p><h2 id="modal-title">${t}</h2>${sub ? `<p>${sub}</p>` : ""}`;
  const field = (id, label, type, extra = "") => `<label class="cloud-field" for="${id}"><span>${label}</span><input id="${id}" type="${type}" ${extra}></label>`;

  function showSignup(prefill = "") {
    open(`${head("Crée ton compte", "Avec un compte, ta progression est sauvegardée en ligne : tu continues sur n’importe quel ordinateur.")}
      ${ONE()}
      <form id="cloud-form" class="cloud-form" novalidate>
        ${field("cloud-email", "Ton e-mail", "email", `autocomplete="email" value="${esc(prefill)}" required`)}
        ${field("cloud-pass", "Choisis un mot de passe (6 caractères minimum)", "password", `autocomplete="new-password" minlength="6" required`)}
        ${field("cloud-pass2", "Retape ton mot de passe", "password", `autocomplete="new-password" required`)}
        ${REMINDER}
        <p class="cloud-err" id="cloud-err" role="alert"></p>
        <div class="dialog-actions"><button class="btn btn-ghost" type="button" id="cloud-to-login">J’ai déjà un compte</button><button class="btn btn-primary" type="submit">Créer mon compte</button></div>
      </form>`, "#cloud-email");
    $("#cloud-to-login").addEventListener("click", () => showLogin($("#cloud-email").value));
    $("#cloud-form").addEventListener("submit", async ev => {
      ev.preventDefault();
      const email = $("#cloud-email").value.trim(), p1 = $("#cloud-pass").value, p2 = $("#cloud-pass2").value, err = $("#cloud-err");
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Écris une adresse e-mail valide."; return; }
      if (p1.length < 6) { err.textContent = "Le mot de passe doit faire au moins 6 caractères."; return; }
      if (p1 !== p2) { err.textContent = "Les deux mots de passe ne sont pas pareils."; return; }
      err.textContent = "Création du compte…";
      let cred;
      try { cred = await auth.createUserWithEmailAndPassword(email, p1); } catch (e) { err.textContent = french(e); return; }
      close(); await adopt(cred.user);
    });
  }
  function showLogin(prefill = "") {
    open(`${head("Me connecter", "Retrouve ta progression avec l’e-mail et le mot de passe de ton compte. C’est le même compte pour Mission Bip et Bip Agence.")}
      <form id="cloud-form" class="cloud-form" novalidate>
        ${field("cloud-email", "Ton e-mail", "email", `autocomplete="email" value="${esc(prefill)}" required`)}
        ${field("cloud-pass", "Ton mot de passe", "password", `autocomplete="current-password" required`)}
        <p class="cloud-err" id="cloud-err" role="alert"></p>
        <p class="cloud-links"><button type="button" class="cloud-link" id="cloud-forgot">Mot de passe oublié ?</button> · <button type="button" class="cloud-link" id="cloud-to-signup">Je n’ai pas encore de compte</button></p>
        <div class="dialog-actions"><button class="btn btn-ghost" type="button" id="cloud-cancel">Plus tard</button><button class="btn btn-primary" type="submit">Me connecter</button></div>
      </form>`, prefill ? "#cloud-pass" : "#cloud-email");
    $("#cloud-cancel").addEventListener("click", close);
    $("#cloud-to-signup").addEventListener("click", () => showSignup($("#cloud-email").value));
    $("#cloud-forgot").addEventListener("click", () => showForgot($("#cloud-email").value));
    $("#cloud-form").addEventListener("submit", async ev => {
      ev.preventDefault();
      const email = $("#cloud-email").value.trim(), pass = $("#cloud-pass").value, err = $("#cloud-err");
      if (!email || !pass) { err.textContent = "Écris ton e-mail et ton mot de passe."; return; }
      err.textContent = "Connexion…";
      let cred;
      try { cred = await auth.signInWithEmailAndPassword(email, pass); } catch (e) { err.textContent = french(e); return; }
      close(); await adopt(cred.user);
    });
  }
  function showForgot(prefill = "") {
    open(`${head("Mot de passe oublié", "Écris l’e-mail de ton compte : tu vas recevoir un lien pour choisir un nouveau mot de passe.")}
      <form id="cloud-form" class="cloud-form" novalidate>
        ${field("cloud-email", "Ton e-mail", "email", `autocomplete="email" value="${esc(prefill)}" required`)}
        <p class="cloud-err" id="cloud-err" role="alert"></p>
        <div class="dialog-actions"><button class="btn btn-ghost" type="button" id="cloud-back">Retour</button><button class="btn btn-primary" type="submit">Recevoir le lien</button></div>
      </form>`, "#cloud-email");
    $("#cloud-back").addEventListener("click", () => showLogin($("#cloud-email").value));
    $("#cloud-form").addEventListener("submit", async ev => {
      ev.preventDefault();
      const email = $("#cloud-email").value.trim(), err = $("#cloud-err");
      if (!email) { err.textContent = "Écris ton e-mail."; return; }
      err.textContent = "Envoi…";
      try { await auth.sendPasswordResetEmail(email); } catch (e) { if (!/user-not-found/.test(String(e && e.code))) { err.textContent = french(e); return; } }
      open(`${head("E-mail envoyé", "Si un compte existe avec <b>" + esc(email) + "</b>, tu vas recevoir un lien. Ouvre-le pour choisir un nouveau mot de passe, puis reviens te connecter ici. Pense à regarder dans les spams.")}
        <div class="dialog-actions"><button class="btn btn-primary" type="button" id="cloud-ok">Compris</button></div>`, "#cloud-ok");
      $("#cloud-ok").addEventListener("click", close);
    });
  }
  function showAccount() {
    const when = status === "saved" ? "Ta progression est à jour en ligne." : status === "error" ? "Pas de connexion pour l’instant : on réessaie tout seul." : "Sauvegarde en cours…";
    open(`${head("Mon compte")}
      <p>Connecté avec <b>${esc(user.email)}</b>. Ce compte marche aussi dans ${other()} : tu y es déjà connecté sur ce navigateur.</p>
      <p class="cloud-state"><span class="cloud-dot ${status}" aria-hidden="true"></span>${when}</p>
      <p class="cloud-remind"><b>Ordinateur de l’école ?</b> Déconnecte-toi en partant : ta progression reste en ligne, et personne d’autre ne pourra jouer avec ton compte.</p>
      <div class="dialog-actions"><button class="btn btn-ghost" type="button" id="cloud-out">Me déconnecter</button><button class="btn" type="button" id="cloud-now">Sauvegarder maintenant</button><button class="btn btn-primary" type="button" id="cloud-close">Continuer</button></div>`, "#cloud-close");
    $("#cloud-close").addEventListener("click", close);
    $("#cloud-now").addEventListener("click", async () => { await push(); showAccount(); });
    $("#cloud-out").addEventListener("click", async () => { close(); await logout(); });
  }

  /* ---------- suivi pour le formateur ----------
     Pour chaque mission : essais, erreurs, indices, solution, mauvaises
     réponses, temps passé, dernière erreur. Rangé dans la progression. */
  function track(kind, id, extra = {}) {
    if (!cfg || !id) return;
    const st = cfg.getStore(); if (!st) return;
    const T = st.track || (st.track = { levels: {} });
    if (!T.levels) T.levels = {};
    const now = Date.now();
    const lv = T.levels[id] || (T.levels[id] = {});
    if (T.cur === id && T.last && now - T.last < 180000) lv.time = (lv.time || 0) + (now - T.last); // pauses de plus de 3 min ignorées
    if (!lv.first) lv.first = now;
    lv.lastAt = now; T.cur = id; T.last = now;
    const inc = k => { lv[k] = (lv[k] || 0) + 1; };
    if (kind === "open") inc("opens");
    if (kind === "run") {
      inc("runs");
      if (extra.error) { inc("errors"); lv.lastErr = String(extra.error).slice(0, 160); }
      else if (extra.ok === false) inc("fails");
      if (extra.goals) lv.goals = extra.goals;
      if (extra.ok) delete lv.lastErr;
    }
    if (kind === "hint") inc("hints");
    if (kind === "solution") lv.solution = 1;
    if (kind === "wrong") inc("wrong");
    if (kind === "done") { if (!lv.doneAt) lv.doneAt = now; if (extra.stars) lv.stars = Math.max(lv.stars || 0, extra.stars); }
    cfg.persist();
    queue();
  }

  /* ---------- bandeau sur l'accueil ---------- */
  function bannerHTML() {
    if (!auth) return "";
    if (user) return "";
    return `<section class="cloud-banner"><div><p class="kicker">Sauvegarde en ligne</p><h2>Crée ton compte pour ne rien perdre</h2><p>Sans compte, ta progression reste dans ce navigateur : sur un autre ordinateur, tu repars de zéro. Avec ton <b>e-mail</b> et un <b>mot de passe</b>, tu la retrouves partout.</p><p class="cloud-banner-one">Déjà un compte sur ${other()} ? C’est le même : clique sur « J’ai déjà un compte ».</p></div>
      <div class="cloud-banner-actions"><button class="btn btn-primary" type="button" data-cloud="signup">Créer mon compte</button><button class="btn" type="button" data-cloud="login">J’ai déjà un compte</button></div></section>`;
  }

  /* ---------- démarrage ---------- */
  async function init(config) {
    cfg = config;
    const nav = $(".nav");
    if (nav && !$("#nav-account")) { const b = document.createElement("button"); b.type = "button"; b.id = "nav-account"; b.className = "nav-account"; nav.appendChild(b); }
    setStatus("off");
    document.addEventListener("click", e => {
      const t = e.target.closest("#nav-account, [data-cloud]"); if (!t) return;
      if (!auth) { note("La sauvegarde en ligne ne marche pas ici : ouvre le jeu depuis son adresse GitHub."); return; }
      const what = t.id === "nav-account" ? (user ? "account" : "login") : t.dataset.cloud;
      ({ account: showAccount, login: showLogin, signup: showSignup })[what]();
    });
    if (!window.firebase || !firebase.initializeApp) { cfg.refresh(); return; } // bibliothèque absente : on reste en local
    try {
      const app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(FB_CONFIG);
      auth = app.auth(); db = app.firestore(); auth.languageCode = "fr";
    } catch (e) { auth = null; cfg.refresh(); return; }
    const first = await new Promise(res => { const off = auth.onAuthStateChanged(u => { off(); res(u); }, () => res(null)); });
    if (first) await adopt(first, { silent: true });
    else {
      const cur = cfg.getStore();
      if (cur.owner) { const next = cfg.empty(); for (const k of ["teacher", "unlockAll"]) if (k in cur) next[k] = cur[k]; cfg.setStore(next); cfg.persist(); } // déconnecté ailleurs
      cfg.refresh(); setStatus("off");
    }
    auth.onAuthStateChanged(u => { if (!u && user) { user = null; ready = false; listenNotes(); setStatus("off"); cfg.refresh(); } });
    document.addEventListener("visibilitychange", async () => {
      if (!user) return;
      if (document.visibilityState === "hidden") { if (timer) push(); return; }
      if (Date.now() - lastPull > 60000) {
        try {
          const remote = await pull(); if (!remote) return;
          const cur = cfg.getStore(); const next = merge(clean(cur), Object.assign(cfg.empty(), remote));
          for (const k of LOCAL_ONLY) if (k in cur) next[k] = cur[k];
          cfg.setStore(next); cfg.persist(); cfg.refresh();
        } catch (e) { /* on garde le local */ }
      }
    });
  }

  return { init, queue, track, bannerHTML, paintNote, isLogged: () => !!user };
})();
window.BipCloud = BipCloud;
