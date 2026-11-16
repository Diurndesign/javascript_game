"use strict";
/* =====================================================================
   SAUVEGARDE EN LIGNE (Supabase) : un compte e-mail + mot de passe,
   la progression suit l'élève sur n'importe quel ordinateur.
   Le même compte sert pour Mission Bip et Bip Agence.
   Sans compte, le jeu marche comme avant (sauvegarde dans le navigateur).
   ===================================================================== */
const BipCloud = (() => {
  const SB_URL = "https://geznatypeygiovbtandl.supabase.co";
  const SB_KEY = "sb_publishable_FjmemBQHp10OD-pL0d4LaQ_tIKjp0MP";
  const START_HASH = location.hash; // lu avant que le jeu ne change l'adresse
  const LOCAL_ONLY = ["teacher", "unlockAll", "owner"];
  let cfg = null, sb = null, user = null, timer = null, busy = false, status = "off", lastPull = 0, ready = false;

  /* ---------- petits outils ---------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  const clean = st => { const o = {}; for (const k in st) if (!LOCAL_ONLY.includes(k)) o[k] = st[k]; return o; };
  function note(msg) {
    let n = $("#cloud-note");
    if (!n) { n = document.createElement("div"); n.id = "cloud-note"; n.setAttribute("role", "status"); document.body.appendChild(n); }
    n.textContent = msg; n.classList.add("show");
    clearTimeout(note.t); note.t = setTimeout(() => n.classList.remove("show"), 3200);
  }
  function french(err) {
    const m = String(err && (err.message || err.error_description || err) || "");
    if (/Invalid login credentials/i.test(m)) return "E-mail ou mot de passe incorrect.";
    if (/already registered|already been registered|already exists/i.test(m)) return "Un compte existe déjà avec cet e-mail : connecte-toi plutôt.";
    if (/at least 6|Password should be/i.test(m)) return "Le mot de passe doit faire au moins 6 caractères.";
    if (/valid email|invalid format|Unable to validate email/i.test(m)) return "Cette adresse e-mail n’est pas valide.";
    if (/rate limit|too many/i.test(m)) return "Trop d’essais en peu de temps : attends quelques minutes, ou préviens ton formateur.";
    if (/not confirmed/i.test(m)) return "Ton e-mail n’est pas encore confirmé : clique sur le lien reçu par e-mail, puis reconnecte-toi.";
    if (/Failed to fetch|NetworkError|network|Load failed/i.test(m)) return "Impossible de joindre le serveur : vérifie ta connexion internet.";
    if (/same.*password|different from the old/i.test(m)) return "Choisis un mot de passe différent de l’ancien.";
    return "Erreur : " + m;
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
    return out;
  }

  /* ---------- lecture / écriture en ligne ---------- */
  async function pull() {
    const { data, error } = await sb.from("progress").select("data").eq("game", cfg.game).maybeSingle();
    if (error) throw error;
    lastPull = Date.now();
    return data ? data.data : null;
  }
  async function push() {
    if (!user) return;
    clearTimeout(timer); timer = null;
    if (busy) { timer = setTimeout(push, 800); return; }
    busy = true; setStatus("saving");
    try {
      const { error } = await sb.from("progress").upsert({ user_id: user.id, game: cfg.game, data: clean(cfg.getStore()) }, { onConflict: "user_id,game" });
      if (error) throw error;
      setStatus("saved");
    } catch (e) {
      setStatus("error");
      timer = setTimeout(push, 15000); // on réessaie plus tard
    } finally { busy = false; }
  }
  function queue() { if (!user || !ready) return; setStatus("pending"); clearTimeout(timer); timer = setTimeout(push, 1200); }

  /* ---------- connexion : on récupère la progression du compte ---------- */
  async function adopt(u, { silent } = {}) {
    user = u; setStatus("saving");
    let remote = null;
    try { remote = await pull(); } catch (e) { setStatus("error"); note(french(e)); return; }
    const cur = cfg.getStore();
    const local = clean(cur);
    let next;
    if (cur.owner && cur.owner !== u.id) next = Object.assign(cfg.empty(), remote || {});        // progression d'un autre élève sur ce PC : on ne mélange pas
    else next = remote ? merge(local, Object.assign(cfg.empty(), remote)) : local;                 // ce que tu as fait sans compte rejoint ton compte
    for (const k of ["teacher", "unlockAll"]) if (k in cur) next[k] = cur[k];
    next.owner = u.id;
    cfg.setStore(next);
    ready = true;
    cfg.persist();
    cfg.refresh();
    await push();
    if (!silent) note(remote ? "Progression récupérée : bon retour !" : "Compte prêt : ta progression est sauvegardée en ligne.");
  }
  async function logout() {
    if (timer || status !== "saved") await push();
    await sb.auth.signOut();
    user = null; ready = false;
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
  const head = (t, sub) => `<p class="card-kicker">Ma sauvegarde en ligne</p><h2 id="modal-title">${t}</h2>${sub ? `<p>${sub}</p>` : ""}`;
  const field = (id, label, type, extra = "") => `<label class="cloud-field" for="${id}"><span>${label}</span><input id="${id}" type="${type}" ${extra}></label>`;

  function showSignup(prefill = "") {
    open(`${head("Crée ton compte", "Avec un compte, ta progression est sauvegardée en ligne : tu continues sur n’importe quel ordinateur. Le même compte marche pour Mission Bip et Bip Agence.")}
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
      const { data, error } = await sb.auth.signUp({ email, password: p1, options: { emailRedirectTo: location.origin + location.pathname } });
      if (error) { err.textContent = french(error); return; }
      if (data.session) { close(); await adopt(data.session.user); return; }
      open(`${head("Vérifie ta boîte mail", "Un e-mail de confirmation vient d’être envoyé à <b>" + esc(email) + "</b>. Clique sur le lien qu’il contient : tu reviendras ici, connecté.")}
        ${REMINDER}<div class="dialog-actions"><button class="btn btn-primary" type="button" id="cloud-ok">Compris</button></div>`, "#cloud-ok");
      $("#cloud-ok").addEventListener("click", close);
    });
  }
  function showLogin(prefill = "") {
    open(`${head("Me connecter", "Retrouve ta progression avec l’e-mail et le mot de passe de ton compte.")}
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
      const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
      if (error) { err.textContent = french(error); return; }
      close(); await adopt(data.user);
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
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      if (error) { err.textContent = french(error); return; }
      open(`${head("E-mail envoyé", "Si un compte existe avec <b>" + esc(email) + "</b>, tu vas recevoir un lien. Ouvre-le : tu pourras choisir un nouveau mot de passe. Pense à regarder dans les spams.")}
        <div class="dialog-actions"><button class="btn btn-primary" type="button" id="cloud-ok">Compris</button></div>`, "#cloud-ok");
      $("#cloud-ok").addEventListener("click", close);
    });
  }
  function showNewPassword() {
    open(`${head("Nouveau mot de passe", "Choisis ton nouveau mot de passe.")}
      <form id="cloud-form" class="cloud-form" novalidate>
        ${field("cloud-pass", "Nouveau mot de passe (6 caractères minimum)", "password", `autocomplete="new-password" required`)}
        ${field("cloud-pass2", "Retape-le", "password", `autocomplete="new-password" required`)}
        ${REMINDER}
        <p class="cloud-err" id="cloud-err" role="alert"></p>
        <div class="dialog-actions"><button class="btn btn-primary" type="submit">Enregistrer</button></div>
      </form>`, "#cloud-pass");
    $("#cloud-form").addEventListener("submit", async ev => {
      ev.preventDefault();
      const p1 = $("#cloud-pass").value, p2 = $("#cloud-pass2").value, err = $("#cloud-err");
      if (p1.length < 6) { err.textContent = "Le mot de passe doit faire au moins 6 caractères."; return; }
      if (p1 !== p2) { err.textContent = "Les deux mots de passe ne sont pas pareils."; return; }
      const { error } = await sb.auth.updateUser({ password: p1 });
      if (error) { err.textContent = french(error); return; }
      close(); note("Mot de passe changé.");
    });
  }
  function showAccount() {
    const when = status === "saved" ? "Ta progression est à jour en ligne." : status === "error" ? "Pas de connexion pour l’instant : on réessaie tout seul." : "Sauvegarde en cours…";
    open(`${head("Mon compte")}
      <p>Connecté avec <b>${esc(user.email)}</b>.</p>
      <p class="cloud-state"><span class="cloud-dot ${status}" aria-hidden="true"></span>${when}</p>
      <p class="cloud-remind"><b>Ordinateur de l’école ?</b> Déconnecte-toi en partant : ta progression reste en ligne, et personne d’autre ne pourra jouer avec ton compte.</p>
      <div class="dialog-actions"><button class="btn btn-ghost" type="button" id="cloud-out">Me déconnecter</button><button class="btn" type="button" id="cloud-now">Sauvegarder maintenant</button><button class="btn btn-primary" type="button" id="cloud-close">Continuer</button></div>`, "#cloud-close");
    $("#cloud-close").addEventListener("click", close);
    $("#cloud-now").addEventListener("click", async () => { await push(); showAccount(); });
    $("#cloud-out").addEventListener("click", async () => { close(); await logout(); });
  }

  /* ---------- bandeau sur l'accueil ---------- */
  function bannerHTML() {
    if (!sb) return "";
    if (user) return "";
    return `<section class="cloud-banner"><div><p class="kicker">Sauvegarde en ligne</p><h2>Crée ton compte pour ne rien perdre</h2><p>Sans compte, ta progression reste dans ce navigateur : sur un autre ordinateur, tu repars de zéro. Avec ton <b>e-mail</b> et un <b>mot de passe</b>, tu la retrouves partout.</p></div>
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
      if (!sb) { note("La sauvegarde en ligne ne marche pas ici : ouvre le jeu depuis son adresse GitHub."); return; }
      const what = t.id === "nav-account" ? (user ? "account" : "login") : t.dataset.cloud;
      ({ account: showAccount, login: showLogin, signup: showSignup })[what]();
    });
    if (!window.supabase || !window.supabase.createClient) { cfg.refresh(); return; } // bibliothèque absente : on reste en local
    sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "bip-jeux-auth" } });
    // retour d'un lien reçu par e-mail (confirmation ou mot de passe oublié)
    const params = new URLSearchParams(START_HASH.replace(/^#/, ""));
    let recovery = false;
    if (params.get("access_token") && params.get("refresh_token")) {
      const { error } = await sb.auth.setSession({ access_token: params.get("access_token"), refresh_token: params.get("refresh_token") });
      if (error) note(french(error)); else recovery = params.get("type") === "recovery";
    } else if (params.get("error_description")) note("Le lien a expiré ou a déjà servi : redemande-en un.");
    let session = null;
    try { session = (await sb.auth.getSession()).data.session; } catch (e) { /* hors ligne */ }
    if (session && session.user) await adopt(session.user, { silent: true });
    else {
      const cur = cfg.getStore();
      if (cur.owner) { const next = cfg.empty(); for (const k of ["teacher", "unlockAll"]) if (k in cur) next[k] = cur[k]; cfg.setStore(next); cfg.persist(); } // déconnecté ailleurs
      cfg.refresh(); setStatus("off");
    }
    if (recovery) showNewPassword();
    sb.auth.onAuthStateChange((ev, s) => { if (ev === "SIGNED_OUT" && user) { user = null; ready = false; setStatus("off"); cfg.refresh(); } });
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

  return { init, queue, bannerHTML, isLogged: () => !!user };
})();
window.BipCloud = BipCloud;
