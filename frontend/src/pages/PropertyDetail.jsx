import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, fileUrl } from "../lib/api";
import { Star, MapPin, BedDouble, Bath, MessageCircle, Home as HomeIcon } from "lucide-react";
import ChatRoom from "../components/ChatRoom";
import ContactForm from "../components/ContactForm";

const REVIEWER_PORTRAIT = "https://images.unsplash.com/photo-1506863530036-1efeddceb993?crop=entropy&cs=srgb&fm=jpg&w=400&q=80&sat=-100";
const FALLBACK = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80";

export default function PropertyDetail() {
  const { id } = useParams();
  const [prop, setProp] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/properties/${id}`).then(({ data }) => setProp(data)),
      api.get("/site/config").then(({ data }) => setCfg(data)),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 text-graphite italic">Loading…</div>;
  if (!prop) return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 text-center">
      <p className="font-serif text-3xl">Not found.</p>
      <Link to="/properties" className="overline text-moss mt-4 inline-block">← Back to properties</Link>
    </div>
  );

  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(prop.price);
  const period = prop.price_period === "night" ? "/ night" : "/ month";
  const images = (prop.images?.length ? prop.images.map(fileUrl) : [FALLBACK]);
  const review = prop.review;

  const waLink = cfg?.whatsapp_number
    ? `https://wa.me/${cfg.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi Ari, I'm interested in "${prop.title}" (${window.location.href})`)}`
    : "#";

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 md:py-12">
      {/* Breadcrumb */}
      <div className="overline text-graphite mb-8">
        <Link to="/" className="hover:text-ink">Home</Link> / <Link to="/properties" className="hover:text-ink">Properties</Link> / <span className="text-ink">{prop.location}</span>
      </div>

      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="overline text-moss">{prop.rental_type === "short_stay" ? "Short Stay" : "For Rent"}</span>
          <span className="text-graphite text-xs">·</span>
          <div className="flex items-center gap-1 overline text-graphite"><MapPin size={12} /> {prop.location}</div>
        </div>
        <h1 className="font-serif text-4xl md:text-6xl leading-[1] tracking-tighter text-ink">{prop.title}</h1>
      </div>

      {/* Gallery — bento style */}
      <div className="grid grid-cols-4 grid-rows-2 gap-3 mb-16 h-[280px] md:h-[520px]">
        <div className="col-span-4 md:col-span-3 row-span-2 overflow-hidden border border-rule bg-stone2">
          <img src={images[activeImg]} alt={prop.title} className="w-full h-full object-cover" />
        </div>
        {images.slice(0, 4).map((src, i) => (
          <button
            key={i}
            onClick={() => setActiveImg(i)}
            className={`hidden md:block overflow-hidden border ${i === activeImg ? "border-ink" : "border-rule"} bg-stone2`}
            data-testid={`gallery-thumb-${i}`}
          >
            <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main content */}
        <div className="lg:col-span-8 space-y-16">
          {/* Facts row */}
          <div className="flex flex-wrap gap-8 pb-8 border-b border-rule">
            {prop.bedrooms > 0 && (
              <div>
                <div className="overline mb-1">Bedrooms</div>
                <div className="font-serif text-3xl flex items-center gap-2"><BedDouble size={22} /> {prop.bedrooms}</div>
              </div>
            )}
            {prop.bathrooms > 0 && (
              <div>
                <div className="overline mb-1">Bathrooms</div>
                <div className="font-serif text-3xl flex items-center gap-2"><Bath size={22} /> {prop.bathrooms}</div>
              </div>
            )}
            <div>
              <div className="overline mb-1">Type</div>
              <div className="font-serif text-3xl flex items-center gap-2"><HomeIcon size={22} /> {prop.rental_type === "short_stay" ? "Short Stay" : "Rental"}</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="overline text-moss mb-4">About this space</div>
            <p className="font-serif text-2xl md:text-3xl leading-snug text-ink whitespace-pre-line">
              {prop.description || "Description coming soon."}
            </p>
          </div>

          {/* Amenities */}
          {prop.amenities?.length > 0 && (
            <div>
              <div className="overline text-moss mb-4">Amenities</div>
              <div className="flex flex-wrap gap-2">
                {prop.amenities.map((a) => (
                  <span key={a} className="border border-rule px-4 py-2 text-sm uppercase tracking-widest">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Editorial Review */}
          {review ? (
            <div className="bg-stone2 border-l-4 border-moss p-8 md:p-12 relative" data-testid="editorial-review">
              <div className="flex items-start gap-6 mb-6">
                <img src={REVIEWER_PORTRAIT} alt={cfg?.reviewer_name} className="w-16 h-16 rounded-full object-cover border border-rule grayscale" />
                <div>
                  <div className="overline text-moss">Reviewed by {cfg?.reviewer_name || "Ari"}</div>
                  <div className="font-serif text-2xl mt-1">The Real Rating</div>
                </div>
                <div className="ml-auto flex items-center gap-1 text-moss">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={18} fill={i < review.rating ? "currentColor" : "none"} />
                  ))}
                  <span className="font-serif text-xl ml-2">{review.rating}/5</span>
                </div>
              </div>
              <h3 className="font-serif italic text-3xl md:text-4xl leading-tight mb-6 tracking-tight">"{review.headline}"</h3>
              <p className="text-graphite text-lg leading-relaxed whitespace-pre-line">{review.body}</p>

              {(review.pros?.length > 0 || review.cons?.length > 0) && (
                <div className="grid md:grid-cols-2 gap-8 mt-10">
                  {review.pros?.length > 0 && (
                    <div>
                      <div className="overline text-moss mb-3">Pros</div>
                      <ul className="space-y-2 text-ink">
                        {review.pros.map((p, i) => <li key={i} className="flex gap-2"><span className="text-moss">+</span> {p}</li>)}
                      </ul>
                    </div>
                  )}
                  {review.cons?.length > 0 && (
                    <div>
                      <div className="overline text-graphite mb-3">Cons</div>
                      <ul className="space-y-2 text-graphite">
                        {review.cons.map((c, i) => <li key={i} className="flex gap-2"><span>−</span> {c}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-rule p-8 text-center">
              <p className="font-serif text-2xl">Editor's review coming soon.</p>
              <p className="text-graphite mt-2">Ari is scheduling a visit. Follow the chat below for updates.</p>
            </div>
          )}

          {/* Chat */}
          <ChatRoom propertyId={prop.id} />
        </div>

        {/* Sticky Sidebar */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-28 space-y-6">
            <div className="bg-white border border-ink p-8">
              <div className="overline mb-2">{prop.rental_type === "short_stay" ? "Per night" : "Per month"}</div>
              <div className="font-serif text-5xl tracking-tight text-ink mb-6" data-testid="detail-price">
                {price}<span className="text-lg text-graphite ml-2 tracking-normal">{period}</span>
              </div>

              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-whatsapp text-white hover:bg-[#1DA851] transition-colors rounded-sm px-6 py-3.5 flex items-center justify-center gap-2 font-medium mb-3"
                data-testid="btn-whatsapp"
              >
                <MessageCircle size={18} /> Chat on WhatsApp
              </a>
              <a
                href="#contact"
                className="w-full border border-ink text-ink hover:bg-ink hover:text-paper transition-colors rounded-sm px-6 py-3.5 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                data-testid="btn-scroll-contact"
              >
                Private message
              </a>
            </div>

            <div id="contact" className="bg-paper border border-rule p-8">
              <div className="overline text-moss mb-2">Private contact</div>
              <h3 className="font-serif text-2xl mb-6">Message Ari directly.</h3>
              <ContactForm propertyId={prop.id} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
