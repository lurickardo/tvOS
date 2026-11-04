// Reorganizar a prateleira só com o controle: pega o app focado, ← → movem, OK solta (grava),
// ↓ volta à ordem padrão, ↑ vai à barra com lixeira (desinstalar) e ocultar, Voltar cancela.
// Entradas: segurar OK num app (options.ts) e tecla amarela.
import { $, qsa } from '../../lib/html';
import { icon } from '../../ui/icons';
import { KEY, popLayer, pushLayer } from '../../ui/nav';
import { toast } from '../../ui/toast';
import { defaultApps, saveOrder } from './apps';
import { confirmRemove, removable, toggleHidden } from './options';

let grabbed: HTMLElement | null = null;
let committed = false;
let original: string[] = [];

const order = (): string[] => qsa('#track .tile').map((t) => t.dataset.id as string);

function move(step: number): void {
  const tile = grabbed as HTMLElement;
  const next = (step < 0 ? tile.previousElementSibling : tile.nextElementSibling) as HTMLElement | null;
  if (!next) return;
  const track = $('#track');
  track.insertBefore(step < 0 ? tile : next, step < 0 ? next : tile);
  tile.focus(); // mover o nó tira o foco; o carrossel acompanha pelo focusin
}

function restoreDefault(): void {
  const tiles = qsa('#track .tile');
  const track = $('#track');
  defaultApps().forEach((app) => {
    const tile = tiles.filter((t) => t.dataset.id === app.id)[0];
    if (tile) track.appendChild(tile);
  });
  (grabbed as HTMLElement).focus();
  toast('Ordem padrão — OK para confirmar, Voltar para cancelar');
}

function finish(): void {
  $('#stage').classList.remove('reorder');
  if (grabbed) grabbed.classList.remove('grab');
  if (committed) {
    const ids = order();
    const same = defaultApps().every((app, i) => app.id === ids[i]);
    saveOrder(same ? null : ids);
  } else {
    // Cancelou: devolve os mesmos nós à ordem de antes (sem redesenhar = ícones não piscam).
    const tiles = qsa('#track .tile');
    const track = $('#track');
    original.forEach((id) => { const t = tiles.filter((x) => x.dataset.id === id)[0]; if (t) track.appendChild(t); });
  }
  grabbed = null;
}

export function startReorder(): void {
  if (grabbed) return;
  let tile = document.activeElement as HTMLElement;
  if (!tile.classList || !tile.classList.contains('tile') || !tile.dataset.id) tile = qsa('#track .tile')[0];
  if (!tile || !tile.dataset.id) { toast('Nenhum app para organizar'); return; }
  committed = false;
  original = order();
  tile.focus();
  const id = tile.dataset.id;
  const title = tile.dataset.title as string;
  // Barra acima da prateleira: lixeira (só app de loja) e ocultar; ↑ entra nela, ↓ volta ao app.
  $('#hint').innerHTML = `<div id="grabbar">${removable(id) ? `<button class="hb" data-v="remove">${icon('trash')}Desinstalar</button>` : ''}`
    + `<button class="hb" data-v="hide">${icon('eyeOff')}Ocultar</button></div>`
    + '<b>← →</b>mover<b>OK</b>soltar<b>↑</b>lixeira<b>↓</b>ordem padrão<b>Voltar</b>cancelar';
  let inBar = false;
  pushLayer({
    selector: '#track .tile',
    onKey: (code) => {
      if (inBar) {
        const buttons = qsa('#grabbar .hb');
        const at = buttons.indexOf(document.activeElement as HTMLElement);
        if (code === KEY.down) { inBar = false; tile.focus(); }
        else if (code === KEY.left || code === KEY.right) { const next = buttons[at + (code === KEY.left ? -1 : 1)]; if (next) next.focus(); }
        else if (code === KEY.enter) {
          const what = buttons[at] && buttons[at].dataset.v;
          popLayer(); // cancela o mover; a ação vem depois
          if (what === 'remove') confirmRemove(id, title); else toggleHidden(id, title);
        }
        return true;
      }
      if (code === KEY.left || code === KEY.right) { move(code === KEY.left ? -1 : 1); return true; }
      if (code === KEY.down) { restoreDefault(); return true; }
      if (code === KEY.enter) { committed = true; popLayer(); return true; }
      if (code === KEY.up) { inBar = true; qsa('#grabbar .hb')[0].focus(); return true; }
      return false;
    },
    onClose: finish,
  });
  grabbed = tile;
  tile.classList.add('grab');
  $('#stage').classList.add('reorder');
}
