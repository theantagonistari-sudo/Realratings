import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import PropertyCard from "../components/PropertyCard";
import { Search, ArrowRight } from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80";

const LOCATION_IMG = [
  "https://images.unsplash.com/photo-1706808849780-7a04fbac83ef?crop=entropy&cs=srgb&fm=jpg&w=900&q=70",
  "https://images.unsplash.com/photo-1724582586458-a51791349977?crop=entropy&cs=srgb&fm=jpg&w=900&q=70",
  "https://images.unsplash.com/photo-1646987916641-1f3c8992daa2?crop=entropy&cs=srgb&fm=jpg&w=900&q=70",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=srgb&fm=jpg&w=900&q=70",
];

export default function Home() {
  const [properties, setProperties] = useState([]);
  const [locations, setLocations] = useState([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/properties", { params: { limit: 6 } }).then(({ data }) => setProperties(data));
    api.get("/properties/locations").then(({ data }) => setLocations(data));
  }, []);

  const search = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("location", q);
    if (type) params.set("rental_type", type);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <>
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

      {/* Latest Reviews */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="overline text-moss mb-3">Latest Reviews</div>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight">Fresh from the editor.</h2>
          </div>
          <Link to="/properties" className="overline text-ink hover:text-moss transition-colors flex items-center gap-1">
            See all <ArrowRight size={14} />
          </Link>
        </div>

        {properties.length === 0 ? (
          <div className="border border-dashed border-rule p-16 text-center">
            <p className="font-serif text-3xl text-ink mb-3">The bookshelf is being stocked.</p>
            <p className="text-graphite mb-6">No properties have been published yet. Check back soon, or submit one for review.</p>
            <Link to="/submit" className="inline-block bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3 font-sans uppercase tracking-widest text-xs" data-testid="empty-submit">
              Submit a property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
