// Rede e cache (tvos-apis-externas): XHR com timeout (o Chromium 53 não tem AbortController) e
// cache no localStorage com TTL. Sem telemetria; domínios só os da CSP do app/index.html.
const TIMEOUT_MS = 8000;

export function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.timeout = TIMEOUT_MS;
    Object.keys(headers).forEach((name) => xhr.setRequestHeader(name, headers[name]));
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) { reject(new Error(`HTTP ${xhr.status}`)); return; }
      try { resolve(JSON.parse(xhr.responseText) as T); } catch (e) { reject(e); }
    };
    xhr.onerror = () => reject(new Error('Sem rede'));
    xhr.ontimeout = () => reject(new Error('Tempo esgotado'));
    xhr.send();
  });
}

interface Saved<T> { savedAt: number; data: T }

function readCache<T>(key: string): Saved<T> | null {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null') as Saved<T> | null;
    return saved && typeof saved.savedAt === 'number' && saved.data !== undefined ? saved : null;
  } catch (e) {
    return null; // dado velho ou corrompido = sem cache
  }
}

function writeCache(key: string, data: unknown): void {
  try { localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data })); } catch (e) { /* storage cheio: segue sem cache */ }
}

/**
 * Cache primeiro: entrega o guardado na hora (`stale` = passou do TTL) e, se venceu ou não existe,
 * busca e entrega o novo. Rede falhou com cache = fica o velho (já marcado stale); sem cache = rejeita.
 */
export function cachedJson<T>(key: string, ttlMs: number, load: () => Promise<T>, on: (data: T, stale: boolean) => void): Promise<void> {
  const hit = readCache<T>(key);
  const expired = !hit || Date.now() - hit.savedAt > ttlMs;
  if (hit) on(hit.data, expired);
  if (!expired) return Promise.resolve();
  return load().then((data) => { writeCache(key, data); on(data, false); }, (error) => { if (!hit) throw error; });
}
