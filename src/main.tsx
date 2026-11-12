import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupFetchInterceptor } from './utils/auth.ts';

setupFetchInterceptor();

createRoot(document.getElementById('root')!).render(<App />);
