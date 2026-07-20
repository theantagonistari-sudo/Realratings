import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Brain, BookOpen, User as UserIcon, RotateCw, LogIn, Wallet, ArrowRight, Star, Trophy, Sparkles, Zap, Activity, Briefcase, Heart, Globe, Film, Compass, Home as HomeIcon } from "lucide-react";
import IQTest from "../components/IQTest";
import ReadingTest from "../components/ReadingTest";

const ASSESSMENTS = [
  { id: "personality", title: "Big Five Personality", icon: Brain, time: "10 min", tint: "moss" },
  { id: "psychometric", title: "Cognitive Analysis", icon: Activity, time: "15 min", tint: "graphite" },
  { id: "career-path", title: "Career Alignment", icon: Briefcase, time: "8 min", tint: "moss" },
  { id: "relationship", title: "Relationship Style", icon: Heart, time: "7 min", tint: "graphite" },
  { id: "general-knowledge", title: "General Knowledge", icon: Globe, time: "10 min", tint: "moss" },
  { id: "films", title: "Famous Films", icon: Film, time: "8 min", tint: "graphite" },
  { id: "reading-speed", title: "Reading Speed", icon: Zap, time: "3 min", tint: "moss" },
  { id: "reading-style-2", title: "Reading Style (Passage)", icon: BookOpen, time: "5 min", tint: "graphite" },
];

const bandLabel = (iq) => {
  if (iq >= 130) return "Very superior";
  if (iq >= 120) return "Superior";
  if (iq >= 110) return "High average";
  if (iq >= 90)  return "Average";
  if (iq >= 80)  return "Low average";
  return "Below average";
};

export default function Profile() {
  const { user, loading, login } = useAuth();
  const [latest, setLatest] = useState(null);
  const [reading, setReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [props, setProps] = useState([]);
  const [testOpen, setTestOpen] = useState(false);
  const [readingOpen, setReadingOpen] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    if (!user) return;
    Promise.all([
      api.get("/iq/me/latest").then(({ data }) => setLatest(data?.iq ? data : null)),
      api.get("/iq/me/history").then(({ data }) => setHistory(data || [])),
      api.get("/me/properties").then(({ data }) => setProps(data || [])),
      api.get("/reading/me/latest").then(({ data }) => setReading(data?.best_fit ? data : null)),
    ]).catch(() => {});
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  if (loading) return <div className="p-16 text-center overline text-graphite">Loading…</div>;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="overline text-moss mb-3">Profile</div>
        <h1 className="font-serif text-5xl tracking-tighter mb-6">Sign in to see your profile.</h1>
        <p className="text-graphite text-lg mb-10 max-w-xl mx-auto">Track your IQ score, revisit properties you've submitted, and pick up where you left off.</p>
        <button onClick={login} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-4 uppercase tracking-widest text-xs flex items-center gap-2 mx-auto" data-testid="profile-login">
          <LogIn size={14} /> Sign in with Google
        </button>
      </div>
    );
  }

  const testsCompleted = (latest ? 1 : 0) + (reading ? 1 : 0);
  const propertiesCount = props.length;
  const publishedCount = props.filter(p => p.status === "published").length;
  const greeting = (() => {
    const hr = new Date().getHours();
    if (hr < 5) return "Still up";
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  })();
  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <>
      {/* Hero identity strip */}
      <section className="bg-paper border-b border-rule" data-testid="profile-hero">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
          <div className="flex flex-col md:flex-row md:items-end gap-8 md:gap-12">
            <div className="flex items-center gap-5">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-24 h-24 rounded-full object-cover border-2 border-ink" data-testid="profile-avatar" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-stone2 border-2 border-ink flex items-center justify-center">
                  <UserIcon size={32} />
                </div>
              )}
              <div>
                <div className="overline text-moss mb-2">{greeting},</div>
                <h1 className="font-serif text-4xl md:text-5xl tracking-tighter leading-none" data-testid="profile-name">{firstName}.</h1>
                <div className="text-graphite mt-2 text-sm" data-testid="profile-email">{user.email}</div>
                {user.role === "admin" && (
                  <span className="inline-block mt-3 bg-moss text-paper px-3 py-1 uppercase tracking-widest text-[10px]">Editor</span>
                )}
              </div>
            </div>

            <div className="md:ml-auto grid grid-cols-3 gap-4 md:gap-8" data-testid="profile-stats">
              <StatBlock label="Tests taken" value={testsCompleted} />
              <StatBlock label="Properties" value={propertiesCount} sub={publishedCount ? `${publishedCount} live` : null} />
              <StatBlock label="IQ score" value={latest ? latest.iq : "—"} sub={latest ? bandLabel(latest.iq) : "Not measured"} />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Finance */}
      <section className="bg-ink text-paper" data-testid="profile-finance-strip">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">
          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-1 hidden md:flex justify-center">
              <div className="p-4 border border-paper/30">
                <Wallet size={24} />
              </div>
            </div>
            <div className="md:col-span-8">
              <div className="overline text-paper/70 mb-2">Featured tool</div>
              <h2 className="font-serif text-3xl md:text-4xl tracking-tight leading-tight">Personal Financial Manager.</h2>
              <p className="text-paper/70 text-sm md:text-base mt-2 max-w-2xl">
                Track transactions, set budgets, run loan / savings / debt / goal calculators, and forecast your balance. All data lives in your browser — nothing uploaded.
              </p>
            </div>
            <div className="md:col-span-3 flex md:justify-end">
              <Link to="/finance" className="w-full md:w-auto text-center bg-paper text-ink hover:bg-stone2 transition-colors rounded-sm px-8 py-4 uppercase tracking-widest text-xs" data-testid="btn-open-finance">
                Open manager →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 space-y-16">
        {/* Cognitive fingerprint */}
        <section data-testid="fingerprint-section">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="overline text-moss mb-2">Cognitive Fingerprint</div>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tighter">How you think, read & score.</h2>
            </div>
            {(latest || reading) && (
              <div className="flex items-center gap-2 text-graphite text-sm">
                <Trophy size={16} className="text-moss" /> {testsCompleted} / 2 core assessments complete
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* IQ */}
            <div className="bg-white border border-ink p-8 flex flex-col" data-testid="iq-card">
              <div className="flex items-center justify-between mb-6">
                <div className="overline text-moss flex items-center gap-2"><Brain size={12} /> IQ Assessment</div>
                {latest && (
                  <span className="text-xs text-graphite">Last tested {new Date(latest.created_at).toLocaleDateString()}</span>
                )}
              </div>
              {latest ? (
                <>
                  <div className="border-l-4 border-moss pl-5 mb-6">
                    <div className="font-serif text-7xl leading-none tracking-tighter text-ink" data-testid="latest-iq">{latest.iq}</div>
                    <div className="text-graphite mt-2 text-sm">CI: {latest.iq_lo}–{latest.iq_hi} · {bandLabel(latest.iq)} · {latest.correct}/{latest.answered} correct</div>
                  </div>
                  {history.length > 1 && (
                    <div className="mb-6">
                      <div className="overline text-graphite mb-2">History</div>
                      <div className="flex items-end gap-2 h-16">
                        {history.slice(0, 12).reverse().map((h) => {
                          const pct = Math.max(10, Math.min(100, ((h.iq - 55) / 90) * 100));
                          return (
                            <div key={h.id} className="flex-1 flex flex-col items-center gap-1" title={`${h.iq} · ${new Date(h.created_at).toLocaleDateString()}`}>
                              <div className="w-full bg-moss transition-all" style={{ height: `${pct}%` }} />
                              <span className="text-[9px] text-graphite">{h.iq}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <button onClick={() => setTestOpen(true)} className="mt-auto self-start bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-5 py-2.5 uppercase tracking-widest text-xs flex items-center gap-2" data-testid="btn-take-iq">
                    <RotateCw size={12} /> Retake
                  </button>
                </>
              ) : (
                <div className="flex flex-col justify-center flex-1 text-center py-6">
                  <Brain size={40} className="text-graphite/40 mb-4 mx-auto" />
                  <p className="font-serif text-2xl mb-1">Not measured yet.</p>
                  <p className="text-graphite text-sm mb-6">17 items · 20 minutes · Rasch-scored.</p>
                  <button onClick={() => setTestOpen(true)} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs mx-auto" data-testid="btn-start-iq">
                    Take the test
                  </button>
                </div>
              )}
            </div>

            {/* Reading Style */}
            <div className="bg-white border border-ink p-8 flex flex-col" data-testid="reading-card">
              <div className="flex items-center justify-between mb-6">
                <div className="overline text-moss flex items-center gap-2"><BookOpen size={12} /> Reading Style</div>
                {reading && <span className="text-xs text-graphite">Best fit</span>}
              </div>
              {reading ? (
                <>
                  <div className="border-l-4 border-moss pl-5 mb-6">
                    <div className="font-serif text-4xl leading-tight tracking-tight text-ink" data-testid="reading-best-label">{reading.label}</div>
                    <div className="text-graphite text-sm mt-2">
                      {reading.best_fit === "natural"
                        ? `${reading.free_wpm} WPM · ${(reading.free_comp * 100).toFixed(0)}% comp`
                        : `${reading[`${reading.best_fit}_wpm`]} WPM · ${(reading[`${reading.best_fit}_comp`] * 100).toFixed(0)}% comp · CAWPM ${reading[`${reading.best_fit}_cawpm`]}`}
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="overline text-graphite mb-3">Round-by-round WPM</div>
                    <div className="space-y-2">
                      {[
                        { l: "Free read", v: reading.free_wpm, c: reading.free_comp },
                        { l: "3-word chunks", v: reading.chunked_wpm, c: reading.chunked_comp },
                        { l: "Pacer", v: reading.pacer_wpm, c: reading.pacer_comp },
                      ].map((r) => {
                        const maxV = Math.max(reading.free_wpm, reading.chunked_wpm, reading.pacer_wpm, 100);
                        return (
                          <div key={r.l} className="flex items-center gap-3 text-sm">
                            <div className="w-28 text-graphite">{r.l}</div>
                            <div className="flex-1 bg-stone2 h-2 overflow-hidden">
                              <div className="h-2 bg-moss" style={{ width: `${(r.v / maxV) * 100}%` }} />
                            </div>
                            <div className="w-24 text-right text-ink font-serif text-lg tabular-nums">{r.v}</div>
                            <div className="w-12 text-right text-xs text-graphite">{(r.c * 100).toFixed(0)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button onClick={() => setReadingOpen(true)} className="mt-auto self-start bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-5 py-2.5 uppercase tracking-widest text-xs flex items-center gap-2" data-testid="btn-retake-reading">
                    <RotateCw size={12} /> Retake
                  </button>
                </>
              ) : (
                <div className="flex flex-col justify-center flex-1 text-center py-6">
                  <BookOpen size={40} className="text-graphite/40 mb-4 mx-auto" />
                  <p className="font-serif text-2xl mb-1">Not measured yet.</p>
                  <p className="text-graphite text-sm mb-6">Free read · Chunks · Pacer, 6 minutes.</p>
                  <button onClick={() => setReadingOpen(true)} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs mx-auto" data-testid="btn-take-reading">
                    Take the test
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Discover more assessments */}
        <section data-testid="more-assessments-section">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="overline text-moss mb-2 flex items-center gap-2"><Compass size={12} /> Discover more</div>
              <h2 className="font-serif text-3xl md:text-4xl tracking-tight">Round out your fingerprint.</h2>
            </div>
            <Link to="/tests" className="overline text-ink hover:text-moss transition-colors flex items-center gap-1" data-testid="btn-all-tests">
              All tests <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ASSESSMENTS.slice(0, 8).map((t) => {
              const Icon = t.icon;
              const dark = t.tint === "moss";
              return (
                <Link
                  key={t.id}
                  to={`/tests/${t.id}`}
                  className={`rr-card-hover group block p-5 border rounded-sm transition-colors ${dark ? "bg-moss text-paper border-moss hover:bg-mossdark" : "bg-white text-ink border-rule hover:border-ink"}`}
                  data-testid={`assessment-${t.id}`}
                >
                  <div className={`mb-4 ${dark ? "text-paper" : "text-ink"}`}>
                    <Icon size={22} />
                  </div>
                  <div className={`font-serif text-lg leading-tight tracking-tight ${dark ? "text-paper" : "text-ink group-hover:text-moss"} transition-colors`}>{t.title}</div>
                  <div className={`overline mt-3 flex items-center justify-between ${dark ? "text-paper/70" : "text-graphite"}`}>
                    <span>{t.time}</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Properties */}
        <section data-testid="my-props-section">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="overline text-moss mb-2 flex items-center gap-2"><HomeIcon size={12} /> Your submissions</div>
              <h2 className="font-serif text-3xl md:text-4xl tracking-tight">Properties you've listed.</h2>
            </div>
            <Link to="/submit" className="border border-ink px-5 py-2.5 uppercase tracking-widest text-xs hover:bg-ink hover:text-paper transition-colors" data-testid="btn-submit-new">
              + Submit new
            </Link>
          </div>

          {props.length === 0 ? (
            <div className="border border-dashed border-rule p-16 text-center bg-stone2/40">
              <HomeIcon size={40} className="text-graphite/40 mb-4 mx-auto" />
              <p className="font-serif text-3xl mb-2">Nothing yet.</p>
              <p className="text-graphite mb-6">Submit a property and Ari will review it before publishing.</p>
              <Link to="/submit" className="inline-block bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs">
                Submit your first property
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {props.map((p) => (
                <div key={p.id} className="bg-white border border-rule rounded-sm overflow-hidden group hover:border-ink transition-colors" data-testid={`my-prop-${p.id}`}>
                  <div className="aspect-[4/3] bg-stone2 border-b border-rule relative overflow-hidden">
                    {p.images?.[0]
                      ? <img src={fileUrl(p.images[0])} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center text-graphite/50"><HomeIcon size={40} /></div>
                    }
                    <span className={`absolute top-3 right-3 text-[10px] uppercase tracking-widest px-2.5 py-1 font-semibold ${
                      p.status === "published" ? "bg-moss text-paper" :
                      p.status === "pending" ? "bg-paper border border-rule text-graphite" :
                      "bg-[#9B2C2C] text-paper"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="font-serif text-xl leading-tight tracking-tight text-ink truncate">{p.title}</div>
                    <div className="text-xs text-graphite uppercase tracking-widest mt-2">{p.location} · {p.rental_type === "short_stay" ? "Short Stay" : "Rent"}</div>
                    {p.status === "published" && (
                      <button onClick={() => navigate(`/properties/${p.id}`)} className="mt-4 text-xs uppercase tracking-widest text-ink hover:text-moss flex items-center gap-1">
                        View listing <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Account */}
        <section className="bg-stone2 p-8 rounded-sm border border-rule" data-testid="account-section">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="overline text-moss mb-3">Account</div>
              <div className="font-serif text-2xl leading-tight">{user.name}</div>
              <div className="text-graphite text-sm mt-1">{user.email}</div>
              <div className="text-graphite text-xs uppercase tracking-widest mt-2">{user.role}</div>
            </div>
            <div>
              <div className="overline text-moss mb-3">Data & privacy</div>
              <p className="text-sm text-graphite leading-relaxed">
                Your finance data stays in your browser. Your IQ + Reading scores are stored in Real Ratings' database, tied to your Google account, and never shared.
              </p>
            </div>
            <div>
              <div className="overline text-moss mb-3">Fun fact</div>
              <p className="text-sm text-graphite leading-relaxed">
                Cognitive testing sessions of 15–25 minutes yield the most reliable estimates. Re-taking weekly reduces measurement noise.
              </p>
            </div>
          </div>
        </section>
      </div>

      <IQTest open={testOpen} onOpenChange={setTestOpen} onCompleted={() => load()} />
      <ReadingTest open={readingOpen} onOpenChange={setReadingOpen} onCompleted={() => load()} />
    </>
  );
}

function StatBlock({ label, value, sub }) {
  return (
    <div>
      <div className="overline text-graphite mb-1">{label}</div>
      <div className="font-serif text-4xl md:text-5xl leading-none tracking-tighter text-ink tabular-nums">{value}</div>
      {sub && <div className="text-xs text-graphite mt-1">{sub}</div>}
    </div>
  );
}
