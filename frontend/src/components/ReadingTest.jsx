import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { PASSAGES, shuffleQuestions, wordCount, chunkWords, calcWPM, scoreQuiz, cawpm, recommend } from "../lib/readingTest";
import { BookOpen, ArrowRight, RotateCw, Timer, X } from "lucide-react";

// phases: intro
//   free_read → free_quiz
//   chunked_read → chunked_quiz
//   pacer_read → pacer_quiz
// results

export default function ReadingTest({ open, onOpenChange, onCompleted }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState("intro");
  const [round, setRound] = useState(0); // 0 free, 1 chunked, 2 pacer
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState([0, 0, 0]); // ms per round
  const [quizzes, setQuizzes] = useState([[], [], []]); // shuffled per round
  const [answers, setAnswers] = useState([[], [], []]);
  const [answerIdx, setAnswerIdx] = useState(0);
  const [scores, setScores] = useState([]); // per-round { wpm, comp, cawpm }
  const [recommendation, setRecommendation] = useState(null);
  const [pacerIdx, setPacerIdx] = useState(0);
  const [freeWpm, setFreeWpm] = useState(0);
  const pacerTimer = useRef(null);
  const savedRef = useRef(false);

  const reset = () => {
    setPhase("intro");
    setRound(0);
    setStartedAt(null);
    setElapsed([0, 0, 0]);
    setQuizzes([shuffleQuestions(PASSAGES[0]), shuffleQuestions(PASSAGES[1]), shuffleQuestions(PASSAGES[2])]);
    setAnswers([Array(5).fill(null), Array(5).fill(null), Array(5).fill(null)]);
    setAnswerIdx(0);
    setScores([]);
    setRecommendation(null);
    setPacerIdx(0);
    setFreeWpm(0);
    savedRef.current = false;
  };

  useEffect(() => { if (open) reset(); /* eslint-disable-next-line */ }, [open]);

  useEffect(() => () => { if (pacerTimer.current) clearInterval(pacerTimer.current); }, []);

  const currentPassage = PASSAGES[round];
  const words = useMemo(() => wordCount(currentPassage?.text || ""), [currentPassage]);
  const chunks = useMemo(() => chunkWords(currentPassage?.text || "", 3), [currentPassage]);

  const beginRead = () => {
    setStartedAt(Date.now());
    setAnswerIdx(0);
    if (round === 0) setPhase("free_read");
    else if (round === 1) setPhase("chunked_read");
    else setPhase("pacer_read");
  };

  // Start pacer sweep when entering pacer_read
  useEffect(() => {
    if (phase !== "pacer_read") { if (pacerTimer.current) clearInterval(pacerTimer.current); return; }
    setPacerIdx(0);
    const targetWpm = Math.max(120, Math.round(freeWpm * 1.1));
    // ms per word
    const msPerWord = 60000 / targetWpm;
    const chunkMs = msPerWord * 3;
    let i = 0;
    pacerTimer.current = setInterval(() => {
      i += 1;
      setPacerIdx(i);
      if (i >= chunks.length) {
        clearInterval(pacerTimer.current);
        // Auto-finish read
        finishRead();
      }
    }, chunkMs);
    return () => { if (pacerTimer.current) clearInterval(pacerTimer.current); };
    // eslint-disable-next-line
  }, [phase]);

  const finishRead = () => {
    if (pacerTimer.current) clearInterval(pacerTimer.current);
    const ms = Date.now() - (startedAt || Date.now());
    setElapsed((prev) => { const n = [...prev]; n[round] = ms; return n; });
    setPhase(round === 0 ? "free_quiz" : round === 1 ? "chunked_quiz" : "pacer_quiz");
    setAnswerIdx(0);
  };

  const pickAnswer = (val) => {
    setAnswers((prev) => {
      const n = prev.map((row) => [...row]);
      n[round][answerIdx] = val;
      return n;
    });
  };

  const nextQuestion = () => {
    if (answerIdx < 4) { setAnswerIdx((i) => i + 1); return; }
    // score this round
    const shuffled = quizzes[round];
    const ans = answers[round];
    const s = scoreQuiz(shuffled, ans);
    const ms = elapsed[round] || 1;
    const wpm = calcWPM(words, ms);
    const cw = cawpm(wpm, s.comp);
    const roundResult = { wpm, comp: s.comp, correct: s.correct, cawpm: cw };
    if (round === 0) setFreeWpm(wpm);
    const nextScores = [...scores, roundResult];
    setScores(nextScores);
    if (round < 2) {
      setRound(round + 1);
      setPhase("intermission");
    } else {
      const rec = recommend({ free: nextScores[0], chunked: nextScores[1], pacer: nextScores[2] });
      setRecommendation(rec);
      setPhase("results");
    }
  };

  // Persist result once we hit results
  useEffect(() => {
    if (phase !== "results" || !recommendation || savedRef.current) return;
    savedRef.current = true;
    const payload = {
      best_fit: recommendation.best_fit,
      label: recommendation.label,
      free_wpm: scores[0].wpm, free_comp: scores[0].comp, free_cawpm: scores[0].cawpm,
      chunked_wpm: scores[1].wpm, chunked_comp: scores[1].comp, chunked_cawpm: scores[1].cawpm,
      pacer_wpm: scores[2].wpm, pacer_comp: scores[2].comp, pacer_cawpm: scores[2].cawpm,
    };
    try {
      const hist = JSON.parse(localStorage.getItem("rr_reading_attempts") || "[]");
      hist.push({ ts: new Date().toISOString(), ...payload });
      localStorage.setItem("rr_reading_attempts", JSON.stringify(hist));
      localStorage.setItem("rr_reading_best", JSON.stringify({ ts: new Date().toISOString(), ...payload }));
    } catch {}
    if (user) {
      api.post("/reading/attempts", payload).catch(() => {});
    }
    onCompleted?.(payload);
  }, [phase, recommendation, scores, user, onCompleted]);

  const pct = (x) => (x * 100).toFixed(0);
  const currentQ = quizzes[round]?.[answerIdx];

  const RoundHeader = ({ title, sub }) => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="overline text-moss mb-1">Round {round + 1} of 3 · {title}</div>
        <div className="text-graphite text-sm">{sub}</div>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1 w-8 ${i <= round ? "bg-moss" : "bg-stone2"}`} />
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-paper border-ink rounded-sm p-0 max-h-[92vh] overflow-y-auto" data-testid="reading-dialog">
        <DialogHeader className="px-8 pt-8 pb-4 border-b border-rule">
          <div className="overline text-moss mb-2 flex items-center gap-2"><BookOpen size={12} /> Find your reading style</div>
          <DialogTitle className="font-serif text-3xl md:text-4xl tracking-tighter text-ink text-left">
            {phase === "intro" && "3 paces · 6 minutes."}
            {phase.endsWith("_read") && "Read at your pace."}
            {phase.endsWith("_quiz") && "Quick comprehension check."}
            {phase === "intermission" && "Nice. On to the next pace."}
            {phase === "results" && "Your reading fingerprint."}
          </DialogTitle>
        </DialogHeader>

        {phase === "intro" && (
          <div className="px-8 py-8" data-testid="reading-intro">
            <p className="text-graphite text-lg leading-relaxed mb-6">
              We'll run you through three short passages, each read a different way. After each, five quick questions check comprehension.
              Then we recommend the technique that actually raised your comprehension-adjusted WPM — or tell you your natural reading is already solid.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mb-8 text-sm">
              <div className="border border-rule p-4">
                <div className="overline mb-1">1. Free read</div>
                <div className="font-serif text-lg leading-tight">Your natural pace.</div>
              </div>
              <div className="border border-rule p-4">
                <div className="overline mb-1">2. 3-word chunks</div>
                <div className="font-serif text-lg leading-tight">Group words visually.</div>
              </div>
              <div className="border border-rule p-4">
                <div className="overline mb-1">3. Pacer</div>
                <div className="font-serif text-lg leading-tight">110% of your baseline.</div>
              </div>
            </div>
            <div className="border-l-4 border-moss bg-stone2 p-4 text-sm text-graphite mb-8">
              Comprehension floor is <b className="text-ink">65%</b>. A technique is only recommended if it beats your natural reading on
              comprehension-adjusted WPM (raw WPM × correct/5).
            </div>
            <div className="flex gap-3">
              <button onClick={() => onOpenChange(false)} className="border border-ink px-6 py-3 uppercase tracking-widest text-xs" data-testid="reading-later">Maybe later</button>
              <button onClick={beginRead} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-3 uppercase tracking-widest text-xs" data-testid="reading-start">Begin</button>
            </div>
          </div>
        )}

        {phase === "free_read" && (
          <div className="px-8 py-8" data-testid="reading-free-read">
            <RoundHeader title="Free read" sub="Read naturally. Click Done when finished." />
            <h3 className="font-serif italic text-xl text-graphite mb-4">"{currentPassage.title}"</h3>
            <div className="font-serif text-lg leading-relaxed text-ink mb-8 whitespace-pre-line">{currentPassage.text}</div>
            <button onClick={finishRead} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-3 uppercase tracking-widest text-xs" data-testid="reading-done-free">
              Done reading
            </button>
          </div>
        )}

        {phase === "chunked_read" && (
          <div className="px-8 py-8" data-testid="reading-chunked-read">
            <RoundHeader title="3-word chunks" sub="Take each group as a single beat. Click Done when finished." />
            <h3 className="font-serif italic text-xl text-graphite mb-4">"{currentPassage.title}"</h3>
            <div className="font-serif text-lg leading-loose text-ink mb-8 flex flex-wrap gap-x-4 gap-y-2">
              {chunks.map((c, i) => (
                <span key={i} className="border-b border-rule pb-0.5">{c.trim()}</span>
              ))}
            </div>
            <button onClick={finishRead} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-3 uppercase tracking-widest text-xs" data-testid="reading-done-chunked">
              Done reading
            </button>
          </div>
        )}

        {phase === "pacer_read" && (
          <div className="px-8 py-8" data-testid="reading-pacer-read">
            <RoundHeader title="Pacer" sub={`Highlight sweeps at ${Math.max(120, Math.round(freeWpm * 1.1))} WPM. Read the highlighted chunk.`} />
            <h3 className="font-serif italic text-xl text-graphite mb-4">"{currentPassage.title}"</h3>
            <div className="font-serif text-lg leading-relaxed text-ink mb-8 flex flex-wrap gap-x-1">
              {chunks.map((c, i) => (
                <span
                  key={i}
                  className={`px-1 transition-colors duration-150 ${
                    i === pacerIdx ? "bg-moss text-paper" :
                    i < pacerIdx ? "text-graphite/50" : "text-ink"
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-graphite">
              <Timer size={14} /> <span className="overline">{pacerIdx}/{chunks.length}</span>
            </div>
          </div>
        )}

        {phase.endsWith("_quiz") && currentQ && (
          <div className="px-8 py-8" data-testid="reading-quiz">
            <RoundHeader
              title={round === 0 ? "Free read · Q" : round === 1 ? "Chunks · Q" : "Pacer · Q"}
              sub={`Question ${answerIdx + 1} of 5`}
            />
            <h3 className="font-serif text-2xl md:text-3xl leading-snug mb-6">{currentQ.q}</h3>
            <div className="space-y-3 mb-8">
              {currentQ.opts.map((opt, i) => {
                const selected = answers[round][answerIdx] === i;
                return (
                  <button
                    key={i}
                    onClick={() => pickAnswer(i)}
                    className={`w-full text-left border rounded-sm px-5 py-4 transition-colors ${selected ? "border-ink bg-ink text-paper" : "border-rule bg-white hover:border-ink"}`}
                    data-testid={`reading-opt-${i}`}
                  >
                    <span className={`inline-block w-6 mr-3 overline ${selected ? "text-paper" : "text-graphite"}`}>{String.fromCharCode(65 + i)}.</span>
                    <span className="font-sans">{opt}</span>
                  </button>
                );
              })}
              <button onClick={() => pickAnswer(null)} className="text-xs uppercase tracking-widest text-graphite hover:text-ink" data-testid="reading-skip">Skip →</button>
            </div>
            <div className="flex justify-end border-t border-rule pt-5">
              <button onClick={nextQuestion} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs flex items-center gap-2" data-testid="reading-next">
                {answerIdx === 4 ? (round === 2 ? "Finish" : "Next round") : "Next question"} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {phase === "intermission" && (
          <div className="px-8 py-8 text-center" data-testid="reading-intermission">
            <p className="text-graphite text-lg mb-6">
              Round {round + 1} coming up:{" "}
              <b className="text-ink">{round === 1 ? "3-word chunks" : "Pacer @ " + Math.max(120, Math.round(freeWpm * 1.1)) + " WPM"}</b>
            </p>
            <button onClick={beginRead} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-3 uppercase tracking-widest text-xs" data-testid="reading-continue">
              Continue
            </button>
          </div>
        )}

        {phase === "results" && recommendation && (
          <div className="px-8 py-8 space-y-8" data-testid="reading-results">
            <div className="border-l-4 border-moss pl-6">
              <div className="overline text-moss mb-2">Your best fit</div>
              <div className="font-serif text-5xl md:text-6xl leading-none tracking-tighter text-ink" data-testid="reading-bestfit">{recommendation.label}</div>
              <div className="text-graphite mt-3">
                {recommendation.best_fit === "natural"
                  ? `${recommendation.wpm} WPM · ${pct(recommendation.comp)}% comprehension`
                  : `${recommendation.wpm} WPM · ${pct(recommendation.comp)}% comprehension · CAWPM ${recommendation.cawpm}`}
              </div>
              <p className="text-ink mt-4 leading-relaxed">{recommendation.message}</p>
            </div>

            <div>
              <div className="overline text-moss mb-3">Round-by-round</div>
              <div className="space-y-3 text-sm">
                {[
                  { key: 0, label: "Free read" },
                  { key: 1, label: "3-word chunks" },
                  { key: 2, label: "Pacer" },
                ].map(({ key, label }) => {
                  const s = scores[key];
                  const compOK = s.comp >= 0.65;
                  const beat = key === 0 ? false : s.cawpm > scores[0].cawpm;
                  return (
                    <div key={key} className="border border-rule p-4 flex flex-wrap items-center gap-4" data-testid={`reading-round-${key}`}>
                      <div className="w-36 font-serif text-lg">{label}</div>
                      <div className="text-graphite">WPM <b className="text-ink font-serif text-lg">{s.wpm}</b></div>
                      <div className={compOK ? "text-graphite" : "text-[#9B2C2C]"}>Comp <b className="text-ink font-serif text-lg">{pct(s.comp)}%</b></div>
                      <div className="text-graphite">CAWPM <b className="text-ink font-serif text-lg">{s.cawpm}</b></div>
                      {key === 0 && <span className="ml-auto overline text-graphite">baseline</span>}
                      {key !== 0 && beat && compOK && <span className="ml-auto text-[10px] uppercase tracking-widest bg-moss text-paper px-2 py-1">beats baseline</span>}
                      {key !== 0 && !compOK && <span className="ml-auto text-[10px] uppercase tracking-widest border border-[#9B2C2C] text-[#9B2C2C] px-2 py-1">below 65%</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {recommendation.drills.length > 0 && (
              <div>
                <div className="overline text-moss mb-3">Recommended drills</div>
                <ul className="space-y-2 text-graphite">
                  {recommendation.drills.map((d, i) => <li key={i} className="pl-4 border-l border-rule">{d}</li>)}
                </ul>
              </div>
            )}

            <div className="border-l-4 border-rule pl-4 text-sm text-graphite italic">
              Placement estimate only. WPM varies with topic, mood and text difficulty. Retake weekly to see if a technique becomes your new default.
            </div>

            <div className="flex flex-wrap gap-3 border-t border-rule pt-6">
              <button onClick={reset} className="border border-ink px-6 py-3 uppercase tracking-widest text-xs flex items-center gap-2" data-testid="reading-retake">
                <RotateCw size={14} /> Take again
              </button>
              <button onClick={() => onOpenChange(false)} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs" data-testid="reading-close">
                Done
              </button>
              <a
                href="https://smarteryou.live"
                target="_blank"
                rel="noreferrer"
                className="ml-auto bg-moss text-paper hover:bg-mossdark transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs flex items-center gap-2"
                data-testid="reading-continue-smarteryou"
              >
                Continue on smarteryou.live →
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
