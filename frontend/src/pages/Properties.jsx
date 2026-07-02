import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import PropertyCard from "../components/PropertyCard";
import { Search } from "lucide-react";

export default function Properties() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get("location") || "");
  const [type, setType] = useState(params.get("rental_type") || "");

  useEffect(() => {
    setLoading(true);
    const p = {};
    const loc = params.get("location");
    const rt = params.get("rental_type");
    if (loc) p.location = loc;
    if (rt) p.rental_type = rt;
    api.get("/properties", { params: p }).then(({ data }) => setItems(data)).finally(() => setLoading(false));
  }, [params]);

  const apply = (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (q) next.set("location", q);
    if (type) next.set("rental_type", type);
    setParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <div className="mb-10">
        <div className="overline text-moss mb-3">Properties</div>
        <h1 className="font-serif text-4xl md:text-6xl tracking-tighter">Every stay, reviewed.</h1>
      </div>

      <form onSubmit={apply} className="bg-white border border-rule p-4 md:p-6 flex flex-col md:flex-row gap-4 mb-12" data-testid="listing-filter-form">
        <div className="flex-1 flex items-center gap-3 px-2">
          <Search size={18} className="text-graphite" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by location…"
            className="w-full bg-transparent focus:outline-none py-2"
            data-testid="filter-location"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full md:w-56 bg-transparent border md:border-0 md:border-l border-rule focus:outline-none px-4 py-3 uppercase text-xs tracking-widest text-graphite"
          data-testid="filter-type"
        >
          <option value="">Any type</option>
          <option value="rent">For Rent</option>
          <option value="short_stay">Short Stay</option>
        </select>
        <button type="submit" className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-3 uppercase tracking-widest text-xs" data-testid="filter-apply">
          Apply
        </button>
      </form>

      {loading ? (
        <div className="text-graphite italic">Loading properties…</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-rule p-16 text-center">
          <p className="font-serif text-3xl text-ink mb-3">No matches (yet).</p>
          <p className="text-graphite">Try broader filters, or check back soon — new reviews are added weekly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="properties-grid">
          {items.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </div>
  );
}
