// Real Ratings — Personal Finance Manager (native React)
// All data lives in localStorage under 'rr_finance_v1'. No backend calls.

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, Wallet, PiggyBank, Target,
  Sparkles, Filter, Download, X, Calendar as CalIcon, Receipt, Landmark,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from "recharts";
import { toast } from "sonner";

// ---------- Constants ----------
const STORAGE_KEY = "rr_finance_v1";
const CURRENCIES = { USD: "$", EUR: "€", GBP: "£", NGN: "₦" };

const CATEGORIES = [
  { id: "salary", label: "Salary", type: "income", color: "#2C4033" },
  { id: "freelance", label: "Freelance", type: "income", color: "#3E5B49" },
  { id: "investments", label: "Investments", type: "income", color: "#547265" },
  { id: "other-income", label: "Other Income", type: "income", color: "#6A897B" },
  { id: "housing", label: "Housing", type: "expense", color: "#1A1A1A" },
  { id: "food", label: "Food & Groceries", type: "expense", color: "#4A4A4A" },
  { id: "transport", label: "Transport", type: "expense", color: "#5C4A3A" },
  { id: "utilities", label: "Utilities", type: "expense", color: "#7A5A3D" },
  { id: "health", label: "Health", type: "expense", color: "#9B2C2C" },
  { id: "entertainment", label: "Entertainment", type: "expense", color: "#B57B4B" },
  { id: "shopping", label: "Shopping", type: "expense", color: "#8B6F5A" },
  { id: "education", label: "Education", type: "expense", color: "#6B5A4A" },
  { id: "other", label: "Other", type: "expense", color: "#A8A29E" },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// ---------- Store ----------
function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { currency: "USD", transactions: [], budgets: {}, recurring: [], settings: { startingBalance: 0 } };
}
function saveStore(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (v, cur = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(v || 0);
const fmtDec = (v, cur = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 2 }).format(v || 0);
const monthKey = (isoDate) => (isoDate || "").slice(0, 7);
const thisMonth = () => new Date().toISOString().slice(0, 7);

// ---------- Root ----------
export default function Finance() {
  const [store, setStore] = useState(loadStore);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => { saveStore(store); }, [store]);

  const update = (patch) => setStore(prev => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));

  return (
    <div className="bg-paper min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <section className="border-b border-rule bg-paper">
        <div className="max-w-6xl mx-auto px-6 md:px-12 pt-10 pb-6">
          <Link to="/profile" className="inline-flex items-center gap-2 overline text-graphite hover:text-ink transition-colors mb-6" data-testid="finance-back">
            <ArrowLeft size={12} /> Back to profile
          </Link>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="overline text-moss mb-3 flex items-center gap-2"><Wallet size={12} /> Personal Finance · Private</div>
              <h1 className="font-serif text-5xl md:text-6xl tracking-tighter leading-none">Your money, on paper.</h1>
              <p className="text-graphite mt-3 max-w-2xl">Track transactions, hold budgets, forecast the runway. Everything stays in your browser — nothing is uploaded to Real Ratings' servers.</p>
            </div>
            <CurrencyPicker value={store.currency} onChange={(c) => update({ currency: c })} />
          </div>
          <TabBar tab={tab} onChange={setTab} />
        </div>
      </section>

      {/* Body */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-10">
        {tab === "dashboard" && <Dashboard store={store} update={update} />}
        {tab === "transactions" && <Transactions store={store} update={update} />}
        {tab === "budgets" && <Budgets store={store} update={update} />}
        {tab === "calculators" && <Calculators cur={store.currency} />}
        {tab === "forecast" && <Forecast store={store} update={update} />}
      </section>
    </div>
  );
}

// ---------- Header widgets ----------
function CurrencyPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 border border-rule bg-white p-1" data-testid="currency-picker">
      {Object.entries(CURRENCIES).map(([code, sym]) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          className={`px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${value === code ? "bg-ink text-paper" : "text-graphite hover:text-ink"}`}
          data-testid={`cur-${code}`}
        >
          {sym} {code}
        </button>
      ))}
    </div>
  );
}

function TabBar({ tab, onChange }) {
  const tabs = [
    { id: "dashboard",    label: "Dashboard",    icon: Sparkles },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "budgets",      label: "Budgets",      icon: Target },
    { id: "calculators",  label: "Calculators",  icon: Landmark },
    { id: "forecast",     label: "Forecast",     icon: TrendingUp },
  ];
  return (
    <div className="mt-8 flex gap-1 border-b border-rule overflow-x-auto no-scrollbar" data-testid="finance-tabs">
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`shrink-0 flex items-center gap-2 px-5 py-3 border-b-2 uppercase tracking-widest text-xs transition-colors ${active ? "border-ink text-ink" : "border-transparent text-graphite hover:text-ink"}`}
            data-testid={`tab-${id}`}
          >
            <Icon size={12} /> {label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Dashboard ----------
function Dashboard({ store, update }) {
  const cur = store.currency;
  const mk = thisMonth();

  const stats = useMemo(() => {
    const monthTxns = store.transactions.filter(t => monthKey(t.date) === mk);
    const income = monthTxns.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0);
    const expense = monthTxns.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0);
    const balance = store.settings.startingBalance +
      store.transactions.reduce((a, t) => a + (t.type === "income" ? t.amount : -t.amount), 0);
    const savingsRate = income > 0 ? Math.max(0, ((income - expense) / income) * 100) : 0;
    return { income, expense, net: income - expense, balance, savingsRate };
  }, [store, mk]);

  const spendingByCat = useMemo(() => {
    const map = {};
    store.transactions
      .filter(t => monthKey(t.date) === mk && t.type === "expense")
      .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map)
      .map(([id, value]) => ({ name: CAT_MAP[id]?.label || id, value, color: CAT_MAP[id]?.color || "#4A4A4A" }))
      .sort((a, b) => b.value - a.value);
  }, [store, mk]);

  const last6 = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = d.toISOString().slice(0, 7);
      const inc = store.transactions.filter(t => monthKey(t.date) === k && t.type === "income").reduce((a, b) => a + b.amount, 0);
      const exp = store.transactions.filter(t => monthKey(t.date) === k && t.type === "expense").reduce((a, b) => a + b.amount, 0);
      arr.push({ month: d.toLocaleString("default", { month: "short" }), income: Math.round(inc), expense: Math.round(exp) });
    }
    return arr;
  }, [store]);

  const recent = useMemo(() => store.transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6), [store]);

  if (store.transactions.length === 0) {
    return <EmptyDashboard store={store} update={update} />;
  }

  return (
    <div className="space-y-10" data-testid="dashboard-content">
      {/* Hero Stats — Bento */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6 bg-ink text-paper p-8 rounded-sm">
          <div className="overline text-paper/70 mb-2">Total balance</div>
          <div className="font-serif text-6xl md:text-7xl tracking-tighter leading-none" data-testid="stat-balance">{fmt(stats.balance, cur)}</div>
          <div className="mt-4 text-paper/70 text-sm">Cumulative across all recorded transactions</div>
        </div>
        <StatTile label="This month · Income"  value={fmt(stats.income, cur)} icon={<TrendingUp size={16} />} sub="Credit total" testid="stat-income" positive />
        <StatTile label="This month · Expense" value={fmt(stats.expense, cur)} icon={<TrendingDown size={16} />} sub="Debit total" testid="stat-expense" negative />
        <StatTile label="Net · this month"     value={fmt(stats.net, cur)}     icon={<PiggyBank size={16} />}    sub={`${stats.savingsRate.toFixed(0)}% savings rate`} testid="stat-net" />
        <StatTile label="Transactions"         value={store.transactions.length} icon={<Receipt size={16} />}    sub="All-time count" testid="stat-txns" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 bg-white border border-rule p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="overline text-moss mb-1">Last 6 months</div>
              <h3 className="font-serif text-2xl tracking-tight">Income vs Expense.</h3>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last6}>
                <CartesianGrid stroke="#EAE6DF" vertical={false} />
                <XAxis dataKey="month" stroke="#4A4A4A" fontSize={11} tickLine={false} />
                <YAxis stroke="#4A4A4A" fontSize={11} tickLine={false} axisLine={false} />
                <ReTooltip
                  contentStyle={{ background: "#1A1A1A", border: "none", borderRadius: 2, color: "#F9F8F6", fontFamily: "Outfit" }}
                  labelStyle={{ color: "#EAE6DF" }}
                  formatter={(v) => fmt(v, cur)}
                />
                <Bar dataKey="income" fill="#2C4033" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" fill="#9B2C2C" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white border border-rule p-6 rounded-sm">
          <div className="mb-4">
            <div className="overline text-moss mb-1">This month</div>
            <h3 className="font-serif text-2xl tracking-tight">Spending by category.</h3>
          </div>
          {spendingByCat.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-graphite italic">No expenses recorded this month.</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={spendingByCat} dataKey="value" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {spendingByCat.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <ReTooltip
                      contentStyle={{ background: "#1A1A1A", border: "none", borderRadius: 2, color: "#F9F8F6", fontFamily: "Outfit" }}
                      formatter={(v) => fmt(v, cur)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 text-sm">
                {spendingByCat.slice(0, 6).map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="flex-1 truncate text-graphite">{c.name}</span>
                    <span className="font-serif text-ink tabular-nums">{fmt(c.value, cur)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="overline text-moss mb-1">Latest activity</div>
            <h3 className="font-serif text-2xl tracking-tight">Recent transactions.</h3>
          </div>
        </div>
        <div className="bg-white border border-rule">
          {recent.map((t) => <TxnRow key={t.id} txn={t} cur={cur} />)}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, icon, sub, positive, negative, testid }) {
  return (
    <div className={`col-span-6 md:col-span-3 border p-6 rounded-sm ${negative ? "bg-white border-[#9B2C2C]/30" : positive ? "bg-white border-moss/30" : "bg-white border-rule"}`} data-testid={testid}>
      <div className="flex items-center gap-2 overline text-graphite mb-3">{icon}{label}</div>
      <div className={`font-serif text-3xl tracking-tighter tabular-nums leading-none ${positive ? "text-moss" : negative ? "text-[#9B2C2C]" : "text-ink"}`}>{value}</div>
      {sub && <div className="text-xs text-graphite mt-2">{sub}</div>}
    </div>
  );
}

function EmptyDashboard({ store, update }) {
  const [starterOpen, setStarterOpen] = useState(false);
  return (
    <div className="text-center py-16 border border-dashed border-rule bg-white" data-testid="dashboard-empty">
      <Wallet size={48} className="text-graphite/40 mb-6 mx-auto" />
      <h2 className="font-serif text-4xl tracking-tighter text-ink mb-3">Start the ledger.</h2>
      <p className="text-graphite max-w-md mx-auto mb-8">Add your first transaction. You can also set an opening balance so the dashboard reads real numbers immediately.</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <button onClick={() => setStarterOpen(true)} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs" data-testid="btn-start-ledger">
          + Add first transaction
        </button>
        <StartingBalance store={store} update={update} />
      </div>
      {starterOpen && <TxnDialog onClose={() => setStarterOpen(false)} onSave={(t) => { update(s => ({ transactions: [{ ...t, id: uid() }, ...s.transactions] })); setStarterOpen(false); toast.success("Added."); }} cur={store.currency} />}
    </div>
  );
}

function StartingBalance({ store, update }) {
  const [v, setV] = useState(store.settings.startingBalance || 0);
  const save = () => {
    update(s => ({ settings: { ...s.settings, startingBalance: parseFloat(v) || 0 } }));
    toast.success("Opening balance saved.");
  };
  return (
    <div className="inline-flex items-center gap-2 border border-ink rounded-sm px-3 py-2">
      <span className="overline">Opening bal.</span>
      <input type="number" value={v} onChange={e => setV(e.target.value)} className="w-28 bg-transparent border-b border-rule focus:outline-none focus:border-ink px-1 py-1 font-serif text-lg" data-testid="input-starting-balance" />
      <button onClick={save} className="text-xs uppercase tracking-widest text-ink hover:text-moss">Save</button>
    </div>
  );
}

// ---------- Transactions ----------
function Transactions({ store, update }) {
  const cur = store.currency;
  const [open, setOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterType, setFilterType] = useState("");
  const [q, setQ] = useState("");

  const months = useMemo(() => {
    const s = new Set(store.transactions.map(t => monthKey(t.date)));
    return [...s].sort().reverse();
  }, [store]);

  const filtered = useMemo(() => {
    return store.transactions
      .filter(t => !filterMonth || monthKey(t.date) === filterMonth)
      .filter(t => !filterType || t.type === filterType)
      .filter(t => !q || (t.note || "").toLowerCase().includes(q.toLowerCase()) || (CAT_MAP[t.category]?.label || "").toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [store, filterMonth, filterType, q]);

  const del = (id) => {
    update(s => ({ transactions: s.transactions.filter(t => t.id !== id) }));
    toast("Transaction removed.");
  };

  const exportCSV = () => {
    const header = "date,type,category,amount,note\n";
    const rows = filtered.map(t => [t.date, t.type, CAT_MAP[t.category]?.label || t.category, t.amount, (t.note || "").replace(/"/g, '""')].map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `transactions-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" data-testid="transactions-content">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-serif text-3xl tracking-tight">Ledger.</h2>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={filtered.length === 0} className="text-xs uppercase tracking-widest px-4 py-2 border border-rule hover:bg-ink hover:text-paper transition-colors disabled:opacity-40 flex items-center gap-2" data-testid="btn-export-csv">
            <Download size={12} /> Export
          </button>
          <button onClick={() => setOpen(true)} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-5 py-2.5 uppercase tracking-widest text-xs flex items-center gap-2" data-testid="btn-add-txn">
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-rule p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2">
          <Filter size={14} className="text-graphite" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search notes or categories…" className="w-full bg-transparent focus:outline-none py-2" data-testid="filter-search" />
        </div>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="bg-transparent border border-rule px-3 py-2 text-xs uppercase tracking-widest text-graphite md:w-40" data-testid="filter-month">
          <option value="">All months</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-transparent border border-rule px-3 py-2 text-xs uppercase tracking-widest text-graphite md:w-32" data-testid="filter-type">
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-white border border-rule">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-graphite italic">No transactions match your filters.</div>
        ) : filtered.map(t => <TxnRow key={t.id} txn={t} cur={cur} onDelete={() => del(t.id)} />)}
      </div>

      {open && <TxnDialog onClose={() => setOpen(false)} onSave={(t) => { update(s => ({ transactions: [{ ...t, id: uid() }, ...s.transactions] })); setOpen(false); toast.success("Added."); }} cur={cur} />}
    </div>
  );
}

function TxnRow({ txn, cur, onDelete }) {
  const cat = CAT_MAP[txn.category];
  const isIncome = txn.type === "income";
  return (
    <div className="flex items-center gap-4 border-b border-rule last:border-b-0 p-4 group" data-testid={`txn-${txn.id}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0`} style={{ background: cat?.color || "#4A4A4A", color: "#F9F8F6" }}>
        {isIncome ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg text-ink">{cat?.label || txn.category}</span>
          <span className="text-xs text-graphite">{new Date(txn.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
        </div>
        {txn.note && <div className="text-sm text-graphite mt-0.5 truncate">{txn.note}</div>}
      </div>
      <div className={`font-serif text-2xl tabular-nums ${isIncome ? "text-moss" : "text-[#9B2C2C]"}`}>
        {isIncome ? "+" : "−"}{fmtDec(txn.amount, cur)}
      </div>
      {onDelete && (
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-stone2" data-testid={`del-txn-${txn.id}`}>
          <Trash2 size={14} className="text-graphite" />
        </button>
      )}
    </div>
  );
}

function TxnDialog({ onClose, onSave, cur }) {
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("food");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const filtered = CATEGORIES.filter(c => c.type === type);
  const submit = (e) => {
    e.preventDefault();
    const a = parseFloat(amount);
    if (!a || a <= 0) return toast.error("Amount must be greater than 0.");
    onSave({ type, category, amount: a, date, note });
  };
  return (
    <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-paper border border-ink max-w-md w-full" onClick={e => e.stopPropagation()} data-testid="txn-dialog">
        <div className="border-b border-rule px-6 py-4 flex items-center justify-between">
          <h3 className="font-serif text-2xl">New transaction</h3>
          <button onClick={onClose} className="p-1 hover:bg-stone2"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-1 border border-rule p-1">
            {["expense", "income"].map(t => (
              <button key={t} type="button" onClick={() => { setType(t); setCategory(CATEGORIES.find(c => c.type === t).id); }}
                className={`py-2 uppercase tracking-widest text-xs transition-colors ${type === t ? "bg-ink text-paper" : "text-graphite hover:text-ink"}`}
                data-testid={`type-${t}`}>
                {t === "expense" ? "− Expense" : "+ Income"}
              </button>
            ))}
          </div>
          <div>
            <label className="overline block mb-2">Amount ({CURRENCIES[cur]})</label>
            <input type="number" step="0.01" required autoFocus value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full bg-transparent border-b border-rule focus:outline-none focus:border-ink py-2 font-serif text-4xl tracking-tighter"
              data-testid="input-amount" placeholder="0.00" />
          </div>
          <div>
            <label className="overline block mb-2">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-transparent border-b border-rule focus:outline-none focus:border-ink py-2" data-testid="input-category">
              {filtered.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="overline block mb-2">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-transparent border-b border-rule focus:outline-none focus:border-ink py-2" data-testid="input-date" />
            </div>
            <div>
              <label className="overline block mb-2">Note</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional"
                className="w-full bg-transparent border-b border-rule focus:outline-none focus:border-ink py-2" data-testid="input-note" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-rule">
            <button type="button" onClick={onClose} className="border border-ink px-5 py-2.5 uppercase tracking-widest text-xs">Cancel</button>
            <button type="submit" className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-2.5 uppercase tracking-widest text-xs" data-testid="btn-save-txn">Add transaction</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Budgets ----------
function Budgets({ store, update }) {
  const cur = store.currency;
  const mk = thisMonth();
  const expenseCats = CATEGORIES.filter(c => c.type === "expense");

  const spent = useMemo(() => {
    const map = {};
    store.transactions.filter(t => monthKey(t.date) === mk && t.type === "expense")
      .forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [store, mk]);

  const setBudget = (cat, v) => {
    const n = parseFloat(v);
    update(s => ({ budgets: { ...s.budgets, [cat]: isNaN(n) || n <= 0 ? 0 : n } }));
  };

  const totalBudget = Object.values(store.budgets).reduce((a, b) => a + (b || 0), 0);
  const totalSpent = Object.values(spent).reduce((a, b) => a + b, 0);
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-8" data-testid="budgets-content">
      <div>
        <h2 className="font-serif text-3xl tracking-tight mb-2">Monthly budgets.</h2>
        <p className="text-graphite">Set a ceiling per category. Progress updates as you record expenses.</p>
      </div>

      <div className="bg-white border border-ink p-6 rounded-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="overline text-moss">Total this month</div>
          <div className="text-xs text-graphite">{new Date().toLocaleString("default", { month: "long", year: "numeric" })}</div>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-5xl tracking-tighter tabular-nums">{fmt(totalSpent, cur)}</span>
          <span className="text-graphite">of {fmt(totalBudget || 0, cur)}</span>
        </div>
        <div className="mt-4 h-2 bg-stone2">
          <div className={`h-2 transition-all ${totalPct > 100 ? "bg-[#9B2C2C]" : totalPct > 80 ? "bg-[#B57B4B]" : "bg-moss"}`} style={{ width: `${Math.min(100, totalPct)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {expenseCats.map(c => {
          const b = store.budgets[c.id] || 0;
          const s = spent[c.id] || 0;
          const pct = b > 0 ? (s / b) * 100 : 0;
          return (
            <div key={c.id} className="bg-white border border-rule p-5 rounded-sm" data-testid={`budget-${c.id}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                <span className="font-serif text-lg flex-1">{c.label}</span>
                <input type="number" placeholder="0" value={b || ""} onChange={e => setBudget(c.id, e.target.value)}
                  className="w-24 bg-transparent border-b border-rule focus:outline-none focus:border-ink py-1 text-right font-serif text-lg"
                  data-testid={`budget-input-${c.id}`} />
              </div>
              {b > 0 ? (
                <>
                  <div className="flex items-baseline justify-between text-sm mb-2">
                    <span className="text-ink font-serif text-xl tabular-nums">{fmt(s, cur)}</span>
                    <span className="text-graphite">of {fmt(b, cur)}</span>
                  </div>
                  <div className="h-1.5 bg-stone2">
                    <div className={`h-1.5 transition-all ${pct > 100 ? "bg-[#9B2C2C]" : pct > 80 ? "bg-[#B57B4B]" : "bg-moss"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-graphite">
                    {pct > 100 ? `${fmt(s - b, cur)} over` : `${fmt(Math.max(0, b - s), cur)} remaining`}
                  </div>
                </>
              ) : (
                <div className="text-xs text-graphite italic">Set a monthly limit to start tracking.</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Calculators ----------
function Calculators({ cur }) {
  return (
    <div className="space-y-10" data-testid="calculators-content">
      <div>
        <h2 className="font-serif text-3xl tracking-tight mb-2">Calculators.</h2>
        <p className="text-graphite">Four common money questions, answered in real time.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <LoanCalc cur={cur} />
        <CompoundCalc cur={cur} />
        <PayoffCalc cur={cur} />
        <GoalCalc cur={cur} />
      </div>
    </div>
  );
}

function CalcShell({ title, subtitle, children, result, testid }) {
  return (
    <div className="bg-white border border-rule p-6 rounded-sm" data-testid={testid}>
      <div className="overline text-moss mb-1">{title}</div>
      <h3 className="font-serif text-2xl tracking-tight mb-4">{subtitle}</h3>
      <div className="space-y-4 mb-6">{children}</div>
      <div className="border-t border-rule pt-4">{result}</div>
    </div>
  );
}

const NumInput = ({ label, value, onChange, suffix, testid }) => (
  <div>
    <label className="overline block mb-1">{label}</label>
    <div className="flex items-center border-b border-rule focus-within:border-ink">
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 bg-transparent focus:outline-none py-2 font-serif text-xl" data-testid={testid} />
      {suffix && <span className="overline text-graphite ml-2">{suffix}</span>}
    </div>
  </div>
);

function LoanCalc({ cur }) {
  const [P, setP] = useState(300000);
  const [rate, setRate] = useState(6.5);
  const [years, setYears] = useState(30);
  const r = (parseFloat(rate) || 0) / 100 / 12;
  const n = (parseFloat(years) || 0) * 12;
  const p = parseFloat(P) || 0;
  const monthly = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = monthly * n;
  const interest = total - p;
  return (
    <CalcShell title="Loan · Mortgage" subtitle="Monthly repayment." testid="calc-loan"
      result={
        <div>
          <div className="overline">Monthly payment</div>
          <div className="font-serif text-4xl tabular-nums text-ink" data-testid="loan-monthly">{isFinite(monthly) ? fmt(Math.round(monthly), cur) : "—"}</div>
          <div className="text-xs text-graphite mt-2">Total paid {fmt(Math.round(total), cur)} · Interest {fmt(Math.round(interest), cur)}</div>
        </div>
      }>
      <NumInput label="Principal" value={P} onChange={setP} suffix={cur} testid="loan-principal" />
      <NumInput label="Annual rate" value={rate} onChange={setRate} suffix="%" testid="loan-rate" />
      <NumInput label="Term" value={years} onChange={setYears} suffix="years" testid="loan-years" />
    </CalcShell>
  );
}

function CompoundCalc({ cur }) {
  const [P, setP] = useState(10000);
  const [pmt, setPmt] = useState(500);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(20);
  const r = (parseFloat(rate) || 0) / 100 / 12;
  const n = (parseFloat(years) || 0) * 12;
  const p = parseFloat(P) || 0;
  const c = parseFloat(pmt) || 0;
  const fv = r === 0 ? p + c * n : p * Math.pow(1 + r, n) + c * ((Math.pow(1 + r, n) - 1) / r);
  const contributions = p + c * n;
  return (
    <CalcShell title="Savings · Compound" subtitle="Future value." testid="calc-compound"
      result={
        <div>
          <div className="overline">Ending balance</div>
          <div className="font-serif text-4xl tabular-nums text-moss" data-testid="compound-fv">{isFinite(fv) ? fmt(Math.round(fv), cur) : "—"}</div>
          <div className="text-xs text-graphite mt-2">Contributions {fmt(Math.round(contributions), cur)} · Gain {fmt(Math.max(0, Math.round(fv - contributions)), cur)}</div>
        </div>
      }>
      <NumInput label="Starting amount" value={P} onChange={setP} suffix={cur} testid="c-start" />
      <NumInput label="Monthly contribution" value={pmt} onChange={setPmt} suffix={cur} testid="c-pmt" />
      <NumInput label="Annual return" value={rate} onChange={setRate} suffix="%" testid="c-rate" />
      <NumInput label="Years" value={years} onChange={setYears} suffix="yrs" testid="c-years" />
    </CalcShell>
  );
}

function PayoffCalc({ cur }) {
  const [balance, setBalance] = useState(15000);
  const [rate, setRate] = useState(19);
  const [pmt, setPmt] = useState(400);
  const r = (parseFloat(rate) || 0) / 100 / 12;
  const b = parseFloat(balance) || 0;
  const p = parseFloat(pmt) || 0;
  let months, interestPaid;
  if (r === 0) { months = p > 0 ? b / p : Infinity; interestPaid = 0; }
  else if (p <= b * r) { months = Infinity; interestPaid = Infinity; }
  else { months = -Math.log(1 - (b * r) / p) / Math.log(1 + r); interestPaid = p * months - b; }
  const years = Math.floor(months / 12);
  const remMonths = Math.round(months - years * 12);
  return (
    <CalcShell title="Debt · Payoff" subtitle="How long until debt-free." testid="calc-payoff"
      result={
        <div>
          <div className="overline">Time to zero</div>
          {isFinite(months) ? (
            <div className="font-serif text-4xl tabular-nums text-ink" data-testid="payoff-months">
              {years}<span className="text-xl">y</span> {remMonths}<span className="text-xl">m</span>
            </div>
          ) : (
            <div className="font-serif text-2xl text-[#9B2C2C]" data-testid="payoff-nope">Payment doesn't cover interest.</div>
          )}
          {isFinite(interestPaid) && <div className="text-xs text-graphite mt-2">Interest paid {fmt(Math.round(interestPaid), cur)}</div>}
        </div>
      }>
      <NumInput label="Balance" value={balance} onChange={setBalance} suffix={cur} testid="p-balance" />
      <NumInput label="APR" value={rate} onChange={setRate} suffix="%" testid="p-rate" />
      <NumInput label="Monthly payment" value={pmt} onChange={setPmt} suffix={cur} testid="p-pmt" />
    </CalcShell>
  );
}

function GoalCalc({ cur }) {
  const [goal, setGoal] = useState(50000);
  const [years, setYears] = useState(5);
  const [rate, setRate] = useState(6);
  const r = (parseFloat(rate) || 0) / 100 / 12;
  const n = (parseFloat(years) || 0) * 12;
  const g = parseFloat(goal) || 0;
  const monthly = r === 0 ? g / n : (g * r) / (Math.pow(1 + r, n) - 1);
  return (
    <CalcShell title="Goal · Save-to" subtitle="Monthly savings required." testid="calc-goal"
      result={
        <div>
          <div className="overline">You need to save</div>
          <div className="font-serif text-4xl tabular-nums text-moss" data-testid="goal-monthly">{isFinite(monthly) ? fmt(Math.round(monthly), cur) : "—"}<span className="text-xl text-graphite ml-1">/ mo</span></div>
          <div className="text-xs text-graphite mt-2">To reach {fmt(g, cur)} in {years} years at {rate}%</div>
        </div>
      }>
      <NumInput label="Target amount" value={goal} onChange={setGoal} suffix={cur} testid="g-target" />
      <NumInput label="Years" value={years} onChange={setYears} suffix="yrs" testid="g-years" />
      <NumInput label="Annual return" value={rate} onChange={setRate} suffix="%" testid="g-rate" />
    </CalcShell>
  );
}

// ---------- Forecast ----------
function Forecast({ store, update }) {
  const cur = store.currency;
  const [monthsAhead, setMonthsAhead] = useState(12);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");

  const addRecurring = (e) => {
    e.preventDefault();
    const a = parseFloat(amount);
    if (!name || !a || a <= 0) return toast.error("Fill both fields.");
    update(s => ({ recurring: [...s.recurring, { id: uid(), name, amount: a, type }] }));
    setName(""); setAmount("");
    toast.success("Recurring added.");
  };

  const removeRecurring = (id) => update(s => ({ recurring: s.recurring.filter(r => r.id !== id) }));

  const netRecurring = store.recurring.reduce((a, r) => a + (r.type === "income" ? r.amount : -r.amount), 0);
  const startBalance = store.settings.startingBalance +
    store.transactions.reduce((a, t) => a + (t.type === "income" ? t.amount : -t.amount), 0);

  const data = useMemo(() => {
    const rows = [];
    for (let i = 0; i <= monthsAhead; i++) {
      const d = new Date(); d.setMonth(d.getMonth() + i);
      rows.push({ month: d.toLocaleString("default", { month: "short", year: "2-digit" }), balance: Math.round(startBalance + netRecurring * i) });
    }
    return rows;
  }, [monthsAhead, startBalance, netRecurring]);

  return (
    <div className="space-y-8" data-testid="forecast-content">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-3xl tracking-tight">Cash forecast.</h2>
          <p className="text-graphite">Recurring items shape your projected balance.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="overline text-graphite">Horizon</span>
          <select value={monthsAhead} onChange={e => setMonthsAhead(parseInt(e.target.value))} className="border border-rule px-3 py-2 text-xs uppercase tracking-widest" data-testid="horizon">
            {[3, 6, 12, 24, 36].map(m => <option key={m} value={m}>{m} months</option>)}
          </select>
        </div>
      </div>

      <div className="bg-ink text-paper p-6 rounded-sm">
        <div className="overline text-paper/70 mb-1">Projected balance</div>
        <div className="flex items-baseline gap-6 flex-wrap">
          <div className="font-serif text-5xl tabular-nums" data-testid="forecast-final">
            {fmt(data[data.length - 1]?.balance ?? 0, cur)}
          </div>
          <div className="text-paper/70 text-sm">in {monthsAhead} months</div>
          <div className={`text-sm ${netRecurring >= 0 ? "text-moss" : "text-[#E88A8A]"}`}>{netRecurring >= 0 ? "+" : ""}{fmt(netRecurring, cur)}/month recurring net</div>
        </div>
      </div>

      <div className="bg-white border border-rule p-6 rounded-sm">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#EAE6DF" vertical={false} />
              <XAxis dataKey="month" stroke="#4A4A4A" fontSize={10} tickLine={false} />
              <YAxis stroke="#4A4A4A" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(v)} />
              <ReTooltip
                contentStyle={{ background: "#1A1A1A", border: "none", borderRadius: 2, color: "#F9F8F6", fontFamily: "Outfit" }}
                formatter={(v) => fmt(v, cur)}
              />
              <Line type="monotone" dataKey="balance" stroke="#2C4033" strokeWidth={2.5} dot={{ fill: "#2C4033", r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={addRecurring} className="bg-white border border-rule p-6 rounded-sm space-y-4">
          <div>
            <div className="overline text-moss mb-1">Add recurring</div>
            <h3 className="font-serif text-2xl tracking-tight">Salary, rent, subscription…</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 border border-rule p-1">
            {["expense", "income"].map(t => (
              <button key={t} type="button" onClick={() => setType(t)} className={`py-2 uppercase tracking-widest text-xs ${type === t ? "bg-ink text-paper" : "text-graphite hover:text-ink"}`}>
                {t === "expense" ? "− Expense" : "+ Income"}
              </button>
            ))}
          </div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Rent, Salary)" className="w-full bg-transparent border-b border-rule focus:outline-none focus:border-ink py-2" data-testid="rec-name" />
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Monthly amount" className="w-full bg-transparent border-b border-rule focus:outline-none focus:border-ink py-2 font-serif text-2xl" data-testid="rec-amount" />
          <button type="submit" className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-5 py-2.5 uppercase tracking-widest text-xs flex items-center gap-2" data-testid="btn-add-recurring">
            <Plus size={12} /> Add
          </button>
        </form>
        <div className="bg-white border border-rule p-6 rounded-sm">
          <div className="overline text-moss mb-3">Recurring items · {store.recurring.length}</div>
          {store.recurring.length === 0 ? (
            <div className="text-graphite italic text-sm py-8 text-center">Nothing added yet. Fill the form to shape the forecast.</div>
          ) : (
            <div className="divide-y divide-rule">
              {store.recurring.map(r => (
                <div key={r.id} className="flex items-center gap-3 py-3" data-testid={`rec-${r.id}`}>
                  <div className={`w-2 h-2 rounded-full ${r.type === "income" ? "bg-moss" : "bg-[#9B2C2C]"}`} />
                  <div className="flex-1 font-serif">{r.name}</div>
                  <div className={`font-serif text-lg tabular-nums ${r.type === "income" ? "text-moss" : "text-[#9B2C2C]"}`}>
                    {r.type === "income" ? "+" : "−"}{fmt(r.amount, cur)}
                  </div>
                  <button onClick={() => removeRecurring(r.id)} className="p-1.5 hover:bg-stone2 text-graphite" data-testid={`del-rec-${r.id}`}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
