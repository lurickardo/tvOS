// Apps instalados na TV: Luna listLaunchPoints; se negado (apps de Developer Mode), SSAP com
// pareamento único. Negado nos dois = sem apps (nunca apps fictícios). Ver tvos-webos-api.
import { esc, $ } from '../../lib/html';
import { isWebOS, luna } from '../../platform/luna';
import { actions, ensureFocus } from '../../ui/nav';
import { openOverlay, setOverlay } from '../../ui/overlay';
import { toast } from '../../ui/toast';

export interface App { id: string; title: string; icon?: string }

interface Service { key: string; label: string; provider?: number }

// Ordem da prateleira (a da imagem de referência). `provider` = id do TMDB no Brasil; as cores da
// marca ficam no CSS (.b-<key>), porque a CSP não aceita style inline.
const SERVICES: Service[] = [
  { key: 'netflix', label: 'NETFLIX', provider: 8 },
  { key: 'youtube', label: '▶ YouTube' },
  { key: 'globoplay', label: 'globoplay', provider: 307 },
  { key: 'primevideo', label: 'prime video', provider: 119 },
  { key: 'disney', label: 'Disney+', provider: 337 },
  { key: 'hbo', label: 'HBO max', provider: 1899 },
  { key: 'appletv', label: 'tv', provider: 350 },
  { key: 'paramount', label: 'paramount+', provider: 531 },
];
const SHELF_SIZE = 7;
const LAUNCH = 'luna://com.webos.applicationManager/launch';

let apps: App[] = [];
let loading = true;
let launching = false;

const normalize = (app: App) => `${app.id} ${app.title}`.toLowerCase().replace(/[^a-z0-9]/g, '').replace('amazonprime', 'primevideo');
const serviceOf = (app: App): Service | undefined => SERVICES.filter((s) => normalize(app).indexOf(s.key) >= 0)[0];
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

/** Conhecidos primeiro (ordem da imagem), depois os demais por nome. */
export function sortedApps(): App[] {
  const rank = (app: App) => { const s = serviceOf(app); return s ? SERVICES.indexOf(s) : 99; };
  return apps.slice().sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
}

function tile(app: App): string {
  const s = serviceOf(app);
  const attrs = `class="tile f${s ? '' : ' other'}" data-a="app" data-id="${esc(app.id)}" data-title="${esc(app.title)}"`;
  if (s) return `<button ${attrs.replace('tile f', `tile f b-${s.key}`)}>${s.label}</button>`;
  return `<button ${attrs}>${app.icon ? `<img src="${esc(app.icon)}" alt="">` : ''}<span>${esc(app.title)}</span></button>`;
}

/** Cartão da lista "Todos os apps". */
export function appCard(app: App): string {
  return `<button class="poster app f" data-a="app" data-id="${esc(app.id)}" data-title="${esc(app.title)}">${app.icon ? `<img src="${esc(app.icon)}" alt="">` : ''}<span>${esc(app.title)}</span></button>`;
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

function renderShelf(): void {
  const shown = sortedApps().slice(0, SHELF_SIZE);
  const note = loading ? (isWebOS ? 'Aguardando autorização na TV…' : 'Carregando apps…') : isWebOS ? 'Apps indisponíveis · OK para tentar de novo' : 'Os apps aparecem na TV';
  $('#shelf').innerHTML = shown.length ? shown.map(tile).join('') : `<button class="tile other f" data-a="apps-retry"><span>${note}</span></button>`;
  ensureFocus('#platter .f');
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

export function loadApps(): void {
  loading = true;
  luna('luna://com.webos.applicationManager/listLaunchPoints', {}, 6000).then((result) => {
    apps = parse(result);
    if (apps.length || !isWebOS) { loading = false; renderShelf(); return; }
    renderShelf();
    listOverSsap().then((list) => { apps = list; loading = false; renderShelf(); });
  });
}

actions.app = (el) => launchApp(el.dataset.id as string, el.dataset.title as string);
actions['apps-retry'] = () => loadApps();
