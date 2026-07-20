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
const API = process.env.REACT_APP_BACKEND_URL + "/api";

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
  return { currency: "USD", transactions: [], budgets: {}, recurring: [], assets: [], debts: [], settings: { startingBalance: 0 } };
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

// ---------- Client-side classifier ----------
// Turns a freeform line ("Uber 24", "+5200 salary", "Netflix 15.99") into a structured transaction.
const CATEGORY_KEYWORDS = {
  salary: ["salary", "payroll", "wage", "wages", "bonus", "paycheck"],
  freelance: ["freelance", "gig", "contract", "consult", "invoice paid", "commission"],
  investments: ["dividend", "interest received", "stock", "etf", "coin", "crypto", "brokerage", "yield", "portfolio"],
  "other-income": ["refund", "cashback", "reimburs", "gift received", "deposit received", "rebate", "tax return"],
  housing: ["rent", "mortgage", "loan payment", "hoa", "landlord", "lease"],
  food: ["grocer", "restaurant", "cafe", "coffee", "starbucks", "whole foods", "trader joe", "market", "dinner", "lunch", "breakfast", "meal", "pizza", "burger", "chipotle", "mcdonald", "kfc", "doordash", "ubereats", "grubhub"],
  transport: ["uber", "lyft", "taxi", "cab", "gas station", "petrol", "fuel", "train", "bus", "metro", "subway", "parking", "toll", "flight", "airfare", "airline", "car wash"],
  utilities: ["electric", "water bill", "gas bill", "internet", "wifi", "phone bill", "cellular", "utility", "utilities", "comcast", "verizon", "at&t", "t-mobile"],
  health: ["doctor", "pharmacy", "gym", "clinic", "hospital", "dental", "dentist", "medic", "cvs", "walgreens", "therapist"],
  entertainment: ["netflix", "spotify", "hulu", "disney+", "hbo", "movie", "cinema", "concert", "game", "bar", "pub", "club", "steam", "playstation", "xbox"],
  shopping: ["amazon", "apparel", "clothes", "clothing", "shoes", "shopping", "target", "walmart", "costco", "ikea", "zara", "h&m", "nike", "adidas"],
  education: ["course", "book", "tuition", "school", "coursera", "udemy", "kindle", "audible", "class"],
  other: [],
};
const INCOME_KEYWORDS = new Set([
  ...CATEGORY_KEYWORDS.salary, ...CATEGORY_KEYWORDS.freelance,
  ...CATEGORY_KEYWORDS["other-income"], "income", "received", "earned", "credited", "credit",
]);
const CATEGORY_TO_TYPE = Object.fromEntries(CATEGORIES.map(c => [c.id, c.type]));

function classifyLine(raw) {
  const line = (raw || "").trim();
  if (!line) return null;

  // Amount: prefer the last number in the line (most transaction formats: "note ... amount")
  const numRe = /-?\+?\$?[\d]+(?:[,]\d{3})*(?:\.\d+)?/g;
  const nums = line.match(numRe);
  if (!nums || nums.length === 0) return null;
  const rawAmount = nums[nums.length - 1];
  const explicitPositive = rawAmount.startsWith("+");
  const explicitNegative = rawAmount.startsWith("-");
  const amount = Math.abs(parseFloat(rawAmount.replace(/[,+$]/g, "")));
  if (!amount || Number.isNaN(amount)) return null;

  // Strip the amount from the note
  const note = line.replace(rawAmount, "").replace(/\s+/g, " ").trim() || "Transaction";
  const lower = line.toLowerCase();

  // Keyword-based category detection (longest match wins)
  let matched = null;
  let matchedLen = 0;
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of kws) {
      if (lower.includes(kw) && kw.length > matchedLen) { matched = cat; matchedLen = kw.length; }
    }
  }
  let category = matched || "other";

  // Type: explicit sign wins, then category default, then keyword sweep, else expense
  let type;
  if (explicitPositive) type = "income";
  else if (explicitNegative) type = "expense";
  else if (matched) type = CATEGORY_TO_TYPE[matched];
  else if ([...INCOME_KEYWORDS].some(k => lower.includes(k))) type = "income";
  else type = "expense";

  // If type income and category still "other", nudge to "other-income"
  if (type === "income" && category === "other") category = "other-income";

  return {
    type,
    category,
    amount: Math.round(amount * 100) / 100,
    note: note.length > 40 ? note.slice(0, 40) : note,
    date: new Date().toISOString().slice(0, 10),
    confidence: matched ? "high" : "medium",
  };
}

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
        {tab === "import" && <ImportPanel store={store} update={update} />}
        {tab === "budgets" && <Budgets store={store} update={update} />}
        {tab === "networth" && <NetWorth store={store} update={update} />}
        {tab === "balancesheet" && <BalanceSheet store={store} />}
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
    { id: "import",       label: "Import",       icon: Plus },
    { id: "budgets",      label: "Budgets",      icon: Target },
    { id: "networth",     label: "Net Worth",    icon: Landmark },
    { id: "balancesheet", label: "Balance Sheet",icon: Receipt },
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
    const monthTxns = store.transactions.filter(t => monthKey(t.date) === mk && t.type === "expense");
    const totals = {};
    monthTxns.forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
    return Object.entries(totals)
      .map(([id, value]) => ({ name: (CAT_MAP[id] || { label: id }).label, value: Math.round(value), color: (CAT_MAP[id] || { color: "#A8A29E" }).color }))
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

  const health = useMemo(() => {
    const totalAssets = (store.assets || []).reduce((a, x) => a + (x.value || 0), 0);
    const totalDebts = (store.debts || []).reduce((a, x) => a + (x.value || 0), 0);
    const netWorth = stats.balance + totalAssets - totalDebts;
    const debtRatio = totalAssets > 0 ? totalDebts / totalAssets : (totalDebts > 0 ? Infinity : 0);
    const overspending = stats.expense > stats.income && stats.income > 0;

    let verdict = "green", label = "In the Green", reason = "Income covers expenses and debts are well contained.";
    if (netWorth < 0 || debtRatio > 0.6 || overspending) {
      verdict = "red";
      label = "In the Red";
      reason = netWorth < 0
        ? "Debts exceed cash and assets. Prioritise paying down high-interest lines."
        : overspending
        ? "You spent more than you earned this month. Trim discretionary categories."
        : "Debt load is heavy versus what you own. Focus on reducing liabilities.";
    } else if (debtRatio > 0.35 || stats.savingsRate < 10) {
      verdict = "amber";
      label = "Holding steady";
      reason = "Positive net worth, but the savings rate or debt ratio needs attention.";
    }
    return { verdict, label, reason, netWorth, totalAssets, totalDebts };
  }, [store, stats]);

  if (store.transactions.length === 0) {
    return <EmptyDashboard store={store} update={update} />;
  }

  return (
    <div className="space-y-10" data-testid="dashboard-content">
      <QuickAdd store={store} update={update} />

      {/* Financial Health verdict */}
      <div className={`p-6 md:p-8 rounded-sm text-paper flex items-center gap-6 flex-wrap ${health.verdict === "green" ? "bg-moss" : health.verdict === "amber" ? "bg-[#B57B4B]" : "bg-[#9B2C2C]"}`} data-testid="health-card">
        <div className={`w-14 h-14 rounded-full border-2 border-paper/40 flex items-center justify-center shrink-0`}>
          {health.verdict === "green" ? <TrendingUp size={24} /> : health.verdict === "amber" ? <Target size={24} /> : <TrendingDown size={24} />}
        </div>
        <div className="flex-1 min-w-[220px]">
          <div className="overline text-paper/70 mb-1">Financial health</div>
          <div className="font-serif text-3xl md:text-4xl tracking-tighter leading-none" data-testid="health-label">{health.label}</div>
          <div className="text-paper/80 text-sm mt-2">{health.reason}</div>
        </div>
        <div className="text-right">
          <div className="overline text-paper/70">Net worth</div>
          <div className="font-serif text-3xl md:text-4xl tabular-nums leading-none" data-testid="health-networth">{fmt(health.netWorth, cur)}</div>
          <div className="text-xs text-paper/70 mt-2">Assets {fmt(health.totalAssets, cur)} · Debts −{fmt(health.totalDebts, cur)}</div>
        </div>
      </div>

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
    <div className="space-y-8" data-testid="dashboard-empty">
      <QuickAdd store={store} update={update} />
      <div className="text-center py-14 border border-dashed border-rule bg-white">
        <Wallet size={48} className="text-graphite/40 mb-6 mx-auto" />
        <h2 className="font-serif text-4xl tracking-tighter text-ink mb-3">Or start the ledger the classic way.</h2>
        <p className="text-graphite max-w-md mx-auto mb-8">Prefer forms? Add your first transaction manually, or set an opening balance so the dashboard reads real numbers immediately.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => setStarterOpen(true)} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs" data-testid="btn-start-ledger">
            + Add first transaction
          </button>
          <StartingBalance store={store} update={update} />
        </div>
        {starterOpen && <TxnDialog onClose={() => setStarterOpen(false)} onSave={(t) => { update(s => ({ transactions: [{ ...t, id: uid() }, ...s.transactions] })); setStarterOpen(false); toast.success("Added."); }} cur={store.currency} />}
      </div>
    </div>
  );
}

// ---------- Quick Add (freeform classifier) ----------
function QuickAdd({ store, update }) {
  const [text, setText] = useState("");
  const [last, setLast] = useState(null); // { txn, id } for undo

  const submit = (e) => {
    e && e.preventDefault();
    const t = classifyLine(text);
    if (!t) { toast.error("Type something like 'Uber 24' or '+5200 salary'."); return; }
    const id = uid();
    const txn = { ...t, id };
    update(s => ({ transactions: [txn, ...s.transactions] }));
    setLast({ txn, id });
    setText("");
    const catLabel = (CAT_MAP[txn.category] || { label: txn.category }).label;
    const prefix = txn.type === "income" ? "+" : "−";
    toast.success(`${prefix}${fmtDec(txn.amount, store.currency)} · ${catLabel}`, {
      description: t.confidence === "medium" ? "Categorised as best-guess. Edit if needed." : txn.note,
      action: { label: "Undo", onClick: () => {
        update(s => ({ transactions: s.transactions.filter(x => x.id !== id) }));
        setLast(null);
      }},
    });
  };

  const editLast = (patch) => {
    if (!last) return;
    update(s => ({ transactions: s.transactions.map(x => x.id === last.id ? { ...x, ...patch } : x) }));
    setLast(l => l ? { ...l, txn: { ...l.txn, ...patch } } : l);
  };

  const preview = classifyLine(text);
  const catLabel = preview ? (CAT_MAP[preview.category] || { label: preview.category }).label : null;

  return (
    <div className="bg-white border border-ink rounded-sm p-5 md:p-6" data-testid="quick-add">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={12} className="text-moss" />
        <span className="overline text-moss">Quick add · type & press enter</span>
      </div>
      <form onSubmit={submit} className="flex gap-2 flex-wrap md:flex-nowrap items-center">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder='e.g. "Uber 24"   ·   "+5200 salary"   ·   "Netflix 15.99"'
          className="flex-1 min-w-0 bg-transparent border-b border-rule focus:outline-none focus:border-ink py-3 font-serif text-xl md:text-2xl tracking-tight placeholder:text-graphite/50 placeholder:font-sans placeholder:text-base"
          data-testid="quick-add-input"
          autoComplete="off"
        />
        <button type="submit" disabled={!text.trim()} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs disabled:opacity-40" data-testid="quick-add-submit">
          Add
        </button>
      </form>
      {preview && (
        <div className="mt-3 flex items-center gap-2 text-xs text-graphite flex-wrap" data-testid="quick-add-preview">
          <span className="overline">Will save as</span>
          <span className={`px-2 py-0.5 rounded-sm ${preview.type === "income" ? "bg-moss/10 text-moss" : "bg-[#9B2C2C]/10 text-[#9B2C2C]"}`}>
            {preview.type === "income" ? "Income" : "Expense"}
          </span>
          <span className="text-ink">{catLabel}</span>
          <span className="text-graphite">·</span>
          <span className="font-serif text-ink text-base tabular-nums">{fmtDec(preview.amount, store.currency)}</span>
          {preview.confidence === "medium" && <span className="text-graphite italic">· best-guess category, edit after adding</span>}
        </div>
      )}
      {last && (
        <div className="mt-4 flex items-center gap-3 text-xs flex-wrap" data-testid="quick-add-last">
          <span className="overline text-graphite">Last added — reclassify:</span>
          <select
            value={last.txn.category}
            onChange={e => editLast({ category: e.target.value, type: CATEGORY_TO_TYPE[e.target.value] })}
            className="border border-rule bg-white px-2 py-1 text-xs"
            data-testid="quick-add-reclassify"
          >
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label} ({c.type})</option>)}
          </select>
        </div>
      )}
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

// ---------- Import (paste text or upload screenshot) ----------
function ImportPanel({ store, update }) {
  const cur = store.currency;
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [selected, setSelected] = useState({});

  const runText = async () => {
    if (!text.trim()) return toast.error("Paste some text first.");
    setLoading(true); setPreview([]);
    try {
      const res = await fetch(`${API}/finance/parse-text`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPreview(data.transactions || []);
      const sel = {}; (data.transactions || []).forEach((_, i) => { sel[i] = true; });
      setSelected(sel);
      toast.success(`Found ${data.count} transaction${data.count === 1 ? "" : "s"}.`);
    } catch (e) {
      toast.error("Parse failed. Try again or paste less text.");
    } finally { setLoading(false); }
  };

  const runImage = async (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setLoading(true); setPreview([]);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(`${API}/finance/parse-image`, { method: "POST", credentials: "include", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPreview(data.transactions || []);
      const sel = {}; (data.transactions || []).forEach((_, i) => { sel[i] = true; });
      setSelected(sel);
      toast.success(`Found ${data.count} transaction${data.count === 1 ? "" : "s"}.`);
    } catch (err) {
      toast.error("Couldn't read the image. Try a clearer photo.");
    } finally { setLoading(false); }
  };

  const commit = () => {
    const chosen = preview.filter((_, i) => selected[i]).map(t => ({ ...t, id: uid() }));
    if (chosen.length === 0) return toast.error("Select at least one row.");
    update(s => ({ transactions: [...chosen, ...s.transactions] }));
    setPreview([]); setText(""); setSelected({});
    toast.success(`Added ${chosen.length} transaction${chosen.length === 1 ? "" : "s"}.`);
  };

  return (
    <div className="space-y-8" data-testid="import-content">
      <div>
        <div className="overline text-moss mb-2 flex items-center gap-2"><Sparkles size={12} /> AI-assisted</div>
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight">Import a batch.</h2>
        <p className="text-graphite mt-2 max-w-2xl">Paste any statement, receipt, or list — or drop in a photo of one. Our reader turns it into clean, categorised transactions you can review before adding.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-rule p-6 rounded-sm">
          <div className="overline text-moss mb-2">Method 1</div>
          <h3 className="font-serif text-2xl tracking-tight mb-4">Paste text</h3>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={9}
            placeholder="e.g.\nRent  1,400  02 Jan\nWhole Foods  84.20  03 Jan\nSalary 5,200  05 Jan  (payroll)"
            className="w-full bg-transparent border border-rule focus:outline-none focus:border-ink p-3 resize-none text-sm font-mono"
            data-testid="import-text" />
          <button onClick={runText} disabled={loading} className="mt-4 bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs disabled:opacity-50" data-testid="btn-parse-text">
            {loading ? "Reading…" : "Extract transactions"}
          </button>
        </div>

        <div className="bg-ink text-paper p-6 rounded-sm">
          <div className="overline text-paper/70 mb-2">Method 2</div>
          <h3 className="font-serif text-2xl tracking-tight mb-4">Upload a screenshot</h3>
          <p className="text-paper/70 text-sm mb-5">Bank statement PDF-screenshot, receipt photo, expense app export — anything readable.</p>
          <label className="cursor-pointer inline-flex items-center gap-2 bg-paper text-ink hover:bg-stone2 transition-colors rounded-sm px-6 py-3 uppercase tracking-widest text-xs" data-testid="btn-parse-image">
            {loading ? "Reading…" : "Choose file"}
            <input type="file" accept="image/*" hidden onChange={runImage} disabled={loading} />
          </label>
          <p className="text-xs text-paper/50 mt-4">Image is processed and discarded — never stored on Real Ratings' servers.</p>
        </div>
      </div>

      {preview.length > 0 && (
        <div className="bg-white border border-ink rounded-sm" data-testid="import-preview">
          <div className="flex items-center justify-between p-4 border-b border-rule">
            <div>
              <div className="overline text-moss">Preview · {preview.length} extracted</div>
              <div className="font-serif text-xl">Review before adding.</div>
            </div>
            <button onClick={commit} className="bg-ink text-paper hover:bg-moss transition-colors rounded-sm px-6 py-2.5 uppercase tracking-widest text-xs" data-testid="btn-commit-import">
              Add selected
            </button>
          </div>
          <div>
            {preview.map((t, i) => (
              <label key={i} className={`flex items-center gap-4 border-b border-rule last:border-b-0 p-4 cursor-pointer ${selected[i] ? "" : "opacity-40"}`}>
                <input type="checkbox" checked={!!selected[i]} onChange={e => setSelected(s => ({ ...s, [i]: e.target.checked }))} />
                <div className={`w-2 h-2 rounded-full ${t.type === "income" ? "bg-moss" : "bg-[#9B2C2C]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex gap-3 items-center">
                    <span className="font-serif text-lg">{(CAT_MAP[t.category] || {}).label || t.category}</span>
                    <span className="text-xs text-graphite">{t.date}</span>
                  </div>
                  {t.note && <div className="text-sm text-graphite truncate">{t.note}</div>}
                </div>
                <div className={`font-serif text-xl tabular-nums ${t.type === "income" ? "text-moss" : "text-[#9B2C2C]"}`}>
                  {t.type === "income" ? "+" : "−"}{fmtDec(t.amount, cur)}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Net Worth (assets & debts) ----------
function NetWorth({ store, update }) {
  const cur = store.currency;
  const [aName, setAName] = useState(""); const [aVal, setAVal] = useState("");
  const [dName, setDName] = useState(""); const [dVal, setDVal] = useState(""); const [dRate, setDRate] = useState("");

  const totalAssets = (store.assets || []).reduce((a, x) => a + (x.value || 0), 0);
  const totalDebts  = (store.debts  || []).reduce((a, x) => a + (x.value || 0), 0);
  const txnBalance  = store.settings.startingBalance +
    store.transactions.reduce((a, t) => a + (t.type === "income" ? t.amount : -t.amount), 0);
  const netWorth    = txnBalance + totalAssets - totalDebts;
  const isGreen     = netWorth >= 0 && totalDebts <= totalAssets * 0.4;

  const addAsset = (e) => {
    e.preventDefault();
    const v = parseFloat(aVal);
    if (!aName || !v || v <= 0) return toast.error("Fill both fields.");
    update(s => ({ assets: [...(s.assets || []), { id: uid(), name: aName, value: v }] }));
    setAName(""); setAVal(""); toast.success("Asset added.");
  };
  const addDebt = (e) => {
    e.preventDefault();
    const v = parseFloat(dVal);
    if (!dName || !v || v <= 0) return toast.error("Fill both fields.");
    update(s => ({ debts: [...(s.debts || []), { id: uid(), name: dName, value: v, rate: parseFloat(dRate) || 0 }] }));
    setDName(""); setDVal(""); setDRate(""); toast.success("Debt added.");
  };
  const rmAsset = (id) => update(s => ({ assets: (s.assets || []).filter(x => x.id !== id) }));
  const rmDebt = (id) => update(s => ({ debts: (s.debts || []).filter(x => x.id !== id) }));

  return (
    <div className="space-y-10" data-testid="networth-content">
      <div>
        <h2 className="font-serif text-3xl tracking-tight">Net worth.</h2>
        <p className="text-graphite mt-2">Assets (investments, savings, property) minus liabilities (loans, cards).</p>
      </div>

      <div className={`p-8 rounded-sm ${isGreen ? "bg-moss text-paper" : "bg-[#9B2C2C] text-paper"}`} data-testid="networth-hero">
        <div className="overline text-paper/70 mb-2">Estimated net worth · {isGreen ? "In the Green" : "In the Red"}</div>
        <div className="font-serif text-6xl md:text-7xl tracking-tighter leading-none tabular-nums">{fmt(netWorth, cur)}</div>
        <div className="mt-4 flex gap-8 text-sm text-paper/80 flex-wrap">
          <span>Cash on hand: {fmt(txnBalance, cur)}</span>
          <span>Assets: {fmt(totalAssets, cur)}</span>
          <span>Debts: −{fmt(totalDebts, cur)}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-rule p-6 rounded-sm">
          <div className="overline text-moss mb-2 flex items-center gap-2"><PiggyBank size={12} /> Assets</div>
          <div className="font-serif text-3xl tabular-nums mb-4">{fmt(totalAssets, cur)}</div>
          <form onSubmit={addAsset} className="space-y-2 mb-4">
            <input value={aName} onChange={e => setAName(e.target.value)} placeholder="Name (e.g. ETF portfolio)" className="w-full bg-transparent border-b border-rule focus:outline-none focus:border-ink py-2 text-sm" data-testid="asset-name" />
            <div className="flex gap-2">
              <input type="number" step="0.01" value={aVal} onChange={e => setAVal(e.target.value)} placeholder="Value" className="flex-1 bg-transparent border-b border-rule focus:outline-none focus:border-ink py-2 font-serif text-lg" data-testid="asset-value" />
              <button type="submit" className="bg-ink text-paper px-4 py-2 uppercase tracking-widest text-xs" data-testid="btn-add-asset">Add</button>
            </div>
          </form>
          <div className="divide-y divide-rule">
            {(store.assets || []).map(a => (
              <div key={a.id} className="flex items-center gap-2 py-2" data-testid={`asset-${a.id}`}>
                <div className="flex-1 truncate">{a.name}</div>
                <div className="font-serif text-lg tabular-nums text-moss">{fmt(a.value, cur)}</div>
                <button onClick={() => rmAsset(a.id)} className="p-1 hover:bg-stone2"><Trash2 size={12} className="text-graphite" /></button>
              </div>
            ))}
            {(store.assets || []).length === 0 && <div className="text-graphite italic text-sm py-4 text-center">Nothing yet.</div>}
          </div>
        </div>

        <div className="bg-white border border-rule p-6 rounded-sm">
          <div className="overline text-[#9B2C2C] mb-2 flex items-center gap-2"><TrendingDown size={12} /> Debts</div>
          <div className="font-serif text-3xl tabular-nums mb-4">−{fmt(totalDebts, cur)}</div>
          <form onSubmit={addDebt} className="space-y-2 mb-4">
            <input value={dName} onChange={e => setDName(e.target.value)} placeholder="Name (e.g. Mortgage)" className="w-full bg-transparent border-b border-rule focus:outline-none focus:border-ink py-2 text-sm" data-testid="debt-name" />
            <div className="flex gap-2">
              <input type="number" step="0.01" value={dVal} onChange={e => setDVal(e.target.value)} placeholder="Balance" className="flex-1 bg-transparent border-b border-rule focus:outline-none focus:border-ink py-2 font-serif text-lg" data-testid="debt-value" />
              <input type="number" step="0.01" value={dRate} onChange={e => setDRate(e.target.value)} placeholder="APR %" className="w-20 bg-transparent border-b border-rule focus:outline-none focus:border-ink py-2 font-serif text-lg" data-testid="debt-rate" />
              <button type="submit" className="bg-ink text-paper px-4 py-2 uppercase tracking-widest text-xs" data-testid="btn-add-debt">Add</button>
            </div>
          </form>
          <div className="divide-y divide-rule">
            {(store.debts || []).map(d => (
              <div key={d.id} className="flex items-center gap-2 py-2" data-testid={`debt-${d.id}`}>
                <div className="flex-1 truncate">{d.name} {d.rate ? <span className="text-xs text-graphite">· {d.rate}% APR</span> : null}</div>
                <div className="font-serif text-lg tabular-nums text-[#9B2C2C]">−{fmt(d.value, cur)}</div>
                <button onClick={() => rmDebt(d.id)} className="p-1 hover:bg-stone2"><Trash2 size={12} className="text-graphite" /></button>
              </div>
            ))}
            {(store.debts || []).length === 0 && <div className="text-graphite italic text-sm py-4 text-center">Nothing yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}


// ---------- Balance Sheet (monthly snapshot) ----------
function BalanceSheet({ store }) {
  const cur = store.currency;

  // Build the list of months available: from earliest txn to current, plus "as of today"
  const months = useMemo(() => {
    const set = new Set([thisMonth()]);
    store.transactions.forEach(t => { if (t.date) set.add(monthKey(t.date)); });
    const arr = Array.from(set).filter(Boolean).sort();
    return arr;
  }, [store.transactions]);

  const [asOf, setAsOf] = useState(thisMonth());
  const endOfMonth = useMemo(() => {
    const [y, m] = asOf.split("-").map(Number);
    return new Date(y, m, 0).toISOString().slice(0, 10);
  }, [asOf]);

  const report = useMemo(() => {
    const upTo = (store.transactions || []).filter(t => t.date && t.date <= endOfMonth);
    const monthTxns = upTo.filter(t => monthKey(t.date) === asOf);

    // Income statement (period = selected month)
    const incomeByCat = {}, expenseByCat = {};
    monthTxns.forEach(t => {
      const bucket = t.type === "income" ? incomeByCat : expenseByCat;
      bucket[t.category] = (bucket[t.category] || 0) + (t.amount || 0);
    });
    const totalIncome = Object.values(incomeByCat).reduce((a, b) => a + b, 0);
    const totalExpense = Object.values(expenseByCat).reduce((a, b) => a + b, 0);
    const netIncome = totalIncome - totalExpense;

    // Balance sheet as of endOfMonth
    // Cash = starting balance + all txns up to endOfMonth
    const cash = (store.settings?.startingBalance || 0) +
      upTo.reduce((a, t) => a + (t.type === "income" ? t.amount : -t.amount), 0);

    // Assets/debts snapshots come from store (not time-indexed) — treat as current standing
    const otherAssets = (store.assets || []).map(a => ({ name: a.name, value: a.value || 0 }));
    const totalOtherAssets = otherAssets.reduce((a, x) => a + x.value, 0);
    const totalAssets = Math.max(0, cash) + totalOtherAssets;
    const overdraft = Math.min(0, cash); // negative cash treated as liability

    const debts = (store.debts || []).map(d => ({ name: d.name, value: d.value || 0, rate: d.rate || 0 }));
    const totalDebts = debts.reduce((a, x) => a + x.value, 0) + Math.abs(overdraft);
    const equity = totalAssets - totalDebts;

    return {
      incomeByCat, expenseByCat, totalIncome, totalExpense, netIncome,
      cash, otherAssets, totalOtherAssets, totalAssets, debts, totalDebts, equity, overdraft,
    };
  }, [store, asOf, endOfMonth]);

  const monthLabel = useMemo(() => {
    const [y, m] = asOf.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
  }, [asOf]);

  const exportCsv = () => {
    const rows = [
      ["Section", "Item", "Amount"],
      ["Balance Sheet — as of", endOfMonth, ""],
      ["Assets", "Cash on hand", Math.max(0, report.cash).toFixed(2)],
      ...report.otherAssets.map(a => ["Assets", a.name, a.value.toFixed(2)]),
      ["", "Total Assets", report.totalAssets.toFixed(2)],
      ["", "", ""],
      ...(report.overdraft < 0 ? [["Liabilities", "Cash overdraft", Math.abs(report.overdraft).toFixed(2)]] : []),
      ...report.debts.map(d => ["Liabilities", `${d.name}${d.rate ? ` (${d.rate}% APR)` : ""}`, d.value.toFixed(2)]),
      ["", "Total Liabilities", report.totalDebts.toFixed(2)],
      ["", "", ""],
      ["", "Owner's Equity", report.equity.toFixed(2)],
      ["", "", ""],
      [`Income Statement — ${monthLabel}`, "", ""],
      ...Object.entries(report.incomeByCat).map(([k, v]) => ["Income", (CAT_MAP[k] || { label: k }).label, v.toFixed(2)]),
      ["", "Total Income", report.totalIncome.toFixed(2)],
      ...Object.entries(report.expenseByCat).map(([k, v]) => ["Expenses", (CAT_MAP[k] || { label: k }).label, v.toFixed(2)]),
      ["", "Total Expenses", report.totalExpense.toFixed(2)],
      ["", "Net Income", report.netIncome.toFixed(2)],
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `balance-sheet-${asOf}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8" data-testid="balancesheet-content">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="overline text-moss mb-2 flex items-center gap-2"><Landmark size={12} /> Financial statement</div>
          <h2 className="font-serif text-3xl md:text-4xl tracking-tight">Balance sheet.</h2>
          <p className="text-graphite mt-2 max-w-2xl">A month-end snapshot of what you own, what you owe, and the equity in between — plus the income statement for the period.</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <label className="inline-flex items-center gap-2 border border-ink rounded-sm px-3 py-2">
            <CalIcon size={12} className="text-graphite" />
            <span className="overline">As of</span>
            <select value={asOf} onChange={e => setAsOf(e.target.value)} className="bg-transparent focus:outline-none font-serif text-base" data-testid="bs-month">
              {months.map(m => {
                const [y, mm] = m.split("-").map(Number);
                const lbl = new Date(y, mm - 1, 1).toLocaleString("default", { month: "short", year: "numeric" });
                return <option key={m} value={m}>{lbl}</option>;
              })}
            </select>
          </label>
          <button onClick={exportCsv} className="inline-flex items-center gap-2 border border-ink px-4 py-2 text-xs uppercase tracking-widest hover:bg-ink hover:text-paper transition-colors rounded-sm" data-testid="bs-export">
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Statement paper */}
      <div className="bg-white border border-ink rounded-sm p-6 md:p-10">
        <div className="text-center mb-8 pb-6 border-b border-rule">
          <div className="overline text-graphite mb-2">Real Ratings Personal Finance</div>
          <div className="font-serif text-3xl md:text-4xl tracking-tighter">Balance Sheet</div>
          <div className="text-graphite mt-1 text-sm">As of {new Date(endOfMonth).toLocaleDateString("default", { year: "numeric", month: "long", day: "numeric" })}</div>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Assets */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-ink">
              <div className="overline text-ink">Assets</div>
              <div className="overline text-graphite">{cur}</div>
            </div>
            <StatementRow label="Cash on hand" value={Math.max(0, report.cash)} cur={cur} testid="bs-cash" />
            {report.otherAssets.length > 0 && (
              <div className="mt-4">
                <div className="overline text-graphite mb-2">Other assets</div>
                {report.otherAssets.map((a, i) => <StatementRow key={i} label={a.name} value={a.value} cur={cur} indent />)}
              </div>
            )}
            {report.otherAssets.length === 0 && (
              <p className="text-graphite italic text-sm mt-4">Add investments & property in Net Worth to see them here.</p>
            )}
            <StatementRow label="Total Assets" value={report.totalAssets} cur={cur} total testid="bs-total-assets" />
          </div>

          {/* Liabilities & Equity */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-ink">
              <div className="overline text-ink">Liabilities</div>
              <div className="overline text-graphite">{cur}</div>
            </div>
            {report.overdraft < 0 && (
              <StatementRow label="Cash overdraft" value={Math.abs(report.overdraft)} cur={cur} negative />
            )}
            {report.debts.map((d, i) => (
              <StatementRow key={i} label={`${d.name}${d.rate ? ` · ${d.rate}% APR` : ""}`} value={d.value} cur={cur} indent negative />
            ))}
            {report.debts.length === 0 && report.overdraft >= 0 && (
              <p className="text-graphite italic text-sm">No liabilities recorded. Debt-free is a beautiful thing.</p>
            )}
            <StatementRow label="Total Liabilities" value={report.totalDebts} cur={cur} total negative testid="bs-total-liab" />

            <div className="mt-8 pt-4 border-t border-ink">
              <div className="overline text-ink mb-4">Owner's Equity</div>
              <div className={`p-4 rounded-sm ${report.equity >= 0 ? "bg-moss text-paper" : "bg-[#9B2C2C] text-paper"}`} data-testid="bs-equity">
                <div className="overline text-paper/70">Net worth</div>
                <div className="font-serif text-4xl md:text-5xl tabular-nums tracking-tighter leading-none">{fmt(report.equity, cur)}</div>
                <div className="text-paper/70 text-xs mt-2">{report.equity >= 0 ? "Assets exceed liabilities." : "Liabilities exceed assets — focus on reducing debt."}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Accounting identity */}
        <div className="mt-10 pt-6 border-t border-rule flex items-center justify-center gap-3 text-xs text-graphite flex-wrap">
          <span className="font-serif text-base text-ink">{fmt(report.totalAssets, cur)}</span>
          <span>Assets</span>
          <span>=</span>
          <span className="font-serif text-base text-ink">{fmt(report.totalDebts, cur)}</span>
          <span>Liabilities</span>
          <span>+</span>
          <span className="font-serif text-base text-ink">{fmt(report.equity, cur)}</span>
          <span>Equity</span>
        </div>
      </div>

      {/* Income Statement */}
      <div className="bg-white border border-ink rounded-sm p-6 md:p-10" data-testid="bs-income-statement">
        <div className="text-center mb-8 pb-6 border-b border-rule">
          <div className="overline text-graphite mb-2">For the period</div>
          <div className="font-serif text-3xl md:text-4xl tracking-tighter">Income Statement</div>
          <div className="text-graphite mt-1 text-sm">{monthLabel}</div>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-ink">
              <div className="overline text-moss">Income</div>
              <div className="overline text-graphite">{cur}</div>
            </div>
            {Object.entries(report.incomeByCat).length === 0 && <p className="text-graphite italic text-sm">No income this month.</p>}
            {Object.entries(report.incomeByCat).map(([k, v]) => (
              <StatementRow key={k} label={(CAT_MAP[k] || { label: k }).label} value={v} cur={cur} indent />
            ))}
            <StatementRow label="Total Income" value={report.totalIncome} cur={cur} total testid="bs-total-income" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-ink">
              <div className="overline text-[#9B2C2C]">Expenses</div>
              <div className="overline text-graphite">{cur}</div>
            </div>
            {Object.entries(report.expenseByCat).length === 0 && <p className="text-graphite italic text-sm">No expenses this month.</p>}
            {Object.entries(report.expenseByCat).map(([k, v]) => (
              <StatementRow key={k} label={(CAT_MAP[k] || { label: k }).label} value={v} cur={cur} indent negative />
            ))}
            <StatementRow label="Total Expenses" value={report.totalExpense} cur={cur} total negative testid="bs-total-expense" />
          </div>
        </div>

        <div className={`mt-10 p-6 rounded-sm text-paper ${report.netIncome >= 0 ? "bg-moss" : "bg-[#9B2C2C]"}`} data-testid="bs-net-income">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="overline text-paper/70">Net income for {monthLabel}</div>
              <div className="font-serif text-4xl md:text-5xl tabular-nums tracking-tighter leading-none mt-1">
                {report.netIncome >= 0 ? "" : "−"}{fmt(Math.abs(report.netIncome), cur)}
              </div>
            </div>
            <div className="text-paper/80 text-sm max-w-xs">
              {report.netIncome >= 0
                ? "You saved money this month. Consider moving the surplus into investments."
                : "You spent more than you earned. Revisit budgets in the Budgets tab."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatementRow({ label, value, cur, indent, negative, total, testid }) {
  return (
    <div className={`flex items-baseline justify-between py-2 ${total ? "mt-4 pt-3 border-t-2 border-ink" : "border-b border-rule"} ${indent ? "pl-4" : ""}`} data-testid={testid}>
      <span className={`${total ? "overline text-ink" : "text-sm text-graphite"}`}>{label}</span>
      <span className={`font-serif tabular-nums ${total ? "text-2xl" : "text-base"} ${negative ? "text-[#9B2C2C]" : total ? "text-ink" : "text-ink"}`}>
        {negative && value > 0 ? "−" : ""}{fmt(value, cur)}
      </span>
    </div>
  );
}
