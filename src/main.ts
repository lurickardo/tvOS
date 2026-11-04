import { $, qsa } from './lib/html';
import { fitStage } from './platform/stage';
import { loadApps } from './features/apps/apps';
import { startReorder } from './features/apps/reorder';
import { initDrawer, openDrawer } from './features/drawer/drawer';
import { onSystem, setSystemMode } from './features/system/system';
import { initHighlights } from './features/titles/highlights';
import { describe, initWeather, onWeather } from './features/weather/weather';
import { icon } from './ui/icons';
import { KEY, setBase } from './ui/nav';

fitStage($('#stage'));
// Pouca RAM (≤ 1 GB): sem animação de foco (tvos-performance, modo lite).
if (((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 2) <= 1) document.body.className = 'lite';

$('#searchbar').innerHTML = `${icon('search')}<span>Buscar filmes e séries</span><em>OK para digitar</em>`;

// O navegador rola o contêiner ao focar algo fora dele; o carrossel anda por transform, então desfaz.
document.addEventListener('scroll', (event) => {
  const el = event.target as HTMLElement;
  if (el.id === 'shelf' || el.id === 'stage') { el.scrollLeft = 0; el.scrollTop = 0; }
}, true);

// Ícone de app que não carrega (caminho inválido na TV) some e deixa só o nome.
document.addEventListener('error', (event) => {
  const img = event.target as HTMLImageElement;
  if (img.tagName !== 'IMG' || !img.parentNode) return;
  const next = img.dataset.next; // próxima fonte do mesmo ícone (logo oficial → ícone da TV)
  if (next) { img.dataset.next = ''; img.src = next; } else img.parentNode.removeChild(img);
}, true);

setBase({
  selector: '#top .f, #cards .f, #searchbar, #platter .f',
  onKey: (code) => { if (code !== KEY.yellow) return false; startReorder(); return true; }, // tecla amarela do controle
  edge: (code, current) => { if (code === KEY.down && current.closest('#platter')) { openDrawer(); return true; } return false; },
});

const rounds: Array<'live' | 'hdmi' | 'gear'> = ['live', 'hdmi', 'gear'];
qsa('#rounds .round').forEach((button, i) => { button.innerHTML = `${icon(rounds[i])}<span class="rl">${button.getAttribute('aria-label')}</span>`; });

// Linha de estado do topo: CPU · memória · FPS · clima.
onSystem((s) => {
  $('#s-cpu').textContent = s.cpu === null ? '—' : `${Math.round(s.cpu)}%`;
  $('#s-mem').textContent = s.memPct === null ? '—' : `${Math.round(s.memPct)}%`;
  $('#s-fps').textContent = s.fps === null ? '—' : String(s.fps);
});
onWeather((w, stale) => {
  $('#s-wx').textContent = w ? `${Math.round(w.temp)}° ${describe(w.code, w.day).text}${stale ? ' · desatualizado' : ''}` : 'Clima indisponível';
});

initDrawer();
initHighlights();
initWeather();
loadApps();
setSystemMode('home');
