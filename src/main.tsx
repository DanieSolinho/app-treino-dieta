import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { watchForUpdates } from './lib/appUpdate';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Instalar no celular e abrir sem internet (só no app publicado; em desenvolvimento atrapalharia o recarregamento)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Ao voltar para o app: carrega a versão nova, se houver, e vira o dia (o app pode ficar aberto de um dia para o outro)
if (import.meta.env.PROD) watchForUpdates();
