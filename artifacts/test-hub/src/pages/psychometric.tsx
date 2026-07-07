import { useState } from 'react';
import { TestWrapper } from '@/components/layout/TestWrapper';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const QUESTIONS = [
  // Verbal
  { q: "BOOK is to LIBRARY as PAINTING is to:", options: ["Canvas", "Museum", "Artist", "Frame"], answer: 1, domain: "Verbal" },
  { q: "Which word is most opposite to TENACIOUS?", options: ["Persistent", "Yielding", "Brave", "Careful"], answer: 1, domain: "Verbal" },
  { q: "Choose the word that best completes: 'Her speech was so _____ that the audience was held spellbound.'", options: ["Tedious", "Captivating", "Brief", "Quiet"], answer: 1, domain: "Verbal" },
  { q: "MELODY is to COMPOSER as SCULPTURE is to:", options: ["Museum", "Clay", "Sculptor", "Painting"], answer: 2, domain: "Verbal" },
  { q: "Which word means the same as EPHEMERAL?", options: ["Permanent", "Fleeting", "Difficult", "Beautiful"], answer: 1, domain: "Verbal" },
  
  // Numerical
  { q: "If a shirt costs $45 and is discounted 20%, what is the sale price?", options: ["$35", "$36", "$38", "$40"], answer: 1, domain: "Numerical" },
  { q: "What is the next number in the sequence: 2, 6, 18, 54, ___?", options: ["108", "162", "216", "270"], answer: 1, domain: "Numerical" },
  { q: "A train travels 120 miles in 2 hours. At the same speed, how far will it travel in 5 hours?", options: ["240 miles", "300 miles", "360 miles", "420 miles"], answer: 1, domain: "Numerical" },
  { q: "What is 15% of 240?", options: ["32", "36", "40", "44"], answer: 1, domain: "Numerical" },
  { q: "If 3x + 7 = 22, what is x?", options: ["3", "5", "7", "9"], answer: 1, domain: "Numerical" },
  
  // Logical
  { q: "All roses are flowers. Some flowers fade quickly. Therefore:", options: ["All roses fade quickly", "Some roses may fade quickly", "No roses fade quickly", "Roses never fade"], answer: 1, domain: "Logical" },
  { q: "Which shape completes the pattern: Circle, Triangle, Square, Circle, Triangle, ___?", options: ["Pentagon", "Square", "Circle", "Triangle"], answer: 1, domain: "Logical" },
  { q: "If all Bloops are Razzles, and all Razzles are Lazzles, then:", options: ["All Bloops are Lazzles", "Some Lazzles are Bloops", "No Bloops are Lazzles", "All Lazzles are Bloops"], answer: 0, domain: "Logical" },
  { q: "Which is the odd one out?", options: ["Oak", "Pine", "Rose", "Maple"], answer: 2, domain: "Logical" },
  { q: "Tom is taller than Sam. Sam is taller than Mike. Who is shortest?", options: ["Tom", "Sam", "Mike", "Cannot determine"], answer: 2, domain: "Logical" },
  
  // Spatial
  { q: "A cube has 6 faces. If you unfold it into a flat cross shape, how many squares do you count?", options: ["4", "5", "6", "8"], answer: 2, domain: "Spatial" },
  { q: "Imagine rotating the lowercase letter 'd' 180 degrees clockwise. What letter does it most resemble?", options: ["b", "p", "q", "d"], answer: 1, domain: "Spatial" }, // rotated 180 deg it becomes 'p'
  { q: "A square piece of paper is folded in half diagonally, then folded in half again. How many layers of paper are there?", options: ["2", "3", "4", "8"], answer: 2, domain: "Spatial" },
  { q: "Which 3D shape has exactly 5 faces?", options: ["Cube", "Triangular prism", "Square pyramid", "Tetrahedron"], answer: 2, domain: "Spatial" },
  { q: "If you look at a clock showing 3:00 in a mirror, what time does the reflection show?", options: ["9:00", "3:00", "6:00", "12:00"], answer: 0, domain: "Spatial" }
];

export default function PsychometricTest() {
  const [step, setStep] = useState<'intro' | 'test' | 'results'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const handleAnswer = (optionIdx: number) => {
    setAnswers([...answers, optionIdx]);
    
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setStep('results');
    }
  };

  const getResults = () => {
    let scores = { Verbal: 0, Numerical: 0, Logical: 0, Spatial: 0 };
    let total = 0;

    answers.forEach((ans, idx) => {
      const q = QUESTIONS[idx];
      if (ans === q.answer) {
        scores[q.domain as keyof typeof scores] += 1;
        total += 1;
      }
    });

    return { scores, total };
  };

  const { scores, total } = getResults();

  const chartData = [
    { name: 'Verbal', score: scores.Verbal, full: 5 },
    { name: 'Numerical', score: scores.Numerical, full: 5 },
    { name: 'Logical', score: scores.Logical, full: 5 },
    { name: 'Spatial', score: scores.Spatial, full: 5 },
  ];

  const getOverallInterpretation = (score: number) => {
    if (score >= 18) return { title: "Exceptional", desc: "Top tier cognitive performance. Excellent reasoning across all domains." };
    if (score >= 15) return { title: "Superior", desc: "Above average cognitive ability. Strong analytical skills." };
    if (score >= 12) return { title: "High Average", desc: "Solid reasoning capabilities and problem-solving skills." };
    if (score >= 9) return { title: "Average", desc: "Typical cognitive performance with balanced strengths." };
    return { title: "Developing", desc: "Practice with puzzles and logic games will improve these areas." };
  };

  const interpretation = getOverallInterpretation(total);

  return (
    <TestWrapper step={step}>
      {step === 'intro' && (
        <div className="flex flex-col items-center justify-center text-center h-full max-w-2xl mx-auto py-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Cognitive Analysis</h1>
          <p className="text-lg text-muted-foreground mb-8">
            A comprehensive psychometric evaluation covering four core domains: Verbal, Numerical, Logical, and Spatial reasoning. 
          </p>
          <div className="flex gap-4 items-center bg-secondary/50 px-6 py-4 rounded-xl mb-8 border border-border/50">
            <div className="text-left">
              <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Estimated Time</p>
              <p className="font-medium">10-15 Minutes</p>
            </div>
            <div className="w-px h-8 bg-border/50"></div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Format</p>
              <p className="font-medium">20 Problem-Solving Questions</p>
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
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">Question {currentQ + 1} of {QUESTIONS.length}</span>
              <span className="text-xs font-semibold px-2 py-1 bg-secondary text-primary rounded-md uppercase tracking-wide">
                {QUESTIONS[currentQ].domain} Reasoning
              </span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full mb-8 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${((currentQ) / QUESTIONS.length) * 100}%` }}
              ></div>
            </div>
            <h2 className="text-2xl font-semibold text-foreground leading-snug">
              {QUESTIONS[currentQ].q}
            </h2>
          </div>

          <div className="space-y-4">
            {QUESTIONS[currentQ].options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="w-full text-left p-5 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-lg font-medium shadow-sm hover:shadow-md flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-sm font-bold">
                  {String.fromCharCode(65 + idx)}
                </div>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="flex flex-col max-w-4xl mx-auto py-8 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-10">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-2">Cognitive Profile</h2>
            <p className="text-muted-foreground text-lg">Your reasoning breakdown across four domains.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-1 bg-primary text-primary-foreground p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="text-6xl font-serif font-bold mb-2 z-10">{total}<span className="text-3xl text-primary-foreground/70">/20</span></div>
              <h3 className="text-xl font-bold mb-1 z-10">{interpretation.title}</h3>
              <p className="text-primary-foreground/80 text-sm z-10">{interpretation.desc}</p>
            </div>

            <div className="md:col-span-2 bg-card border border-border/50 p-6 rounded-3xl shadow-sm h-[300px]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">Domain Breakdown</h3>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 5]} hide />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fill: 'hsl(var(--foreground))', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} formatter={(val: number) => [`${val} / 5`, 'Score']} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={30}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <Button asChild size="lg" variant="outline" className="px-8">
              <Link href="/">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      )}
    </TestWrapper>
  );
}
