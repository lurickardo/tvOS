// Catálogo paginado do TMDB (Filmes/Séries): Em alta, Populares, Lançamentos e busca pelo teclado
// da TV. Filtra pelos provedores dos apps instalados; páginas sob demanda, nunca o catálogo inteiro.
// Modo busca (kind 'all', botão Buscar do menu): filmes e séries de todos os serviços, cada resultado
// com o serviço onde passa no Brasil; OK abre o app instalado desse serviço.
import { $, esc } from '../../lib/html';
import { appForProviders, installedProviders } from '../apps/apps';
import { actions } from '../../ui/nav';
import { openOverlay, setOverlay } from '../../ui/overlay';
import { openTitle } from './open';
import { fetchDetail, fetchPage, hasToken, img, Kind, Page, Section, Title } from './tmdb';

const SECTIONS: Array<[Section, string]> = [['trending', 'Em alta'], ['popular', 'Populares'], ['releases', 'Lançamentos']];
const KINDS: Array<[Kind, string]> = [['movie', 'Filmes'], ['tv', 'Séries']];

let kind: Kind | 'all' = 'movie';
let section: Section = 'trending';
let text = '';
let page = 1;
let items: Title[] = [];
let pages = 1;
let status: 'loading' | 'ready' | 'error' = 'loading';
let stale = false;
let filtered = false;
let seq = 0;

const chip = (label: string, attrs: string, on: boolean) => `<button class="chip f${on ? ' sel' : ''}" ${attrs}>${label}</button>`;
const msg = (title: string, body: string) => `<div class="cards-msg"><h2>${title}</h2><p>${body}</p></div>`;

function body(): string {
  if (!hasToken) return msg('Configure seu catálogo', 'Adicione <b>TMDB_TOKEN</b> ao arquivo .env e rode <b>npm run tv:install</b>.');
  if (status === 'loading') return msg('Carregando…', 'Buscando no TMDB.');
  if (status === 'error') return msg('Catálogo indisponível', 'Sem conexão com o TMDB e sem cache desta página.');
  if (kind === 'all' && !text) return msg('O que você quer assistir?', 'Digite o nome de um filme ou série: mostro em qual streaming ele está e abro o app com OK.');
  if (!items.length) return msg('Nenhum título encontrado', text ? 'Tente outro nome.' : 'Nada disponível nos seus apps nesta lista.');
  const posters = items.map((t, i) => `<button class="poster f" data-a="open" data-i="${i}">${t.poster ? `<img src="${img(t.poster, 'w342')}" alt="">` : ''}<span>${esc(t.name)}</span></button>`).join('');
  const pager = `<div class="pager">${page > 1 ? chip('‹ Anterior', 'data-a="page" data-v="-1"', false) : ''}<span>Página ${page} de ${pages}</span>${page < pages ? chip('Próxima ›', 'data-a="page" data-v="1"', false) : ''}</div>`;
  return `<div class="gridin">${posters}${pager}</div>`;
}

function render(first: boolean): void {
  const active = document.activeElement as HTMLElement | null;
  const keep = active && active.dataset.a && active.closest('#overlay') ? `#overlay [data-a="${active.dataset.a}"]${active.dataset.v ? `[data-v="${active.dataset.v}"]` : ''}${active.dataset.i ? `[data-i="${active.dataset.i}"]` : ''}` : '';
  const search = kind === 'all';
  const sub = stale ? 'Exibindo cache local — dados desatualizados' : search ? 'Filmes e séries de todos os serviços · o selo mostra onde passa no Brasil' : text ? 'Busca em todos os serviços' : filtered ? 'Só o que passa nos seus apps instalados · Brasil' : 'Catálogo geral · Brasil';
  const filters = search ? '' : SECTIONS.map(([id, label]) => chip(label, `data-a="section" data-v="${id}"`, !text && section === id)).join('')
    + `<i></i>${KINDS.map(([id, label]) => chip(label, `data-a="kind" data-v="${id}"`, kind === id)).join('')}`;
  setOverlay(
    `<div class="ov-head"><div><h2>${text ? `Busca: ${esc(text)}` : search ? 'Buscar' : kind === 'movie' ? 'Filmes' : 'Séries'}</h2><div class="sub">${sub}</div></div>${chip('Voltar', 'data-a="close"', false)}</div>`
    + `<div class="chips${search ? ' solo' : ''}">${filters}`
    + `<input id="q" class="f" type="search" placeholder="Buscar título" value="${esc(text)}" aria-label="Buscar título"></div>`
    + `<div class="grid">${body()}</div>`,
  );
  const target = (first && document.querySelector('#overlay .poster')) || (keep && document.querySelector(keep)) || document.querySelector('#overlay .poster') || (search && document.querySelector('#q')) || document.querySelector('#overlay .chip');
  if (target) (target as HTMLElement).focus();
  if (text && status === 'ready') badges(seq);
}

/** Selo em cada resultado de busca: app instalado que serve o título (verde) ou o 1º serviço (cinza). */
function badges(mine: number): void {
  items.forEach((t, i) => {
    fetchDetail(t, (detail) => {
      const poster = mine === seq && document.querySelector(`#overlay .poster[data-i="${i}"]`);
      if (!poster || poster.querySelector('.bdg')) return;
      const app = appForProviders(detail.providers.map((p) => p.id));
      const name = app ? app.title : detail.providers.length ? detail.providers[0].name : '';
      poster.insertAdjacentHTML('afterbegin', `<b class="bdg ${app ? 'on' : name ? '' : 'off'}">${esc(name || 'Sem streaming')}</b>`);
    }).catch(() => { /* sem selo */ });
  });
}

function load(focusPoster: boolean): void {
  const mine = ++seq;
  status = 'loading';
  const providers = installedProviders();
  filtered = providers.length > 0 && !text;
  if (!hasToken) { render(false); return; }
  if (kind === 'all' && !text) { items = []; status = 'ready'; render(false); return; }
  if (!items.length) render(false);
  fetchPage({ kind, section, page, providers: text ? [] : providers, text }, (result: Page, isStale: boolean) => {
    if (mine !== seq) return;
    items = result.items; pages = result.pages; status = 'ready'; stale = isStale;
    render(focusPoster);
  }).catch(() => {
    if (mine !== seq) return;
    items = []; status = 'error'; stale = false;
    render(false);
  });
}

export function openCatalog(next: Kind | 'all'): void {
  kind = next; section = 'trending'; text = ''; page = 1; items = [];
  openOverlay();
  load(true);
}

const reload = (): void => { page = 1; items = []; load(true); };

actions.section = (el) => { section = el.dataset.v as Section; text = ''; reload(); };
actions.kind = (el) => { kind = el.dataset.v as Kind; reload(); };
actions.search = () => openCatalog('all');
actions.page = (el) => { page += Number(el.dataset.v); items = []; load(true); };
actions.open = (el) => { const t = items[Number(el.dataset.i)]; if (t) openTitle(t); };

// Enter no campo de busca (o teclado da TV confirma com OK/Enter).
$('#overlay').addEventListener('keydown', (event) => {
  const target = event.target as HTMLInputElement;
  if (event.keyCode !== 13 || target.id !== 'q') return;
  event.preventDefault();
  text = target.value.trim();
  reload();
});
