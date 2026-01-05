import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from '@/pages/Router';
import { GlobalStyles } from '@/style/GlobalStyles';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyles />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
