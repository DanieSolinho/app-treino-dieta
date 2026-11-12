// O jsdom (ambiente dos testes) não implementa <dialog>.showModal(); navegadores reais sim.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

// Os testes nunca falam com o Supabase de verdade: rodam no "modo só neste aparelho".
// Os testes de login simulam o serviço de autenticação diretamente.
import { vi } from 'vitest';
vi.mock('../services/supabase', () => ({ supabase: null, cloudEnabled: false }));
