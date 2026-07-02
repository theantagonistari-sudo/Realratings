import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, fileUrl } from "../lib/api";
import { toast } from "sonner";
import { Trash2, Check, X, Mail, MessageSquare, Star, Upload } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import PropertyEditor from "../components/PropertyEditor";

export default function Admin() {
  const { user, loading, login } = useAuth();
  const [tab, setTab] = useState("properties");
  const [properties, setProperties] = useState([]);
  const [pending, setPending] = useState([]);
  const [messages, setMessages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    const [p, s, c] = await Promise.all([
      api.get("/properties", { params: { status: "published" } }),
      api.get("/submissions"),
      api.get("/contact"),
    ]);
    setProperties(p.data);
    setPending(s.data);
    setMessages(c.data);
  };

  useEffect(() => {
    if (user?.role === "admin") refresh();
  }, [user]);

  if (loading) return <div className="p-16 text-center">Loading…</div>;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-5xl mb-6">Admin only.</h1>
        <button onClick={login} className="bg-ink text-paper px-8 py-4 uppercase tracking-widest text-xs" data-testid="admin-login">Sign in</button>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-5xl mb-6">Restricted.</h1>
        <p className="text-graphite">This dashboard is for Real Ratings editors only.</p>
      </div>
    );
  }

  const approve = async (id) => {
    await api.put(`/properties/${id}`, { status: "published" });
    toast.success("Approved and published.");
    refresh();
  };
  const reject = async (id) => {
    await api.put(`/properties/${id}`, { status: "rejected" });
    toast("Marked as rejected.");
    refresh();
  };
  const del = async (id) => {
    if (!window.confirm("Delete this property permanently?")) return;
    await api.delete(`/properties/${id}`);
    toast.success("Deleted.");
    refresh();
  };
  const markRead = async (id) => { await api.put(`/contact/${id}/read`); refresh(); };
  const delMsg = async (id) => { await api.delete(`/contact/${id}`); refresh(); };

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="overline text-moss mb-3">Control Room</div>
            <h1 className="font-serif text-5xl tracking-tighter">Editor's Desk</h1>
          </div>
          <button onClick={() => setCreating(true)} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs" data-testid="btn-new-property">
            + New property
          </button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-transparent border border-rule rounded-sm p-1 mb-8" data-testid="admin-tabs">
            <TabsTrigger value="properties" className="uppercase tracking-widest text-xs data-[state=active]:bg-ink data-[state=active]:text-paper rounded-sm" data-testid="tab-properties">
              Properties · {properties.length}
            </TabsTrigger>
            <TabsTrigger value="pending" className="uppercase tracking-widest text-xs data-[state=active]:bg-ink data-[state=active]:text-paper rounded-sm" data-testid="tab-pending">
              Pending · {pending.length}
            </TabsTrigger>
            <TabsTrigger value="inbox" className="uppercase tracking-widest text-xs data-[state=active]:bg-ink data-[state=active]:text-paper rounded-sm" data-testid="tab-inbox">
              Inbox · {messages.filter((m) => !m.read).length}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            <div className="bg-white border border-rule">
              {properties.length === 0 && <div className="p-12 text-center text-graphite italic">No properties yet.</div>}
              {properties.map((p) => (
                <div key={p.id} className="flex items-center gap-4 border-b border-rule last:border-b-0 p-4" data-testid={`admin-prop-${p.id}`}>
                  <div className="w-20 h-16 bg-stone2 overflow-hidden border border-rule shrink-0">
                    {p.images?.[0] && <img src={fileUrl(p.images[0])} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-xl truncate">{p.title}</div>
                    <div className="text-xs text-graphite uppercase tracking-widest mt-1">
                      {p.location} · {p.rental_type} · ${p.price}
                      {p.review && <span className="ml-2 text-moss"><Star size={10} className="inline" /> {p.review.rating}/5</span>}
                    </div>
                  </div>
                  <button onClick={() => setEditing(p)} className="text-xs uppercase tracking-widest px-3 py-2 border border-rule hover:bg-ink hover:text-paper transition-colors" data-testid={`edit-${p.id}`}>Edit</button>
                  <button onClick={() => del(p.id)} className="text-xs px-3 py-2 border border-rule hover:bg-[#9B2C2C] hover:text-paper hover:border-[#9B2C2C] transition-colors" data-testid={`delete-${p.id}`}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="bg-white border border-rule">
              {pending.length === 0 && <div className="p-12 text-center text-graphite italic">No pending submissions.</div>}
              {pending.map((p) => (
                <div key={p.id} className="border-b border-rule last:border-b-0 p-6" data-testid={`pending-${p.id}`}>
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-24 h-20 bg-stone2 border border-rule shrink-0 overflow-hidden">
                      {p.images?.[0] && <img src={fileUrl(p.images[0])} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-serif text-2xl">{p.title}</div>
                      <div className="text-sm text-graphite">{p.location} · {p.rental_type} · ${p.price}</div>
                      <div className="text-xs text-graphite mt-1">By {p.submitter_name} ({p.submitter_email})</div>
                      {p.owner_contact && <div className="text-xs text-graphite">Contact: {p.owner_contact}</div>}
                    </div>
                  </div>
                  {p.description && <p className="text-sm text-graphite mb-4 line-clamp-3">{p.description}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => approve(p.id)} className="bg-moss text-paper px-4 py-2 uppercase tracking-widest text-xs flex items-center gap-2" data-testid={`approve-${p.id}`}>
                      <Check size={14} /> Approve
                    </button>
                    <button onClick={() => setEditing(p)} className="border border-ink px-4 py-2 uppercase tracking-widest text-xs" data-testid={`edit-pending-${p.id}`}>Edit before publish</button>
                    <button onClick={() => reject(p.id)} className="border border-rule px-4 py-2 uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-[#9B2C2C] hover:text-paper hover:border-[#9B2C2C]" data-testid={`reject-${p.id}`}>
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inbox">
            <div className="bg-white border border-rule">
              {messages.length === 0 && <div className="p-12 text-center text-graphite italic">Inbox empty.</div>}
              {messages.map((m) => (
                <div key={m.id} className={`border-b border-rule last:border-b-0 p-6 ${!m.read ? "bg-stone2/40" : ""}`} data-testid={`inbox-${m.id}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-serif text-xl">{m.name} <span className="text-graphite text-sm ml-2">{m.email}</span></div>
                      {m.phone && <div className="text-xs text-graphite">📞 {m.phone}</div>}
                      {m.property_title && <div className="text-xs text-moss uppercase tracking-widest mt-1">re: {m.property_title}</div>}
                    </div>
                    <div className="flex gap-2">
                      {!m.read && (
                        <button onClick={() => markRead(m.id)} className="border border-rule px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-ink hover:text-paper transition-colors" data-testid={`read-${m.id}`}>
                          Mark read
                        </button>
                      )}
                      <button onClick={() => delMsg(m.id)} className="border border-rule px-3 py-1.5 text-xs hover:bg-[#9B2C2C] hover:text-paper hover:border-[#9B2C2C]" data-testid={`del-msg-${m.id}`}><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <p className="text-graphite mt-3 whitespace-pre-line">{m.message}</p>
                  <div className="text-xs text-graphite mt-3">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {(editing || creating) && (
        <PropertyEditor
          property={editing}
          isNew={creating}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); refresh(); }}
        />
      )}
    </div>
  );
}
