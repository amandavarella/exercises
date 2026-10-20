// Shared code for every week page (week-N/index.html).
// The week number comes from the folder name, e.g. /exercises/week-17/
const weekNum = Number((location.pathname.match(/week-(\d+)/) || [])[1]);
const WEEK = WEEKS.find(w => w.number === weekNum);
if (!WEEK) location.replace("../");
const EXERCISES = WEEK ? WEEK.exercises : [];
document.title = `Week ${weekNum} · My Exercises`;
document.getElementById("week-title").textContent = `Week ${weekNum}`;

const load = () => Store.get(Store.doneKey(weekNum), []);
const save = (done) => Store.set(Store.doneKey(weekNum), done);
let done = new Set(load());

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

const grid = document.getElementById("grid");

ordered.forEach((ex) => {
  const main = ex.videos[0];
  const card = document.createElement("article");
  card.dataset.name = ex.name;
  card.className = "card" + (done.has(ex.name) ? " done" : "");
  card.innerHTML = `
    <button class="thumb" type="button" aria-label="Play ${ex.name} video"
      style="background-image:url('https://i.ytimg.com/vi/${main.id}/hqdefault.jpg')">
      <span class="play">${playIcon}</span>
      <span class="badge"><span class="num"></span>${main.short ? " · Short" : ""}</span>
    </button>
    <div class="body">
      <div class="title-row">
        <button class="handle" type="button" aria-label="Reorder ${ex.name}. Drag, or use arrow keys">${gripIcon}</button>
        <h2>${ex.name}</h2>
        <button class="check" type="button" aria-label="Mark ${ex.name} as done" aria-pressed="${done.has(ex.name)}">${tickIcon}</button>
      </div>
      ${ex.tips ? `<div class="tips">${ex.tips.map(t => `<p>${t}</p>`).join("")}</div>` : ""}
      ${ex.videos.length > 1 ? `<div class="alt">${ex.videos.map((v, j) =>
        `<button type="button" data-v="${j}">▶ ${v.label || "Video " + (j + 1)}</button>`).join("")}</div>` : ""}
    </div>`;

  card.querySelector(".thumb").addEventListener("click", () => openVideo(ex, main));
  card.querySelectorAll(".alt button").forEach(b =>
    b.addEventListener("click", () => openVideo(ex, ex.videos[+b.dataset.v])));
  const check = card.querySelector(".check");
  check.addEventListener("click", () => {
    done.has(ex.name) ? done.delete(ex.name) : done.add(ex.name);
    card.classList.toggle("done", done.has(ex.name));
    check.setAttribute("aria-pressed", done.has(ex.name));
    save([...done]);
    updateCount();
  });
  setupDrag(card);
  grid.appendChild(card);
});
renumber();

function renumber() {
  grid.querySelectorAll(".card").forEach((c, i) => {
    c.querySelector(".num").textContent = String(i + 1).padStart(2, "0");
  });
}
function persistOrder() {
  saveOrder([...grid.querySelectorAll(".card")].map(c => c.dataset.name));
  renumber();
}

// Drag to reorder with the handle. Pointer events cover mouse, touch, and pen.
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

      const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".card");
      if (!target || target === card) return;
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

  // Keyboard: arrow keys move the card one place.
  handle.addEventListener("keydown", (e) => {
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
  const byName = Object.fromEntries([...grid.children].map(c => [c.dataset.name, c]));
  EXERCISES.forEach(ex => grid.appendChild(byName[ex.name]));
  persistOrder();
});

function updateCount() {
  document.getElementById("count").textContent = `${done.size} / ${EXERCISES.length} done`;
}
updateCount();

// Jump to the first unticked exercise, so you can carry on where you left off.
// Stop the browser restoring the old scroll position over this jump.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
function scrollToNext() {
  const next = grid.querySelector(".card:not(.done)");
  if (!next || next === grid.firstElementChild) return;
  next.scrollIntoView({ block: "start" });
  next.classList.remove("next");
  void next.offsetWidth; // restart the highlight animation
  next.classList.add("next");
  next.addEventListener("animationend", () => next.classList.remove("next"), { once: true });
}
scrollToNext();
// iOS can restore this page from memory instead of reloading it; jump again in that case.
window.addEventListener("pageshow", (e) => { if (e.persisted) scrollToNext(); });

document.getElementById("reset").addEventListener("click", () => {
  done.clear(); save([]);
  document.querySelectorAll(".card").forEach(c => c.classList.remove("done"));
  document.querySelectorAll(".check").forEach(c => c.setAttribute("aria-pressed", "false"));
  updateCount();
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
