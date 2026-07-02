import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Brain, User as UserIcon, RotateCw, LogIn } from "lucide-react";
import IQTest from "../components/IQTest";

export default function Profile() {
  const { user, loading, login } = useAuth();
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [props, setProps] = useState([]);
  const [testOpen, setTestOpen] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    if (!user) return;
    Promise.all([
      api.get("/iq/me/latest").then(({ data }) => setLatest(data?.iq ? data : null)),
      api.get("/iq/me/history").then(({ data }) => setHistory(data || [])),
      api.get("/me/properties").then(({ data }) => setProps(data || [])),
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

  const bandLabel = (iq) => {
    if (iq >= 130) return "Very superior";
    if (iq >= 120) return "Superior";
    if (iq >= 110) return "High average";
    if (iq >= 90)  return "Average";
    if (iq >= 80)  return "Low average";
    return "Below average";
  };

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
      {/* Identity */}
      <div className="flex items-start gap-6 mb-12 pb-8 border-b border-rule">
        {user.picture ? (
          <img src={user.picture} alt={user.name} className="w-24 h-24 rounded-full object-cover border border-rule" data-testid="profile-avatar" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-stone2 border border-rule flex items-center justify-center">
            <UserIcon size={32} />
          </div>
        )}
        <div className="flex-1">
          <div className="overline text-moss mb-2">Profile</div>
          <h1 className="font-serif text-5xl tracking-tighter" data-testid="profile-name">{user.name}</h1>
          <div className="text-graphite mt-2" data-testid="profile-email">{user.email}</div>
          {user.role === "admin" && (
            <span className="inline-block mt-3 bg-moss text-paper px-3 py-1 uppercase tracking-widest text-[10px]">Editor</span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* IQ Card */}
        <div className="lg:col-span-2 bg-white border border-ink p-8" data-testid="iq-card">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="overline text-moss mb-2 flex items-center gap-2"><Brain size={12} /> Cognitive Ability</div>
              <h2 className="font-serif text-3xl tracking-tight">Your latest IQ score.</h2>
            </div>
            <button
              onClick={() => setTestOpen(true)}
              className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-5 py-2.5 uppercase tracking-widest text-xs flex items-center gap-2 shrink-0"
              data-testid="btn-take-iq"
            >
              {latest ? <><RotateCw size={12} /> Retake</> : "Take the test"}
            </button>
          </div>

          {latest ? (
            <>
              <div className="border-l-4 border-moss pl-6 mb-8">
                <div className="font-serif text-7xl md:text-8xl leading-none tracking-tighter text-ink" data-testid="latest-iq">{latest.iq}</div>
                <div className="text-graphite mt-3">
                  95% CI: {latest.iq_lo}–{latest.iq_hi} · {bandLabel(latest.iq)} · Answered {latest.correct}/{latest.answered}
                </div>
                <div className="overline text-graphite mt-2">Tested {new Date(latest.created_at).toLocaleDateString()}</div>
              </div>

              {history.length > 1 && (
                <div>
                  <div className="overline mb-3">History</div>
                  <div className="space-y-2">
                    {history.slice(0, 8).map((h) => (
                      <div key={h.id} className="flex items-center gap-4 border-b border-rule pb-2 last:border-b-0" data-testid={`iq-hist-${h.id}`}>
                        <div className="font-serif text-xl tabular-nums w-16">{h.iq}</div>
                        <div className="flex-1 text-sm text-graphite">{new Date(h.created_at).toLocaleString()}</div>
                        <div className="text-xs text-graphite">{h.correct}/{h.answered}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="font-serif text-2xl mb-2">You haven't taken the test yet.</p>
              <p className="text-graphite mb-6">A 17-item, 20-minute cognitive assessment — Rasch-scored to the IQ metric.</p>
              <button onClick={() => setTestOpen(true)} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-3 uppercase tracking-widest text-xs" data-testid="btn-start-iq">
                Start the assessment
              </button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-stone2 border border-rule p-6">
            <div className="overline text-moss mb-2">Fun fact</div>
            <p className="font-serif text-lg leading-snug text-ink">Cognitive testing sessions of 15–25 minutes yield the most reliable estimates.</p>
          </div>
          <div className="bg-white border border-rule p-6">
            <div className="overline mb-3">Account</div>
            <div className="text-sm text-graphite space-y-2">
              <div><b className="text-ink">Name:</b> {user.name}</div>
              <div><b className="text-ink">Email:</b> {user.email}</div>
              <div><b className="text-ink">Role:</b> {user.role}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Submitted properties */}
      <div className="mt-16">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="overline text-moss mb-2">Your submissions</div>
            <h2 className="font-serif text-4xl tracking-tight">Properties you've listed.</h2>
          </div>
          <Link to="/submit" className="border border-ink px-5 py-2.5 uppercase tracking-widest text-xs hover:bg-ink hover:text-paper transition-colors" data-testid="btn-submit-new">
            + Submit new
          </Link>
        </div>

        {props.length === 0 ? (
          <div className="border border-dashed border-rule p-12 text-center">
            <p className="font-serif text-2xl mb-2">Nothing yet.</p>
            <p className="text-graphite">Submit a property and Ari will review it before publishing.</p>
          </div>
        ) : (
          <div className="border border-rule bg-white">
            {props.map((p) => (
              <div key={p.id} className="flex items-center gap-4 border-b border-rule last:border-b-0 p-4" data-testid={`my-prop-${p.id}`}>
                <div className="w-20 h-16 bg-stone2 border border-rule shrink-0 overflow-hidden">
                  {p.images?.[0] && <img src={fileUrl(p.images[0])} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-xl truncate">{p.title}</div>
                  <div className="text-xs text-graphite uppercase tracking-widest">{p.location} · {p.rental_type}</div>
                </div>
                <span className={`text-[10px] uppercase tracking-widest px-3 py-1 border ${
                  p.status === "published" ? "border-moss text-moss" :
                  p.status === "pending" ? "border-rule text-graphite" :
                  "border-[#9B2C2C] text-[#9B2C2C]"
                }`}>
                  {p.status}
                </span>
                {p.status === "published" && (
                  <button onClick={() => navigate(`/properties/${p.id}`)} className="text-xs uppercase tracking-widest text-ink hover:text-moss">View →</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <IQTest open={testOpen} onOpenChange={setTestOpen} onCompleted={() => load()} />
    </div>
  );
}
