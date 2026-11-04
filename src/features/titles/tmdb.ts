// Cliente TMDB (ADR 0004): token do .env no header, imagens w342/w780, cache de 1 h (detalhe 24 h).
import { config } from '../../config';
import { cachedJson, getJson } from '../../lib/net';

export type Kind = 'movie' | 'tv';
export type Section = 'trending' | 'popular' | 'releases';

/** Só o que a UI usa — `poster`/`backdrop` são caminhos do TMDB, não URLs. */
export interface Title { id: number; kind: Kind; name: string; poster: string; backdrop: string; year: string }
export interface Detail { genres: string[]; minutes: number; providers: Array<{ id: number; name: string }> }
export interface Page { items: Title[]; pages: number }
export interface Query { kind: Kind | 'all'; section: Section; page: number; providers: number[]; text: string }

interface Raw {
  id: number; media_type?: string; title?: string; name?: string; poster_path?: string | null; backdrop_path?: string | null;
  release_date?: string; first_air_date?: string;
}
interface RawProvider { provider_id: number; provider_name: string }
interface RawDetail {
  genres?: Array<{ name: string }>; runtime?: number; episode_run_time?: number[];
  'watch/providers'?: { results?: { BR?: { flatrate?: RawProvider[]; free?: RawProvider[]; ads?: RawProvider[] } } };
}

const HOUR = 3600000;
export const hasToken = config.tmdbToken !== '';
export const img = (path: string, size: 'w342' | 'w780'): string => (path ? `https://image.tmdb.org/t/p/${size}${path}` : '');

function call<T>(path: string, params: Record<string, string>): Promise<T> {
  const query = Object.keys(params).map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
  return getJson<T>(`https://api.themoviedb.org/3/${path}?${query}`, { Authorization: `Bearer ${config.tmdbToken}` });
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

function toTitle(raw: Raw, kind: Kind): Title | null {
  const k = raw.media_type || kind;
  if (k !== 'movie' && k !== 'tv') return null; // trending/all traz pessoas
  return { id: raw.id, kind: k, name: raw.title || raw.name || 'Sem título', poster: raw.poster_path || '', backdrop: raw.backdrop_path || '', year: (raw.release_date || raw.first_air_date || '').slice(0, 4) };
}

function request(q: Query): [string, Record<string, string>] {
  const kind: Kind = q.kind === 'all' ? 'movie' : q.kind;
  const params: Record<string, string> = { language: 'pt-BR', page: String(q.page) };
  if (q.text) { params.query = q.text; return [q.kind === 'all' ? 'search/multi' : `search/${kind}`, params]; }
  if (q.kind === 'all') return ['trending/all/week', params];
  if (q.providers.length) {
    // Só o que passa nos apps instalados (provedores brasileiros).
    params.watch_region = 'BR';
    params.with_watch_providers = q.providers.join('|');
    params.with_watch_monetization_types = 'flatrate|free|ads';
    params.sort_by = 'popularity.desc';
    if (q.section === 'releases') {
      const field = kind === 'movie' ? 'primary_release_date' : 'first_air_date';
      params[`${field}.gte`] = daysAgo(90);
      params[`${field}.lte`] = daysAgo(0);
      params.sort_by = `${field}.desc`;
    }
    return [`discover/${kind}`, params];
  }
  if (q.section === 'popular') return [`${kind}/popular`, params];
  if (q.section === 'releases') return [kind === 'movie' ? 'movie/now_playing' : 'tv/on_the_air', params];
  return [`trending/${kind}/week`, params];
}

/** Uma página de títulos (cache primeiro; `stale` = dado vencido por falta de rede). */
export function fetchPage(q: Query, on: (page: Page, stale: boolean) => void): Promise<void> {
  const [path, params] = request(q);
  const kind: Kind = q.kind === 'all' ? 'movie' : q.kind;
  const load = () => call<{ results?: Raw[]; total_pages?: number }>(path, params).then((data): Page => ({
    items: (data.results || []).map((r) => toTitle(r, kind)).filter((t): t is Title => !!t),
    pages: Math.min(data.total_pages || 1, 500), // limite da API
  }));
  return cachedJson(`tvos.t.${path}.${JSON.stringify(params)}`, HOUR, load, on);
}

/** Gêneros, duração e onde assistir no Brasil — numa chamada só. */
export function fetchDetail(t: Title, on: (detail: Detail) => void): Promise<void> {
  const load = () => call<RawDetail>(`${t.kind}/${t.id}`, { language: 'pt-BR', append_to_response: 'watch/providers' }).then((d): Detail => {
    const br = (d['watch/providers'] && d['watch/providers'].results && d['watch/providers'].results.BR) || {};
    const all = (br.flatrate || []).concat(br.free || [], br.ads || []);
    return {
      genres: (d.genres || []).map((g) => g.name),
      minutes: d.runtime || (d.episode_run_time && d.episode_run_time[0]) || 0,
      providers: all.map((p) => ({ id: p.provider_id, name: p.provider_name })),
    };
  });
  return cachedJson(`tvos.d.${t.kind}.${t.id}`, 24 * HOUR, load, (d) => on(d));
}
