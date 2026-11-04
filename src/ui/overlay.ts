// Tela cheia por cima da home (catálogo, todos os apps). Pausa as leituras do sistema enquanto aberta.
import { $ } from '../lib/html';
import { getSystemMode, setSystemMode } from '../features/system/system';
import { actions, back, pushLayer } from './nav';

export function openOverlay(): void {
  const overlay = $('#overlay');
  const resume = getSystemMode();
  setSystemMode('off');
  overlay.className = 'open';
  pushLayer({
    selector: '#overlay .f',
    onClose: () => { overlay.className = ''; overlay.innerHTML = ''; setSystemMode(resume); },
  });
}

export const setOverlay = (html: string): void => { $('#overlay').innerHTML = html; };

actions.close = back;
