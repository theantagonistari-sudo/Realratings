import { Link } from 'wouter';
import { motion, type Variants } from 'framer-motion';
import { BookOpen, Brain, Briefcase, Heart, Globe, Film, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const TESTS = [
  { id: 'reading-speed', title: 'Reading Speed', desc: 'Measure your reading rate and comprehension accuracy.', time: '3 min', icon: Zap, category: 'Cognitive' },
  { id: 'reading-style', title: 'Reading Style', desc: 'Discover how you consume and process written information.', time: '5 min', icon: BookOpen, category: 'Personality' },
  { id: 'personality', title: 'Big Five Personality', desc: 'A deep dive into the five core dimensions of your character.', time: '10 min', icon: Brain, category: 'Personality' },
  { id: 'psychometric', title: 'Cognitive Analysis', desc: 'Test your verbal, numerical, logical, and spatial reasoning.', time: '15 min', icon: Activity, category: 'Cognitive' },
  { id: 'career-path', title: 'Career Alignment', desc: 'Find out which professional domains match your interests.', time: '8 min', icon: Briefcase, category: 'Career' },
  { id: 'relationship', title: 'Relationship Style', desc: 'Understand your attachment, communication, and conflict styles.', time: '7 min', icon: Heart, category: 'Personal' },
  { id: 'general-knowledge', title: 'General Knowledge', desc: 'Challenge your breadth of facts under time pressure.', time: '10 min', icon: Globe, category: 'Knowledge' },
  { id: 'films', title: 'Famous Films', desc: 'Test your cinematic memory with iconic movies and quotes.', time: '8 min', icon: Film, category: 'Knowledge' },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <section className="py-16 md:py-24 text-center max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-primary mb-6">
            Discover your <span className="italic text-accent">mind.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            TestHub is a premium self-discovery platform. Take our suite of cognitive, personality, and knowledge assessments designed to reveal how you think, feel, and interact with the world.
          </p>
        </motion.div>
      </section>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full"
      >
        {TESTS.map((test) => {
          const Icon = test.icon;
          return (
            <motion.div variants={itemVariants} key={test.id}>
              <Link href={`/${test.id}`} className="block h-full group">
                <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/10"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-secondary text-primary rounded-xl">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {test.category}
                    </span>
                  </div>
                  
                  <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {test.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 flex-1">
                    {test.desc}
                  </p>
                  
                  <div className="flex items-center text-xs font-medium text-muted-foreground pt-4 border-t border-border/50">
                    <svg className="w-4 h-4 mr-1.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {test.time}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
