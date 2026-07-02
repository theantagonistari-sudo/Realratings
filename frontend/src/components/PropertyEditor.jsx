import { useState, useEffect } from "react";
import { api, fileUrl } from "../lib/api";
import { toast } from "sonner";
import { X, Upload, Star } from "lucide-react";

export default function PropertyEditor({ property, isNew, onClose, onSaved }) {
  const empty = {
    title: "", location: "", address: "", rental_type: "rent",
    price: 0, price_period: "month", bedrooms: 0, bathrooms: 0,
    description: "", amenities: [], images: [], status: "published",
    review: null,
  };
  const [form, setForm] = useState(empty);
  const [reviewOn, setReviewOn] = useState(false);
  const [review, setReview] = useState({ rating: 5, headline: "", body: "", pros: [], cons: [] });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (property) {
      setForm({
        title: property.title || "", location: property.location || "", address: property.address || "",
        rental_type: property.rental_type || "rent", price: property.price || 0,
        price_period: property.price_period || "month", bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0, description: property.description || "",
        amenities: property.amenities || [], images: property.images || [],
        status: property.status || "published",
      });
      if (property.review) {
        setReviewOn(true);
        setReview({
          rating: property.review.rating || 5,
          headline: property.review.headline || "",
          body: property.review.body || "",
          pros: property.review.pros || [],
          cons: property.review.cons || [],
        });
      }
    } else {
      setForm(empty);
    }
  }, [property]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const uploadFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);
    const paths = [];
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      try {
        const { data } = await api.post("/upload", fd);
        paths.push(data.path);
      } catch { toast.error(`Upload failed: ${f.name}`); }
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, ...paths] }));
    setUploading(false);
    e.target.value = "";
  };

  const removeImg = (i) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        bedrooms: parseInt(form.bedrooms) || 0,
        bathrooms: parseInt(form.bathrooms) || 0,
        amenities: typeof form.amenities === "string"
          ? form.amenities.split(",").map((a) => a.trim()).filter(Boolean)
          : form.amenities,
        status: "published",
      };
      if (reviewOn) {
        payload.review = {
          ...review,
          rating: parseInt(review.rating) || 5,
          pros: typeof review.pros === "string" ? review.pros.split("\n").map((s) => s.trim()).filter(Boolean) : review.pros,
          cons: typeof review.cons === "string" ? review.cons.split("\n").map((s) => s.trim()).filter(Boolean) : review.cons,
        };
      }
      if (isNew) await api.post("/properties", payload);
      else await api.put(`/properties/${property.id}`, payload);
      toast.success("Saved.");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  const input = "w-full bg-transparent border-b border-rule rounded-none px-0 py-2 focus:outline-none focus:border-ink transition-colors";

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-paper max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-ink" onClick={(e) => e.stopPropagation()} data-testid="property-editor">
        <div className="sticky top-0 bg-paper border-b border-rule px-8 py-5 flex items-center justify-between z-10">
          <h2 className="font-serif text-3xl tracking-tight">{isNew ? "New property" : "Edit property"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone2" data-testid="editor-close"><X size={20} /></button>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <label className="overline block mb-2">Title</label>
            <input value={form.title} onChange={set("title")} className={input} data-testid="editor-title" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="overline block mb-2">Location</label>
              <input value={form.location} onChange={set("location")} className={input} data-testid="editor-location" />
            </div>
            <div>
              <label className="overline block mb-2">Address (private)</label>
              <input value={form.address} onChange={set("address")} className={input} data-testid="editor-address" />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="overline block mb-2">Type</label>
              <select value={form.rental_type} onChange={set("rental_type")} className={input} data-testid="editor-type">
                <option value="rent">For Rent</option>
                <option value="short_stay">Short Stay</option>
              </select>
            </div>
            <div>
              <label className="overline block mb-2">Price (USD)</label>
              <input type="number" value={form.price} onChange={set("price")} className={input} data-testid="editor-price" />
            </div>
            <div>
              <label className="overline block mb-2">Period</label>
              <select value={form.price_period} onChange={set("price_period")} className={input}>
                <option value="month">per month</option>
                <option value="night">per night</option>
              </select>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="overline block mb-2">Bedrooms</label>
              <input type="number" value={form.bedrooms} onChange={set("bedrooms")} className={input} />
            </div>
            <div>
              <label className="overline block mb-2">Bathrooms</label>
              <input type="number" value={form.bathrooms} onChange={set("bathrooms")} className={input} />
            </div>
          </div>
          <div>
            <label className="overline block mb-2">Description</label>
            <textarea rows={4} value={form.description} onChange={set("description")} className="w-full bg-transparent border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-ink resize-none" data-testid="editor-description" />
          </div>
          <div>
            <label className="overline block mb-2">Amenities (comma separated)</label>
            <input
              value={Array.isArray(form.amenities) ? form.amenities.join(", ") : form.amenities}
              onChange={(e) => setForm((f) => ({ ...f, amenities: e.target.value.split(",").map((a) => a.trim()).filter(Boolean) }))}
              className={input}
              data-testid="editor-amenities"
            />
          </div>

          <div>
            <label className="overline block mb-2">Photos</label>
            <div className="flex flex-wrap items-center gap-3 border border-dashed border-rule p-4">
              <label className="cursor-pointer inline-flex items-center gap-2 bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-4 py-2 uppercase tracking-widest text-xs">
                <Upload size={14} /> {uploading ? "Uploading…" : "Add"}
                <input type="file" accept="image/*" multiple hidden onChange={uploadFiles} data-testid="editor-upload" />
              </label>
              {form.images.map((path, i) => (
                <div key={path} className="relative w-20 h-20 border border-rule overflow-hidden group">
                  <img src={fileUrl(path)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImg(i)} className="absolute top-1 right-1 bg-ink text-paper rounded-full p-1 opacity-0 group-hover:opacity-100">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Review */}
          <div className="border-t border-rule pt-8">
            <label className="flex items-center gap-3 mb-4 cursor-pointer" data-testid="editor-review-toggle">
              <input type="checkbox" checked={reviewOn} onChange={(e) => setReviewOn(e.target.checked)} />
              <span className="font-serif text-2xl">Include Real Ratings Review</span>
            </label>
            {reviewOn && (
              <div className="space-y-5 pl-6 border-l-4 border-moss">
                <div>
                  <label className="overline block mb-2">Rating (1–5)</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((n) => (
                      <button key={n} type="button" onClick={() => setReview((r) => ({ ...r, rating: n }))} className="text-moss">
                        <Star size={24} fill={n <= review.rating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="overline block mb-2">Headline</label>
                  <input value={review.headline} onChange={(e) => setReview((r) => ({ ...r, headline: e.target.value }))} className={input} data-testid="review-headline" />
                </div>
                <div>
                  <label className="overline block mb-2">Body</label>
                  <textarea rows={4} value={review.body} onChange={(e) => setReview((r) => ({ ...r, body: e.target.value }))} className="w-full bg-transparent border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-ink resize-none" data-testid="review-body" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="overline block mb-2">Pros (one per line)</label>
                    <textarea rows={4} value={Array.isArray(review.pros) ? review.pros.join("\n") : review.pros} onChange={(e) => setReview((r) => ({ ...r, pros: e.target.value.split("\n") }))} className="w-full bg-transparent border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-ink resize-none" />
                  </div>
                  <div>
                    <label className="overline block mb-2">Cons (one per line)</label>
                    <textarea rows={4} value={Array.isArray(review.cons) ? review.cons.join("\n") : review.cons} onChange={(e) => setReview((r) => ({ ...r, cons: e.target.value.split("\n") }))} className="w-full bg-transparent border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-ink resize-none" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-paper border-t border-rule px-8 py-5 flex justify-end gap-3">
          <button onClick={onClose} className="border border-ink px-6 py-3 uppercase tracking-widest text-xs">Cancel</button>
          <button onClick={save} disabled={saving} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-3 uppercase tracking-widest text-xs disabled:opacity-50" data-testid="editor-save">
            {saving ? "Saving…" : "Save & publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
