import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { prepareItems, scoreAttempt } from "../lib/iqTest";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Brain, ArrowLeft, ArrowRight, RotateCw, X } from "lucide-react";

const TOTAL_SECONDS = 20 * 60;

export default function IQTest({ open, onOpenChange, onCompleted }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState("intro"); // intro | test | gate | results
  const [gateEmail, setGateEmail] = useState("");
  const [gateName, setGateName] = useState("");
  const [gateSubmitting, setGateSubmitting] = useState(false);
  const [items, setItems] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);
  const savedRef = useRef(false);

  const reset = () => {
    const prepared = prepareItems();
    setItems(prepared);
    setAnswers(Array(prepared.length).fill(null));
    setIdx(0);
    setRemaining(TOTAL_SECONDS);
    setResult(null);
    setPhase("intro");
    savedRef.current = false;
  };

  useEffect(() => {
    if (open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Timer
  useEffect(() => {
    if (phase !== "test") return;
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(timerRef.current); finish(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const start = () => setPhase("test");

  const finish = () => {
    clearInterval(timerRef.current);
    const r = scoreAttempt(items, answers);
    setResult(r);
    // If signed in, auto-subscribe silently (email already known) and go to results.
    // Otherwise, show the email gate first.
    if (!r.valid || user) {
      if (user && r.valid) {
        api.post("/subscribers", {
          email: user.email, name: user.name || "",
          source: "iq_test", iq_score: r.iq,
        }).catch(() => {});
      }
      setPhase("results");
    } else {
      setPhase("gate");
    }
  };

  const submitGate = async (e) => {
    e?.preventDefault();
    if (!gateEmail || !gateEmail.includes("@")) return;
    setGateSubmitting(true);
    try {
      await api.post("/subscribers", {
        email: gateEmail.trim(),
        name: gateName.trim(),
        source: "iq_test",
        iq_score: result?.iq,
      });
    } catch {}
    setGateSubmitting(false);
    setPhase("results");
  };

  const skipGate = () => setPhase("results");

  // Persist result once
  useEffect(() => {
    if (phase !== "results" || !result?.valid || savedRef.current) return;
    savedRef.current = true;
    // localStorage history (guest + signed-in)
    try {
      const hist = JSON.parse(localStorage.getItem("rr_iq_attempts") || "[]");
      hist.push({
        ts: new Date().toISOString(),
        iq: result.iq, theta: +result.theta.toFixed(3), sem: +result.sem.toFixed(3),
        nCorrect: result.nCorrect, answered: result.answered,
      });
      localStorage.setItem("rr_iq_attempts", JSON.stringify(hist));
    } catch {}
    // Backend save (signed-in only)
    if (user) {
      api.post("/iq/attempts", {
        iq: result.iq, iq_lo: result.iqLo, iq_hi: result.iqHi,
        theta: +result.theta.toFixed(4), sem: +result.sem.toFixed(4),
        answered: result.answered, correct: result.nCorrect,
        domains: result.domains,
      }).catch(() => {});
    }
    onCompleted?.(result);
  }, [phase, result, user, onCompleted]);

  const cur = items[idx];
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const answered = useMemo(() => answers.filter((a) => a !== null).length, [answers]);

  const setAnswer = (v) => setAnswers((prev) => { const n = [...prev]; n[idx] = v; return n; });
  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => {
    if (idx === items.length - 1) return finish();
    setIdx((i) => Math.min(items.length - 1, i + 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-paper border-ink rounded-sm p-0 max-h-[92vh] overflow-y-auto" data-testid="iq-dialog">
        <DialogHeader className="px-8 pt-8 pb-4 border-b border-rule">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="overline text-moss mb-2 flex items-center gap-2"><Brain size={12} /> Cognitive Ability Assessment</div>
              <DialogTitle className="font-serif text-3xl md:text-4xl tracking-tighter text-ink text-left">
                {phase === "intro" && "Test your IQ."}
                {phase === "test"  && "Item " + (idx + 1) + " of " + items.length}
                {phase === "gate"  && "One last step."}
                {phase === "results" && "Your results."}
              </DialogTitle>
            </div>
            {phase === "test" && (
              <div className="text-right shrink-0">
                <div className="overline text-graphite mb-1">Time left</div>
                <div className="font-serif text-3xl tabular-nums" data-testid="iq-timer">{mm}:{ss}</div>
              </div>
            )}
          </div>
        </DialogHeader>

        {phase === "intro" && (
          <div className="px-8 py-8" data-testid="iq-intro">
            <p className="text-graphite text-lg leading-relaxed mb-6">
              A 17-item multi-domain reasoning test with model-based scoring. You have <b className="text-ink">20 minutes</b>. Each question has one correct answer. Skips don't count against you as much as wrong guesses — answer only when you can engage with the item.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mb-8 text-sm">
              <div className="border border-rule p-4">
                <div className="overline mb-1">Number series</div>
                <div className="font-serif text-2xl">6</div>
              </div>
              <div className="border border-rule p-4">
                <div className="overline mb-1">Verbal analogies</div>
                <div className="font-serif text-2xl">6</div>
              </div>
              <div className="border border-rule p-4">
                <div className="overline mb-1">Logical reasoning</div>
                <div className="font-serif text-2xl">5</div>
              </div>
            </div>
            <div className="border-l-4 border-moss bg-stone2 p-4 text-sm text-graphite mb-8">
              <b className="text-ink">Disclaimer:</b> educational/entertainment instrument. Not clinically valid. Scores are provisional estimates only.
            </div>
            <div className="flex gap-3">
              <button onClick={() => onOpenChange(false)} className="border border-ink px-6 py-3 uppercase tracking-widest text-xs" data-testid="iq-later">Maybe later</button>
              <button onClick={start} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-3 uppercase tracking-widest text-xs" data-testid="iq-start">Begin test</button>
            </div>
          </div>
        )}

        {phase === "test" && cur && (
          <div className="px-8 py-8" data-testid="iq-test">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 flex-1 bg-stone2">
                <div className="h-1 bg-moss transition-all" style={{ width: `${((idx + 1) / items.length) * 100}%` }} />
              </div>
              <span className="overline text-graphite tabular-nums">{answered}/{items.length}</span>
            </div>

            <div className="overline text-moss mb-3">{cur.d}</div>
            <h3 className="font-serif text-2xl md:text-3xl leading-snug mb-8">{cur.prompt}</h3>

            <div className="space-y-3 mb-8">
              {cur.opts.map((opt, i) => {
                const selected = answers[idx] === i;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswer(i)}
                    className={`w-full text-left border rounded-sm px-5 py-4 transition-colors ${selected ? "border-ink bg-ink text-paper" : "border-rule bg-white hover:border-ink"}`}
                    data-testid={`iq-opt-${i}`}
                  >
                    <span className={`inline-block w-6 mr-3 overline ${selected ? "text-paper" : "text-graphite"}`}>{String.fromCharCode(65 + i)}.</span>
                    <span className="font-sans">{opt}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setAnswer(null)}
                className="text-xs uppercase tracking-widest text-graphite hover:text-ink"
                data-testid="iq-skip"
              >
                Skip this item →
              </button>
            </div>

            <div className="flex justify-between items-center border-t border-rule pt-5">
              <button onClick={prev} disabled={idx === 0} className="flex items-center gap-2 text-xs uppercase tracking-widest text-graphite hover:text-ink disabled:opacity-40" data-testid="iq-prev">
                <ArrowLeft size={14} /> Back
              </button>
              <div className="flex items-center gap-3">
                <button onClick={finish} className="text-xs uppercase tracking-widest text-graphite hover:text-ink" data-testid="iq-finish-now">Finish now</button>
                <button onClick={next} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs flex items-center gap-2" data-testid="iq-next">
                  {idx === items.length - 1 ? "Finish" : "Next"} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "gate" && result && result.valid && (
          <div className="px-8 py-8" data-testid="iq-gate">
            <div className="mb-6">
              <div className="overline text-moss mb-2">Almost there</div>
              <p className="font-serif text-2xl leading-snug text-ink">
                Drop your email and we'll unlock your score plus a one-page breakdown — and add you to Real Ratings' short, curated newsletter (one email a month, unsubscribe anytime).
              </p>
            </div>
            <form onSubmit={submitGate} className="space-y-5">
              <div>
                <label className="overline block mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={gateEmail}
                  onChange={(e) => setGateEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full bg-transparent border-b border-rule rounded-none px-0 py-2 focus:outline-none focus:border-ink transition-colors"
                  data-testid="iq-gate-email"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="overline block mb-2">First name (optional)</label>
                <input
                  value={gateName}
                  onChange={(e) => setGateName(e.target.value)}
                  className="w-full bg-transparent border-b border-rule rounded-none px-0 py-2 focus:outline-none focus:border-ink transition-colors"
                  data-testid="iq-gate-name"
                  autoComplete="given-name"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                <button type="button" onClick={skipGate} className="overline text-graphite hover:text-ink" data-testid="iq-gate-skip">
                  No thanks, just show my score →
                </button>
                <button
                  type="submit"
                  disabled={gateSubmitting}
                  className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-3 uppercase tracking-widest text-xs disabled:opacity-50"
                  data-testid="iq-gate-submit"
                >
                  {gateSubmitting ? "Unlocking…" : "Reveal my score"}
                </button>
              </div>
              <p className="text-xs text-graphite italic pt-2">We'll never share your email. One-click unsubscribe.</p>
            </form>
          </div>
        )}

        {phase === "results" && result && (
          <div className="px-8 py-8 space-y-8" data-testid="iq-results">
            {!result.valid ? (
              <div>
                <p className="text-graphite mb-4">You answered only {result.answered} item(s). At least 5 answers are needed for a meaningful estimate.</p>
                <button onClick={reset} className="bg-ink text-paper px-6 py-3 uppercase tracking-widest text-xs flex items-center gap-2">
                  <RotateCw size={14} /> Restart
                </button>
              </div>
            ) : (
              <>
                <div className="border-l-4 border-moss pl-6">
                  <div className="overline text-moss mb-2">Estimated IQ</div>
                  <div className="font-serif text-7xl md:text-8xl leading-none tracking-tighter text-ink" data-testid="iq-score">{result.iq}</div>
                  <div className="text-graphite mt-2">95% CI: {result.iqLo}–{result.iqHi} · Percentile: {result.pctText}</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="border border-rule p-4">
                    <div className="overline mb-1">Correct</div>
                    <div className="font-serif text-2xl">{result.nCorrect}/{result.answered}</div>
                  </div>
                  <div className="border border-rule p-4">
                    <div className="overline mb-1">Ability θ</div>
                    <div className="font-serif text-2xl">{result.theta.toFixed(2)}</div>
                  </div>
                  <div className="border border-rule p-4">
                    <div className="overline mb-1">SEM</div>
                    <div className="font-serif text-2xl">±{result.sem === Infinity ? "—" : result.sem.toFixed(2)}</div>
                  </div>
                </div>

                <div>
                  <div className="overline text-moss mb-3">Domain profile</div>
                  <div className="space-y-3">
                    {Object.entries(result.domains).map(([d, v]) => {
                      const p = Math.round((v.c / v.n) * 100);
                      return (
                        <div key={d} className="flex items-center gap-3">
                          <div className="w-40 text-sm">{d}</div>
                          <div className="flex-1 bg-stone2 h-2 rounded-sm overflow-hidden">
                            <div className="h-2 bg-moss" style={{ width: `${p}%` }} />
                          </div>
                          <div className="w-24 text-right text-sm text-graphite tabular-nums">{v.c}/{v.n} ({p}%)</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-l-4 border-rule pl-4 text-sm text-graphite italic">
                  Provisional, un-normed estimate. Rasch (1-PL) scored: harder items count for more. Not a clinical measurement.
                </div>

                <div className="flex flex-wrap gap-3 border-t border-rule pt-6">
                  <button onClick={reset} className="border border-ink px-6 py-3 uppercase tracking-widest text-xs flex items-center gap-2" data-testid="iq-retake">
                    <RotateCw size={14} /> Take again
                  </button>
                  <button onClick={() => onOpenChange(false)} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs" data-testid="iq-close">
                    Done
                  </button>
                  {!user && (
                    <span className="ml-auto self-center overline text-graphite">Sign in to save your score to your profile</span>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
