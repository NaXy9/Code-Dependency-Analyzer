import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from './store/AppContext';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Switch>
          <Route path="/" component={ProjectsPage} />
          <Route path="/project/:id" component={ProjectDetailPage} />
        </Switch>
      </AppProvider>
    </QueryClientProvider>
  );
}
