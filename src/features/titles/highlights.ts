// Destaques da home: três títulos em alta da semana por aba; o focado alarga e mostra gênero,
// duração e serviço (tvos-design-system, "Card em foco").
import { $, esc, qsa } from '../../lib/html';
import { appForProviders } from '../apps/apps';
import { actions } from '../../ui/nav';
import { openCatalog } from './catalog';
import { openTitle } from './open';
import { fetchDetail, fetchPage, hasToken, img, Kind, Title } from './tmdb';

type Tab = Kind | 'all';

let tab: Tab = 'all';
let items: Title[] = [];
let wide = 0;
let tabTimer = 0;

const message = (title: string, text: string) => `<div class="cards-msg"><h2>${title}</h2><p>${text}</p></div>`;

function render(): void {
  $('#cards').innerHTML = items.map((t, i) => {
    const backdrop = img(t.backdrop || t.poster, 'w780');
    return `<div class="cw${i === wide ? ' wide' : ''}" data-i="${i}"><button class="card f" data-a="title" data-i="${i}">`
      + `${t.poster ? `<img class="po" src="${img(t.poster, 'w342')}" alt="">` : ''}`
      + `<img class="bd" ${i === wide ? 'src' : 'data-src'}="${backdrop}" alt=""></button>`
      + `<div class="nm">${esc(t.name)}</div><div class="mt"></div></div>`;
  }).join('');
  loadMeta();
}

function loadMeta(): void {
  const title = items[wide];
  if (!title) return;
  fetchDetail(title, (detail) => {
    if (items[wide] !== title) return;
    const app = appForProviders(detail.providers.map((p) => p.id));
    const service = app ? app.title : detail.providers[0] && detail.providers[0].name;
    const minutes = detail.minutes ? `${Math.floor(detail.minutes / 60) ? `${Math.floor(detail.minutes / 60)}h ` : ''}${detail.minutes % 60}min` : '';
    const text = [detail.genres[0], minutes, service].filter(Boolean).join(' · ') || title.year;
    const node = document.querySelector(`.cw[data-i="${wide}"] .mt`);
    if (node) node.textContent = text;
  }).catch(() => { /* sem detalhe: fica só o nome */ });
}

function setWide(i: number): void {
  if (i === wide) return;
  wide = i;
  qsa('#cards .cw').forEach((cw, index) => {
    cw.classList.toggle('wide', index === i);
    const bd = cw.querySelector('.bd') as HTMLImageElement | null;
    if (index === i && bd && !bd.src && bd.dataset.src) bd.src = bd.dataset.src;
  });
  loadMeta();
}

export function showTab(next: Tab): void {
  tab = next;
  qsa('#tabs .tab').forEach((el) => el.classList.toggle('on', el.dataset.v === tab));
  if (!hasToken) {
    $('#cards').innerHTML = message('Configure seus destaques', 'Adicione <b>TMDB_TOKEN</b> ao arquivo .env e rode <b>npm run tv:install</b>. Apps, clima e controles continuam funcionando.');
    return;
  }
  fetchPage({ kind: tab, section: 'trending', page: 1, providers: [], text: '' }, (page, stale) => {
    if (tab !== next) return; // a pessoa já foi para outra aba
    $('#note').textContent = stale ? 'dados desatualizados' : '';
    const fresh = page.items.filter((t) => t.backdrop || t.poster).slice(0, 3);
    if (fresh.length === items.length && fresh.every((t, i) => t.id === items[i].id)) return;
    const focusedCard = document.activeElement && (document.activeElement as HTMLElement).closest('#cards') ? wide : -1;
    items = fresh;
    wide = 0;
    render();
    if (focusedCard >= 0) { const card = document.querySelector('#cards .card') as HTMLElement | null; if (card) card.focus(); }
  }).catch(() => {
    items = [];
    $('#cards').innerHTML = message('Destaques indisponíveis', 'Sem conexão com o TMDB. Os apps e o resto da home seguem funcionando.');
  });
}

export function initHighlights(): void {
  // Foco numa aba troca os destaques (com espera, para não buscar a cada seta).
  $('#tabs').addEventListener('focusin', (event) => {
    const v = (event.target as HTMLElement).dataset.v as Tab | undefined;
    if (!v || v === tab) return;
    window.clearTimeout(tabTimer);
    tabTimer = window.setTimeout(() => showTab(v), 250);
  });
  $('#cards').addEventListener('focusin', (event) => {
    const i = (event.target as HTMLElement).dataset.i;
    if (i !== undefined) setWide(Number(i));
  });
  actions.tab = (el) => { const v = el.dataset.v as Tab; if (v === 'all') showTab('all'); else openCatalog(v); };
  actions.title = (el) => { const t = items[Number(el.dataset.i)]; if (t) openTitle(t); };
  showTab('all');
}
