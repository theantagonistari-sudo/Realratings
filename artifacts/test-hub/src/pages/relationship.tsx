import { useState } from 'react';
import { TestWrapper } from '@/components/layout/TestWrapper';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Heart, ChevronLeft } from 'lucide-react';

const QUESTIONS = [
  // Communication
  { dim: 'Communication', q: "I express my feelings openly and directly", r: false },
  { dim: 'Communication', q: "I prefer texting over phone calls for important conversations", r: true }, // high score = digital/reserved
  { dim: 'Communication', q: "I check in with my partner frequently throughout the day", r: false },
  { dim: 'Communication', q: "I feel comfortable discussing difficult topics", r: false },
  { dim: 'Communication', q: "I expect my partner to read my mood without me explaining", r: true },
  
  // Attachment
  { dim: 'Attachment', q: "I worry about whether my partner truly loves me", r: true }, // anxious
  { dim: 'Attachment', q: "I feel uncomfortable depending on others", r: true }, // avoidant
  { dim: 'Attachment', q: "I find it easy to be close to romantic partners", r: false }, // secure
  { dim: 'Attachment', q: "I don't worry about being abandoned", r: false }, // secure
  { dim: 'Attachment', q: "I tend to pull away when things get too intimate", r: true }, // avoidant
  
  // Values
  { dim: 'Values', q: "Shared financial goals are essential in a relationship", r: false },
  { dim: 'Values', q: "I want a partner who shares my spiritual or philosophical views", r: false },
  { dim: 'Values', q: "Building a family is important to my future", r: false },
  { dim: 'Values', q: "Career ambition in a partner is very attractive to me", r: false },
  { dim: 'Values', q: "Politics do not matter much in romantic compatibility", r: true },
  
  // Conflict
  { dim: 'Conflict', q: "I prefer to resolve disagreements immediately", r: false }, // confronter
  { dim: 'Conflict', q: "I sometimes need space before discussing conflicts", r: true }, // avoider/reflector
  { dim: 'Conflict', q: "I rarely hold grudges after arguments", r: false },
  { dim: 'Conflict', q: "I can stay calm during heated discussions", r: false },
  { dim: 'Conflict', q: "I tend to yield to keep the peace", r: true } // mediator/avoider
];

export default function RelationshipTest() {
  const [step, setStep] = useState<'intro' | 'test' | 'results'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const handleAnswer = (val: number) => {
    setAnswers([...answers, val]);
    if (currentQ < QUESTIONS.length - 1) {
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

  const getResults = () => {
    let scores = { Communication: 0, Attachment: 0, Values: 0, Conflict: 0 };
    answers.forEach((ans, idx) => {
      const q = QUESTIONS[idx];
      let val = ans;
      if (q.r) val = 6 - ans; // reverse score
      scores[q.dim as keyof typeof scores] += val;
    });
    
    // Normalize to 100
    Object.keys(scores).forEach(key => {
      scores[key as keyof typeof scores] = Math.round((scores[key as keyof typeof scores] / 25) * 100);
    });
    
    return scores;
  };

  const getAttachmentStyle = (score: number) => {
    if (score > 75) return { name: "Secure", desc: "Comfortable with intimacy and independence." };
    if (score < 40) return { name: "Avoidant", desc: "Prioritizes independence over deep emotional closeness." };
    if (score > 40 && score < 60) return { name: "Anxious", desc: "Craves closeness but fears abandonment." };
    return { name: "Anxious-Avoidant", desc: "Desires intimacy but pulls away when it gets too close." };
  };

  const getCommunicationStyle = (score: number) => {
    if (score > 75) return "Highly Expressive & Direct";
    if (score > 50) return "Balanced & Thoughtful";
    return "Reserved & Internal processor";
  };

  const scores = answers.length === QUESTIONS.length ? getResults() : { Communication: 0, Attachment: 0, Values: 0, Conflict: 0 };
  const attachment = getAttachmentStyle(scores.Attachment);

  const radarData = [
    { subject: 'Communication', A: scores.Communication, fullMark: 100 },
    { subject: 'Attachment Security', A: scores.Attachment, fullMark: 100 },
    { subject: 'Value Alignment', A: scores.Values, fullMark: 100 },
    { subject: 'Conflict Resolution', A: scores.Conflict, fullMark: 100 },
  ];

  return (
    <TestWrapper step={step}>
      {step === 'intro' && (
        <div className="flex flex-col items-center justify-center text-center h-full max-w-2xl mx-auto py-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Relationship Style</h1>
          <p className="text-lg text-muted-foreground mb-8">
            This self-reflection assessment maps your attachment style, communication preferences, and approach to conflict to help you understand what you need in a partner.
          </p>
          <Button size="lg" onClick={() => setStep('test')} variant="premium">
            Begin Assessment
          </Button>
        </div>
      )}

      {step === 'test' && (
        <div className="flex flex-col max-w-2xl mx-auto py-12 w-full">
          <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-3">
            <span>Question {currentQ + 1} of {QUESTIONS.length}</span>
            {currentQ > 0 && (
              <button onClick={handleBack} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" />Back
              </button>
            )}
          </div>
          <div className="w-full bg-secondary h-2 rounded-full mb-8 overflow-hidden">
            <div className="bg-primary h-full transition-all duration-300 ease-out" style={{ width: `${(currentQ / QUESTIONS.length) * 100}%` }} />
          </div>
           <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-medium text-foreground leading-tight min-h-[100px] flex items-center justify-center">
              "{QUESTIONS[currentQ].q}"
            </h2>
          </div>
          
          <div className="space-y-3">
             {[
               { val: 1, label: "Strongly Disagree" },
               { val: 2, label: "Disagree" },
               { val: 3, label: "Neutral" },
               { val: 4, label: "Agree" },
               { val: 5, label: "Strongly Agree" }
             ].map(opt => (
               <button
                 key={opt.val}
                 onClick={() => handleAnswer(opt.val)}
                 className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all font-medium"
               >
                 {opt.label}
               </button>
             ))}
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="flex flex-col max-w-4xl mx-auto py-8 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className="text-center mb-10">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-2">Relationship Profile</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-card p-6 rounded-3xl border border-border/50 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
                  <Radar dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-6">
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
                <div className="text-xs uppercase tracking-wider text-primary font-bold mb-1">Attachment Style</div>
                <div className="font-serif text-2xl font-bold mb-2">{attachment.name}</div>
                <div className="text-sm text-muted-foreground">{attachment.desc}</div>
              </div>
              
              <div className="bg-card p-6 rounded-2xl border border-border/50">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Communication</div>
                <div className="font-serif text-xl font-bold">{getCommunicationStyle(scores.Communication)}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-8">
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
