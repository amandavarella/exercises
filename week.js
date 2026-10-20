// Shared code for every week page (week-N/index.html).
// The week number comes from the folder name, e.g. /exercises/week-17/
const weekNum = Number((location.pathname.match(/week-(\d+)/) || [])[1]);
const WEEK = WEEKS.find(w => w.number === weekNum);
if (!WEEK) location.replace("../");
const EXERCISES = WEEK ? WEEK.exercises : [];
const SESSIONS = WEEK ? weekSessions(WEEK) : 1;
const REPS = WEEK ? weekReps(WEEK) : [];
document.title = `Week ${weekNum} · My Exercises`;
document.getElementById("week-title").textContent = `Week ${weekNum}`;

// Session log: { "1": { name: reps|null }, "2": { ... } }
let log = Store.get(Store.logKey(weekNum), {});
const saveLog = () => Store.set(Store.logKey(weekNum), log);
const entries = (s) => (log[s] = log[s] || {});
const isDone = (s, name) => name in entries(s);
const sessionComplete = (s) => EXERCISES.every(ex => isDone(s, ex.name));

// Reps picked on a card before ticking it, per session. Kept until the page closes.
const draft = {};
const shownReps = (s, name) =>
  (isDone(s, name) && entries(s)[name]) || draft[s]?.[name] || lastReps(name, WEEK, s) || REPS[0];

// Open on the session you last used, unless it's finished; then the first unfinished one.
let session = Store.get(Store.sessionKey(weekNum), 1);
if (!(session >= 1 && session <= SESSIONS)) session = 1;
if (sessionComplete(session)) {
  for (let s = 1; s <= SESSIONS; s++) if (!sessionComplete(s)) { session = s; break; }
}

const loadOrder = () => Store.get(Store.orderKey(weekNum), []);
const saveOrder = (order) => Store.set(Store.orderKey(weekNum), order);

// Apply the saved order. Exercises not in the saved list (e.g. newly added) go at the end.
const savedOrder = loadOrder();
const rank = (ex) => { const i = savedOrder.indexOf(ex.name); return i === -1 ? Infinity : i; };
const ordered = EXERCISES.map((ex, i) => ({ ex, i })).sort((a, b) => rank(a.ex) - rank(b.ex) || a.i - b.i).map(o => o.ex);

const ytUrl = (v) => v.short ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`;
const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const gripIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
const tickIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12l5 5L19 7"/></svg>';

// Sections, in the order they first appear in weeks.js. Exercises without one go in a single unnamed section.
const sectionsEl = document.getElementById("sections");
const sectionNames = [...new Set(EXERCISES.map(ex => ex.section || ""))];
const grids = {};
sectionNames.forEach(name => {
  const sec = document.createElement("section");
  sec.className = "section";
  sec.innerHTML = `${name ? `<h2 class="section-title">${name}</h2>` : ""}<div class="grid"></div>`;
  grids[name] = sec.querySelector(".grid");
  sectionsEl.appendChild(sec);
});
const allCards = () => [...document.querySelectorAll(".card")];

ordered.forEach((ex) => {
  const main = ex.videos[0];
  const card = document.createElement("article");
  card.dataset.name = ex.name;
  card.className = "card";
  card.innerHTML = `
    <button class="thumb" type="button" aria-label="Play ${ex.name} video"
      style="background-image:url('https://i.ytimg.com/vi/${main.id}/hqdefault.jpg')">
      <span class="play">${playIcon}</span>
      <span class="badge"><span class="num"></span>${main.short ? " · Short" : ""}</span>
    </button>
    <div class="body">
      <div class="title-row">
        <button class="handle" type="button" aria-label="Reorder ${ex.name}. Drag, or use arrow keys">${gripIcon}</button>
        <h3>${ex.name}</h3>
        <button class="check" type="button" aria-label="Mark ${ex.name} as done" aria-pressed="false">${tickIcon}</button>
      </div>
      <div class="reps-row">
        <div class="reps" role="radiogroup" aria-label="Sets x reps for ${ex.name}">
          ${REPS.map(r => `<button type="button" role="radio" aria-checked="false" data-reps="${r}">${r}</button>`).join("")}
        </div>
        <p class="other"></p>
      </div>
      ${ex.tips ? `<div class="tips">${ex.tips.map(t => `<p>${t}</p>`).join("")}</div>` : ""}
      ${ex.videos.length > 1 ? `<div class="alt">${ex.videos.map((v, j) =>
        `<button type="button" data-v="${j}">▶ ${v.label || "Video " + (j + 1)}</button>`).join("")}</div>` : ""}
    </div>`;

  card.querySelector(".thumb").addEventListener("click", () => openVideo(ex, main));
  card.querySelectorAll(".alt button").forEach(b =>
    b.addEventListener("click", () => openVideo(ex, ex.videos[+b.dataset.v])));

  // Picking reps: updates the log if already ticked, otherwise remembers it for when you tick.
  card.querySelectorAll(".reps button").forEach(b => b.addEventListener("click", () => {
    if (isDone(session, ex.name)) { entries(session)[ex.name] = b.dataset.reps; saveLog(); }
    else (draft[session] = draft[session] || {})[ex.name] = b.dataset.reps;
    renderCard(card, ex);
  }));

  card.querySelector(".check").addEventListener("click", () => {
    const s = session;
    if (isDone(s, ex.name)) delete entries(s)[ex.name];
    else entries(s)[ex.name] = shownReps(s, ex.name);
    saveLog();
    renderCard(card, ex);
    updateCount();
    // After ticking, move on to the next unticked exercise (or the first one left above).
    if (isDone(s, ex.name)) {
      setTimeout(() => {
        if (session !== s || !isDone(s, ex.name)) return; // unticked or switched session during the pause
        const cards = allCards();
        const next = cards.slice(cards.indexOf(card) + 1).find(c => !c.classList.contains("done"))
          || cards.find(c => !c.classList.contains("done"));
        if (next) goTo(next, true);
      }, 450);
    }
  });
  card._ex = ex;
  setupDrag(card);
  grids[ex.section || ""].appendChild(card);
});
renumber();

// Show the current session's tick and reps on a card, plus what you logged in the other session(s).
function renderCard(card, ex) {
  const done = isDone(session, ex.name);
  card.classList.toggle("done", done);
  card.querySelector(".check").setAttribute("aria-pressed", done);
  const reps = shownReps(session, ex.name);
  card.querySelectorAll(".reps button").forEach(b => b.setAttribute("aria-checked", b.dataset.reps === reps));
  const others = [];
  for (let s = 1; s <= SESSIONS; s++) {
    if (s !== session && isDone(s, ex.name)) others.push(`Session ${s}: ${entries(s)[ex.name] || "done"} ✓`);
  }
  card.querySelector(".other").textContent = others.join(" · ");
}
function renderAll() {
  allCards().forEach(c => renderCard(c, c._ex));
  renderTabs();
  updateCount();
}

// Session tabs
const tabs = document.getElementById("tabs");
function renderTabs() {
  tabs.innerHTML = "";
  for (let s = 1; s <= SESSIONS; s++) {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", s === session);
    b.innerHTML = `Session ${s}${sessionComplete(s) ? ' <span class="tab-done">✓</span>' : ""}`;
    b.addEventListener("click", () => switchSession(s));
    tabs.appendChild(b);
  }
}
function switchSession(s) {
  if (s === session) return;
  session = s;
  Store.set(Store.sessionKey(weekNum), s);
  renderAll();
  scrollToNext(true);
}

function renumber() {
  Object.values(grids).forEach(g => g.querySelectorAll(".card").forEach((c, i) => {
    c.querySelector(".num").textContent = String(i + 1).padStart(2, "0");
  }));
}
function persistOrder() {
  saveOrder(allCards().map(c => c.dataset.name));
  renumber();
}

// Drag to reorder with the handle, within a section. Pointer events cover mouse, touch, and pen.
function setupDrag(card) {
  const handle = card.querySelector(".handle");

  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    card.classList.add("dragging");
    document.body.classList.add("is-dragging");

    const onMove = (ev) => {
      // Auto-scroll near the top or bottom edge of the screen.
      const edge = 60;
      if (ev.clientY < edge) window.scrollBy(0, -12);
      else if (ev.clientY > window.innerHeight - edge) window.scrollBy(0, 12);

      const grid = card.parentElement;
      const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".card");
      if (!target || target === card || target.parentElement !== grid) return;
      const cards = [...grid.children];
      const before = cards.indexOf(card) > cards.indexOf(target);
      grid.insertBefore(card, before ? target : target.nextSibling);
    };
    // Listen on the document: moving the card in the DOM would drop pointer capture on the handle.
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      card.classList.remove("dragging");
      document.body.classList.remove("is-dragging");
      persistOrder();
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  });

  // Keyboard: arrow keys move the card one place within its section.
  handle.addEventListener("keydown", (e) => {
    const grid = card.parentElement;
    if (["ArrowUp", "ArrowLeft"].includes(e.key) && card.previousElementSibling) {
      grid.insertBefore(card, card.previousElementSibling);
    } else if (["ArrowDown", "ArrowRight"].includes(e.key) && card.nextElementSibling) {
      grid.insertBefore(card.nextElementSibling, card);
    } else return;
    e.preventDefault();
    handle.focus();
    persistOrder();
  });
}

document.getElementById("reset-order").addEventListener("click", () => {
  const byName = Object.fromEntries(allCards().map(c => [c.dataset.name, c]));
  EXERCISES.forEach(ex => grids[ex.section || ""].appendChild(byName[ex.name]));
  persistOrder();
});

function updateCount() {
  const done = EXERCISES.filter(ex => isDone(session, ex.name)).length;
  document.getElementById("count").textContent =
    `Session ${session}: ${done} / ${EXERCISES.length} done${done === EXERCISES.length ? " 🎉" : ""}`;
  renderTabs();
}

document.getElementById("reset").addEventListener("click", () => {
  if (!Object.keys(entries(session)).length) return;
  if (!confirm(`Clear all ticks and reps for Session ${session}?`)) return;
  log[session] = {};
  delete draft[session];
  saveLog();
  renderAll();
});

renderAll();

// Jump to the first unticked exercise, so you can carry on where you left off.
// Stop the browser restoring the old scroll position over this jump.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
function scrollToNext(smooth = false) {
  const cards = allCards();
  const next = cards.find(c => !c.classList.contains("done"));
  if (!next || next === cards[0]) {
    if (smooth) window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  goTo(next, smooth);
}
function goTo(next, smooth) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  next.scrollIntoView({ block: "start", behavior: smooth && !reduce ? "smooth" : "auto" });
  next.classList.remove("next");
  void next.offsetWidth; // restart the highlight animation
  next.classList.add("next");
  next.addEventListener("animationend", () => next.classList.remove("next"), { once: true });
}
scrollToNext();
// iOS can restore this page from memory instead of reloading it; reload the log and jump again in that case.
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  log = Store.get(Store.logKey(weekNum), {});
  renderAll();
  scrollToNext();
});

// Modal player
const modal = document.getElementById("modal");
const player = document.getElementById("player");
const frame = document.getElementById("frame");
let lastFocus = null;

function openVideo(ex, v) {
  lastFocus = document.activeElement;
  document.getElementById("modal-title").textContent = ex.name + (v.label ? ` · ${v.label}` : "");
  document.getElementById("modal-link").href = ytUrl(v);
  player.classList.toggle("short", v.short);
  frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&playsinline=1"
    title="${ex.name}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  modal.classList.add("open");
  document.getElementById("close").focus();
}
function closeVideo() {
  modal.classList.remove("open");
  frame.innerHTML = "";
  if (lastFocus) lastFocus.focus();
}
document.getElementById("close").addEventListener("click", closeVideo);
modal.addEventListener("click", (e) => { if (e.target === modal) closeVideo(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("open")) closeVideo(); });
