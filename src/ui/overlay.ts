// Tela cheia por cima da home (catálogo, todos os apps). Pausa as leituras do sistema enquanto aberta.
import { $ } from '../lib/html';
import { getSystemMode, setSystemMode } from '../features/system/system';
import { actions, back, pushLayer } from './nav';

export function openOverlay(onKey?: (code: number) => boolean): void {
  const overlay = $('#overlay');
  const resume = getSystemMode();
  setSystemMode('off');
  overlay.className = 'open';
  pushLayer({
    selector: '#overlay .f',
    onKey,
    onClose: () => { overlay.className = ''; overlay.innerHTML = ''; setSystemMode(resume); },
  });
}

// Atribuição exigida pelo TMDB e pelo JustWatch (onde assistir e logos dos serviços).
const CREDIT = '<div class="credit">Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB. Onde assistir e logos dos serviços: JustWatch.</div>';

export const setOverlay = (html: string): void => { $('#overlay').innerHTML = html + CREDIT; };

actions.close = back;
