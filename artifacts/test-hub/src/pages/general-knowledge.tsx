import { useState, useEffect } from 'react';
import { TestWrapper } from '@/components/layout/TestWrapper';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Globe, Clock, ChevronLeft } from 'lucide-react';

const QUESTIONS = [
  { c: "Science", q: "What is the chemical symbol for gold?", opts: ["Go", "Gd", "Au", "Ag"], a: 2 },
  { c: "History", q: "In what year did World War II end?", opts: ["1943", "1944", "1945", "1946"], a: 2 },
  { c: "Geography", q: "What is the capital of Australia?", opts: ["Sydney", "Melbourne", "Brisbane", "Canberra"], a: 3 },
  { c: "Science", q: "How many bones are in the adult human body?", opts: ["186", "206", "226", "246"], a: 1 },
  { c: "History", q: "Who painted the Mona Lisa?", opts: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], a: 2 },
  { c: "Geography", q: "The Amazon River flows through which continent?", opts: ["Africa", "Asia", "South America", "North America"], a: 2 },
  { c: "Pop Culture", q: "Which artist released the album 'Thriller'?", opts: ["Prince", "Michael Jackson", "David Bowie", "Elton John"], a: 1 },
  { c: "Literature", q: "Who wrote '1984'?", opts: ["Aldous Huxley", "Ray Bradbury", "George Orwell", "H.G. Wells"], a: 2 },
  { c: "Science", q: "What planet is known as the Red Planet?", opts: ["Jupiter", "Venus", "Saturn", "Mars"], a: 3 },
  { c: "Sports", q: "How many players are on a basketball team on the court at one time?", opts: ["4", "5", "6", "7"], a: 1 },
  { c: "History", q: "Which civilization built the pyramids of Giza?", opts: ["Roman", "Greek", "Egyptian", "Mesopotamian"], a: 2 },
  { c: "Geography", q: "What is the longest river in the world?", opts: ["Amazon", "Congo", "Mississippi", "Nile"], a: 3 },
  { c: "Science", q: "What is the speed of light (approximately) in km/s?", opts: ["100,000", "200,000", "300,000", "400,000"], a: 2 },
  { c: "Literature", q: "Who wrote 'Pride and Prejudice'?", opts: ["Charlotte Brontë", "Jane Austen", "Mary Shelley", "Virginia Woolf"], a: 1 },
  { c: "Pop Culture", q: "In which country did the Olympics originate?", opts: ["Italy", "France", "Egypt", "Greece"], a: 3 },
  { c: "Sports", q: "How many rings are on the Olympic flag?", opts: ["4", "5", "6", "7"], a: 1 },
  { c: "History", q: "Who was the first President of the United States?", opts: ["John Adams", "Thomas Jefferson", "George Washington", "Benjamin Franklin"], a: 2 },
  { c: "Geography", q: "What is the largest continent by area?", opts: ["North America", "Africa", "Europe", "Asia"], a: 3 },
  { c: "Science", q: "What gas do plants absorb from the air?", opts: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], a: 2 },
  { c: "Pop Culture", q: "What does 'www' stand for in a web address?", opts: ["World Wide Web", "World Web Wide", "Wide World Web", "Web World Wide"], a: 0 }
];

export default function GeneralKnowledgeTest() {
  const [step, setStep] = useState<'intro' | 'test' | 'results'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answers, setAnswers] = useState<number[]>([]);

  useEffect(() => {
    if (step === 'test' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'test' && timeLeft === 0) {
      handleAnswer(-1); // Timeout
      return undefined;
    }
    return undefined;
  }, [timeLeft, step, currentQ]);

  const handleStart = () => {
    setAnswers([]);
    setCurrentQ(0);
    setStep('test');
    setTimeLeft(30);
  };

  const handleAnswer = (idx: number) => {
    setAnswers(a => [...a, idx]);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1);
      setTimeLeft(30);
    } else {
      setStep('results');
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setCurrentQ(q => q - 1);
      setAnswers(a => a.slice(0, -1));
      setTimeLeft(30);
    }
  };

  const getRank = (s: number) => {
    if (s >= 18) return { title: "Knowledge Maestro", desc: "You're in the top tier. Pub quiz teams want you." };
    if (s >= 15) return { title: "Well-Rounded Scholar", desc: "Impressive breadth of knowledge." };
    if (s >= 12) return { title: "Solid Knowledge Base", desc: "Above average with room to explore." };
    if (s >= 9) return { title: "Learning Enthusiast", desc: "A good foundation to build on." };
    return { title: "Curious Beginner", desc: "Every expert was once a beginner." };
  };

  const computedScore = answers.filter((a, i) => i < QUESTIONS.length && a === QUESTIONS[i].a).length;
  const computedCatScores = (() => {
    const cats: Record<string, { correct: number; total: number }> = {};
    answers.forEach((a, i) => {
      if (i >= QUESTIONS.length) return;
      const q = QUESTIONS[i];
      if (!cats[q.c]) cats[q.c] = { correct: 0, total: 0 };
      cats[q.c].total++;
      if (a === q.a) cats[q.c].correct++;
    });
    return cats;
  })();

  const rank = getRank(computedScore);

  return (
    <TestWrapper step={step}>
      {step === 'intro' && (
        <div className="flex flex-col items-center justify-center text-center h-full max-w-2xl mx-auto py-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <Globe className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">General Knowledge</h1>
          <p className="text-lg text-muted-foreground mb-8">
            20 questions spanning Science, History, Geography, Literature, Pop Culture, and Sports. You have 30 seconds per question.
          </p>
          <Button size="lg" onClick={handleStart} variant="premium">
            Start Challenge
          </Button>
        </div>
      )}

      {step === 'test' && (
        <div className="flex flex-col max-w-2xl mx-auto py-8 w-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              {currentQ > 0 && (
                <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="w-4 h-4" />Back
                </button>
              )}
              <span className="text-xs font-semibold px-3 py-1 bg-secondary text-primary rounded-full uppercase tracking-wide">
                {QUESTIONS[currentQ].c}
              </span>
            </div>
            <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timeLeft <= 5 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
              <Clock className="w-5 h-5" /> 00:{timeLeft.toString().padStart(2, '0')}
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground leading-snug">
              {QUESTIONS[currentQ].q}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUESTIONS[currentQ].opts.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="text-left p-5 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-lg font-medium shadow-sm"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="flex flex-col max-w-3xl mx-auto py-8 w-full animate-in fade-in">
          <div className="text-center mb-10">
             <div className="text-6xl font-serif font-bold text-primary mb-4">{computedScore}<span className="text-3xl text-muted-foreground">/20</span></div>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-2">{rank.title}</h2>
            <p className="text-muted-foreground">{rank.desc}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
             {Object.entries(computedCatScores).map(([cat, stats]) => (
                <div key={cat} className="bg-card border border-border/50 p-4 rounded-2xl">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{cat}</div>
                  <div className="font-bold text-xl">{stats.correct}/{stats.total}</div>
                  <div className="w-full bg-secondary h-1.5 rounded-full mt-2">
                    <div className="bg-primary h-full rounded-full" style={{width: `${(stats.correct/stats.total)*100}%`}}></div>
                  </div>
                </div>
             ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/">Return to Dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="premium">
              <a href="https://smarteryou.live" target="_blank" rel="noopener noreferrer">Explore SmarterYou</a>
            </Button>
          </div>
        </div>
      )}
    </TestWrapper>
  );
}
