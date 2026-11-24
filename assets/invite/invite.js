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

  // one quiet line: how long until the doors open
  var target = new Date(D.iso).getTime(), timer;
  function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
  function tick() {
    var el = document.getElementById("doors"); if (!el) return;
    var left = target - Date.now();
    var d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24, m = Math.floor(left / 6e4) % 60;
    if (left <= 0) el.textContent = "Tonight · the doors are open";
    else if (d >= 1) el.textContent = "Doors open in " + plural(d, "day") + (h ? ", " + plural(h, "hour") : "");
    else if (h >= 1) el.textContent = "Doors open in " + plural(h, "hour") + (m ? ", " + plural(m, "minute") : "");
    else el.textContent = "Doors open in " + plural(Math.max(1, m), "minute");
    clearTimeout(timer); if (left > 0) timer = setTimeout(tick, 30000);
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
