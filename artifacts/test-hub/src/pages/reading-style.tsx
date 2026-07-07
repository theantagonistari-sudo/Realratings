import { useState } from 'react';
import { TestWrapper } from '@/components/layout/TestWrapper';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const QUESTIONS = [
  {
    q: "When you pick up a new book, what do you do first?",
    options: [
      { text: "Flip through to look at any diagrams, maps, or images", style: "visual" },
      { text: "Read the table of contents and introduction carefully", style: "analytical" },
      { text: "Read the back cover and feel for the emotional tone", style: "empathetic" },
      { text: "Check page count and estimate how fast you can finish it", style: "speed" }
    ]
  },
  {
    q: "How do you handle a word you don't recognize?",
    options: [
      { text: "Look for context clues in surrounding sentences", style: "visual" },
      { text: "Stop and look it up immediately", style: "analytical" },
      { text: "Try to feel what it might mean from context", style: "empathetic" },
      { text: "Skip it and keep reading", style: "speed" }
    ]
  },
  {
    q: "After reading a chapter, you most often remember...",
    options: [
      { text: "The setting and visual descriptions", style: "visual" },
      { text: "The key arguments or plot points in logical sequence", style: "analytical" },
      { text: "How the characters felt and what motivated them", style: "empathetic" },
      { text: "The general gist and maybe 2-3 key facts", style: "speed" }
    ]
  },
  {
    q: "You prefer reading materials that are...",
    options: [
      { text: "Richly descriptive with strong imagery", style: "visual" },
      { text: "Well-structured with clear headings and evidence", style: "analytical" },
      { text: "Character-driven with emotional depth", style: "empathetic" },
      { text: "Concise and information-dense", style: "speed" }
    ]
  },
  {
    q: "When you lose track of the story, you...",
    options: [
      { text: "Flip back to find the last vivid scene you remember", style: "visual" },
      { text: "Find the last plot point you remember and re-read from there", style: "analytical" },
      { text: "Try to recall the emotional state of the scene you last remember", style: "empathetic" },
      { text: "Keep reading forward — you'll catch up", style: "speed" }
    ]
  },
  {
    q: "What makes you abandon a book?",
    options: [
      { text: "Bland descriptions and lack of atmosphere", style: "visual" },
      { text: "Logical inconsistencies or poor structure", style: "analytical" },
      { text: "Unrelatable or flat characters", style: "empathetic" },
      { text: "Slow pacing and too much filler", style: "speed" }
    ]
  },
  {
    q: "How do you prefer to take notes while reading?",
    options: [
      { text: "Drawing mind maps or using color-coded highlighters", style: "visual" },
      { text: "Writing structured summaries or margin notes", style: "analytical" },
      { text: "Jotting down quotes that moved you", style: "empathetic" },
      { text: "I rarely take notes, just skim for the main idea", style: "speed" }
    ]
  },
  {
    q: "If a book is made into a movie, you usually think...",
    options: [
      { text: "The cinematography didn't match how I pictured it", style: "visual" },
      { text: "They left out too many important plot details", style: "analytical" },
      { text: "The actors didn't capture the characters' internal struggles", style: "empathetic" },
      { text: "The movie was faster to consume anyway", style: "speed" }
    ]
  },
  {
    q: "When reading non-fiction, you focus most on...",
    options: [
      { text: "The charts, graphs, and infographics", style: "visual" },
      { text: "The thesis, methodology, and conclusions", style: "analytical" },
      { text: "The human stories and case studies", style: "empathetic" },
      { text: "The bullet points and executive summaries", style: "speed" }
    ]
  },
  {
    q: "Your ideal reading environment is...",
    options: [
      { text: "A visually beautiful space with perfect lighting", style: "visual" },
      { text: "A quiet, distraction-free desk or study", style: "analytical" },
      { text: "Cozy in bed or a comfortable armchair", style: "empathetic" },
      { text: "On a commute or during a short break", style: "speed" }
    ]
  },
  {
    q: "When recommending a book to a friend, you say...",
    options: [
      { text: "'The world-building is incredibly immersive.'", style: "visual" },
      { text: "'It really makes you think critically about the subject.'", style: "analytical" },
      { text: "'It will absolutely break your heart.'", style: "empathetic" },
      { text: "'It's a really quick, worthwhile read.'", style: "speed" }
    ]
  },
  {
    q: "You read fastest when...",
    options: [
      { text: "The imagery is flowing like a movie in my head", style: "visual" },
      { text: "The arguments follow a logical, predictable pattern", style: "analytical" },
      { text: "I am deeply invested in the characters' fates", style: "empathetic" },
      { text: "I skim over the adjectives and focus on the verbs", style: "speed" }
    ]
  },
  {
    q: "What part of a textbook is most useful to you?",
    options: [
      { text: "The diagrams and sidebars", style: "visual" },
      { text: "The chapter summaries and index", style: "analytical" },
      { text: "The author's personal anecdotes", style: "empathetic" },
      { text: "The bolded vocabulary words", style: "speed" }
    ]
  },
  {
    q: "How do you feel about poetry?",
    options: [
      { text: "Love how it paints pictures with words", style: "visual" },
      { text: "Appreciate the structure, meter, and wordplay", style: "analytical" },
      { text: "Connect with the raw emotion", style: "empathetic" },
      { text: "Too vague; takes too much time to decode", style: "speed" }
    ]
  },
  {
    q: "When a character dies, you...",
    options: [
      { text: "Re-read the scene to visualize how it happened", style: "visual" },
      { text: "Analyze how it impacts the rest of the plot", style: "analytical" },
      { text: "Feel genuine grief for days", style: "empathetic" },
      { text: "Acknowledge it and keep moving forward", style: "speed" }
    ]
  }
];

const STYLE_DESCRIPTIONS = {
  visual: {
    title: "Visual Reader",
    desc: "You experience books cinematically. Your mind automatically translates words into vivid imagery, scenes, and spaces. You likely have an excellent memory for descriptive passages and settings."
  },
  analytical: {
    title: "Analytical Reader",
    desc: "You read like a scholar. You break down texts systematically, hunting for logical consistency, structure, and evidence. You retain complex information with precision."
  },
  empathetic: {
    title: "Empathetic Reader",
    desc: "You read with your heart. You connect deeply with characters and retain emotional arcs more than plot details. Books are emotional experiences for you, not just data transfers."
  },
  speed: {
    title: "Speed Reader",
    desc: "You're efficiency-focused. You extract information rapidly and instinctively prioritize what matters. You rarely get bogged down in excessive description, preferring to cut to the core."
  }
};

export default function ReadingStyle() {
  const [step, setStep] = useState<'intro' | 'test' | 'results'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState({ visual: 0, analytical: 0, empathetic: 0, speed: 0 });

  const handleAnswer = (style: string) => {
    setScores(prev => ({ ...prev, [style]: prev[style as keyof typeof scores] + 1 }));
    
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setStep('results');
    }
  };

  const getPrimaryStyle = () => {
    let max = -1;
    let primary = 'visual';
    Object.entries(scores).forEach(([style, score]) => {
      if (score > max) {
        max = score;
        primary = style;
      }
    });
    return primary as keyof typeof STYLE_DESCRIPTIONS;
  };

  const primaryStyle = getPrimaryStyle();
  const info = STYLE_DESCRIPTIONS[primaryStyle];

  const radarData = [
    { subject: 'Visual', A: scores.visual, fullMark: 15 },
    { subject: 'Analytical', A: scores.analytical, fullMark: 15 },
    { subject: 'Empathetic', A: scores.empathetic, fullMark: 15 },
    { subject: 'Speed', A: scores.speed, fullMark: 15 },
  ];

  return (
    <TestWrapper step={step}>
      {step === 'intro' && (
        <div className="flex flex-col items-center justify-center text-center h-full max-w-2xl mx-auto py-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Reading Style Assessment</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Everyone processes written information differently. This assessment consists of 15 situational questions designed to map your natural reading patterns to one of four core archetypes.
          </p>
          <div className="flex gap-4 items-center bg-secondary/50 px-6 py-4 rounded-xl mb-8 border border-border/50">
            <div className="text-left">
              <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Estimated Time</p>
              <p className="font-medium">5 Minutes</p>
            </div>
            <div className="w-px h-8 bg-border/50"></div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Format</p>
              <p className="font-medium">15 Multiple Choice</p>
            </div>
          </div>
          <Button size="lg" onClick={() => setStep('test')} variant="premium">
            Begin Assessment
          </Button>
        </div>
      )}

      {step === 'test' && (
        <div className="flex flex-col max-w-2xl mx-auto py-12 w-full">
          <div className="mb-8">
            <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
              <span>Question {currentQ + 1} of {QUESTIONS.length}</span>
              <span>{Math.round(((currentQ) / QUESTIONS.length) * 100)}% Completed</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full mb-8 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${((currentQ) / QUESTIONS.length) * 100}%` }}
              ></div>
            </div>
            <h2 className="font-serif text-3xl font-semibold text-foreground leading-tight mb-8">
              {QUESTIONS[currentQ].q}
            </h2>
          </div>

          <div className="space-y-4">
            {QUESTIONS[currentQ].options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(opt.style)}
                className="w-full text-left p-6 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-lg font-medium shadow-sm hover:shadow-md"
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="flex flex-col max-w-4xl mx-auto py-8 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent font-semibold text-sm mb-4 tracking-wider uppercase">
              Your Primary Profile
            </div>
            <h2 className="font-serif text-5xl font-bold text-foreground mb-6">
              {info.title}
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {info.desc}
            </p>
          </div>

          <div className="bg-card border border-border/50 rounded-3xl p-8 mb-12 shadow-lg flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 14, fontWeight: 500 }} />
                  <Radar name="Style" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-6">
              <h3 className="font-serif text-2xl font-bold border-b border-border/50 pb-4">Dimension Breakdown</h3>
              {radarData.sort((a, b) => b.A - a.A).map((item) => (
                <div key={item.subject}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-foreground">{item.subject}</span>
                    <span className="text-muted-foreground font-mono">{Math.round((item.A / 15) * 100)}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full" 
                      style={{ width: `${(item.A / 15) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
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
