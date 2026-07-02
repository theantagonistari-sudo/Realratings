import { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Send, LogIn, Shield } from "lucide-react";

export default function ChatRoom({ propertyId }) {
  const { user, login } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const lastTs = useRef(null);

  const fetchNew = async () => {
    try {
      const params = lastTs.current ? { since: lastTs.current } : {};
      const { data } = await api.get(`/properties/${propertyId}/messages`, { params });
      if (data.length) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const merged = [...prev, ...data.filter((m) => !ids.has(m.id))];
          return merged;
        });
        lastTs.current = data[data.length - 1].created_at;
      }
    } catch {}
  };

  useEffect(() => {
    fetchNew();
    const id = setInterval(fetchNew, 2500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await api.post(`/properties/${propertyId}/messages`, { text });
      setText("");
      await fetchNew();
    } catch {} finally { setSending(false); }
  };

  return (
    <section className="mt-16 border-t border-rule pt-12" data-testid="chat-room">
      <div className="mb-6">
        <div className="overline text-moss mb-2">The Conversation</div>
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight">Ask, discuss, decide.</h2>
        <p className="text-graphite mt-2 max-w-2xl">
          A live room for prospective tenants and guests. {user?.role === "admin" ? "Your replies are marked as verified." : "Ari (verified) usually replies within 24h."}
        </p>
      </div>

      <div className="bg-white border border-rule rounded-sm">
        <div ref={scrollRef} className="h-[420px] overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-graphite italic">
              No messages yet — be the first to start the conversation.
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.user_id === user?.user_id ? "flex-row-reverse" : ""}`} data-testid={`chat-msg-${m.id}`}>
              {m.user_picture ? (
                <img src={m.user_picture} alt="" className="w-9 h-9 rounded-full border border-rule shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-stone2 border border-rule shrink-0 flex items-center justify-center text-xs font-semibold">
                  {m.user_name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className={`max-w-[75%] ${m.user_id === user?.user_id ? "text-right" : ""}`}>
                <div className="flex items-center gap-2 mb-1 text-xs text-graphite">
                  <span className="font-semibold text-ink">{m.user_name}</span>
                  {m.is_admin && (
                    <span className="inline-flex items-center gap-1 bg-moss text-paper px-1.5 py-0.5 text-[10px] uppercase tracking-widest">
                      <Shield size={9} /> Ari
                    </span>
                  )}
                  <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className={`inline-block px-4 py-2.5 text-sm leading-relaxed border ${m.is_admin ? "bg-[#F0F4F1] border-moss text-ink" : "bg-stone2 border-rule text-ink"}`}>
                  {m.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-rule p-4">
          {user ? (
            <form onSubmit={send} className="flex gap-3" data-testid="chat-form">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a message…"
                className="flex-1 bg-transparent border border-rule rounded-sm px-4 py-3 focus:outline-none focus:border-ink transition-colors"
                data-testid="chat-input"
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-5 py-3 font-sans uppercase tracking-widest text-xs flex items-center gap-2 disabled:opacity-50"
                data-testid="chat-send"
              >
                <Send size={14} /> Send
              </button>
            </form>
          ) : (
            <button
              onClick={login}
              className="w-full bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-5 py-3 font-sans uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              data-testid="chat-login-cta"
            >
              <LogIn size={14} /> Sign in with Google to join the conversation
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
