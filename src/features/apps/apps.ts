// Apps instalados na TV: Luna listLaunchPoints; se negado (apps de Developer Mode), SSAP com
// pareamento único. Negado nos dois = sem apps (nunca apps fictícios). Ver tvos-webos-api.
import { esc, $, qsa } from '../../lib/html';
import { isWebOS, luna } from '../../platform/luna';
import { actions, ensureFocus } from '../../ui/nav';
import { iconHtml, loadLogos } from './appicon';
import { openOverlay, setOverlay } from '../../ui/overlay';
import { toast } from '../../ui/toast';

export interface App { id: string; title: string; icon?: string }

interface Service { key: string; label: string; match: RegExp; provider?: number }

// Ordem da prateleira (a da imagem de referência, depois os demais). `key` = arquivo em
// assets/brands/<key>.svg e classe .b-<key> (cor do tile; a CSP não aceita style inline).
// `provider` = id do TMDB no Brasil.
const SERVICES: Service[] = [
  { key: 'netflix', label: 'Netflix', match: /netflix/, provider: 8 },
  { key: 'youtube', label: 'YouTube', match: /youtube(?! ?(music|kids))/ },
  { key: 'globoplay', label: 'Globoplay', match: /globoplay/, provider: 307 },
  { key: 'primevideo', label: 'Prime Video', match: /prime video|primevideo|amazon(?! music)/, provider: 119 },
  { key: 'disney', label: 'Disney+', match: /disney/, provider: 337 },
  { key: 'hbomax', label: 'HBO Max', match: /hbo|(^| )max( |$)/, provider: 1899 },
  { key: 'appletv', label: 'Apple TV', match: /apple ?tv/, provider: 350 },
  { key: 'paramountplus', label: 'Paramount+', match: /paramount/, provider: 531 },
  { key: 'telecine', label: 'Telecine', match: /telecine/ },
  { key: 'vivo', label: 'Vivo', match: /(^| )vivo( |$)/ },
  { key: 'clarotv', label: 'Claro tv+', match: /claro/ },
  { key: 'tubi', label: 'Tubi', match: /(^| )tubi( |$)/ },
  { key: 'mubi', label: 'MUBI', match: /(^| )mubi( |$)/ },
  { key: 'dazn', label: 'DAZN', match: /dazn/ },
  { key: 'plex', label: 'Plex', match: /(^| )plex( |$)/ },
  { key: 'kodi', label: 'Kodi', match: /(^| )kodi( |$)/ },
  { key: 'jellyfin', label: 'Jellyfin', match: /jellyfin/ },
  { key: 'stremio', label: 'Stremio', match: /stremio/ },
  { key: 'vimeo', label: 'Vimeo', match: /vimeo/ },
  { key: 'twitch', label: 'Twitch', match: /twitch/ },
  { key: 'crunchyroll', label: 'Crunchyroll', match: /crunchyroll/ },
  { key: 'kick', label: 'Kick', match: /(^| )kick( |$)/ },
  { key: 'spotify', label: 'Spotify', match: /spotify/ },
  { key: 'applemusic', label: 'Apple Music', match: /apple ?music/ },
  { key: 'soundcloud', label: 'SoundCloud', match: /soundcloud/ },
  { key: 'youtubemusic', label: 'YouTube Music', match: /youtube ?music/ },
  { key: 'youtubekids', label: 'YouTube Kids', match: /youtube ?kids/ },
];
const TILE_GAP = 40;
const TILE_PITCH = 200 + TILE_GAP; // tile de 200
const TRACK_PAD = 34; // 17 de cada lado da trilha
const SHELF_GUTTER = 64; // vão de cada lado da plataforma para as setas ‹ ›
const SHELF_BLEED = 20; // folga para o tile focado crescer sem ser cortado
const LAUNCH = 'luna://com.webos.applicationManager/launch';

let apps: App[] = [];
let loading = true;
let launching = false;
let shelfIndex = 0;

const normalize = (app: App) => `${app.id} ${app.title}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
const serviceOf = (app: App): Service | undefined => SERVICES.filter((s) => s.match.test(normalize(app)))[0];
const providerOf = (app: App): number => (serviceOf(app) || { provider: 0 }).provider || 0;

/** Ids de provedor do TMDB (Brasil) cujo app está instalado — filtra o catálogo. */
export function installedProviders(): number[] {
  return apps.map(providerOf).filter((id, i, all) => id && all.indexOf(id) === i);
}

/** App instalado que serve algum dos provedores (na ordem em que o TMDB os lista). */
export function appForProviders(ids: number[]): App | null {
  for (let i = 0; i < ids.length; i++) {
    const hit = apps.filter((app) => providerOf(app) === ids[i])[0];
    if (hit) return hit;
  }
  return null;
}

export function launchApp(id: string, label: string): void {
  if (launching) return; // OK repetido enquanto abre
  launching = true;
  luna(LAUNCH, { id }, 8000).then((result) => {
    launching = false;
    if (!result) toast(`Não foi possível abrir ${label}`);
  });
}

const ORDER_KEY = 'tvos.order';

/** Ordem padrão: conhecidos primeiro (ordem da lista acima), depois os demais por nome. */
export function defaultApps(): App[] {
  const rank = (app: App) => { const s = serviceOf(app); return s ? SERVICES.indexOf(s) : 99; };
  return apps.slice().sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
}

function savedOrder(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(ORDER_KEY) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch (e) {
    return [];
  }
}

/** Guarda a ordem escolhida na TV; `null` volta à padrão (apps novos entram no lugar natural). */
export function saveOrder(ids: string[] | null): void {
  try { if (ids) localStorage.setItem(ORDER_KEY, JSON.stringify(ids)); else localStorage.removeItem(ORDER_KEY); } catch (e) { /* sem storage */ }
}

/** Ordem da pessoa; apps novos (fora da ordem guardada) vão para o fim na ordem padrão. */
export function sortedApps(): App[] {
  const base = defaultApps();
  const saved = savedOrder();
  if (!saved.length) return base;
  const rank = (app: App) => { const i = saved.indexOf(app.id); return i < 0 ? saved.length : i; };
  return base.map((app, i) => ({ app, i })).sort((a, b) => rank(a.app) - rank(b.app) || a.i - b.i).map((x) => x.app);
}

const logo = (s: Service) => `<img class="logo" src="assets/brands/${s.key}.svg" alt="${s.label}">`;

function tile(app: App): string {
  const s = serviceOf(app);
  const attrs = `data-a="app" data-id="${esc(app.id)}" data-title="${esc(app.title)}"`;
  if (s) return `<button class="tile f b-${s.key}" ${attrs} aria-label="${s.label}">${logo(s)}</button>`;
  return `<button class="tile icon f" ${attrs}>${iconHtml(app)}<span class="lbl">${esc(app.title)}</span></button>`;
}

/** Cartão da lista "Todos os apps". */
export function appCard(app: App): string {
  const s = serviceOf(app);
  const attrs = `data-a="app" data-id="${esc(app.id)}" data-title="${esc(app.title)}"`;
  if (s) return `<button class="poster app f b-${s.key}" ${attrs}>${logo(s)}<span>${esc(app.title)}</span></button>`;
  return `<button class="poster app f" ${attrs}>${iconHtml(app, ' big')}<span>${esc(app.title)}</span></button>`;
}

/** Lista completa (atalho "Todos os apps" da gaveta). */
export function openAllApps(): void {
  const list = sortedApps();
  openOverlay();
  setOverlay(
    `<div class="ov-head"><div><h2>Todos os apps</h2><div class="sub">${list.length} instalados na TV</div></div><button class="chip f" data-a="close">Voltar</button></div>`
    + (list.length ? `<div class="grid grid-apps"><div class="gridin">${list.map(appCard).join('')}</div></div>` : '<div class="cards-msg"><h2>Lista de apps indisponível</h2><p>A TV não liberou a lista de apps instalados.</p></div>'),
  );
  const first = document.querySelector('#overlay .poster') || document.querySelector('#overlay .chip');
  if (first) (first as HTMLElement).focus();
}

/** Carrossel: a trilha anda por transform para o tile focado ficar no meio; setas nas bordas avisam que há mais. */
function scrollShelf(index: number, count: number): void {
  const room = $('#platter').clientWidth - 2 * SHELF_GUTTER - TRACK_PAD;
  const visible = Math.max(1, Math.floor((room + TILE_GAP) / TILE_PITCH)); // quantos tiles inteiros cabem
  const first = Math.max(0, Math.min(index - Math.floor(visible / 2), count - visible));
  const shown = Math.max(1, Math.min(count, visible));
  const width = shown * TILE_PITCH - TILE_GAP + TRACK_PAD + 2 * SHELF_BLEED; // janela exata dos tiles, centrada
  const shelf = $('#shelf');
  shelf.style.width = `${width}px`;
  shelf.style.marginLeft = `${-width / 2}px`;
  const track = $('#track');
  track.style.transform = `translateX(${-first * TILE_PITCH}px)`;
  $('#platter').className = `${first > 0 ? 'more-l ' : ''}${first < count - visible ? 'more-r' : ''}`;
  shelfIndex = index;
}

/** Desenha a prateleira de novo (apps, ordem ou logos mudaram) sem perder o foco no mesmo app. */
export function refreshShelf(): void {
  const active = document.activeElement as HTMLElement | null;
  const keep = active && active.closest('#track') ? active.dataset.id : '';
  const list = sortedApps();
  const note = loading ? (isWebOS ? 'Aguardando autorização na TV…' : 'Carregando apps…') : isWebOS ? 'Apps indisponíveis · OK para tentar de novo' : 'Os apps aparecem na TV';
  $('#shelf').innerHTML = `<div id="track">${list.length ? list.map(tile).join('') : `<button class="tile other f" data-a="apps-retry"><span>${note}</span></button>`}</div>`;
  const again = keep ? qsa('#track .tile').filter((t) => t.dataset.id === keep)[0] : null;
  if (again) again.focus();
  else { scrollShelf(0, list.length); ensureFocus('#platter .f'); }
}

function parse(result: Record<string, unknown> | null): App[] {
  const points = result && Array.isArray(result.launchPoints) ? (result.launchPoints as Array<Record<string, unknown>>) : [];
  return points.filter((p) => typeof p.id === 'string' && p.id !== 'com.lurickardo.tvos').map((p) => {
    const raw = typeof p.largeIcon === 'string' ? p.largeIcon : typeof p.icon === 'string' ? p.icon : '';
    const url = raw.charAt(0) === '/' ? `file://${raw}` : /^file:/.test(raw) ? raw : '';
    return { id: p.id as string, title: typeof p.title === 'string' ? p.title : (p.id as string), icon: url || undefined };
  });
}

/** SSAP em ws://127.0.0.1:3000: a TV pede uma aprovação na tela na primeira vez (client-key fica guardada). */
function listOverSsap(): Promise<App[]> {
  return new Promise((resolve) => {
    let socket: WebSocket | null = null;
    let done = false;
    const finish = (list: App[]) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      try { if (socket) socket.close(); } catch (e) { /* já fechado */ }
      resolve(list);
    };
    const timer = window.setTimeout(() => finish([]), 90000);
    const send = (message: object) => { if (socket) socket.send(JSON.stringify(message)); };
    try { socket = new WebSocket('ws://127.0.0.1:3000'); } catch (e) { finish([]); return; }
    socket.onopen = () => {
      const payload: Record<string, unknown> = { forcePairing: false, pairingType: 'PROMPT', manifest: { manifestVersion: 1, appVersion: '0.1.0', permissions: ['READ_INSTALLED_APPS'] } };
      try { const key = localStorage.getItem('tvos.ssap.clientKey'); if (key) payload['client-key'] = key; } catch (e) { /* sem storage */ }
      send({ type: 'register', id: 'register', payload });
    };
    socket.onmessage = (event) => {
      let message: { type?: string; id?: string; payload?: Record<string, unknown> };
      try { message = JSON.parse(String(event.data)); } catch (e) { return; }
      if (message.type === 'error') { finish([]); return; }
      if (message.type === 'registered') {
        const key = message.payload && message.payload['client-key'];
        if (typeof key === 'string') { try { localStorage.setItem('tvos.ssap.clientKey', key); } catch (e) { /* sem storage */ } }
        send({ type: 'request', id: 'apps', uri: 'ssap://com.webos.applicationManager/listLaunchPoints' });
      } else if (message.id === 'apps') finish(parse(message.payload || null));
    };
    socket.onerror = () => finish([]);
    socket.onclose = () => finish([]);
  });
}

const idsOf = (list: App[]) => list.map((app) => app.id).join();

export function loadApps(): void {
  const reload = !loading && apps.length > 0; // tvOS voltou à frente: só atualiza se algo mudou
  loading = true;
  luna('luna://com.webos.applicationManager/listLaunchPoints', {}, 6000).then((result) => {
    const list = parse(result);
    if (reload) {
      loading = false;
      if (list.length && idsOf(list) !== idsOf(apps)) { apps = list; refreshShelf(); }
      return; // falha passageira não apaga a prateleira nem pede pareamento SSAP
    }
    apps = list;
    if (apps.length || !isWebOS) { loading = false; refreshShelf(); loadLogos(refreshShelf); return; }
    refreshShelf();
    listOverSsap().then((list) => { apps = list; loading = false; refreshShelf(); loadLogos(refreshShelf); });
  });
}

$('#shelf').addEventListener('focusin', (event) => {
  const tiles = qsa('#track .tile');
  const index = tiles.indexOf(event.target as HTMLElement);
  if (index >= 0) scrollShelf(index, tiles.length);
});

// A janela mudou de tamanho: recalcula quantos tiles cabem.
window.addEventListener('resize', () => window.requestAnimationFrame(() => { if (apps.length) scrollShelf(shelfIndex, apps.length); }));

actions.app = (el) => { if (!$('#stage').classList.contains('reorder')) launchApp(el.dataset.id as string, el.dataset.title as string); };
actions['apps-retry'] = () => loadApps();
