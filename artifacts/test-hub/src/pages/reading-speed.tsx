import { useState, useEffect, useRef } from 'react';
import { TestWrapper } from '@/components/layout/TestWrapper';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Link } from 'wouter';

const PASSAGE = "The deep ocean remains one of Earth's least explored frontiers. Stretching down to nearly eleven kilometers in the Mariana Trench, the abyssal depths harbor creatures adapted to perpetual darkness and crushing pressure. Bioluminescent organisms drift through these lightless waters, producing their own ghostly illumination through chemical reactions in their cells. Scientists estimate that fewer than twenty percent of the world's oceans have been mapped with any real precision, meaning that vast ecosystems remain entirely unknown to us. In recent decades, remotely operated vehicles have begun to pull back the curtain on this alien world. They have discovered hydrothermal vents teeming with extremophile bacteria that derive energy not from sunlight but from the sulfur-rich water gushing from cracks in the ocean floor. These findings have profound implications for the search for life beyond Earth — if complex ecosystems can thrive without sunlight here, similar environments might exist beneath the icy shells of moons like Europa and Enceladus. The ocean is not merely a habitat but a time capsule, preserving sediment layers that record millions of years of climate history. Each core sample pulled from the seafloor tells a story of ice ages and warming periods, of volcanic eruptions and mass extinctions. Understanding these archives is crucial as we attempt to model the trajectory of our own rapidly changing climate. The deep sea, it turns out, is not a barren wilderness but one of the most scientifically significant places on the planet.";

const WORD_COUNT = 232;

const QUESTIONS = [
  {
    q: "What percentage of oceans have been mapped with precision?",
    options: ["Less than 20%", "About 50%", "Over 75%", "Nearly 100%"],
    answer: 0
  },
  {
    q: "What do hydrothermal vent bacteria use for energy instead of sunlight?",
    options: ["Bioluminescence", "Sulfur-rich water", "Ocean currents", "Chemical light"],
    answer: 1
  },
  {
    q: "Which moons are mentioned as potentially having similar environments?",
    options: ["Titan and Io", "Ganymede and Callisto", "Europa and Enceladus", "Triton and Phobos"],
    answer: 2
  }
];

export default function ReadingSpeed() {
  const [step, setStep] = useState<'intro' | 'reading' | 'questions' | 'results'>('intro');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [readTimeSec, setReadTimeSec] = useState(0);
  const [wpm, setWpm] = useState(0);
  
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  
  const handleStartReading = () => {
    setStep('reading');
    setStartTime(Date.now());
  };

  const handleFinishReading = () => {
    if (!startTime) return;
    const elapsed = (Date.now() - startTime) / 1000;
    setReadTimeSec(elapsed);
    setWpm(Math.round((WORD_COUNT / elapsed) * 60));
    setStep('questions');
  };

  const handleAnswer = (optionIdx: number) => {
    if (optionIdx === QUESTIONS[currentQ].answer) {
      setScore(s => s + 1);
    }
    
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setStep('results');
    }
  };

  const getPercentile = (speed: number) => {
    if (speed < 150) return "Bottom 20%";
    if (speed < 238) return "Below Average";
    if (speed < 300) return "Above Average";
    if (speed < 500) return "Top 10% (Fast)";
    return "Top 1% (Speed Reader)";
  };

  const chartData = [
    { name: 'Slow', range: [0, 150], fill: '#cbd5e1' },
    { name: 'Average', range: [150, 300], fill: '#94a3b8' },
    { name: 'Fast', range: [300, 500], fill: '#64748b' },
    { name: 'Elite', range: [500, 800], fill: '#334155' }
  ];

  return (
    <TestWrapper step={step}>
      {step === 'intro' && (
        <div className="flex flex-col items-center justify-center text-center h-full max-w-2xl mx-auto py-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Reading Speed Test</h1>
          <p className="text-lg text-muted-foreground mb-8">
            This test measures your raw reading speed in Words Per Minute (WPM) and your comprehension retention. You will be presented with a short passage. Read at your normal, comfortable pace.
          </p>
          <div className="flex gap-4 items-center bg-secondary/50 px-6 py-4 rounded-xl mb-8 border border-border/50">
            <div className="text-left">
              <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Estimated Time</p>
              <p className="font-medium">3 Minutes</p>
            </div>
            <div className="w-px h-8 bg-border/50"></div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Format</p>
              <p className="font-medium">230 Words + 3 Questions</p>
            </div>
          </div>
          <Button size="lg" onClick={handleStartReading} variant="premium">
            Start Reading
          </Button>
        </div>
      )}

      {step === 'reading' && (
        <div className="flex flex-col max-w-3xl mx-auto py-8">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-border/50">
            <h2 className="font-serif text-2xl font-bold text-primary">Read the following passage:</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              Timer running
            </div>
          </div>
          
          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <p className="leading-relaxed text-foreground/90 text-[1.1rem]">
              {PASSAGE}
            </p>
          </div>
          
          <div className="flex justify-center mt-auto pb-12">
            <Button size="lg" onClick={handleFinishReading} className="w-full sm:w-auto text-lg px-12 py-6 shadow-lg shadow-primary/20">
              I've Finished Reading
            </Button>
          </div>
        </div>
      )}

      {step === 'questions' && (
        <div className="flex flex-col max-w-2xl mx-auto py-12 w-full">
          <div className="mb-8">
            <div className="text-sm font-medium text-accent mb-2">Comprehension Check {currentQ + 1} of 3</div>
            <h2 className="text-2xl font-semibold text-foreground leading-tight">
              {QUESTIONS[currentQ].q}
            </h2>
            <div className="w-full bg-secondary h-2 rounded-full mt-6 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 ease-out"
                style={{ width: `${((currentQ) / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-4">
            {QUESTIONS[currentQ].options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="w-full text-left p-5 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-lg font-medium"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="flex flex-col max-w-3xl mx-auto py-8 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-10">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-2">Your Results</h2>
            <p className="text-muted-foreground text-lg">Here is how you process written information.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reading Speed</div>
              <div className="text-6xl font-serif font-bold text-primary mb-2">
                {wpm} <span className="text-2xl text-muted-foreground font-sans font-normal">WPM</span>
              </div>
              <div className="inline-block bg-secondary text-foreground px-3 py-1 rounded-full text-sm font-medium">
                {getPercentile(wpm)}
              </div>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Comprehension</div>
              <div className="text-6xl font-serif font-bold text-accent mb-2">
                {Math.round((score / 3) * 100)}<span className="text-4xl">%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You answered {score} out of 3 questions correctly.
              </p>
            </div>
          </div>

          <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm mb-12">
            <h3 className="text-lg font-semibold mb-6">Where you stand</h3>
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 800]} hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 14 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="range[1]" fill="#8884d8" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.4} />
                    ))}
                  </Bar>
                  <ReferenceLine x={wpm} stroke="hsl(var(--primary))" strokeWidth={3} strokeDasharray="3 3">
                    <div className="absolute top-0 text-xs">You</div>
                  </ReferenceLine>
                </BarChart>
              </ResponsiveContainer>
              <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `calc(80px + (calc(100% - 80px) * ${Math.min(wpm, 800) / 800}))`}}>
                <div className="w-1 bg-primary h-full rounded-full shadow-[0_0_8px_hsl(var(--primary))] relative z-10">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">You</div>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-6 leading-relaxed">
              The average adult reads at about 238 words per minute. A score of over 300 is considered fast, while 500+ enters the realm of speed reading. Comprehension is just as important as speed — reading fast without retaining the information is counterproductive.
            </p>
          </div>

          <div className="flex justify-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      )}
    </TestWrapper>
  );
}
