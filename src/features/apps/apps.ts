// Apps instalados na TV: Luna listLaunchPoints; se negado (apps de Developer Mode), SSAP com
// pareamento único. Negado nos dois = sem apps (nunca apps fictícios). Ver tvos-webos-api.
import { esc, $, qsa } from '../../lib/html';
import { isWebOS, luna, tvService } from '../../platform/luna';
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
  { key: 'livetv', label: 'TV ao vivo', match: /livetv/ },
  { key: 'netflix', label: 'Netflix', match: /netflix/, provider: 8 },
  { key: 'youtube', label: 'YouTube', match: /youtube(?! ?(music|kids))/ },
  { key: 'globoplay', label: 'Globoplay', match: /globoplay/, provider: 307 },
  { key: 'primevideo', label: 'Prime Video', match: /prime video|primevideo|amazon(?! music)/, provider: 119 },
  { key: 'disney', label: 'Disney+', match: /disneyplus/, provider: 337 }, // Star+ (com.disney.alch…) não é Disney+
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
  { key: 'webos', label: 'webOS da LG', match: /fullhome/ },
];

const LIVE = 'com.webos.app.livetv';
export const LG_HOME = 'com.webos.app.fullhome';
// Sempre na prateleira, mesmo fora do listLaunchPoints: TV ao vivo (1º) e o webOS da LG como app (último).
const VIRTUAL: App[] = [{ id: LIVE, title: 'TV ao vivo' }, { id: LG_HOME, title: 'webOS da LG' }];
const TILE_GAP = 24;
const TILE_PITCH = 160 + TILE_GAP; // tile de 160: ~9 apps visíveis em 16:9
const TRACK_PAD = 34; // 17 de cada lado da trilha
const SHELF_GUTTER = 64; // vão de cada lado da plataforma para as setas ‹ ›
const SHELF_BLEED = 20; // folga para o tile focado crescer sem ser cortado
const LAUNCH = 'luna://com.webos.applicationManager/launch';

let apps: App[] = [];
let loading = true;
let launching = false;
let shelfIndex = 0;
let lgOpened = false;

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
  if (id === LG_HOME) lgOpened = true;
  luna(LAUNCH, { id }, 8000).then((result) => {
    launching = false;
    if (!result) toast(`Não foi possível abrir ${label}`);
  });
}

/** Voltou ao tvOS depois de abrir o webOS da LG: tira a home dela da memória (~66 MB). */
export function closeLgIfOpened(): void {
  if (!lgOpened) return;
  lgOpened = false;
  tvService('closeLgHome');
}

const ORDER_KEY = 'tvos.order';
const HIDDEN_KEY = 'tvos.hidden';

/** Ordem padrão: TV ao vivo e conhecidos primeiro (ordem da lista acima), depois os demais por nome; webOS da LG por último. */
export function defaultApps(): App[] {
  const rank = (app: App) => { const s = serviceOf(app); return !s ? 99 : s.key === 'webos' ? 100 : SERVICES.indexOf(s); };
  const all = apps.concat(VIRTUAL.filter((v) => !apps.some((a) => a.id === v.id)));
  return all.sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
}

function readIds(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch (e) {
    return [];
  }
}

const savedOrder = () => readIds(ORDER_KEY);

/** App desinstalado: sai da prateleira na hora (a lista da TV demora a refletir). */
export function forgetApp(id: string): void {
  apps = apps.filter((app) => app.id !== id);
  dropTile(id);
}
export const isHidden = (id: string): boolean => readIds(HIDDEN_KEY).indexOf(id) >= 0;

/** Oculta/mostra um app na prateleira (continua em "Todos os apps"). */
export function setHidden(id: string, hidden: boolean): void {
  const ids = readIds(HIDDEN_KEY).filter((x) => x !== id);
  if (hidden) ids.push(id);
  try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids)); } catch (e) { /* sem storage */ }
  if (hidden) dropTile(id); else insertTile(id);
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

// Entrar/sair da prateleira sem redesenhar (redesenhar recarrega todos os ícones e pisca): só o tile
// afetado anima e os vizinhos deslizam para o novo lugar (FLIP só com transform/opacity). Estilo inline
// de propósito: vence o `.lite .f { transition: none }` da TV.
const FADE = 'opacity .2s ease-out, transform .2s ease-out';
const SLIDE = 'transform .28s cubic-bezier(.2,.9,.3,1)';
const tileOf = (id: string) => qsa('#track .tile').filter((t) => t.dataset.id === id)[0];

/** Vizinhos começam deslocados `dx` (onde estavam) e deslizam até o lugar novo. */
function slide(tiles: HTMLElement[], dx: number): void {
  tiles.forEach((t) => { t.style.transition = 'none'; t.style.transform = `translateX(${dx}px)`; });
  void $('#track').offsetWidth; // aplica a posição antiga antes de animar
  tiles.forEach((t) => { t.style.transition = SLIDE; t.style.transform = ''; });
  window.setTimeout(() => tiles.forEach((t) => { t.style.transition = ''; }), 300);
}

/** O tile some (encolhe e esmaece), sai do DOM e os da direita fecham o vão; o foco vai ao vizinho. */
function dropTile(id: string): void {
  const gone = tileOf(id);
  if (!gone) return;
  const tiles = qsa('#track .tile');
  const index = tiles.indexOf(gone);
  gone.style.transition = FADE;
  gone.style.opacity = '0';
  gone.style.transform = 'scale(.6)';
  window.setTimeout(() => {
    const hadFocus = document.activeElement === gone;
    if (gone.parentNode) gone.parentNode.removeChild(gone);
    slide(tiles.slice(index + 1), TILE_PITCH);
    const rest = qsa('#track .tile');
    const next = rest[Math.min(index, rest.length - 1)];
    if (next && (hadFocus || document.activeElement === document.body)) next.focus(); // focusin recentra o carrossel
    else scrollShelf(shelfIndex, rest.length);
  }, 200);
}

/** Volta um app oculto ao lugar dele na ordem: os da direita abrem espaço e ele aparece. */
function insertTile(id: string): void {
  if (tileOf(id)) return;
  const list = shelfApps();
  const at = list.map((app) => app.id).indexOf(id);
  if (at < 0) return;
  const holder = document.createElement('div');
  holder.innerHTML = tile(list[at]);
  const added = holder.firstChild as HTMLElement;
  const after = list.slice(at + 1).map((app) => tileOf(app.id)).filter(Boolean) as HTMLElement[];
  $('#track').insertBefore(added, after[0] || null);
  slide(after, -TILE_PITCH);
  added.style.opacity = '0';
  added.style.transform = 'scale(.6)';
  void added.offsetWidth;
  added.style.transition = FADE;
  added.style.opacity = '';
  added.style.transform = '';
  window.setTimeout(() => { added.style.transition = ''; }, 250);
  scrollShelf(shelfIndex, qsa('#track .tile').length);
}

/** O que a prateleira mostra: ordem da pessoa, sem ocultos. */
export const shelfApps = (): App[] => sortedApps().filter((app) => !isHidden(app.id));

/** Cartão da lista "Todos os apps" (e das escolhas de app); `a` = ação do OK. */
export function appCard(app: App, a = 'app', extra = ''): string {
  const s = serviceOf(app);
  const attrs = `data-a="${a}" data-id="${esc(app.id)}" data-title="${esc(app.title)}"`;
  const badge = extra || (a === 'app' && isHidden(app.id) ? '<i class="bdg">Oculto</i>' : '');
  if (s) return `<button class="poster app f b-${s.key}" ${attrs}>${badge}${logo(s)}<span>${esc(app.title)}</span></button>`;
  return `<button class="poster app f" ${attrs}>${badge}${iconHtml(app, ' big')}<span>${esc(app.title)}</span></button>`;
}

/** Lista completa (atalho "Todos os apps" da gaveta). */
export function openAllApps(): void {
  const list = sortedApps();
  openOverlay();
  setOverlay(
    `<div class="ov-head"><div><h2>Todos os apps</h2><div class="sub">${list.length} instalados na TV</div></div><button class="chip f" data-a="close">Voltar</button></div>`
    + (list.length ? `<div class="grid grid-apps"><div class="gridin">${list.map((app) => appCard(app)).join('')}</div></div>` : '<div class="cards-msg"><h2>Lista de apps indisponível</h2><p>A TV não liberou a lista de apps instalados.</p></div>'),
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
  const list = shelfApps();
  const note = loading ? (isWebOS ? 'Aguardando autorização na TV…' : 'Carregando apps…') : isWebOS ? 'Apps indisponíveis · OK para tentar de novo' : 'Os apps aparecem na TV';
  const retry = apps.length ? '' : `<button class="tile other f" data-a="apps-retry"><span>${note}</span></button>`;
  $('#shelf').innerHTML = `<div id="track">${list.map(tile).join('')}${retry}</div>`;
  const again = keep ? qsa('#track .tile').filter((t) => t.dataset.id === keep)[0] : null;
  if (again) again.focus();
  else { scrollShelf(0, qsa('#track .tile').length); ensureFocus('#platter .f'); }
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
window.addEventListener('resize', () => window.requestAnimationFrame(() => scrollShelf(shelfIndex, qsa('#track .tile').length)));

actions.app = (el) => { if (!$('#stage').classList.contains('reorder')) launchApp(el.dataset.id as string, el.dataset.title as string); };
actions['apps-retry'] = () => loadApps();
