import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

const Field = ({ label, children, testid }) => (
  <div data-testid={testid}>
    <label className="overline block mb-2">{label}</label>
    {children}
  </div>
);

export default function SubmitProperty() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    title: "", location: "", address: "", rental_type: "rent",
    price: "", price_period: "month", bedrooms: "", bathrooms: "",
    description: "", amenities: "", owner_contact: "", images: [],
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const upload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const f of files) {
      try {
        const fd = new FormData();
        fd.append("file", f);
        const { data } = await api.post("/upload", fd);
        uploaded.push(data.path);
      } catch { toast.error(`Failed to upload ${f.name}`); }
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
    setUploading(false);
    e.target.value = "";
  };

  const removeImg = (i) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.location || !form.price) {
      toast.error("Title, location and price are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        bedrooms: parseInt(form.bedrooms) || 0,
        bathrooms: parseInt(form.bathrooms) || 0,
        amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
      };
      await api.post("/submissions", payload);
      setSubmitted(true);
      toast.success("Submitted for review — Ari will get back to you soon.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Submission failed");
    } finally { setSaving(false); }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="overline text-moss mb-3">Property owners</div>
        <h1 className="font-serif text-5xl tracking-tighter mb-6">Submit your space for review.</h1>
        <p className="text-graphite text-lg mb-10 max-w-xl mx-auto">Sign in with Google to submit. Ari reviews every submission personally before it's published.</p>
        <button onClick={login} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-4 uppercase tracking-widest text-xs" data-testid="submit-login-cta">
          Sign in to continue
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="overline text-moss mb-3">Received</div>
        <h1 className="font-serif text-5xl tracking-tighter mb-6">Thank you.</h1>
        <p className="text-graphite text-lg mb-10">Your submission is now in Ari's queue. You'll hear back within a few days.</p>
        <button onClick={() => { setSubmitted(false); setForm({ ...form, title: "", location: "", description: "", images: [] }); }} className="border border-ink text-ink hover:bg-ink hover:text-paper transition-colors rounded-sm px-8 py-4 uppercase tracking-widest text-xs" data-testid="submit-another">
          Submit another
        </button>
      </div>
    );
  }

  const input = "w-full bg-transparent border-b border-rule rounded-none px-0 py-2 focus:outline-none focus:border-ink transition-colors";

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-16">
      <div className="mb-12">
        <div className="overline text-moss mb-3">Submit</div>
        <h1 className="font-serif text-5xl md:text-6xl tracking-tighter">Tell us about your space.</h1>
        <p className="text-graphite text-lg mt-4 max-w-xl">Fill in the details. Ari will visit and photograph before publishing. Only honest listings make the cut.</p>
      </div>

      <form onSubmit={submit} className="space-y-10" data-testid="submit-form">
        <Field label="Property title" testid="field-title">
          <input value={form.title} onChange={set("title")} placeholder="A light-filled loft in Yaba" className={input} data-testid="input-title" />
        </Field>
        <div className="grid md:grid-cols-2 gap-8">
          <Field label="Location (city / neighborhood)" testid="field-location">
            <input value={form.location} onChange={set("location")} placeholder="Lagos, Yaba" className={input} data-testid="input-location" />
          </Field>
          <Field label="Full address (private)" testid="field-address">
            <input value={form.address} onChange={set("address")} className={input} data-testid="input-address" />
          </Field>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Field label="Rental type" testid="field-type">
            <select value={form.rental_type} onChange={set("rental_type")} className={input} data-testid="input-type">
              <option value="rent">For Rent</option>
              <option value="short_stay">Short Stay</option>
            </select>
          </Field>
          <Field label="Price (USD)" testid="field-price">
            <input type="number" value={form.price} onChange={set("price")} className={input} data-testid="input-price" />
          </Field>
          <Field label="Period" testid="field-period">
            <select value={form.price_period} onChange={set("price_period")} className={input} data-testid="input-period">
              <option value="month">per month</option>
              <option value="night">per night</option>
            </select>
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <Field label="Bedrooms" testid="field-beds">
            <input type="number" value={form.bedrooms} onChange={set("bedrooms")} className={input} data-testid="input-bedrooms" />
          </Field>
          <Field label="Bathrooms" testid="field-baths">
            <input type="number" value={form.bathrooms} onChange={set("bathrooms")} className={input} data-testid="input-bathrooms" />
          </Field>
        </div>
        <Field label="Description" testid="field-desc">
          <textarea rows={5} value={form.description} onChange={set("description")} className="w-full bg-transparent border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-ink resize-none" data-testid="input-description" />
        </Field>
        <Field label="Amenities (comma separated)" testid="field-amenities">
          <input value={form.amenities} onChange={set("amenities")} placeholder="Wifi, Pool, AC" className={input} data-testid="input-amenities" />
        </Field>
        <Field label="Your contact (private, shown only to Ari)" testid="field-owner">
          <input value={form.owner_contact} onChange={set("owner_contact")} placeholder="Phone or email" className={input} data-testid="input-owner-contact" />
        </Field>

        <div>
          <label className="overline block mb-2">Photos</label>
          <div className="border border-dashed border-rule p-6 flex flex-wrap items-center gap-4">
            <label className="cursor-pointer inline-flex items-center gap-2 bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-5 py-3 uppercase tracking-widest text-xs" data-testid="upload-btn">
              <Upload size={14} /> {uploading ? "Uploading…" : "Choose files"}
              <input type="file" accept="image/*" multiple hidden onChange={upload} disabled={uploading} data-testid="upload-input" />
            </label>
            {form.images.map((path, i) => (
              <div key={path} className="relative w-24 h-24 border border-rule overflow-hidden group" data-testid={`preview-${i}`}>
                <img src={`${process.env.REACT_APP_BACKEND_URL}/api/files/${path}`} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImg(i)} className="absolute top-1 right-1 bg-ink text-paper rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-8 py-4 uppercase tracking-widest text-xs disabled:opacity-50" data-testid="submit-btn">
          {saving ? "Submitting…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
