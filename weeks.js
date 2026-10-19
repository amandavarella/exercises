// All training weeks. To add a week, copy a block below, change the number, and list its exercises.
// "short: true" means a vertical YouTube Short. "tips" and "label" are optional.
const WEEKS = [
  {
    number: 17,
    exercises: [
      {
        name: "Lying Press",
        videos: [{ id: "d33SDkfL1yQ", short: true }]
      },
      {
        name: "Single Arm Row",
        videos: [{ id: "i9BJwVCK5VQ", short: true }]
      },
      {
        name: "Pallof Press (Banded)",
        videos: [{ id: "y1fOBVtANdM", short: false }]
      },
      {
        name: "Standing Banded Abduction",
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
        videos: [{ id: "tTej-ax9XiA", short: false }]
      },
      {
        name: "Glute Bridge with Band Abduction",
        tips: [
          "Before you come up, pelvic tilt first: bring the top of your hips toward your belly button and squeeze your bum.",
          "Then drive up into the glute bridge end position.",
          "From the top, abduct your knees out against the band."
        ],
        videos: [{ id: "tv9dFw4zPA0", short: true }]
      },
      {
        name: "Squat with a Band",
        tips: ["Band goes above the knees."],
        videos: [{ id: "ExfeIVSC1HU", short: true }]
      },
      {
        name: "Arnold Press",
        videos: [
          { id: "ek_lFDl-pJw", short: true, label: "Standing" },
          { id: "DskS1VzOVos", short: true, label: "Seated" }
        ]
      }
    ]
  }
];

// Each week lives at /week-<number>/ (a folder made by tools/sync-weeks.js).
const weekSlug = (w) => `week-${w.number}`;

// Per-week storage of ticks and order, saved in this browser only.
const Store = {
  get(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  doneKey: (n) => `week-${n}-done`,
  orderKey: (n) => `week-${n}-order`
};

// One-time move of ticks and order saved before weeks existed (they belonged to Week 17).
(function migrate() {
  try {
    for (const [oldKey, newKey] of [["exercises-done", Store.doneKey(17)], ["exercises-order", Store.orderKey(17)]]) {
      const v = localStorage.getItem(oldKey);
      if (v !== null && localStorage.getItem(newKey) === null) localStorage.setItem(newKey, v);
      localStorage.removeItem(oldKey);
    }
  } catch {}
})();
