// Cognitive Ability Assessment — text-only edition (17 items).
// Rasch (1-PL) scoring: theta_MLE → IQ = 100 + 15*theta, with ±SEM.
// Source: user-provided cognitive assessment.

// Each item has: d=domain, b=Rasch difficulty (logits),
// prompt=question text, opts=array of 4 answer strings.
// The FIRST option is always the correct one at authoring time.
// At runtime we shuffle and track the correct index.

export const RAW_ITEMS = [
  // ---------- Number series (6) ----------
  { d: "Number series", b: -2.2, prompt: "2, 4, 6, 8, ?", opts: ["10", "12", "9", "16"] },
  { d: "Number series", b: -1.3, prompt: "3, 6, 12, 24, ?", opts: ["48", "36", "30", "42"] },
  { d: "Number series", b: -0.8, prompt: "1, 1, 2, 3, 5, 8, ?", opts: ["13", "11", "12", "16"] },
  { d: "Number series", b:  0.2, prompt: "2, 3, 5, 9, 17, ?", opts: ["33", "34", "26", "31"] },
  { d: "Number series", b:  0.5, prompt: "6, 11, 21, 41, 81, ?", opts: ["161", "121", "141", "163"] },
  { d: "Number series", b:  1.2, prompt: "4, 9, 25, 49, 121, ?", opts: ["169", "144", "143", "225"] },

  // ---------- Verbal analogies (6) ----------
  { d: "Verbal", b: -2.5, prompt: "KITTEN is to CAT as PUPPY is to …",         opts: ["Dog", "Wolf", "Kennel", "Bone"] },
  { d: "Verbal", b: -1.0, prompt: "AUTHOR is to BOOK as COMPOSER is to …",      opts: ["Symphony", "Orchestra", "Piano", "Concert"] },
  { d: "Verbal", b: -0.6, prompt: "SCALPEL is to SURGEON as CHISEL is to …",    opts: ["Sculptor", "Stone", "Hammer", "Workshop"] },
  { d: "Verbal", b: -0.3, prompt: "DROUGHT is to RAIN as FAMINE is to …",       opts: ["Food", "Hunger", "Poverty", "Harvest"] },
  { d: "Verbal", b:  0.6, prompt: "EPHEMERAL is to PERMANENT as AMBIGUOUS is to …", opts: ["Clear", "Vague", "Doubtful", "Complex"] },
  { d: "Verbal", b:  0.9, prompt: "MISER is to GENEROSITY as TRAITOR is to …",  opts: ["Loyalty", "Betrayal", "Country", "Deceit"] },

  // ---------- Logical reasoning (5) ----------
  { d: "Logic", b: -1.8, prompt: "Anna is taller than Ben. Ben is taller than Carl. Who is shortest?", opts: ["Carl", "Ben", "Anna", "Cannot be determined"] },
  { d: "Logic", b:  0.1, prompt: "Some doctors are surgeons. All surgeons are skilled. Which conclusion follows with certainty?", opts: ["Some doctors are skilled", "All doctors are skilled", "No doctors are skilled", "All skilled people are surgeons"] },
  { d: "Logic", b:  0.3, prompt: "If it rains, the ground gets wet. The ground is wet. What can you conclude?", opts: ["It may or may not have rained", "It definitely rained", "It definitely did not rain", "The ground is always wet"] },
  { d: "Logic", b:  0.4, prompt: "Which word does NOT belong with the others?", opts: ["Brass", "Copper", "Iron", "Zinc"] },
  { d: "Logic", b:  0.7, prompt: "All roses are flowers. Some flowers fade quickly. Which conclusion follows with certainty?", opts: ["None of the other conclusions follows", "Some roses fade quickly", "All flowers are roses", "Roses never fade"] },
];

// Fisher–Yates + return the new correct-index after shuffle.
export function shuffleItem(item) {
  const idx = item.opts.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return {
    ...item,
    opts: idx.map((i) => item.opts[i]),
    correct: idx.indexOf(0), // first raw option is the correct one
  };
}

export function prepareItems() {
  return RAW_ITEMS.map(shuffleItem);
}

// ---------- Rasch (1-PL) MLE for theta ----------
const prob = (theta, b) => 1 / (1 + Math.exp(-(theta - b)));

export function estimateTheta(scored /* [{b, u}] */) {
  let th = 0;
  for (let iter = 0; iter < 50; iter++) {
    let d1 = 0, d2 = 0;
    for (const s of scored) {
      const p = prob(th, s.b);
      d1 += s.u - p;
      d2 -= p * (1 - p);
    }
    if (Math.abs(d2) < 1e-9) break;
    let step = d1 / d2;
    step = Math.max(-1, Math.min(1, step));
    th -= step;
    th = Math.max(-4, Math.min(4, th));
    if (Math.abs(step) < 1e-6) break;
  }
  let info = 0;
  for (const s of scored) {
    const p = prob(th, s.b);
    info += p * (1 - p);
  }
  return { theta: th, sem: info > 0 ? 1 / Math.sqrt(info) : Infinity };
}

// Standard normal CDF (Zelen & Severo)
export function normCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function scoreAttempt(items, answers) {
  const scored = [];
  items.forEach((it, i) => {
    if (answers[i] !== null && answers[i] !== undefined) {
      scored.push({ b: it.b, u: answers[i] === it.correct ? 1 : 0, i });
    }
  });
  const answered = scored.length;
  const nCorrect = scored.reduce((a, s) => a + s.u, 0);
  if (answered < 5) return { valid: false, answered, nCorrect };
  const { theta, sem } = estimateTheta(scored);
  const clamp = (v) => Math.max(55, Math.min(145, v));
  const iq = clamp(Math.round(100 + 15 * theta));
  const iqLo = clamp(Math.round(100 + 15 * (theta - 1.96 * sem)));
  const iqHi = clamp(Math.round(100 + 15 * (theta + 1.96 * sem)));
  const pct = normCDF(theta);
  const pctText = pct >= 0.999 ? ">99.9" : pct <= 0.001 ? "<0.1" : (pct * 100).toFixed(1);
  // domain breakdown
  const domains = {};
  items.forEach((it, i) => {
    if (answers[i] === null || answers[i] === undefined) return;
    domains[it.d] = domains[it.d] || { n: 0, c: 0 };
    domains[it.d].n += 1;
    if (answers[i] === it.correct) domains[it.d].c += 1;
  });
  return { valid: true, answered, nCorrect, theta, sem, iq, iqLo, iqHi, pct, pctText, domains };
}
