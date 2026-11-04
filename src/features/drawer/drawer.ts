// Gaveta (↓ na prateleira): entradas, atalhos, clima detalhado e painel do sistema.
// A home sobe 560 px; topo e destaques somem (tvos-design-system, "Drawer").
import { config } from '../../config';
import { $, esc } from '../../lib/html';
import { icon, IconName } from '../../ui/icons';
import { actions, back, focusFirst, KEY, pushLayer } from '../../ui/nav';
import { openAllApps } from '../apps/apps';
import { startReorder } from '../apps/reorder';
import { onSystem, setSystemMode, SystemState } from '../system/system';
import { cityName, describe, onWeather, Weather } from '../weather/weather';

const MODEL = 'webOS 4.x · 43LM631C0SB';
let open = false;

const key = (name: IconName, label: string, attrs: string) => `<button class="key f" ${attrs}>${icon(name)}${label}</button>`;
const live = (id: string, label: string) => `data-a="app" data-id="${id}" data-title="${esc(label)}"`;

function build(): void {
  $('#drawer').innerHTML =
    `<div id="inputs" class="keyrow"><div class="row-title">Entradas</div>${key('tv', 'TV ao vivo', live('com.webos.app.livetv', 'TV ao vivo'))}`
    + `${key('hdmi', esc(config.hdmi1Name), live('com.webos.app.hdmi1', config.hdmi1Name))}${key('hdmi', esc(config.hdmi2Name), live('com.webos.app.hdmi2', config.hdmi2Name))}</div>`
    + `<div id="shortcuts" class="keyrow"><div class="row-title">Atalhos</div>${key('apps', 'Todos os apps', 'data-a="all-apps"')}${key('swap', 'Organizar apps', 'data-a="reorder"')}${key('tvStar', 'Ajustes da TV', live('com.palm.app.settings', 'Ajustes da TV'))}</div>`
    + `<div id="panels"><section id="wx" class="panel"></section><section id="sys" class="panel"><h3>Sistema</h3><div class="model">${MODEL}</div><div id="sys-rows"></div></section></div>`;
}

const hm = (clock: string) => `${Number(clock.slice(0, 2))}h${clock.slice(3)}`;
const deg = (n: number) => `${Math.round(n)}°`;

function renderWeather(weather: Weather | null, stale: boolean, empty = 'Clima indisponível'): void {
  const title = `<h3>Clima · ${esc(cityName())}${stale ? ' · desatualizado' : ''}</h3>`;
  if (!weather) { $('#wx').innerHTML = `${title}<div class="wx-empty">${empty}</div>`; return; }
  const now = describe(weather.code, weather.day);
  $('#wx').innerHTML = `${title}<div class="wx-body"><div class="wx-left"><div class="wx-now">${icon(now.icon)}<span class="big">${deg(weather.temp)}</span></div>`
    + `<div class="wx-cond">${now.text}</div><div class="wx-range">Máx. ${deg(weather.high)} · Mín. ${deg(weather.low)}</div></div>`
    + `<div class="wx-right"><div class="hours">${weather.hours.map((h) => `<div class="hour">${h.time}h${icon(describe(h.code, h.day).icon)}<b>${deg(h.temp)}</b></div>`).join('')}</div>`
    + `<div class="wx-extra">Sensação ${deg(weather.feels)} · Umidade ${Math.round(weather.humidity)}%</div>`
    + `<div class="wx-extra">Vento ${Math.round(weather.wind)} km/h · Nascer ${hm(weather.sunrise)} · Pôr ${hm(weather.sunset)}</div></div></div>`;
}

const level = (pct: number): string => (pct < 70 ? 'ok' : pct < 90 ? 'warn' : 'bad');
const row = (label: string, value: string, pill: string, tone: string) =>
  `<div class="sys-row"><span class="label">${label}</span><span class="val">${value}</span><span class="pill ${pill ? tone : ''}">${pill}</span></div>`;
const gb = (kb: number) => (kb / 1048576).toFixed(1).replace('.', ',');

function renderSystem(s: SystemState): void {
  const cpu = s.cpu === null ? '—' : `${Math.round(s.cpu)}%`;
  const mem = s.memUsedKb === null || s.memTotalKb === null ? '—' : `${gb(s.memUsedKb)} / ${gb(s.memTotalKb)} GB`;
  const fps = s.fps === null ? '—' : `${s.fps} fps`;
  const cpuTone = s.cpu === null ? '' : level(s.cpu);
  const fpsTone = s.fps === null ? '' : s.fps >= 55 ? 'ok' : s.fps >= 30 ? 'warn' : 'bad';
  $('#sys-rows').innerHTML =
    row('CPU', cpu, cpuTone === 'ok' ? 'normal' : cpuTone === 'warn' ? 'alta' : cpuTone ? 'crítica' : '', cpuTone)
    + row('Memória', mem, s.memPct === null ? '' : `${Math.round(s.memPct)}%`, s.memPct === null ? '' : level(s.memPct))
    + row('Interface', fps, fpsTone === 'ok' ? 'fluida' : fpsTone === 'warn' ? 'irregular' : fpsTone ? 'lenta' : '', fpsTone)
    + row('Rede', s.link === null ? '—' : `${s.link}${s.online ? ' · conectado' : ''}`, s.online === null ? '' : s.online ? 'online' : 'offline', s.online ? 'ok' : 'bad');
}

export function openDrawer(): void {
  if (open) return;
  open = true;
  $('#stage').classList.add('drawer-open');
  setSystemMode('drawer');
  pushLayer({
    selector: '#platter .f, #drawer .f',
    edge: (code, current) => { if (code === KEY.up && current.closest('#platter')) { back(); return true; } return false; },
    onClose: () => { open = false; $('#stage').classList.remove('drawer-open'); setSystemMode('home'); },
  });
  focusFirst('#inputs .f');
}

export function initDrawer(): void {
  build();
  renderWeather(null, false, 'Buscando previsão…');
  renderSystem({ cpu: null, memPct: null, memUsedKb: null, memTotalKb: null, fps: null, link: null, online: null });
  onWeather((weather, stale) => renderWeather(weather, stale));
  onSystem((s) => { if (open) renderSystem(s); });
  actions.drawer = openDrawer;
  actions['all-apps'] = openAllApps;
  actions.reorder = () => { back(); startReorder(); }; // fecha a gaveta e pega o app que estava em foco
}
