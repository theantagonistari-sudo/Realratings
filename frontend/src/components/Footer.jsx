import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Footer() {
  const [cfg, setCfg] = useState(null);
  useEffect(() => {
    api.get("/site/config").then(({ data }) => setCfg(data)).catch(() => {});
  }, []);

  return (
    <footer className="bg-ink text-paper mt-24" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="font-serif text-4xl tracking-tighter leading-none mb-4">Real Ratings</div>
          <p className="text-sm text-paper/70 max-w-md leading-relaxed">
            An editorial marketplace for rentals and short stays.
            Every listing is visited, photographed and reviewed by {cfg?.reviewer_name || "Ari"} — no algorithms, just honest opinion.
          </p>
        </div>
        <div>
          <div className="overline text-paper/60 mb-4">Explore</div>
          <ul className="space-y-3 text-sm">
            <li><a href="/properties" className="hover:text-white/90 text-paper/80">All Properties</a></li>
            <li><a href="/properties?rental_type=rent" className="hover:text-white/90 text-paper/80">For Rent</a></li>
            <li><a href="/properties?rental_type=short_stay" className="hover:text-white/90 text-paper/80">Short Stay</a></li>
            <li><a href="/submit" className="hover:text-white/90 text-paper/80">Submit a property</a></li>
          </ul>
        </div>
        <div>
          <div className="overline text-paper/60 mb-4">Contact</div>
          <ul className="space-y-3 text-sm text-paper/80">
            <li data-testid="footer-email">{cfg?.contact_email}</li>
            <li data-testid="footer-whatsapp">WhatsApp: {cfg?.whatsapp_number}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 flex flex-col md:flex-row items-center justify-between gap-2 px-6 md:px-12">
        <div className="overline text-paper/50">© {new Date().getFullYear()} Real Ratings — Curated Spaces. Honest Reviews.</div>
        <a href="/admin/login" className="overline text-paper/40 hover:text-paper/80 transition-colors" data-testid="footer-admin-link">Editor</a>
      </div>
    </footer>
  );
}
