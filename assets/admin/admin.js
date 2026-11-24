/* La Raza · hiring dashboard: sign in, review applications (status, rating, notes, CV), and see sign-ups. */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const API = "/api/admin?action=";
  const STATUS = { new: "New", shortlisted: "Shortlisted", interview: "Interview", hired: "Hired", declined: "Not suitable" };
  let apps = [], subs = [], filter = "all", current = null;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const when = (iso) => new Date(iso).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const phonePretty = (p) => (p && p.startsWith("+27") && p.length === 12 ? "0" + p.slice(3, 5) + " " + p.slice(5, 8) + " " + p.slice(8) : p || "");
  const store = { get: (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

  async function call(action, body) {
    const res = await fetch(API + action, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
    const data = await res.json().catch(() => ({ ok: false, error: "Something went wrong." }));
    if (res.status === 401 && action !== "login") { showLogin(); throw new Error(data.error); }
    if (!data.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  /* ---------- sign in / out ---------- */
  function showLogin() { $("#app").hidden = true; $("#login").hidden = false; setTimeout(() => $("#pw").focus(), 50); }
  async function showApp() { $("#login").hidden = true; $("#app").hidden = false; await Promise.all([loadApps(), loadSubs()]); }
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button"); btn.disabled = true; $("#login-msg").textContent = "";
    try { await call("login", { password: $("#pw").value }); $("#pw").value = ""; await showApp(); }
    catch (err) { $("#login-msg").textContent = err.message; }
    btn.disabled = false;
  });
  $("#logout").addEventListener("click", async () => { await call("logout", {}).catch(() => {}); showLogin(); });

  /* ---------- tabs ---------- */
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.setAttribute("aria-selected", String(x === t)));
    $("#view-apps").hidden = t.dataset.tab !== "apps";
    $("#view-subs").hidden = t.dataset.tab !== "subs";
  }));

  /* ---------- applications ---------- */
  async function loadApps() {
    $("#list").innerHTML = '<li class="empty">Loading applications…</li>';
    try { apps = (await call("apps")).apps; } catch (err) { $("#list").innerHTML = `<li class="empty">${esc(err.message)}</li>`; return; }
    $("#n-apps").textContent = apps.length;
    renderChips(); renderList();
  }

  function renderChips() {
    const count = (s) => apps.filter((a) => s === "all" || a.status === s).length;
    $("#status-chips").innerHTML = ["all", ...Object.keys(STATUS)].map((s) =>
      `<button type="button" class="chip" data-s="${s}" aria-pressed="${s === filter}">${s === "all" ? "All" : STATUS[s]} <b>${count(s)}</b></button>`).join("");
    document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => { filter = c.dataset.s; renderChips(); renderList(); }));
  }

  function shown() {
    const q = $("#q").value.trim().toLowerCase(), role = $("#role-filter").value;
    return apps.filter((a) => (filter === "all" || a.status === filter) && (!role || a.role === role) &&
      (!q || (a.name + " " + a.email).toLowerCase().includes(q)));
  }

  function renderList() {
    const rows = shown();
    if (!apps.length) { $("#list").innerHTML = '<li class="empty">No applications yet. They appear here as soon as someone applies on the website.</li>'; return; }
    if (!rows.length) { $("#list").innerHTML = '<li class="empty">No applications match. Try another filter.</li>'; return; }
    $("#list").innerHTML = rows.map((a) => `<li><button type="button" class="item" data-id="${esc(a.id)}" aria-current="${current === a.id}">
      <span class="item__name">${esc(a.name)}</span>
      <span class="item__meta">${esc(a.role)} · ${when(a.at)}</span>
      <span class="item__side"><span class="pill ${esc(a.status)}">${STATUS[a.status] || "New"}</span>${a.rating ? `<span class="stars-s">${"★".repeat(a.rating)}</span>` : ""}</span>
    </button></li>`).join("");
    document.querySelectorAll(".item").forEach((b) => b.addEventListener("click", () => open(b.dataset.id)));
  }
  $("#q").addEventListener("input", renderList);
  $("#role-filter").addEventListener("change", renderList);

  function open(id) {
    current = id;
    const a = apps.find((x) => x.id === id);
    if (!a) return;
    renderList();
    const ext = (a.cv.path.split(".").pop() || "").toLowerCase();
    const cvUrl = `${API}cv&id=${encodeURIComponent(a.id)}`;
    const preview = ext === "pdf" ? `<iframe class="cv-frame" src="${cvUrl}" title="CV of ${esc(a.name)}"></iframe>`
      : ["jpg", "jpeg", "png", "webp"].includes(ext) ? `<img class="cv-img" src="${cvUrl}" alt="CV of ${esc(a.name)}">` : "";
    const wa = a.phone ? `https://wa.me/${a.phone.replace(/\D/g, "")}` : "";
    const d = $("#detail");
    d.innerHTML = `
      <button type="button" class="link back" id="back">← All applications</button>
      <h2 class="d-name">${esc(a.name)}</h2>
      <p class="d-meta">${esc(a.role)} · applied ${when(a.at)}</p>
      <div class="d-sec"><p class="d-label">Contact</p><div class="contact">
        <a href="mailto:${esc(a.email)}">${esc(a.email)}</a>
        ${wa ? `<a href="${wa}" target="_blank" rel="noopener">WhatsApp ${esc(phonePretty(a.phone))}</a>` : ""}
      </div></div>
      <div class="d-sec"><p class="d-label">Status</p><div class="status">${Object.keys(STATUS).map((s) =>
        `<button type="button" data-s="${s}" aria-pressed="${a.status === s}">${STATUS[s]}</button>`).join("")}</div></div>
      <div class="d-sec"><p class="d-label">Rating</p><div class="stars" role="group" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) =>
        `<button type="button" data-r="${n}" class="${a.rating >= n ? "on" : ""}" aria-label="${n} star${n > 1 ? "s" : ""}">★</button>`).join("")}</div></div>
      <div class="d-sec"><p class="d-label">CV</p><div class="cv-actions">
        <a class="btn small" href="${cvUrl}" target="_blank" rel="noopener">Open CV</a>
        <a class="btn small ghost" href="${cvUrl}&dl=1">Download</a>
      </div>${preview}</div>
      ${a.refs ? `<div class="d-sec"><p class="d-label">References</p><p class="refs">${esc(a.refs)}</p></div>` : ""}
      <div class="d-sec"><p class="d-label">Notes</p>
        <ul class="notes">${a.notes.map((n) => `<li><p>${esc(n.text)}</p><small>${n.by ? esc(n.by) + " · " : ""}${when(n.at)}</small></li>`).join("") || ""}</ul>
        <form class="note-form" id="note-form">
          <label class="sr" for="note">Add a note</label>
          <textarea id="note" placeholder="Add a note, e.g. “Strong bar experience, call for interview”"></textarea>
          <div class="note-form__row">
            <label class="sr" for="by">Your name</label>
            <input id="by" placeholder="Your name" value="${esc(store.get("lr-by"))}">
            <button class="btn small" type="submit">Add note</button>
          </div>
        </form>
      </div>
      <div class="danger" id="danger"><button type="button" class="link" id="del">Delete this application</button></div>
      <p class="msg" id="d-msg" role="status"></p>`;
    d.classList.add("open"); d.scrollTop = 0;

    $("#back").addEventListener("click", () => { d.classList.remove("open"); current = null; renderList(); });
    d.querySelectorAll(".status button").forEach((b) => b.addEventListener("click", () => update(a, { status: b.dataset.s })));
    d.querySelectorAll(".stars button").forEach((b) => b.addEventListener("click", () => update(a, { rating: a.rating === +b.dataset.r ? 0 : +b.dataset.r })));
    $("#note-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("#note").value.trim(); if (!text) return;
      store.set("lr-by", $("#by").value.trim());
      update(a, { note: text, by: $("#by").value.trim() });
    });
    $("#del").addEventListener("click", () => {
      $("#danger").innerHTML = `<span>Delete ${esc(a.name)}’s application and CV for good?</span>
        <button type="button" class="btn small" id="del-yes">Delete</button><button type="button" class="link" id="del-no">Keep it</button>`;
      $("#del-no").addEventListener("click", () => open(a.id));
      $("#del-yes").addEventListener("click", async () => {
        try { await call("delete", { id: a.id }); apps = apps.filter((x) => x.id !== a.id); current = null;
          d.classList.remove("open"); d.innerHTML = '<p class="empty">Application deleted.</p>';
          $("#n-apps").textContent = apps.length; renderChips(); renderList(); }
        catch (err) { $("#d-msg").textContent = err.message; $("#d-msg").className = "msg err"; }
      });
    });
  }

  async function update(a, change) {
    try {
      const { app } = await call("update", { id: a.id, ...change });
      Object.assign(a, app); renderChips(); open(a.id);
      const m = $("#d-msg"); m.className = "msg ok"; m.textContent = change.note ? "Note added." : change.status ? `Marked as ${STATUS[change.status]}.` : "Rating saved.";
    } catch (err) { const m = $("#d-msg"); if (m) { m.className = "msg err"; m.textContent = err.message; } }
  }

  /* ---------- sign-ups ---------- */
  async function loadSubs() {
    try { subs = (await call("subs")).subs; } catch (err) { $("#subs").innerHTML = `<li class="empty">${esc(err.message)}</li>`; return; }
    const e = subs.filter((s) => s.via === "email").length, w = subs.length - e;
    $("#n-subs").textContent = subs.length;
    $("#subs-count").textContent = `${subs.length} sign-up${subs.length === 1 ? "" : "s"} · ${e} email · ${w} WhatsApp`;
    $("#subs").innerHTML = subs.length ? subs.map((s) => `<li><span class="v">${esc(s.via === "whatsapp" ? phonePretty(s.value) : s.value)}</span>
      <span class="tag ${s.via === "whatsapp" ? "wa" : ""}">${s.via === "whatsapp" ? "WhatsApp" : "Email"}</span><small>${when(s.at)}</small></li>`).join("")
      : '<li class="empty">No sign-ups yet. They appear here when people use the box on the home page.</li>';
  }
  const copyList = (via, btn) => {
    const text = subs.filter((s) => s.via === via).map((s) => s.value).join(via === "email" ? ", " : "\n");
    const done = () => { const o = btn.textContent; btn.textContent = "Copied"; setTimeout(() => (btn.textContent = o), 1400); };
    if (!text) { btn.textContent = "Nothing to copy"; setTimeout(() => (btn.textContent = via === "email" ? "Copy emails" : "Copy WhatsApp numbers"), 1400); return; }
    navigator.clipboard.writeText(text).then(done, () => {});
  };
  $("#copy-emails").addEventListener("click", (e) => copyList("email", e.currentTarget));
  $("#copy-phones").addEventListener("click", (e) => copyList("whatsapp", e.currentTarget));

  /* ---------- start ---------- */
  call("session").then((r) => (r.ok ? showApp() : showLogin())).catch(showLogin);
})();
