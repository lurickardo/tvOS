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

// O palco é 1920×1080; a janela da TV pode ser 1280×720 (Full HD) ou 1920×1080: escala para caber.
const stage = el('stage');
function fit() {
  stage.style.transform = `scale(${window.innerWidth / 1920})`;
}
fit();
window.addEventListener('resize', fit);

const clock = el('clock');
const cpu = el('cpu');
const mem = el('mem');
const fps = el('fps');

// ponytail: HH:MM à mão — o Chromium 53 da TV pode ter ICU sem pt-BR (Intl cairia em "02:06 AM").
const two = (n: number) => (n < 10 ? '0' : '') + n;
function tickClock() {
  const now = new Date();
  clock.textContent = `${two(now.getHours())}:${two(now.getMinutes())}`;
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
