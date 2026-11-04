// Ícone de app sem logo de marca embutido. Ordem de tentativa: glifo de sistema (HDMI, navegador…),
// logo oficial do serviço pelo nome (JustWatch via TMDB, só no Brasil), ícone que a própria TV
// informa e, por fim, monograma colorido — nunca só texto.
import { esc, plain } from '../../lib/html';
import { icon, IconName } from '../../ui/icons';
import { fetchProviderLogos, hasToken, img, ProviderLogo } from '../titles/tmdb';

interface Iconic { id: string; title: string; icon?: string }

const SYSTEM: Array<[RegExp, IconName]> = [
  [/hdmi|external ?input|\binput\b|entrada/, 'hdmi'],
  [/live ?tv|tv ao vivo|channel|canais|\btv\b$/, 'live'],
  [/browser|navegador|\bweb\b/, 'globe'],
  [/setting|ajuste|configura/, 'gear'],
  [/photo|galeria|gallery|foto|video ?player/, 'photo'],
  [/music|musica|\bsom\b|audio/, 'music'],
  [/share|miracast|airplay|cast|espelh/, 'cast'],
  [/store|loja|discover/, 'store'],
  [/game|jogo/, 'game'],
  [/home|hub|\bapps?\b/, 'apps'],
];

let logos: ProviderLogo[] = [];

/** Busca os logos oficiais uma vez (cache de 7 dias); `ready` redesenha a prateleira quando chegam. */
export function loadLogos(ready: () => void): void {
  if (!hasToken) return;
  fetchProviderLogos((list) => { logos = list; ready(); }).catch(() => { /* sem rede: fica o ícone da TV ou o monograma */ });
}

function logoFor(title: string): string {
  const name = plain(title);
  if (name.length < 3) return '';
  const hit = logos.filter((l) => l.n === name)[0]
    || logos.filter((l) => name.length >= 4 && (l.n.indexOf(name) === 0 || name.indexOf(l.n) === 0))[0];
  return hit ? img(hit.p, 'w154') : '';
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 9973;
  return h;
}

const initials = (title: string): string => {
  const words = title.replace(/[^A-Za-zÀ-ÿ0-9 ]/g, '').split(' ').filter(Boolean);
  return (words.length > 1 ? words[0].charAt(0) + words[1].charAt(0) : (words[0] || '?').slice(0, 2)).toUpperCase();
};

/** `<span class="ico">` pronto: glifo, logo/ícone com monograma por baixo (aparece se a imagem falhar). */
export function iconHtml(app: Iconic, extra = ''): string {
  const key = plain(`${app.id} ${app.title}`);
  const system = SYSTEM.filter(([re]) => re.test(key))[0];
  if (system && /^com\.(webos|palm|lge)|hdmi/.test(app.id.toLowerCase())) return `<span class="ico sys${extra}">${icon(system[1])}</span>`;
  const urls = [logoFor(app.title), app.icon || ''].filter(Boolean);
  const image = urls.length ? `<img src="${esc(urls[0])}"${urls[1] ? ` data-next="${esc(urls[1])}"` : ''} alt="">` : '';
  return `<span class="ico g${hash(app.id) % 8}${extra}">${esc(initials(app.title))}${image}</span>`;
}
