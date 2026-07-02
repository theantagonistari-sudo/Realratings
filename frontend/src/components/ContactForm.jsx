import { useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";

export default function ContactForm({ propertyId }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Name, email and message are required.");
      return;
    }
    setSending(true);
    try {
      await api.post("/contact", { ...form, property_id: propertyId });
      toast.success("Message sent — Ari will get back to you.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      toast.error("Could not send. Try WhatsApp instead.");
    } finally { setSending(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-5" data-testid="contact-form">
      <div>
        <label className="overline block mb-2">Your name</label>
        <input value={form.name} onChange={set("name")} className="w-full bg-transparent border-b border-rule rounded-none px-0 py-2 focus:outline-none focus:border-ink transition-colors" data-testid="contact-name" />
      </div>
      <div>
        <label className="overline block mb-2">Email</label>
        <input type="email" value={form.email} onChange={set("email")} className="w-full bg-transparent border-b border-rule rounded-none px-0 py-2 focus:outline-none focus:border-ink transition-colors" data-testid="contact-email" />
      </div>
      <div>
        <label className="overline block mb-2">Phone (optional)</label>
        <input value={form.phone} onChange={set("phone")} className="w-full bg-transparent border-b border-rule rounded-none px-0 py-2 focus:outline-none focus:border-ink transition-colors" data-testid="contact-phone" />
      </div>
      <div>
        <label className="overline block mb-2">Message</label>
        <textarea rows={4} value={form.message} onChange={set("message")} className="w-full bg-transparent border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-ink transition-colors resize-none" data-testid="contact-message" />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="w-full bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3.5 font-sans uppercase tracking-widest text-xs disabled:opacity-50"
        data-testid="contact-submit"
      >
        {sending ? "Sending…" : "Send private message"}
      </button>
    </form>
  );
}
