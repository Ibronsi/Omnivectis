import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupFetchInterceptor } from './utils/auth.ts';
import { ThemeProvider } from './hooks/useTheme.tsx';

setupFetchInterceptor();

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
