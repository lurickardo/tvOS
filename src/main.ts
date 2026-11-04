// Esqueleto do tvOS: prova o ciclo build → .ipk → TV e a leitura de CPU/memória/FPS.
import { exitApp } from './platform/luna';
import { watchFps } from './features/system/fps';
import { watchStats } from './features/system/metrics';

const KEY_BACK = 461;

function el(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} ausente no index.html`);
  return node;
}

const clock = el('clock');
const cpu = el('cpu');
const mem = el('mem');
const fps = el('fps');

const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
function tickClock() {
  clock.textContent = timeFormat.format(new Date());
}
tickClock();
setInterval(tickClock, 10000);

watchFps((value) => {
  fps.textContent = String(value);
});

watchStats((stats) => {
  if (!stats) {
    // Fora da TV ou serviço sem acesso a /proc.
    cpu.textContent = '—';
    mem.textContent = '—';
    return;
  }
  cpu.textContent = `${Math.round(stats.cpuPercent)}%`;
  mem.textContent = `${Math.round((stats.memUsedKb / stats.memTotalKb) * 100)}%`;
});

document.addEventListener('keydown', (e) => {
  if (e.keyCode === KEY_BACK || e.key === 'Escape' || e.key === 'GoBack') {
    e.preventDefault();
    exitApp();
  }
});
