import { Link } from "react-router-dom";
import { Star, MapPin, BedDouble, Bath } from "lucide-react";
import { fileUrl } from "../lib/api";

const FALLBACK = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=srgb&fm=jpg&w=1200&q=70";

export default function PropertyCard({ property, span = "" }) {
  const cover = property.images?.[0] ? fileUrl(property.images[0]) : FALLBACK;
  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(property.price);
  const period = property.price_period === "night" ? "/ night" : "/ month";

  return (
    <Link
      to={`/properties/${property.id}`}
      className={`rr-card-hover group block bg-white border border-rule rounded-sm overflow-hidden hover:border-ink transition-colors ${span}`}
      data-testid={`property-card-${property.id}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone2">
        <img
          src={cover}
          alt={property.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-paper/95 border border-rule text-ink text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 font-semibold">
            {property.rental_type === "short_stay" ? "Short Stay" : "For Rent"}
          </span>
          {property.review && (
            <span className="bg-moss text-paper text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 font-semibold flex items-center gap-1">
              <Star size={10} fill="currentColor" /> Reviewed
            </span>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-1.5 text-graphite text-xs mb-2">
          <MapPin size={12} />
          <span className="uppercase tracking-widest">{property.location}</span>
        </div>
        <h3 className="font-serif text-2xl leading-tight tracking-tight text-ink mb-3 group-hover:text-moss transition-colors">
          {property.title}
        </h3>
        <div className="flex items-center gap-4 text-graphite text-sm mb-4">
          {property.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble size={14} /> {property.bedrooms}</span>}
          {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath size={14} /> {property.bathrooms}</span>}
          {property.review && (
            <span className="flex items-center gap-1 text-moss">
              <Star size={14} fill="currentColor" /> {property.review.rating}/5
            </span>
          )}
        </div>
        <div className="rr-hairline pt-4 flex items-baseline justify-between">
          <span className="font-serif text-2xl text-ink">{price}<span className="text-sm text-graphite ml-1">{period}</span></span>
          <span className="overline text-moss group-hover:translate-x-1 transition-transform">View →</span>
        </div>
      </div>
    </Link>
  );
}
