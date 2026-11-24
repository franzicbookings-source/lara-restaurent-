/* La Raza · personal invitation: open the envelope (or the chat), then the invitation with a live countdown. */
(function () {
  var D = window.LR || {};
  var body = document.body;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var key = "lr-opened-" + D.slug;
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); };
  var store = {
    get: function () { try { return localStorage.getItem(key) === "1"; } catch (e) { return false; } },
    set: function (v) { try { v ? localStorage.setItem(key, "1") : localStorage.removeItem(key); } catch (e) {} }
  };

  // shrink a single-line name until it fits its box
  function fit() {
    document.querySelectorAll(".fit").forEach(function (el) {
      var max = +el.getAttribute("data-max") || 60, s = max, box = el.parentElement.clientWidth * 0.94;
      el.style.fontSize = s + "px";
      while (el.scrollWidth > box && s > 18) { s -= 1; el.style.fontSize = s + "px"; }
    });
  }

  function show(instant) {
    body.classList.remove("leaving");
    body.classList.add("opened");
    if (instant) body.classList.add("instant");
    store.set(true);
    window.scrollTo(0, 0);
    fit();
    tick();
  }

  // live countdown to doors
  var target = new Date(D.iso).getTime(), timer;
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function tick() {
    var left = Math.max(0, target - Date.now());
    var d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24, m = Math.floor(left / 6e4) % 60, s = Math.floor(left / 1e3) % 60;
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set("cd-d", d); set("cd-h", pad(h)); set("cd-m", pad(m)); set("cd-s", pad(s));
    if (left === 0) { var k = document.querySelector(".count-k"); if (k) k.textContent = "Tonight · the doors are open"; return; }
    clearTimeout(timer); timer = setTimeout(tick, 1000);
  }

  // calendar: Apple devices take the .ics file, everyone else gets Google Calendar
  var cal = document.getElementById("cal");
  if (cal && !/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) {
    cal.href = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("La Raza · Soft launch") +
      "&dates=20261127T150000Z/20261127T210000Z&details=" + encodeURIComponent("Formal · All black. By invitation only. RSVP 066 407 9896") +
      "&location=" + encodeURIComponent("La Raza, Newcastle");
    cal.target = "_blank"; cal.rel = "noopener";
  }

  var again = document.getElementById("again");
  if (again) again.addEventListener("click", function () { store.set(false); location.reload(); });

  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  var opener = document.getElementById("open");
  if (!opener) { tick(); return; }
  if (store.get()) { show(true); return; }

  if (D.kind === "f") {
    // the chat plays itself, then the gold card waits to be tapped
    var items = [].slice.call(document.querySelectorAll("#thread .chip, #thread .b"));
    var typing = document.getElementById("typing"), st = document.getElementById("chat-st");
    var typingOn = function (on) { typing.classList.toggle("on", on); st.textContent = on ? "typing…" : "online"; st.classList.toggle("ty", on); };
    (async function () {
      await wait(300); items[0].classList.add("on");
      for (var i = 1; i < items.length; i++) {
        typingOn(true); items[i].parentNode.insertBefore(typing, items[i]);
        await wait(i === 1 ? 700 : 900);
        typingOn(false); items[i].classList.add("on");
        if (i > 2) items[i].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
        await wait(250);
      }
    })();
    opener.addEventListener("click", async function () {
      body.classList.add("leaving"); await wait(550); show(false);
    });
    return;
  }

  // the envelope: crack the seal, lift the flap, raise the letter, then the invitation
  var busy = false;
  opener.addEventListener("click", async function () {
    if (busy) return; busy = true;
    if (navigator.vibrate) navigator.vibrate(18);
    body.classList.add("cracked"); await wait(380);
    body.classList.add("flapped"); await wait(650);
    body.classList.add("risen"); await wait(900);
    body.classList.add("leaving"); await wait(550);
    show(false);
  });
})();
