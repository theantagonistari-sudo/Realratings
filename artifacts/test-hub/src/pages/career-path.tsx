import { useState } from 'react';
import { TestWrapper } from '@/components/layout/TestWrapper';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Briefcase, Paintbrush, Monitor, HeartPulse, GraduationCap, Wrench } from 'lucide-react';

const CLUSTERS = {
  Creative: {
    icon: Paintbrush,
    title: "Creative Arts",
    jobs: [
      { t: "Art Director", d: "Leading visual style and imagery for magazines, packaging, and productions." },
      { t: "UX/UI Designer", d: "Designing digital interfaces focusing on user experience and aesthetics." },
      { t: "Copywriter", d: "Writing compelling text for advertising, marketing, and brand narratives." },
      { t: "Audio Producer", d: "Recording, mixing, and editing sound for media." },
      { t: "Animator", d: "Creating multiple images that give an illusion of movement." }
    ],
    strengths: "Imagination, visual thinking, unconventional problem-solving.",
    profile: "You thrive in environments where you can express ideas visually, verbally, or conceptually. You likely find strict routines stifling and prefer project-based work with tangible, original outputs."
  },
  Tech: {
    icon: Monitor,
    title: "Technology & Science",
    jobs: [
      { t: "Data Scientist", d: "Analyzing complex datasets to inform business decisions." },
      { t: "Software Engineer", d: "Designing and building applications and systems." },
      { t: "Research Scientist", d: "Planning and conducting experiments to expand scientific knowledge." },
      { t: "Machine Learning Engineer", d: "Building AI systems that learn from data." },
      { t: "Systems Architect", d: "Designing complex IT networks and infrastructure." }
    ],
    strengths: "Analytical thinking, pattern recognition, logical deduction.",
    profile: "You are driven by curiosity and logic. You enjoy diving deep into complex systems, finding objective truths, and building scalable solutions. You value data over intuition."
  },
  Business: {
    icon: Briefcase,
    title: "Business & Leadership",
    jobs: [
      { t: "Product Manager", d: "Guiding the strategy, development, and launch of a product." },
      { t: "Management Consultant", d: "Helping organizations improve their performance and efficiency." },
      { t: "Financial Analyst", d: "Examining financial data to guide business decisions." },
      { t: "Sales Director", d: "Leading teams to meet revenue goals and build client relationships." },
      { t: "Entrepreneur/Founder", d: "Building new business ventures from the ground up." }
    ],
    strengths: "Strategic thinking, negotiation, risk assessment, leadership.",
    profile: "You are goal-oriented and comfortable taking charge. You enjoy optimizing systems, persuading others, and driving tangible growth. You likely handle pressure and ambiguity well."
  },
  Health: {
    icon: HeartPulse,
    title: "Healthcare & Helping",
    jobs: [
      { t: "Clinical Psychologist", d: "Diagnosing and treating mental, emotional, and behavioral disorders." },
      { t: "Physician/Surgeon", d: "Diagnosing and treating medical conditions and injuries." },
      { t: "Physical Therapist", d: "Helping patients improve movement and manage pain." },
      { t: "Social Worker", d: "Helping people cope with challenges in their everyday lives." },
      { t: "Medical Researcher", d: "Conducting research to improve human health." }
    ],
    strengths: "Empathy, active listening, crisis management, biological science.",
    profile: "You are motivated by a desire to improve the lives of others directly. You have a high capacity for empathy but can maintain professional composure in high-stakes or emotionally taxing situations."
  },
  Edu: {
    icon: GraduationCap,
    title: "Education & Communication",
    jobs: [
      { t: "Corporate Trainer", d: "Developing and conducting training programs for employees." },
      { t: "Journalist", d: "Investigating, analyzing, and reporting on news and events." },
      { t: "Professor/Teacher", d: "Educating students and conducting academic research." },
      { t: "Public Relations Director", d: "Managing the public image of an organization or individual." },
      { t: "Instructional Designer", d: "Creating educational courses and materials." }
    ],
    strengths: "Public speaking, synthesis of information, mentoring.",
    profile: "You excel at breaking down complex information and making it accessible to others. You value knowledge transfer and likely enjoy environments where you act as a mediator of information."
  },
  Trades: {
    icon: Wrench,
    title: "Trades & Engineering",
    jobs: [
      { t: "Mechanical Engineer", d: "Designing and building physical machines and systems." },
      { t: "Civil Engineer", d: "Designing infrastructure projects like bridges and roads." },
      { t: "Master Electrician", d: "Installing and maintaining complex electrical systems." },
      { t: "Industrial Designer", d: "Developing concepts and designs for manufactured products." },
      { t: "Aviation Technician", d: "Repairing and maintaining aircraft systems." }
    ],
    strengths: "Spatial awareness, hands-on problem solving, precision.",
    profile: "You have a practical, hands-on approach to the world. You prefer to work with physical laws and materials to create structures and objects that have immediate utility and function."
  }
};

const QUESTIONS = [
  // Creative
  { c: 'Creative', q: "Designing visual layouts for websites or print" },
  { c: 'Creative', q: "Writing stories, scripts, or creative content" },
  { c: 'Creative', q: "Working with music, sound, or audio production" },
  { c: 'Creative', q: "Creating illustrations, animations, or photography" },
  // Tech
  { c: 'Tech', q: "Analyzing large datasets to find patterns" },
  { c: 'Tech', q: "Building software or applications" },
  { c: 'Tech', q: "Conducting scientific experiments and research" },
  { c: 'Tech', q: "Working with AI, machine learning, or robotics" },
  // Business
  { c: 'Business', q: "Managing teams and projects to meet goals" },
  { c: 'Business', q: "Developing business strategies and growth plans" },
  { c: 'Business', q: "Negotiating deals and building client relationships" },
  { c: 'Business', q: "Analyzing financial data and investments" },
  // Health
  { c: 'Health', q: "Diagnosing and treating medical conditions" },
  { c: 'Health', q: "Providing therapy or counseling support" },
  { c: 'Health', q: "Working in emergency or crisis situations" },
  { c: 'Health', q: "Researching diseases and developing treatments" },
  // Edu
  { c: 'Edu', q: "Teaching and mentoring others" },
  { c: 'Edu', q: "Public speaking or presenting to audiences" },
  { c: 'Edu', q: "Writing educational content or journalism" },
  { c: 'Edu', q: "Creating documentaries or podcasts" },
  // Trades
  { c: 'Trades', q: "Designing and building physical structures" },
  { c: 'Trades', q: "Working with mechanical systems and machinery" },
  { c: 'Trades', q: "Electrical or plumbing installation and maintenance" },
  { c: 'Trades', q: "Woodworking, metalwork, or fabrication" }
];

const SHUFFLED_QUESTIONS = [...QUESTIONS].sort(() => Math.random() - 0.5);

export default function CareerPath() {
  const [step, setStep] = useState<'intro' | 'test' | 'results'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({
    Creative: 0, Tech: 0, Business: 0, Health: 0, Edu: 0, Trades: 0
  });

  const handleAnswer = (value: number) => {
    const cluster = SHUFFLED_QUESTIONS[currentQ].c;
    setScores(prev => ({ ...prev, [cluster]: prev[cluster] + value }));
    
    if (currentQ < SHUFFLED_QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setStep('results');
    }
  };

  const getResults = () => {
    const sorted = Object.entries(scores)
      .map(([key, value]) => ({ key, value, data: CLUSTERS[key as keyof typeof CLUSTERS] }))
      .sort((a, b) => b.value - a.value);
    
    return sorted;
  };

  const results = getResults();
  const topTwo = results.slice(0, 2);

  const chartData = results.map(r => ({
    name: r.data.title,
    score: Math.round((r.value / 20) * 100), // Max possible is 4 questions * 5 points = 20
    fill: r.key === topTwo[0].key ? 'hsl(var(--primary))' : r.key === topTwo[1].key ? 'hsl(var(--accent))' : 'hsl(var(--muted))'
  }));

  return (
    <TestWrapper step={step}>
      {step === 'intro' && (
        <div className="flex flex-col items-center justify-center text-center h-full max-w-2xl mx-auto py-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Career Alignment</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Rate your interest in various activities to map your natural inclinations to six major professional domains. Discover paths that align with what you actually enjoy doing.
          </p>
          <div className="flex gap-4 items-center bg-secondary/50 px-6 py-4 rounded-xl mb-8 border border-border/50">
            <div className="text-left">
              <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Estimated Time</p>
              <p className="font-medium">6 Minutes</p>
            </div>
            <div className="w-px h-8 bg-border/50"></div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Format</p>
              <p className="font-medium">24 Interest Ratings</p>
            </div>
          </div>
          <Button size="lg" onClick={() => setStep('test')} variant="premium">
            Begin Assessment
          </Button>
        </div>
      )}

      {step === 'test' && (
        <div className="flex flex-col max-w-3xl mx-auto py-12 w-full">
          <div className="mb-12">
            <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
              <span>Activity {currentQ + 1} of {SHUFFLED_QUESTIONS.length}</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full mb-12 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${((currentQ) / SHUFFLED_QUESTIONS.length) * 100}%` }}
              ></div>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground text-center leading-tight min-h-[100px] flex items-center justify-center">
              {SHUFFLED_QUESTIONS[currentQ].q}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-auto">
            {[
              { val: 1, label: "Not Interested" },
              { val: 2, label: "Slightly" },
              { val: 3, label: "Neutral" },
              { val: 4, label: "Interested" },
              { val: 5, label: "Very Interested" }
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => handleAnswer(opt.val)}
                className="py-4 px-2 rounded-xl border-2 border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="flex flex-col max-w-5xl mx-auto py-8 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-10">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-2">Your Career Vectors</h2>
            <p className="text-muted-foreground text-lg">Your strongest professional inclinations.</p>
          </div>

          <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 mb-12 shadow-sm h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {topTwo.map((result, idx) => {
              const Icon = result.data.icon;
              return (
                <div key={result.key} className="bg-card border border-border/50 p-8 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Icon className="w-48 h-48" />
                  </div>
                  
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${idx === 0 ? 'bg-primary' : 'bg-accent'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Path {idx + 1}</h3>
                      <h4 className="font-serif text-2xl font-bold">{result.data.title}</h4>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6 leading-relaxed relative z-10 text-sm">
                    {result.data.profile}
                  </p>

                  <div className="mb-6 relative z-10">
                    <h5 className="text-xs font-bold uppercase tracking-wider mb-2 text-foreground">Key Strengths</h5>
                    <p className="text-sm font-medium text-primary bg-primary/5 p-3 rounded-lg border border-primary/10">
                      {result.data.strengths}
                    </p>
                  </div>

                  <div className="relative z-10">
                    <h5 className="text-xs font-bold uppercase tracking-wider mb-3 text-foreground">Example Roles</h5>
                    <ul className="space-y-3">
                      {result.data.jobs.slice(0, 3).map((job, jIdx) => (
                        <li key={jIdx} className="text-sm">
                          <span className="font-semibold block text-foreground">{job.t}</span>
                          <span className="text-muted-foreground text-xs">{job.d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button asChild size="lg" variant="outline" className="px-8">
              <Link href="/">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      )}
    </TestWrapper>
  );
}
