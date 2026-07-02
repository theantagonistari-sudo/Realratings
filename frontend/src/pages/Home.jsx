import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PropertyCard from "../components/PropertyCard";
import ReadingTest from "../components/ReadingTest";
import { Search, ArrowRight, BookOpen, Sparkles } from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80";

const LOCATION_IMG = [
  "https://images.unsplash.com/photo-1706808849780-7a04fbac83ef?crop=entropy&cs=srgb&fm=jpg&w=900&q=70",
  "https://images.unsplash.com/photo-1724582586458-a51791349977?crop=entropy&cs=srgb&fm=jpg&w=900&q=70",
  "https://images.unsplash.com/photo-1646987916641-1f3c8992daa2?crop=entropy&cs=srgb&fm=jpg&w=900&q=70",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=srgb&fm=jpg&w=900&q=70",
];

export default function Home() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [stays, setStays] = useState([]);
  const [locations, setLocations] = useState([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [readingOpen, setReadingOpen] = useState(false);
  const [bestFit, setBestFit] = useState(null);
  const navigate = useNavigate();

  const loadBestFit = () => {
    // Prefer backend (signed-in), fall back to localStorage
    if (user) {
      api.get("/reading/me/latest").then(({ data }) => {
        if (data && data.best_fit) setBestFit(data);
        else {
          try {
            const local = JSON.parse(localStorage.getItem("rr_reading_best") || "null");
            if (local) setBestFit(local);
          } catch {}
        }
      }).catch(() => {});
    } else {
      try {
        const local = JSON.parse(localStorage.getItem("rr_reading_best") || "null");
        if (local) setBestFit(local);
      } catch {}
    }
  };

  useEffect(() => {
    api.get("/properties", { params: { limit: 6, rental_type: "rent" } }).then(({ data }) => setRentals(data));
    api.get("/properties", { params: { limit: 6, rental_type: "short_stay" } }).then(({ data }) => setStays(data));
    api.get("/properties/locations").then(({ data }) => setLocations(data));
    loadBestFit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const search = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("location", q);
    if (type) params.set("rental_type", type);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <>
      {/* Featured — Reading Style Placement */}
      <section className="bg-ink text-paper" data-testid="reading-featured">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 flex items-start gap-5">
              <div className="hidden sm:flex shrink-0 w-14 h-14 border border-paper/30 items-center justify-center">
                <BookOpen size={22} className="text-paper" />
              </div>
              <div>
                <div className="overline text-paper/70 mb-2 flex items-center gap-2">
                  <Sparkles size={12} /> Featured · 6 minutes
                </div>
                <div className="font-serif text-3xl md:text-4xl leading-tight tracking-tight">Find your reading style.</div>
                <p className="text-paper/70 mt-2 text-sm md:text-base max-w-xl">
                  Same passage at three paces — free read, 3-word chunks, and a pacer at 110% of your baseline. We only recommend a technique if it actually raised your comprehension-adjusted WPM.
                </p>
                {bestFit && (
                  <div className="mt-4 inline-flex items-center gap-3 border border-paper/30 px-4 py-2" data-testid="reading-best-badge">
                    <span className="overline text-paper/70">Your best fit</span>
                    <span className="font-serif text-lg">{bestFit.label}</span>
                    {bestFit.best_fit !== "natural" && (
                      <span className="text-paper/70 text-xs">· {bestFit[`${bestFit.best_fit}_wpm`] || bestFit.free_wpm} WPM</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <button
                onClick={() => setReadingOpen(true)}
                className="bg-paper text-ink hover:bg-stone2 transition-colors rounded-sm px-8 py-4 uppercase tracking-widest text-xs w-full md:w-auto"
                data-testid="btn-reading-start"
              >
                {bestFit ? "Retake test" : "Take the test"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="relative bg-paper overflow-hidden" data-testid="home-hero">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-12">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-6 animate-fade-up">
              <div className="overline text-moss mb-6">A Curated Editorial · Est. 2026</div>
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tighter text-ink">
                Curated Spaces.<br />
                <span className="italic text-moss">Honest</span> Reviews.
              </h1>
              <p className="mt-8 text-lg md:text-xl text-graphite leading-relaxed max-w-xl">
                Every property here has been visited, photographed and reviewed by Ari. No sponsored placements. No filler listings — only spaces worth staying in.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/properties" className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-4 font-sans uppercase tracking-widest text-xs" data-testid="hero-cta-browse">
                  Browse Properties
                </Link>
                <Link to="/submit" className="border border-ink text-ink hover:bg-ink hover:text-paper transition-colors rounded-sm px-8 py-4 font-sans uppercase tracking-widest text-xs" data-testid="hero-cta-submit">
                  Submit yours →
                </Link>
              </div>
            </div>
            <div className="md:col-span-6 relative">
              <div className="aspect-[4/5] overflow-hidden bg-stone2 border border-rule">
                <img src={HERO_IMG} alt="Curated property" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-paper border border-rule p-6 hidden md:block max-w-[240px]">
                <div className="overline mb-2">This Week's Pick</div>
                <p className="font-serif text-lg leading-tight text-ink">"An honest 4.6/5. Light-flooded, well-kept, and worth every dime."</p>
                <div className="overline mt-3 text-moss">— Ari</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 pb-16">
          <form onSubmit={search} className="bg-white border border-ink p-4 md:p-6 flex flex-col md:flex-row gap-4 items-stretch" data-testid="hero-search">
            <div className="flex-1 flex items-center gap-3 px-2">
              <Search size={18} className="text-graphite" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Location — city, neighborhood…"
                className="w-full bg-transparent focus:outline-none py-2 placeholder:text-graphite/60"
                data-testid="hero-search-input"
              />
            </div>
            <div className="w-full md:w-56 border-t md:border-t-0 md:border-l border-rule">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-transparent focus:outline-none px-4 py-3 uppercase text-xs tracking-widest text-graphite"
                data-testid="hero-search-type"
              >
                <option value="">Any type</option>
                <option value="rent">For Rent</option>
                <option value="short_stay">Short Stay</option>
              </select>
            </div>
            <button type="submit" className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-3 font-sans uppercase tracking-widest text-xs" data-testid="hero-search-submit">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Locations */}
      {locations.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="overline text-moss mb-3">By Location</div>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight">Where we're looking.</h2>
            </div>
            <Link to="/properties" className="overline text-ink hover:text-moss transition-colors">All properties →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {locations.slice(0, 4).map((loc, i) => (
              <Link
                key={loc.location}
                to={`/properties?location=${encodeURIComponent(loc.location)}`}
                className={`rr-card-hover relative overflow-hidden border border-rule ${i === 0 ? "md:col-span-2 md:row-span-2 aspect-square" : "aspect-square"}`}
                data-testid={`location-card-${loc.location}`}
              >
                <img src={LOCATION_IMG[i % LOCATION_IMG.length]} alt={loc.location} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-paper text-center p-4">
                  <div className="font-serif text-3xl md:text-4xl tracking-tight">{loc.location}</div>
                  <div className="overline text-paper/80 mt-2">{loc.count} propert{loc.count === 1 ? "y" : "ies"}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Two clearly separated categories */}
      <CategorySection
        overline="For Rent"
        title="Long-term homes."
        subtitle="Reviewed rentals for a month, a season, or a year."
        items={rentals}
        seeAllHref="/properties?rental_type=rent"
        emptyLabel="No rentals published yet."
        testid="section-rentals"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="rr-hairline" />
      </div>

      <CategorySection
        overline="Short Stay"
        title="Nights worth booking."
        subtitle="Curated short stays — from weekend getaways to a fortnight abroad."
        items={stays}
        seeAllHref="/properties?rental_type=short_stay"
        emptyLabel="No short stays published yet."
        testid="section-shortstay"
        dark
      />

      <ReadingTest open={readingOpen} onOpenChange={setReadingOpen} onCompleted={loadBestFit} />
    </>
  );
}

function CategorySection({ overline, title, subtitle, items, seeAllHref, emptyLabel, testid, dark = false }) {
  return (
    <section className={dark ? "bg-ink text-paper py-20" : "py-20"} data-testid={testid}>
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className={`overline mb-3 ${dark ? "text-paper/70" : "text-moss"}`}>{overline}</div>
            <h2 className={`font-serif text-4xl md:text-5xl tracking-tight ${dark ? "text-paper" : "text-ink"}`}>{title}</h2>
            {subtitle && <p className={`mt-3 max-w-xl ${dark ? "text-paper/70" : "text-graphite"}`}>{subtitle}</p>}
          </div>
          <Link
            to={seeAllHref}
            className={`overline flex items-center gap-1 transition-colors ${dark ? "text-paper hover:text-paper/70" : "text-ink hover:text-moss"}`}
            data-testid={`${testid}-see-all`}
          >
            See all <ArrowRight size={14} />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className={`border border-dashed p-12 text-center ${dark ? "border-white/20 text-paper/60" : "border-rule text-graphite"}`}>
            <p className="font-serif text-2xl">{emptyLabel}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
