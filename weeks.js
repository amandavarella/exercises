// All training weeks. To add a week, copy a block below, change the number, and list its exercises.
// "short: true" means a vertical YouTube Short. "tips" and "label" are optional.
// "section" groups exercises on the week page, in the order the sections first appear.
// "sessions" (how many times you do the week) and "reps" (the choices to log) are optional per week.
const DEFAULT_SESSIONS = 2;
const DEFAULT_REPS = ["2x4", "2x6", "2x8", "2x10"];

const WEEKS = [
  {
    number: 17,
    exercises: [
      {
        name: "Lying Press",
        section: "Upper Program 2",
        videos: [{ id: "d33SDkfL1yQ", short: true }]
      },
      {
        name: "Single Arm Row",
        section: "Upper Program 2",
        videos: [{ id: "i9BJwVCK5VQ", short: true }]
      },
      {
        name: "Arnold Press",
        section: "Upper Program 2",
        videos: [
          { id: "ek_lFDl-pJw", short: true, label: "Standing" },
          { id: "DskS1VzOVos", short: true, label: "Seated" }
        ]
      },
      {
        name: "Pallof Press (Banded)",
        section: "Upper Program 2",
        videos: [{ id: "JEjKGg7dVVA", short: true }]
      },
      {
        name: "Standing Banded Abduction",
        section: "Lower Program 2",
        tips: [
          "Keep your trunk nice and straight as you abduct (move away) the leg.",
          "Use whichever band feels best or that you have access to. A long band needs to be tied."
        ],
        videos: [
          { id: "8Ax7lJ3I7pk", short: true, label: "Friend demo (small band)" },
          { id: "7Sph-K6Nmgc", short: true, label: "Long band version" }
        ]
      },
      {
        name: "Alternating Lunges",
        section: "Lower Program 2",
        videos: [{ id: "tTej-ax9XiA", short: false }]
      },
      {
        name: "Glute Bridge with Band Abduction",
        section: "Lower Program 2",
        tips: [
          "Before you come up, pelvic tilt first: bring the top of your hips toward your belly button and squeeze your bum.",
          "Then drive up into the glute bridge end position.",
          "From the top, abduct your knees out against the band."
        ],
        videos: [{ id: "tv9dFw4zPA0", short: true }]
      },
      {
        name: "Squat with a Band",
        section: "Lower Program 2",
        tips: ["Band goes above the knees."],
        videos: [{ id: "ExfeIVSC1HU", short: true }]
      }
    ]
  }
];

// Each week lives at /week-<number>/ (a folder made by tools/sync-weeks.js).
const weekSlug = (w) => `week-${w.number}`;
const weekSessions = (w) => w.sessions || DEFAULT_SESSIONS;
const weekReps = (w) => w.reps || DEFAULT_REPS;

// Saved in this browser only.
const Store = {
  get(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  // Log of what you did: { "1": { "Lying Press": "2x8", ... }, "2": { ... } }.
  // An exercise listed under a session is done in that session; its value is the reps (or null if not recorded).
  logKey: (n) => `week-${n}-log`,
  orderKey: (n) => `week-${n}-order`,
  sessionKey: (n) => `week-${n}-session`
};

// Done counts for a week: overall and per session.
function weekProgress(w) {
  const log = Store.get(Store.logKey(w.number), {});
  const names = w.exercises.map(e => e.name);
  const sessions = [];
  for (let s = 1; s <= weekSessions(w); s++) {
    const entries = log[s] || {};
    sessions.push({ done: names.filter(n => n in entries).length, total: names.length });
  }
  const done = sessions.reduce((a, s) => a + s.done, 0);
  const total = sessions.reduce((a, s) => a + s.total, 0);
  return { done, total, pct: total ? done / total : 0, sessions };
}

// The reps you logged most recently for an exercise, looking at this week's other sessions, then earlier weeks.
function lastReps(name, week, exceptSession) {
  const earlier = WEEKS.filter(w => w.number <= week.number).sort((a, b) => b.number - a.number);
  for (const w of earlier) {
    const log = Store.get(Store.logKey(w.number), {});
    const sessions = Object.keys(log).map(Number).sort((a, b) => b - a);
    for (const s of sessions) {
      if (w === week && s === exceptSession) continue;
      if (log[s][name]) return log[s][name];
    }
  }
  return null;
}

// One-time moves of data saved by earlier versions of the app.
(function migrate() {
  try {
    // Before weeks existed, ticks and order belonged to Week 17.
    for (const [oldKey, newKey] of [["exercises-done", "week-17-done"], ["exercises-order", Store.orderKey(17)]]) {
      const v = localStorage.getItem(oldKey);
      if (v !== null && localStorage.getItem(newKey) === null) localStorage.setItem(newKey, v);
      localStorage.removeItem(oldKey);
    }
    // Before sessions existed, ticks were a single list. They become Session 1, with reps not recorded.
    for (const w of WEEKS) {
      const oldKey = `week-${w.number}-done`;
      const ticks = JSON.parse(localStorage.getItem(oldKey) || "null");
      if (ticks && localStorage.getItem(Store.logKey(w.number)) === null) {
        Store.set(Store.logKey(w.number), { 1: Object.fromEntries(ticks.map(n => [n, null])) });
      }
      localStorage.removeItem(oldKey);
    }
  } catch {}
})();
