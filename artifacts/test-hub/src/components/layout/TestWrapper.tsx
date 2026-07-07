import { motion, AnimatePresence } from 'framer-motion';

interface TestWrapperProps {
  step: string;
  children: React.ReactNode;
}

export function TestWrapper({ step, children }: TestWrapperProps) {
  return (
    <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
