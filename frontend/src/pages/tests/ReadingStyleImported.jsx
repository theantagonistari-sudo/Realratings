import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { BookOpen, FlaskConical, Newspaper, Feather, Lightbulb, ChevronLeft } from 'lucide-react';



const PASSAGES = {
  fiction: {
    Icon: BookOpen,
    label: 'Literary Fiction',
    tagline: 'A story excerpt — narrative, character-driven prose.',
    title: 'Still House',
    text: `The house had stood empty for eleven years before Clara came to inherit it. She found it much as her aunt had left it: dishes stacked in the draining rack as if someone had only just finished washing up, a half-knitted scarf draped over the arm of the wingback chair, three paperback novels face-down on the windowsill with their spines cracked like small surrenders.

The garden beyond the kitchen window had reverted to something wilder — bindweed lacing through the rose bushes, a blackberry cane throwing long exploratory arms across the flagstone path. Clara stood in the doorway between the hallway and the sitting room for a very long time, her suitcase still in her hand, listening to the house settle around her.

The floors made sounds. The radiators ticked. Somewhere behind the plaster, something moved — probably a mouse, her rational mind supplied, but she let herself believe for just a moment that the house was simply glad to have someone in it again. She set her suitcase down, crossed to the window, and looked out at the overgrown garden.

She would fix the rose bushes first.`,
  },
  technical: {
    Icon: FlaskConical,
    label: 'Technical / Scientific',
    tagline: 'An analytical explanation — structured, factual, concept-driven writing.',
    title: 'How Large Language Models Work',
    text: `Large language models are neural networks trained on vast corpora of text to predict the next token in a sequence. The core architecture, the Transformer, processes language by computing attention weights — for each word in a sentence, determining how much weight to assign every other word. This mechanism captures long-range dependencies: the relationship between a pronoun at the end of a paragraph and the noun it references at the beginning.

Training occurs in two main phases. Pretraining exposes the model to hundreds of billions of tokens from internet sources, books, and code. The model learns statistical regularities in language — grammar, world knowledge, and reasoning patterns — by minimising prediction error. Fine-tuning then narrows the model's behaviour, using human feedback to align outputs toward helpfulness and safety.

The result is a system that generates fluent, contextually coherent text at scale. What it cannot do is verify its outputs against reality; it has no mechanism for checking whether what it says is true, only whether it is statistically plausible given the training data. This distinction — between fluency and accuracy — is the central challenge of deploying such systems responsibly.`,
  },
  news: {
    Icon: Newspaper,
    label: 'News & Journalism',
    tagline: 'An investigative feature — evidence-led, fact-based narrative writing.',
    title: "The Reef That Shouldn't Exist",
    text: `In the spring of 2019, a team of marine biologists working off the coast of New South Wales made an accidental discovery that would challenge decades of oceanographic assumption. While conducting a routine seagrass survey, they found coral formations growing at depths and temperatures previously considered lethal to reef ecosystems — alive and, apparently, thriving.

The finding, published after eighteen months of verification, suggested that certain coral species possess a thermal plasticity that existing models had significantly underestimated. For conservationists watching the Great Barrier Reef lose roughly half its coral cover over three decades, the news arrived like a cautious exhale.

It did not mean the reef was recovering. It did not reverse the chemistry of increasingly acidic seas. But it opened a question the scientific community had been reluctant to ask aloud: were there reef communities already adapting to warmer conditions, hiding in the ocean's depths — refugia the models had written off as impossible?

"We are not announcing a solution," Dr Fiona Walsh told this paper. "We are announcing that the system is more complicated than we thought. That is both humbling and, in a small way, hopeful."`,
  },
  poetry: {
    Icon: Feather,
    label: 'Poetry',
    tagline: 'A short poem — compressed, imagistic language designed to be felt.',
    title: 'Still Life',
    text: `The teapot on the counter
holds last night's cooling tea —
a small abandonment,
a record of a moment
when something more urgent
called you from the kitchen.

The coat on the hook
still holds your shape,
a little.
The book on the nightstand
knows the exact page
where sleep found you.

Every room is full
of evidence of a life in progress:
the pen left uncapped,
the window cracked an inch,
the unwashed glass catching
what is left of the afternoon.

Nothing here is finished.
Nothing is supposed to be.
This is not a house in disarray —
this is a house being lived in,
which is the whole point
of having a house at all.`,
  },
  practical: {
    Icon: Lightbulb,
    label: 'Self-Help / Practical',
    tagline: 'Actionable advice — direct, purposeful, structured for application.',
    title: 'The Architecture of Habit',
    text: `The most reliable way to build a new habit is to attach it to something you already do without thinking. Behavioural researchers call this habit stacking. If you want to start meditating each morning, don't try to carve a new slot from your schedule — decide that you will meditate immediately after making your first coffee. The existing behaviour acts as an anchor, a cue that requires no willpower to trigger.

The second principle is to make the new behaviour easy at the start. The goal is not ten minutes of meditation on day one; it is thirty seconds. Research consistently shows that people who begin with small, manageable versions of a behaviour are far more likely to still be practising six months later than those who start with ambitious targets.

The mechanism is simple: easy wins build identity. Each time you follow through, even briefly, you cast a vote for the belief that you are the kind of person who meditates. That self-concept, once formed, becomes the actual engine of change — not motivation, not discipline, not willpower. Identity.

Start embarrassingly small. Attach it to something solid. Show up long enough to become someone who does the thing.`,
  },
};

const QUESTIONS = [
  {
    q: 'While reading, what captured your attention most?',
    options: [
      { text: 'The descriptive language and the images it created', style: 'visual' },
      { text: 'The structure and logical flow of the ideas', style: 'analytical' },
      { text: 'The emotional undercurrent or human element', style: 'empathetic' },
      { text: 'The key facts or central message', style: 'speed' },
    ],
  },
  {
    q: 'How quickly did you feel settled into the text?',
    options: [
      { text: 'Once I could picture the scene or concept clearly', style: 'visual' },
      { text: 'Once I understood the structure and purpose', style: 'analytical' },
      { text: 'When I sensed the emotional register of the writing', style: 'empathetic' },
      { text: 'Almost immediately — I picked up the main idea fast', style: 'speed' },
    ],
  },
  {
    q: 'What would you most naturally share with someone about this passage?',
    options: [
      { text: 'A vivid phrase or image that stayed with you', style: 'visual' },
      { text: 'The core argument or point it was making', style: 'analytical' },
      { text: 'How it made you feel', style: 'empathetic' },
      { text: 'The basic topic summarised in one sentence', style: 'speed' },
    ],
  },
  {
    q: 'How did you actually read the passage?',
    options: [
      { text: 'Slowly, forming mental images went', style: 'visual' },
      { text: 'Carefully, tracking the logic and structure', style: 'analytical' },
      { text: 'Immersively, letting the mood carry me through it', style: 'empathetic' },
      { text: 'Efficiently, moving fast and picking out essentials', style: 'speed' },
    ],
  },
  {
    q: 'When you finished, your first instinct was to...',
    options: [
      { text: 'Replay the most vivid section in your mind', style: 'visual' },
      { text: 'Review whether you understood the main point correctly', style: 'analytical' },
      { text: 'Sit with how it made you feel', style: 'empathetic' },
      { text: 'Move on — you had what you needed', style: 'speed' },
    ],
  },
  {
    q: 'If interrupted mid-read, how would you have resumed?',
    options: [
      { text: 'Scanned back to find the last scene I could picture', style: 'visual' },
      { text: 'Found the last logical point and reread from there', style: 'analytical' },
      { text: 'Reconnected with the mood I had when I stopped', style: 'empathetic' },
      { text: 'Skimmed back to where the key information was', style: 'speed' },
    ],
  },
  {
    q: 'After reading, you could most easily reconstruct...',
    options: [
      { text: 'The atmosphere — sensory details and setting', style: 'visual' },
      { text: 'The logical sequence and main conclusions', style: 'analytical' },
      { text: 'The emotional arc and what it felt like to read', style: 'empathetic' },
      { text: 'The core message in a single sentence', style: 'speed' },
    ],
  },
  {
    q: 'What kind of remark would make you want to reread a section?',
    options: [
      { text: '"The writing in that part is so beautiful."', style: 'visual' },
      { text: '"There\'s a logical inconsistency there."', style: 'analytical' },
      { text: '"That part is genuinely moving."', style: 'empathetic' },
      { text: '"You probably missed a key fact there."', style: 'speed' },
    ],
  },
  {
    q: 'What would have improved your reading experience?',
    options: [
      { text: 'More vivid sensory detail and richer language', style: 'visual' },
      { text: 'A clearer structure or more explicit argument', style: 'analytical' },
      { text: 'A deeper human or personal angle', style: 'empathetic' },
      { text: 'A shorter, more condensed version', style: 'speed' },
    ],
  },
  {
    q: 'Where does your attention go naturally when encountering new text?',
    options: [
      { text: 'The words themselves — how they paint a picture', style: 'visual' },
      { text: 'The structure — what the text is trying to prove', style: 'analytical' },
      { text: 'The human feeling behind the text', style: 'empathetic' },
      { text: 'The bottom line, as fast as possible', style: 'speed' },
    ],
  },
];

const STYLE_INFO = {
  visual: {
    title: 'Visual Reader',
    desc: 'You experience text cinematically. Your mind translates words into vivid imagery, scenes, and atmosphere automatically. You have strong recall for descriptive passages and are most engaged by writing that creates a world rather than simply conveying information.',
    tips: [
      'Read in quiet environments where you can visualise without distraction',
      'Illustrated books and graphic narratives amplify your natural strength',
      'Reading aloud slows you down and deepens immersion significantly',
      'Sketching or mapping scenes as you read improves your retention',
    ],
  },
  analytical: {
    title: 'Analytical Reader',
    desc: 'You read like a scholar. You naturally decompose text into its structural components, tracking arguments, evidence, and logical consistency. You retain information with precision and perform particularly well with non-fiction and technical material.',
    tips: [
      'Marginal notes and outlines feed your natural reading method',
      'Active recall — closing the book and writing a summary — works powerfully for you',
      'Your growth edge is emotional engagement; try fiction with complex inner lives',
      'Structured note-taking systems like Cornell or Zettelkasten suit your style well',
    ],
  },
  empathetic: {
    title: 'Empathetic Reader',
    desc: "You read with your heart. You connect deeply with the emotional undertow of what you read — characters' inner lives, the author's implicit feeling, the human stakes beneath the surface. Books are emotional experiences for you, not just information transfers.",
    tips: [
      'Book clubs and discussions amplify your natural gift for emotional insight',
      'A reading journal captures your emotional responses — which are your real analysis',
      'Biographies and narrative non-fiction are a natural sweet spot for your style',
      'Challenge yourself with more structural or abstract texts to develop a complementary skill',
    ],
  },
  speed: {
    title: 'Efficiency Reader',
    desc: 'You are goal-oriented and extract value from text rapidly. You instinctively separate signal from noise and rarely get bogged down in descriptive passages. You read broadly rather than deeply and perform best with information-dense, purposeful material.',
    tips: [
      'SQ3R (Survey, Question, Read, Recite, Review) maximises retention at pace',
      'Slowing down deliberately for complex arguments is your most productive challenge',
      'Skimming and strategic reading are genuine cognitive strengths — own them',
      'Spaced repetition tools can significantly extend your retention over time',
    ],
  },
};

export default function ReadingStyle() {
  const [step, setStep] = useState('intro');
  const [selectedPassage, setSelectedPassage] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);

  const handleSelectPassage = (key) => {
    setSelectedPassage(key);
    setStep('reading');
  };

  const handleStartTest = () => {
    setCurrentQ(0);
    setAnswers([]);
    setStep('test');
  };

  const handleAnswer = (style) => {
    const newAnswers = [...answers,];
    setAnswers(newAnswers);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setStep('results');
    }
  };

  const handleBack = () => {
    if (step === 'test') {
      if (currentQ > 0) {
        setCurrentQ(q => q - 1);
        setAnswers(a => a.slice(0, -1));
      } else {
        setStep('reading');
      }
    } else if (step === 'reading') {
      setStep('choose');
    } else if (step === 'choose') {
      setStep('intro');
    }
  };

  const getStyleCounts = () => {
    const counts = { visual: 0, analytical: 0, empathetic: 0, speed: 0 };
    answers.forEach(s => { if (s in counts) counts[s]++; });
    return counts;
  };

  const styleCounts = getStyleCounts();
  const primaryStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0][0];
  const info = STYLE_INFO[primaryStyle];

  const radarData = [
    { subject: 'Visual', A: styleCounts.visual, fullMark: QUESTIONS.length },
    { subject: 'Analytical', A: styleCounts.analytical, fullMark: QUESTIONS.length },
    { subject: 'Empathetic', A: styleCounts.empathetic, fullMark: QUESTIONS.length },
    { subject: 'Efficiency', A: styleCounts.speed, fullMark: QUESTIONS.length },
  ];

  const passage = selectedPassage ? PASSAGES[selectedPassage] : null;

  // Map new steps to TestWrapper animation keys
  const wrapperStep = step === 'results' ? 'results' : step === 'intro' ? 'intro' : step;

  return (
    <>
      {step === 'intro' && (
        <div className="flex flex-col items-center justify-center text-center h-full max-w-2xl mx-auto py-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-4">Reading Style</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Choose a type of reading material, read a short passage, then answer 10 questions about your experience. The results reveal whether you are a Visual, Analytical, Empathetic, or Efficiency reader.
          </p>
          <div className="flex gap-4 items-center bg-secondary/50 px-6 py-4 rounded-xl mb-8 border border-border/50">
            <div className="text-left">
              <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Format</p>
              <p className="font-medium">Choose passage + 10 questions</p>
            </div>
            <div className="w-px h-8 bg-border/50"></div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wider">Estimated Time</p>
              <p className="font-medium">5–7 minutes</p>
            </div>
          </div>
          <Button size="lg" onClick={() => setStep('choose')}>
            Choose Your Passage
          </Button>
        </div>
      )}

      {step === 'choose' && (
        <div className="flex flex-col max-w-3xl mx-auto py-8 w-full">
          <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ChevronLeft className="w-4 h-4" />Back
          </button>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-2">Choose a passage type</h2>
          <p className="text-muted-foreground mb-8">Select the type of reading material you'd like to be assessed on. Different formats reveal different facets of your reading style.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(PASSAGES)).map((key) => {
              const p = PASSAGES[key];
              const Icon = p.Icon;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectPassage(key)}
                  className="text-left p-6 rounded-2xl border-2 border-border/50 bg-card hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{p.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.tagline}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 'reading' && passage && (
        <div className="flex flex-col max-w-2xl mx-auto py-8 w-full">
          <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ChevronLeft className="w-4 h-4" />Change passage
          </button>
          <div className="bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full w-fit">
            {passage.label}
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6">{passage.title}</h2>
          <div className="bg-card border border-border/50 rounded-2xl p-8 mb-8 shadow-sm">
            <p className="text-foreground leading-8 whitespace-pre-line text-base font-serif">
              {passage.text}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mb-6 text-center">Take your time. When you are ready, click below to begin the questions.</p>
          <Button size="lg" onClick={handleStartTest} className="self-center px-10">
            I have finished reading
          </Button>
        </div>
      )}

      {step === 'test' && (
        <div className="flex flex-col max-w-2xl mx-auto py-12 w-full">
          <div className="mb-8">
            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-3">
              <span>Question {currentQ + 1} of {QUESTIONS.length}</span>
              <button onClick={handleBack} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" />
                {currentQ === 0 ? 'Re-read passage' : 'Back'}
              </button>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full mb-8 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${(currentQ / QUESTIONS.length) * 100}%` }}
              />
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
                className="w-full text-left p-6 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-base font-medium shadow-sm hover:shadow-md"
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
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">Your Reading Style</p>
            <h2 className="font-serif text-5xl font-bold text-foreground mb-6">{info.title}</h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">{info.desc}</p>
          </div>

          <div className="bg-card border border-border/50 rounded-3xl p-8 mb-8 shadow-lg flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 14, fontWeight: 500 }} />
                  <Radar name="Style" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              <h3 className="font-serif text-xl font-bold border-b border-border/50 pb-4">Style Breakdown</h3>
              {radarData.map((item) => (
                <div key={item.subject}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{item.subject}</span>
                    <span className="text-sm text-muted-foreground font-mono">{Math.round((item.A / QUESTIONS.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${(item.A / QUESTIONS.length) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-3xl p-8 mb-10">
            <h3 className="font-serif text-xl font-bold mb-4">Practical tips for your style</h3>
            <ul className="space-y-3">
              {info.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">{i + 1}</div>
                  {tip}
                </li>
              ))}
            </ul>
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
