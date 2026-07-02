// Adaptive Reading Style Placement Test
// 3 passages of matched difficulty (~200 words each), one for each pacing mode.
// Scoring: comprehension-adjusted WPM = raw WPM × (correct/5)
// Recommendation gate: comprehension >= 65% AND CAWPM strictly greater than free-read CAWPM.

export const PASSAGES = [
  {
    id: "free",
    title: "Why home matters",
    text: `In every culture, home is more than shelter. It is the first stage where identity develops, quietly recorded by the corners we retreat to and the thresholds we cross each day. Architects have long understood that a home shapes its occupants as much as they shape it: ceiling height nudges mood, the angle of a window governs how morning unfolds, and even a narrow hallway can compress or elongate the sense of time. Studies of dwellings from many centuries reveal a persistent human preference for prospect and refuge — a place from which to look out safely, and a place to withdraw. Modern apartments often lose one of these dimensions in the pursuit of open plans, and their residents frequently report an unnameable restlessness. Good design is not about square meters; it is about legibility. A room that reads clearly, whose purpose is obvious from a single glance, calms the nervous system. When people describe their favorite home as one where they can think, what they are describing is not silence but this legibility. Home, at its best, is a diagram of a life — spatial handwriting that returns each night to remind us who we are.`,
    questions: [
      { q: "According to the passage, home is more than what?", opts: ["Shelter", "A building", "A possession", "An investment"], correct: 0 },
      { q: "What two dimensions do studies say humans prefer in dwellings?", opts: ["Prospect and refuge", "Light and space", "Height and width", "History and modernity"], correct: 0 },
      { q: "What often causes residents of modern open-plan apartments to feel restless?", opts: ["Losing prospect or refuge", "Too much natural light", "Small square footage", "Noise from neighbours"], correct: 0 },
      { q: "What does the author say good design is about?", opts: ["Legibility", "Square meters", "Minimalism", "Natural light"], correct: 0 },
      { q: "The author describes home as a diagram of…", opts: ["A life", "A family", "A culture", "An era"], correct: 0 },
    ],
  },
  {
    id: "chunked",
    title: "The oldest material",
    text: `Light is the oldest material an architect works with, and the hardest to master. Long before stone or timber, a builder chose an orientation for a shelter — where the sun would rise on its walls, where it would set. That first decision cascaded into every other. Windows are the compromise between two ancient impulses: to let the world in, and to keep it out. In the Mediterranean, thick walls and small openings answered the punishing summer sun by trapping cool shadow inside. In Scandinavian winters, walls thinned and windows widened, hungry for whatever grey light the sky offered. The rise of electricity should have made these calculations obsolete, but studies show that people who live in daylit rooms report better mood, sleep, and even memory. Artificial light, however bright, does not carry the passage of hours. The body only knows the shift from cool morning to warm afternoon by the sun itself. This is why the best contemporary architects still design first for the sun and only later for the switch. A room without daylight is technically a room, but experientially it is a corridor: a place to move through, not to live in.`,
    questions: [
      { q: "What is described as the oldest material an architect works with?", opts: ["Light", "Stone", "Timber", "Shadow"], correct: 0 },
      { q: "Windows are described as a compromise between which two impulses?", opts: ["Letting the world in and keeping it out", "Warmth and coolness", "Privacy and view", "Beauty and function"], correct: 0 },
      { q: "How did Mediterranean builders respond to summer sun?", opts: ["Thick walls, small openings", "Thin walls, large openings", "Reflective roofs", "Interior courtyards only"], correct: 0 },
      { q: "What does artificial light fail to carry?", opts: ["The passage of hours", "Heat", "UV rays", "Color balance"], correct: 0 },
      { q: "A room without daylight is described experientially as…", opts: ["A corridor", "A cell", "A warehouse", "A basement"], correct: 0 },
    ],
  },
  {
    id: "pacer",
    title: "A stranger's spare room",
    text: `The idea of paying to sleep in a stranger's spare room is older than any hotel. Medieval pilgrims relied on farmhouses along their routes; nineteenth-century farmers in New England took in summer boarders to survive the off-season. What changed in the last two decades was scale. Once the internet made trust between strangers a matter of profiles and reviews rather than personal introductions, a bedroom in a distant city became bookable in three clicks. The consequences have been mixed. Neighborhoods in Barcelona, Lisbon, and New Orleans saw rents climb as apartments were pulled from long-term markets and turned into rotating short stays. Yet the same tools also let a retired teacher in a small town host guests from four continents each summer, funding a modest garden and, more importantly, connections that would never have existed. Cities have responded unevenly — some capping stays, others taxing platforms, a few doing nothing at all. What is clear is that short-term rentals sit at the intersection of housing policy, tourism, and community identity, and the arguments about them are ultimately arguments about what a neighborhood is for. Is it a place people live in, or a place people pass through?`,
    questions: [
      { q: "What made trust between strangers scalable in short-term rentals?", opts: ["Profiles and reviews", "Legal contracts", "Personal introductions", "Government verification"], correct: 0 },
      { q: "According to the passage, what changed in the last two decades?", opts: ["Scale", "Prices", "Demographics", "Hospitality laws"], correct: 0 },
      { q: "Which cities are named as having seen rents climb?", opts: ["Barcelona, Lisbon, New Orleans", "Paris, Rome, Berlin", "London, Madrid, Athens", "Sydney, Auckland, Tokyo"], correct: 0 },
      { q: "What benefit is given as an example for a host?", opts: ["A retired teacher funding a garden", "A student paying off loans", "A family avoiding eviction", "A business owner scaling up"], correct: 0 },
      { q: "The final question in the passage is about…", opts: ["What a neighborhood is for", "How much to tax platforms", "Whether tourism benefits locals", "Which platform is best"], correct: 0 },
    ],
  },
];

export function shuffleQuestions(passage) {
  return passage.questions.map((qq) => {
    const idx = qq.opts.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return {
      q: qq.q,
      opts: idx.map((i) => qq.opts[i]),
      correct: idx.indexOf(qq.correct),
    };
  });
}

export function wordCount(text) {
  return text.trim().split(/\s+/).length;
}

export function chunkWords(text, size = 3) {
  const words = text.split(/(\s+)/); // preserve spaces
  const chunks = [];
  let buf = [];
  let count = 0;
  for (const t of words) {
    buf.push(t);
    if (/\S/.test(t)) {
      count += 1;
      if (count === size) {
        chunks.push(buf.join(""));
        buf = [];
        count = 0;
      }
    }
  }
  if (buf.length) chunks.push(buf.join(""));
  return chunks;
}

export function calcWPM(words, elapsedMs) {
  if (elapsedMs <= 0) return 0;
  return Math.round((words / elapsedMs) * 60000);
}

export function scoreQuiz(shuffled, answers) {
  let correct = 0;
  shuffled.forEach((q, i) => {
    if (answers[i] === q.correct) correct += 1;
  });
  return { correct, total: shuffled.length, comp: correct / shuffled.length };
}

export function cawpm(wpm, comp) {
  return Math.round(wpm * comp);
}

// Recommend a technique.
// baseline = free-read CAWPM
// candidates: chunked, pacer
// Rule: must have comprehension >= 65% AND CAWPM strictly > baseline CAWPM.
// If multiple pass, pick highest CAWPM.
export function recommend({ free, chunked, pacer }) {
  const COMP_FLOOR = 0.65;
  const baseline = free.cawpm;
  const cands = [];
  if (chunked.comp >= COMP_FLOOR && chunked.cawpm > baseline) {
    cands.push({ key: "chunked", label: "3-word chunks", ...chunked });
  }
  if (pacer.comp >= COMP_FLOOR && pacer.cawpm > baseline) {
    cands.push({ key: "pacer", label: "Pacer-guided", ...pacer });
  }
  if (cands.length === 0) {
    return {
      best_fit: "natural",
      label: "Free read (natural)",
      wpm: free.wpm,
      comp: free.comp,
      cawpm: free.cawpm,
      message: "Your natural reading is already solid — no technique cleared the comprehension floor while beating your baseline. Focus on preview-then-read and targeted vocab drills instead of pushing raw speed.",
      drills: [
        "Preview-then-read: skim headings and first sentences for 20 seconds before reading in full.",
        "Vocab drills: 10 domain-specific words a day, spaced repetition.",
        "Re-read for structure: mark topic sentence and 2 supporting details per paragraph.",
      ],
    };
  }
  cands.sort((a, b) => b.cawpm - a.cawpm);
  const w = cands[0];
  return {
    best_fit: w.key,
    label: w.label,
    wpm: w.wpm,
    comp: w.comp,
    cawpm: w.cawpm,
    message: `${w.label} beat your natural pace on comprehension-adjusted WPM. Use it when you're reading longer material where speed matters.`,
    drills: [],
  };
}
