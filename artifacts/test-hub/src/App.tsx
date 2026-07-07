import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/layout/Shell';

// Pages
import Home from '@/pages/home';
import ReadingSpeed from '@/pages/reading-speed';
import ReadingStyle from '@/pages/reading-style';
import Personality from '@/pages/personality';
import Psychometric from '@/pages/psychometric';
import CareerPath from '@/pages/career-path';
import Relationship from '@/pages/relationship';
import GeneralKnowledge from '@/pages/general-knowledge';
import Films from '@/pages/films';

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/reading-speed" component={ReadingSpeed} />
        <Route path="/reading-style" component={ReadingStyle} />
        <Route path="/personality" component={Personality} />
        <Route path="/psychometric" component={Psychometric} />
        <Route path="/career-path" component={CareerPath} />
        <Route path="/relationship" component={Relationship} />
        <Route path="/general-knowledge" component={GeneralKnowledge} />
        <Route path="/films" component={Films} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
