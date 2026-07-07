import { Link } from 'wouter';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-primary-foreground font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg shadow-sm shadow-primary/20">
              T
            </div>
            TestHub
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Discover</Link>
            <Link href="/personality" className="hover:text-foreground transition-colors">Personality</Link>
            <Link href="/psychometric" className="hover:text-foreground transition-colors">Cognitive</Link>
            <Link href="/career-path" className="hover:text-foreground transition-colors">Career</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 flex-1 flex flex-col">
          {children}
        </div>
      </main>
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40 mt-auto bg-background/50">
        <p className="font-serif italic">Know Thyself.</p>
        <p className="mt-2 text-xs opacity-60">© {new Date().getFullYear()} TestHub Platform</p>
      </footer>
    </div>
  );
}
