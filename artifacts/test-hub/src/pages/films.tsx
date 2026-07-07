import { useState } from 'react';
import { TestWrapper } from '@/components/layout/TestWrapper';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Film, ChevronLeft } from 'lucide-react';

const QUESTIONS = [
  { q: "Who directed 'Schindler's List'?", opts: ["Francis Ford Coppola", "Steven Spielberg", "Martin Scorsese", "Stanley Kubrick"], a: 1 },
  { q: "What did Andy hide his escape tunnel behind in 'The Shawshank Redemption'?", opts: ["A bookshelf", "A filing cabinet", "A large movie poster", "A wardrobe"], a: 2 },
  { q: "'You can't handle the truth!' is a famous line from which film?", opts: ["A Few Good Men", "The Godfather", "Pulp Fiction", "Jerry Maguire"], a: 0 },
  { q: "Which film features the character Jack Sparrow?", opts: ["Master and Commander", "Pirates of the Caribbean", "Treasure Island", "The Bounty"], a: 1 },
  { q: "Who played the Joker in 'The Dark Knight'?", opts: ["Jack Nicholson", "Jared Leto", "Heath Ledger", "Joaquin Phoenix"], a: 2 },
  { q: "In which film does a character say 'E.T. phone home'?", opts: ["Close Encounters", "E.T. the Extra-Terrestrial", "Men in Black", "Contact"], a: 1 },
  { q: "Who directed 'Pulp Fiction'?", opts: ["David Fincher", "Coen Brothers", "Quentin Tarantino", "Oliver Stone"], a: 2 },
  { q: "'Here's looking at you, kid' is from which classic film?", opts: ["Gone with the Wind", "Citizen Kane", "Casablanca", "Sunset Boulevard"], a: 2 },
  { q: "Which actor played Tony Stark / Iron Man in the MCU?", opts: ["Chris Evans", "Chris Hemsworth", "Robert Downey Jr.", "Mark Ruffalo"], a: 2 },
  { q: "What year was James Cameron's 'Titanic' released?", opts: ["1995", "1996", "1997", "1998"], a: 2 },
  { q: "In 'The Matrix', what color pill does Neo take?", opts: ["Blue", "Green", "Red", "White"], a: 2 },
  { q: "Who directed 'Parasite' (2019 Oscar winner)?", opts: ["Park Chan-wook", "Bong Joon-ho", "Wong Kar-wai", "Akira Kurosawa"], a: 1 },
  { q: "Which film features the line 'I see dead people'?", opts: ["The Others", "Sixth Sense", "Poltergeist", "Ghost"], a: 1 },
  { q: "Who played Hannibal Lecter in 'The Silence of the Lambs'?", opts: ["Gary Oldman", "Anthony Hopkins", "Ian McKellen", "Daniel Day-Lewis"], a: 1 },
  { q: "What is the name of the toy cowboy in 'Toy Story'?", opts: ["Buzz", "Rex", "Woody", "Hamm"], a: 2 },
  { q: "In 'Inception', what does Cobb use as his totem?", opts: ["A coin", "A chess piece", "A spinning top", "A ring"], a: 2 },
  { q: "Which film won the first Academy Award for Best Picture in 1929?", opts: ["It Happened One Night", "Wings", "All Quiet on the Western Front", "Sunrise"], a: 1 },
  { q: "Who played Katniss Everdeen in 'The Hunger Games'?", opts: ["Emma Watson", "Saoirse Ronan", "Jennifer Lawrence", "Shailene Woodley"], a: 2 },
  { q: "'To infinity and beyond!' is the catchphrase of which character?", opts: ["Woody", "Buzz Lightyear", "Hamm", "Rex"], a: 1 },
  { q: "Which country produced the film 'Amélie' (2001)?", opts: ["Italy", "Spain", "France", "Belgium"], a: 2 },
  { q: "Who directed '2001: A Space Odyssey'?", opts: ["Ridley Scott", "George Lucas", "Stanley Kubrick", "Steven Spielberg"], a: 2 },
  { q: "What is the name of the fictional country in 'Black Panther'?", opts: ["Sokovia", "Wakanda", "Genosha", "Latveria"], a: 1 },
  { q: "In 'Forrest Gump', what does Forrest say 'Life is like'?", opts: ["A river", "A box of chocolates", "A rollercoaster", "A long road"], a: 1 },
  { q: "Who played James Bond in 'Casino Royale' (2006)?", opts: ["Pierce Brosnan", "Roger Moore", "Daniel Craig", "Timothy Dalton"], a: 2 },
  { q: "Which animated film features the song 'Let It Go'?", opts: ["Brave", "Tangled", "Frozen", "Moana"], a: 2 }
];

export default function FilmsTest() {
  const [step, setStep] = useState<'intro' | 'test' | 'results'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const handleAnswer = (idx: number) => {
    setAnswers(a => [...a, idx]);
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

  const score = answers.filter((a, i) => a === QUESTIONS[i]?.a).length;

  const getRank = (s: number) => {
    if (s >= 23) return { title: "Cinephile Extraordinaire", desc: "Cannes jury material. You know cinema." };
    if (s >= 18) return { title: "Film Buff", desc: "You've clearly spent quality time with cinema." };
    if (s >= 13) return { title: "Movie Fan", desc: "Good knowledge with some gaps to explore." };
    if (s >= 8) return { title: "Casual Viewer", desc: "Netflix evenings are your speed." };
    return { title: "Popcorn Enthusiast", desc: "You love the experience more than the details." };
  };

  const rank = getRank(score);

  return (
    <TestWrapper step={step}>
      {step === 'intro' && (
        <div className="flex flex-col items-center justify-center text-center h-full max-w-2xl mx-auto py-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <Film className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Famous Films</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Test your cinematic memory with 25 questions about iconic movies, legendary directors, memorable quotes, and film trivia.
          </p>
          <Button size="lg" onClick={() => setStep('test')} variant="premium">
            Roll Camera
          </Button>
        </div>
      )}

      {step === 'test' && (
        <div className="flex flex-col max-w-2xl mx-auto py-8 w-full">
           <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">Scene {currentQ + 1} of {QUESTIONS.length}</span>
              {currentQ > 0 && (
                <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="w-4 h-4" />Back
                </button>
              )}
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
            {QUESTIONS[currentQ].opts.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="w-full text-left p-5 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-lg font-medium shadow-sm"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="flex flex-col items-center max-w-2xl mx-auto py-12 w-full animate-in fade-in">
          <div className="text-6xl font-serif font-bold text-primary mb-2">{score}<span className="text-3xl text-muted-foreground">/25</span></div>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">{rank.title}</h2>
          <p className="text-lg text-muted-foreground mb-10 text-center">{rank.desc}</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" variant="outline">
              <Link href="/">Return to Lobby</Link>
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
