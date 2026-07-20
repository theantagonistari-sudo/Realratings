import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Wallet } from "lucide-react";

export default function Finance() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-paper">
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-10 pb-4">
        <Link to="/profile" className="inline-flex items-center gap-2 overline text-graphite hover:text-ink transition-colors mb-6" data-testid="finance-back">
          <ArrowLeft size={12} /> Back to profile
        </Link>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="overline text-moss mb-2 flex items-center gap-2"><Wallet size={12} /> Personal Finance</div>
            <h1 className="font-serif text-4xl md:text-5xl tracking-tighter">Financial Manager.</h1>
            <p className="text-graphite mt-2 max-w-2xl">Track transactions, set budgets, run calculators, forecast cash flow. Everything stays in your browser — nothing is uploaded.</p>
          </div>
          <a href="/finance-app/index.html" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-ink px-4 py-2 uppercase tracking-widest text-xs hover:bg-ink hover:text-paper transition-colors" data-testid="finance-open-new-tab">
            Open in new tab <ExternalLink size={12} />
          </a>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 md:px-12 pb-16">
        <div className="bg-white border border-ink rounded-sm overflow-hidden">
          <iframe
            src="/finance-app/index.html"
            title="Personal finance manager"
            className="w-full block"
            style={{ height: "calc(100vh - 220px)", minHeight: "620px", border: 0 }}
            data-testid="finance-iframe"
          />
        </div>
      </div>
    </div>
  );
}
