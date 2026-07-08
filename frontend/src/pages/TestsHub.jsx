import { Link } from "react-router-dom";
import { Zap, BookOpen, Brain, Activity, Briefcase, Heart, Globe, Film, ArrowRight } from "lucide-react";

const TESTS = [
  { id: "reading-speed", title: "Reading Speed", desc: "Measure your reading rate and comprehension accuracy.", time: "3 min", icon: Zap, category: "Cognitive" },
  { id: "reading-style-2", title: "Reading Style (Passage)", desc: "Choose a passage and discover if you're a visual, analytical, empathetic, or efficiency reader.", time: "5 min", icon: BookOpen, category: "Personality" },
  { id: "personality", title: "Big Five Personality", desc: "The scientifically validated OCEAN model — mapped to a radar chart.", time: "10 min", icon: Brain, category: "Personality" },
  { id: "psychometric", title: "Cognitive Analysis", desc: "Verbal, numerical, logical, and spatial reasoning across 20 items.", time: "15 min", icon: Activity, category: "Cognitive" },
  { id: "career-path", title: "Career Alignment", desc: "Map your interests to 6 professional domains with example roles.", time: "8 min", icon: Briefcase, category: "Career" },
  { id: "relationship", title: "Relationship Style", desc: "Attachment, communication, values, and conflict resolution.", time: "7 min", icon: Heart, category: "Personal" },
  { id: "general-knowledge", title: "General Knowledge", desc: "20 timed questions across 6 categories.", time: "10 min", icon: Globe, category: "Knowledge" },
  { id: "films", title: "Famous Films", desc: "25 questions on iconic cinema — directors, quotes, trivia.", time: "8 min", icon: Film, category: "Knowledge" },
];

export default function TestsHub() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
      <div className="mb-12">
        <div className="overline text-moss mb-3">Assessments</div>
        <h1 className="font-serif text-5xl md:text-6xl tracking-tighter text-ink">Know thyself.</h1>
        <p className="text-graphite text-lg mt-4 max-w-2xl">
          A growing library of cognitive, personality, and knowledge assessments — take any of them anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="tests-grid">
        {TESTS.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.id}
              to={`/tests/${t.id}`}
              className="rr-card-hover group block bg-white border border-rule rounded-sm p-6 h-full hover:border-ink transition-colors"
              data-testid={`test-card-${t.id}`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-stone2 rounded-sm border border-rule">
                  <Icon size={22} className="text-ink" />
                </div>
                <span className="overline text-graphite">{t.category}</span>
              </div>
              <h3 className="font-serif text-2xl tracking-tight text-ink mb-2 group-hover:text-moss transition-colors">{t.title}</h3>
              <p className="text-sm text-graphite mb-6">{t.desc}</p>
              <div className="rr-hairline pt-4 flex items-center justify-between text-xs">
                <span className="overline text-graphite">{t.time}</span>
                <ArrowRight size={14} className="text-ink group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
