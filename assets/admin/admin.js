/* La Raza Admin: overview, hiring (applicants, CVs, stages, ratings, notes) and subscribers. */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const API = "/api/admin?action=";
  const STAGES = { new: "New", shortlisted: "Shortlisted", interview: "Interview", hired: "Hired", declined: "Not suitable" };
  const OPENING = new Date("2026-12-02T18:00:00+02:00");
  const TITLES = { overview: "Overview", hiring: "Hiring", subs: "Subscribers" };
  let apps = [], subs = [], view = "overview", stage = "all", subFilter = "all", openId = null;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const initials = (n) => String(n || "?").replace(/\(.*?\)/g, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const phone = (p) => (p && p.startsWith("+27") && p.length === 12 ? "0" + p.slice(3, 5) + " " + p.slice(5, 8) + " " + p.slice(8) : p || "");
  const date = (iso) => new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  const ago = (iso) => {
    const m = Math.round((Date.now() - new Date(iso)) / 6e4);
    if (m < 1) return "just now"; if (m < 60) return m + " min ago";
    const h = Math.round(m / 60); if (h < 24) return h + " h ago";
    const d = Math.round(h / 24); return d < 7 ? d + (d === 1 ? " day ago" : " days ago") : date(iso);
  };
  const store = { get: (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const icon = (id) => `<svg><use href="#i-${id}"/></svg>`;

  async function call(action, body) {
    const res = await fetch(API + action, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
    const data = await res.json().catch(() => ({ ok: false, error: "Something went wrong. Please try again." }));
    if (res.status === 401 && action !== "login") { showLogin(); throw new Error(data.error); }
    if (!data.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  }

  /* ---------- sign in ---------- */
  function showLogin() { $("#app").hidden = true; $("#login").hidden = false; setTimeout(() => $("#pw").focus(), 60); }
  async function showApp() {
    $("#login").hidden = true; $("#app").hidden = false;
    $("#head-kicker").textContent = new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });
    go(location.hash.slice(1) in TITLES ? location.hash.slice(1) : "overview");
    await Promise.all([loadApps(), loadSubs()]);
  }
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const b = e.target.querySelector("button"); b.disabled = true; $("#login-msg").textContent = "";
    try { await call("login", { password: $("#pw").value }); $("#pw").value = ""; await showApp(); } catch (err) { $("#login-msg").textContent = err.message; }
    b.disabled = false;
  });
  const out = async () => { await call("logout", {}).catch(() => {}); closeSheet(); showLogin(); };
  $("#logout").addEventListener("click", out); $("#logout-m").addEventListener("click", out);

  /* ---------- navigation ---------- */
  function go(v) {
    view = v;
    document.querySelectorAll(".nav__item").forEach((n) => (n.dataset.view === v ? n.setAttribute("aria-current", "page") : n.removeAttribute("aria-current")));
    Object.keys(TITLES).forEach((k) => ($("#v-" + k).hidden = k !== v));
    $("#head-title").textContent = TITLES[v];
    document.title = TITLES[v] + " · La Raza Admin";
    try { history.replaceState(null, "", "#" + v); } catch (e) {}
    window.scrollTo(0, 0);
  }
  document.querySelectorAll(".nav__item").forEach((n) => n.addEventListener("click", () => go(n.dataset.view)));
  document.querySelectorAll("[data-go]").forEach((n) => n.addEventListener("click", () => go(n.dataset.go)));

  /* ---------- overview ---------- */
  function renderOverview() {
    const days = Math.max(0, Math.ceil((OPENING - Date.now()) / 864e5));
    const week = Date.now() - 7 * 864e5;
    const fresh = apps.filter((a) => a.status === "new").length;
    const shortlisted = apps.filter((a) => a.status === "shortlisted" || a.status === "interview").length;
    const newSubs = subs.filter((s) => new Date(s.at) > week).length;
    $("#ov-stats").innerHTML = `
      <div class="stat stat--ink"><span class="stat__n">${days}</span><span class="caps stat__l">Days to opening</span><span class="stat__s">2 December · 18:00</span></div>
      <button type="button" class="stat" data-jump="subs"><span class="stat__n">${subs.length}</span><span class="caps stat__l">Subscribers</span><span class="stat__s">${newSubs} new this week</span></button>
      <button type="button" class="stat" data-jump="hiring"><span class="stat__n">${apps.length}</span><span class="caps stat__l">Applicants</span><span class="stat__s">${fresh} waiting for review</span></button>
      <button type="button" class="stat" data-jump="hiring" data-stage="shortlisted"><span class="stat__n">${shortlisted}</span><span class="caps stat__l">Shortlisted</span><span class="stat__s">${apps.filter((a) => a.status === "hired").length} hired</span></button>`;
    document.querySelectorAll("[data-jump]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.stage) { stage = b.dataset.stage; renderHiring(); } go(b.dataset.jump); }));
    $("#ov-apps").innerHTML = apps.length ? apps.slice(0, 5).map((a) => `<li><button type="button" class="row" data-open="${esc(a.id)}">
        <span class="mono">${esc(initials(a.name))}</span>
        <span class="row__main"><span class="row__t">${esc(a.name)}</span><span class="row__s">${esc(a.role)} · ${ago(a.at)}</span></span>
        <span class="status ${esc(a.status)}">${STAGES[a.status]}</span></button></li>`).join("")
      : '<li class="empty">No applicants yet. They appear here as soon as someone applies on the website.</li>';
    $("#ov-subs").innerHTML = subs.length ? subs.slice(0, 5).map((s) => `<li><div class="row">${kindIcon(s)}
        <span class="row__main"><span class="row__t">${esc(s.via === "whatsapp" ? phone(s.value) : s.value)}</span><span class="row__s">${s.via === "whatsapp" ? "WhatsApp" : "Email"} · ${ago(s.at)}</span></span></div></li>`).join("")
      : '<li class="empty">No subscribers yet. They appear here when people subscribe on the home page.</li>';
    document.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => openApp(b.dataset.open)));
  }
  const kindIcon = (s) => `<span class="kind ${s.via === "whatsapp" ? "wa" : ""}">${icon(s.via === "whatsapp" ? "wa" : "mail")}</span>`;

  /* ---------- hiring ---------- */
  async function loadApps() {
    $("#apps").innerHTML = '<li class="empty">Loading applicants…</li>';
    try { apps = (await call("apps")).apps; } catch (err) { $("#apps").innerHTML = `<li class="empty">${esc(err.message)}</li>`; return; }
    renderHiring(); renderOverview();
  }
  function renderHiring() {
    const n = (s) => apps.filter((a) => s === "all" || a.status === s).length;
    const fresh = n("new");
    $("#badge-new").hidden = !fresh; $("#badge-new").textContent = fresh;
    $("#pipe").innerHTML = ["all", ...Object.keys(STAGES)].map((s) =>
      `<button type="button" role="tab" data-s="${s}" aria-selected="${s === stage}">${s === "all" ? "All" : STAGES[s]} <b>${n(s)}</b></button>`).join("");
    document.querySelectorAll("#pipe button").forEach((b) => b.addEventListener("click", () => { stage = b.dataset.s; renderHiring(); }));
    const q = $("#hq").value.trim().toLowerCase(), role = $("#role").value;
    const list = apps.filter((a) => (stage === "all" || a.status === stage) && (!role || a.role === role) && (!q || (a.name + " " + a.email).toLowerCase().includes(q)));
    $("#apps").innerHTML = !apps.length ? '<li class="empty">No applicants yet. When someone applies on the website, they appear here.</li>'
      : !list.length ? '<li class="empty">No applicants match. Try another stage, role or name.</li>'
      : list.map((a) => `<li><button type="button" class="card" data-id="${esc(a.id)}">
          <span class="mono">${esc(initials(a.name))}</span>
          <span class="card__name">${esc(a.name)}</span>
          <span class="card__meta">${esc(a.role)} · applied ${ago(a.at)}</span>
          <span class="card__foot"><span class="status ${esc(a.status)}">${STAGES[a.status]}</span>${a.rating ? `<span class="stars-s">${"★".repeat(a.rating)}</span>` : ""}</span>
        </button></li>`).join("");
    document.querySelectorAll(".card").forEach((c) => c.addEventListener("click", () => openApp(c.dataset.id)));
  }
  $("#hq").addEventListener("input", renderHiring);
  $("#role").addEventListener("change", renderHiring);

  function closeSheet() { $("#sheet").hidden = true; $("#scrim").hidden = true; document.body.style.overflow = ""; openId = null; }
  $("#scrim").addEventListener("click", closeSheet);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openId) closeSheet(); });

  function openApp(id) {
    const a = apps.find((x) => x.id === id); if (!a) return;
    openId = id;
    const ext = (a.cv.path.split(".").pop() || "").toLowerCase();
    const cv = `${API}cv&id=${encodeURIComponent(a.id)}`;
    const first = a.name.split(" ")[0];
    const wa = `https://wa.me/${a.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${first}, this is La Raza about your application for ${a.role}.`)}`;
    const kb = a.cv.size > 1048576 ? (a.cv.size / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(a.cv.size / 1024)) + " KB";
    const preview = ext === "pdf" ? `<iframe class="preview" src="${cv}" title="CV of ${esc(a.name)}"></iframe>`
      : ["jpg", "jpeg", "png", "webp"].includes(ext) ? `<img class="preview-img" src="${cv}" alt="CV of ${esc(a.name)}">` : "";
    const s = $("#sheet");
    s.innerHTML = `
      <div class="sheet__bar"><button type="button" class="icon-btn" id="close" aria-label="Close">${icon("back")}</button><span class="caps">Applicant</span><span style="width:40px"></span></div>
      <div class="sheet__in">
        <div class="who"><span class="mono lg">${esc(initials(a.name))}</span><div style="min-width:0">
          <h2 class="who__name">${esc(a.name)}</h2><p class="who__meta">${esc(a.role)} · applied ${date(a.at)}, ${ago(a.at)}</p></div></div>
        <div class="quick">
          <a href="${wa}" target="_blank" rel="noopener">${icon("wa")}WhatsApp</a>
          <a href="mailto:${esc(a.email)}?subject=${encodeURIComponent("Your application at La Raza")}">${icon("mail")}Email</a>
          <a href="${cv}" target="_blank" rel="noopener">${icon("doc")}CV</a>
        </div>
        <div class="block"><span class="caps">Stage</span><div class="stages">${Object.keys(STAGES).map((k) =>
          `<button type="button" data-s="${k}" aria-pressed="${a.status === k}">${STAGES[k]}</button>`).join("")}</div></div>
        <div class="block"><span class="caps">Rating</span><div class="rate">${[1, 2, 3, 4, 5].map((r) =>
          `<button type="button" data-r="${r}" class="${a.rating >= r ? "on" : ""}" aria-label="${r} star${r > 1 ? "s" : ""}">★</button>`).join("")}</div></div>
        <div class="block"><span class="caps">Contact</span><div class="quote">${esc(a.email)}\n${esc(phone(a.phone))}</div></div>
        <div class="block"><span class="caps">CV</span>
          <div class="file"><span class="file__ic">${icon("doc")}</span><span class="file__main"><b>${esc(a.cv.name)}</b><small>${kb}</small></span>
            <span class="file__acts"><a class="btn small" href="${cv}" target="_blank" rel="noopener">Open</a><a class="btn small ghost" href="${cv}&dl=1" aria-label="Download">${icon("down")}</a></span></div>
          ${preview}</div>
        ${a.refs ? `<div class="block"><span class="caps">References</span><p class="quote">${esc(a.refs)}</p></div>` : ""}
        <div class="block"><span class="caps">Notes</span>
          <ul class="notes">${a.notes.map((n) => `<li><p>${esc(n.text)}</p><small>${n.by ? esc(n.by) + " · " : ""}${ago(n.at)}</small></li>`).join("")}</ul>
          <form class="note-form" id="note-form">
            <label class="sr" for="note">Add a note</label>
            <textarea id="note" placeholder="Add a note for the team"></textarea>
            <div class="note-form__row"><label class="sr" for="by">Your name</label><input id="by" placeholder="Your name" value="${esc(store.get("lr-by"))}"><button class="btn small" type="submit">Add note</button></div>
          </form></div>
        <p class="msg" id="s-msg" role="status"></p>
        <div class="danger" id="danger"><button type="button" class="link" id="del">Delete this applicant</button></div>
      </div>`;
    s.hidden = false; $("#scrim").hidden = false; s.scrollTop = 0; document.body.style.overflow = "hidden";
    $("#close").addEventListener("click", closeSheet);
    s.querySelectorAll(".stages button").forEach((b) => b.addEventListener("click", () => update(a, { status: b.dataset.s })));
    s.querySelectorAll(".rate button").forEach((b) => b.addEventListener("click", () => update(a, { rating: a.rating === +b.dataset.r ? 0 : +b.dataset.r })));
    $("#note-form").addEventListener("submit", (e) => {
      e.preventDefault(); const text = $("#note").value.trim(); if (!text) return;
      store.set("lr-by", $("#by").value.trim()); update(a, { note: text, by: $("#by").value.trim() });
    });
    $("#del").addEventListener("click", () => {
      $("#danger").innerHTML = `<span>Delete ${esc(first)}’s application and CV for good?</span><button type="button" class="btn small" id="yes">Delete</button><button type="button" class="link" id="no" style="color:var(--muted)">Keep</button>`;
      $("#no").addEventListener("click", () => openApp(a.id));
      $("#yes").addEventListener("click", async () => {
        try { await call("delete", { id: a.id }); apps = apps.filter((x) => x.id !== a.id); closeSheet(); renderHiring(); renderOverview(); }
        catch (err) { flash(err.message, true); }
      });
    });
  }
  const flash = (t, bad) => { const m = $("#s-msg"); if (m) { m.className = "msg " + (bad ? "err" : "ok"); m.textContent = t; } };
  async function update(a, change) {
    try {
      const { app } = await call("update", { id: a.id, ...change });
      Object.assign(a, app); const top = $("#sheet").scrollTop; openApp(a.id); $("#sheet").scrollTop = top;
      renderHiring(); renderOverview();
      flash(change.note ? "Note added." : change.status ? `Moved to ${STAGES[change.status]}.` : "Rating saved.");
    } catch (err) { flash(err.message, true); }
  }

  /* ---------- subscribers ---------- */
  async function loadSubs() {
    $("#subs").innerHTML = '<li class="empty">Loading subscribers…</li>';
    try { subs = (await call("subs")).subs; } catch (err) { $("#subs").innerHTML = `<li class="empty">${esc(err.message)}</li>`; return; }
    renderSubs(); renderOverview();
  }
  function renderSubs() {
    const e = subs.filter((s) => s.via === "email").length;
    $("#sub-stats").innerHTML = `
      <div class="stat stat--ink"><span class="stat__n">${subs.length}</span><span class="caps stat__l">Total</span></div>
      <div class="stat"><span class="stat__n">${e}</span><span class="caps stat__l">Email</span></div>
      <div class="stat"><span class="stat__n">${subs.length - e}</span><span class="caps stat__l">WhatsApp</span></div>`;
    const q = $("#sq").value.trim().toLowerCase();
    const list = shownSubs(q);
    $("#subs").innerHTML = !subs.length ? '<li class="empty">No subscribers yet. They appear here when people subscribe on the home page, or add someone above.</li>'
      : !list.length ? '<li class="empty">No one matches that.</li>'
      : list.map((s) => `<li data-id="${esc(s.id)}">${kindIcon(s)}
          <span class="row__main"><span class="row__t">${esc(s.via === "whatsapp" ? phone(s.value) : s.value)}</span><span class="row__s">${s.via === "whatsapp" ? "WhatsApp" : "Email"} · ${date(s.at)}${s.from === "admin" ? " · added here" : ""}</span></span>
          <button type="button" class="del" aria-label="Remove">${icon("x")}</button></li>`).join("");
    document.querySelectorAll("#subs .del").forEach((b) => b.addEventListener("click", () => confirmRemove(b.closest("li"))));
  }
  function shownSubs(q = $("#sq").value.trim().toLowerCase()) {
    return subs.filter((s) => (subFilter === "all" || s.via === subFilter) && (!q || s.value.toLowerCase().includes(q) || phone(s.value).includes(q)));
  }
  function confirmRemove(li) {
    const id = li.dataset.id;
    li.querySelector(".del").outerHTML = `<span class="confirm"><button type="button" class="link">Remove</button><button type="button" class="link keep">Keep</button></span>`;
    li.querySelector(".keep").addEventListener("click", renderSubs);
    li.querySelector(".confirm .link:not(.keep)").addEventListener("click", async () => {
      try { await call("sub-delete", { id }); subs = subs.filter((s) => s.id !== id); renderSubs(); renderOverview(); say("Removed from the list."); }
      catch (err) { say(err.message, true); }
    });
  }
  const say = (t, bad) => { const m = $("#sub-msg"); m.className = "msg " + (bad ? "err" : "ok"); m.textContent = t; };
  $("#sq").addEventListener("input", renderSubs);
  document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => {
    subFilter = b.dataset.f; document.querySelectorAll(".seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); renderSubs();
  }));
  $("#add-form").addEventListener("submit", async (e) => {
    e.preventDefault(); const v = $("#add-in").value.trim(); if (!v) return;
    try { const { sub } = await call("sub-add", { value: v }); subs.unshift(sub); $("#add-in").value = ""; renderSubs(); renderOverview(); say("Added to the list."); }
    catch (err) { say(err.message, true); }
  });
  $("#copy-list").addEventListener("click", async (e) => {
    const list = shownSubs();
    if (!list.length) return say("There’s no one to copy yet.", true);
    const text = list.map((s) => (s.via === "whatsapp" ? s.value : s.value)).join(subFilter === "email" ? ", " : "\n");
    try { await navigator.clipboard.writeText(text); say(`Copied ${list.length} ${subFilter === "whatsapp" ? "numbers" : subFilter === "email" ? "emails" : "contacts"}.`); }
    catch (err) { say("Copying isn’t allowed here. Use Download instead.", true); }
  });

  /* ---------- start ---------- */
  call("session").then((r) => (r.ok ? showApp() : showLogin())).catch(showLogin);
})();
