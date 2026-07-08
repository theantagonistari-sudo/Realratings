import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { ChevronLeft } from 'lucide-react';

const QUESTIONS = [
  // Openness
  { trait: 'O', text: "I have a vivid imagination", reverse: false },
  { trait: 'O', text: "I am quick to understand things", reverse: false },
  { trait: 'O', text: "I prefer sticking to traditional ways of doing things", reverse: true },
  { trait: 'O', text: "I spend time reflecting on things", reverse: false },
  { trait: 'O', text: "I rarely look for deeper meaning in things", reverse: true },
  { trait: 'O', text: "I am full of ideas", reverse: false },
  
  // Conscientiousness
  { trait: 'C', text: "I am always prepared", reverse: false },
  { trait: 'C', text: "I leave my belongings around", reverse: true },
  { trait: 'C', text: "I pay attention to details", reverse: false },
  { trait: 'C', text: "I make a mess of things", reverse: true },
  { trait: 'C', text: "I follow a schedule", reverse: false },
  { trait: 'C', text: "I get chores done right away", reverse: false },
  
  // Extraversion
  { trait: 'E', text: "I am the life of the party", reverse: false },
  { trait: 'E', text: "I don't talk a lot", reverse: true },
  { trait: 'E', text: "I feel comfortable around people", reverse: false },
  { trait: 'E', text: "I keep in the background", reverse: true },
  { trait: 'E', text: "I start conversations", reverse: false },
  { trait: 'E', text: "I have little to say", reverse: true },
  
  // Agreeableness
  { trait: 'A', text: "I am interested in people", reverse: false },
  { trait: 'A', text: "I insult people", reverse: true },
  { trait: 'A', text: "I sympathize with others' feelings", reverse: false },
  { trait: 'A', text: "I am not interested in other people's problems", reverse: true },
  { trait: 'A', text: "I feel others' emotions", reverse: false },
  { trait: 'A', text: "I am not really interested in others", reverse: true },
  
  // Neuroticism
  { trait: 'N', text: "I get stressed out easily", reverse: false },
  { trait: 'N', text: "I am relaxed most of the time", reverse: true },
  { trait: 'N', text: "I worry about things", reverse: false },
  { trait: 'N', text: "I seldom feel blue", reverse: true },
  { trait: 'N', text: "I am easily disturbed", reverse: false },
  { trait: 'N', text: "I have frequent mood swings", reverse: false }
];

// Shuffle questions for better UX
const SHUFFLED_QUESTIONS = [...QUESTIONS].sort(() => Math.random() - 0.5);

const LIKERT_OPTIONS = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" }
];

export default function PersonalityTest() {
  const [step, setStep] = useState('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);

  const handleAnswer = (value) => {
    const newAnswers = [...answers,];
    setAnswers(newAnswers);
    if (currentQ < SHUFFLED_QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setStep('results');
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setCurrentQ(q => q - 1);
      setAnswers(a => a.slice(0, -1));
    }
  };

  const calculateScores = () => {
    if (answers.length < SHUFFLED_QUESTIONS.length) return { Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreeableness: 0, Neuroticism: 0 };
    
    const totals = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    const maxScorePerTrait = 6 * 5; // 6 questions, max score 5 each = 30
    
    SHUFFLED_QUESTIONS.forEach((q, index) => {
      let score = answers[index];
      if (q.reverse) {
        score = 6 - score; // Reverse scoring (1->5, 2->4, 4->2, 5->1)
      }
      totals[q.trait] += score;
    });

    return {
      Openness: Math.round((totals.O / maxScorePerTrait) * 100),
      Conscientiousness: Math.round((totals.C / maxScorePerTrait) * 100),
      Extraversion: Math.round((totals.E / maxScorePerTrait) * 100),
      Agreeableness: Math.round((totals.A / maxScorePerTrait) * 100),
      Neuroticism: Math.round((totals.N / maxScorePerTrait) * 100)
    };
  };

  const scores = calculateScores();
  
  const getInterpretation = (trait, score) => {
    if (trait === 'Openness') return score > 70 ? "Creative, curious, and open to abstract ideas." : score < 40 ? "Practical, concrete, and prefers familiar routines." : "Balances imagination with practical thinking.";
    if (trait === 'Conscientiousness') return score > 70 ? "Highly organized, disciplined, and goal-directed." : score < 40 ? "Spontaneous, flexible, and dislikes rigid structures." : "Reliable but adaptable to changing situations.";
    if (trait === 'Extraversion') return score > 70 ? "Sociable, energetic, and draws energy from others." : score < 40 ? "Reserved, quiet, and recharges through solitude." : "Ambiverted: comfortable in crowds but needs quiet time.";
    if (trait === 'Agreeableness') return score > 70 ? "Cooperative, trusting, and highly empathetic." : score < 40 ? "Competitive, skeptical, and prioritizes logic over feelings." : "Generally warm but capable of tough decisions.";
    if (trait === 'Neuroticism') return score > 70 ? "Emotionally reactive, sensitive, and prone to stress." : score < 40 ? "Calm, emotionally stable, and resilient under pressure." : "Generally balanced emotional responses.";
    return "";
  };

  const radarData = [
    { subject: 'Openness', A: scores.Openness, fullMark: 100 },
    { subject: 'Conscientiousness', A: scores.Conscientiousness, fullMark: 100 },
    { subject: 'Extraversion', A: scores.Extraversion, fullMark: 100 },
    { subject: 'Agreeableness', A: scores.Agreeableness, fullMark: 100 },
    { subject: 'Neuroticism', A: scores.Neuroticism, fullMark: 100 },
  ];

  return (
    <>
      {step === 'intro' && (
        <div className="flex flex-col items-center justify-center text-center h-full max-w-2xl mx-auto py-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Big Five Personality</h1>
          <p className="text-lg text-muted-foreground mb-8">
            The most scientifically validated model of human personality. Map your traits across Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism (OCEAN).
          </p>
          <div className="flex gap-4 items-center bg-secondary/50 px-6 py-4 rounded-xl mb-8 border border-border/50">
            <div className="text-left">
              <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Estimated Time</p>
              <p className="font-medium">5 Minutes</p>
            </div>
            <div className="w-px h-8 bg-border/50"></div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Format</p>
              <p className="font-medium">30 Statements</p>
            </div>
          </div>
          <Button size="lg" onClick={() => setStep('test')}>
            Begin Assessment
          </Button>
        </div>
      )}

      {step === 'test' && (
        <div className="flex flex-col max-w-3xl mx-auto py-12 w-full">
          <div className="mb-12">
            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
              <span>Statement {currentQ + 1} of {SHUFFLED_QUESTIONS.length}</span>
              {currentQ > 0 && (
                <button onClick={handleBack} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="w-4 h-4" />Back
                </button>
              )}
            </div>
            <div className="w-full bg-secondary h-2 rounded-full mb-12 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${((currentQ) / SHUFFLED_QUESTIONS.length) * 100}%` }}
              ></div>
            </div>
            <h2 className="font-serif text-4xl font-medium text-foreground text-center leading-tight min-h-[120px] flex items-center justify-center">
              "{SHUFFLED_QUESTIONS[currentQ].text}"
            </h2>
          </div>

          <div className="grid grid-cols-5 gap-2 md:gap-4 mt-auto">
            {LIKERT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                className="flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border-2 border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className={`w-8 h-8 rounded-full border-2 border-muted-foreground/30 mb-3 group-hover:border-primary group-hover:bg-primary/20 flex items-center justify-center transition-colors
                  ${opt.value === 1 || opt.value === 5 ? 'w-10 h-10' : ''}
                  ${opt.value === 3 ? 'w-6 h-6' : ''}
                `}>
                </div>
                <span className="text-xs md:text-sm font-medium text-muted-foreground text-center leading-tight">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="flex flex-col max-w-4xl mx-auto py-8 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-2">Your Personality Profile</h2>
            <p className="text-muted-foreground text-lg">Based on the Five-Factor Model.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm flex items-center justify-center min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }} />
                  <Radar name="Score" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              {radarData.map((trait) => (
                <div key={trait.subject} className="bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-serif font-bold text-lg">{trait.subject}</h3>
                    <div className="text-2xl font-light text-primary">{trait.A}<span className="text-sm text-muted-foreground">%</span></div>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mb-3">
                    <div 
                      className="bg-primary h-full rounded-full" 
                      style={{ width: `${trait.A}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getInterpretation(trait.subject, trait.A)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button asChild size="lg" variant="outline" className="px-8">
              <Link to="/">Return to Dashboard</Link>
            </Button>
            <Button asChild size="lg" className="px-8">
              <a href="https://smarteryou.live" target="_blank" rel="noopener noreferrer">Explore SmarterYou</a>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
