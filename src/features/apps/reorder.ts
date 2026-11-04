// Reorganizar a prateleira só com o controle: pega o app focado, ← → movem, OK solta (grava),
// ↓ volta à ordem padrão, Voltar cancela. Entradas: atalho "Organizar apps" da gaveta e tecla amarela.
import { $, qsa } from '../../lib/html';
import { KEY, popLayer, pushLayer } from '../../ui/nav';
import { toast } from '../../ui/toast';
import { defaultApps, refreshShelf, saveOrder } from './apps';

let grabbed: HTMLElement | null = null;
let committed = false;

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
  } else refreshShelf(); // cancelou: desfaz o que foi movido
  grabbed = null;
}

export function startReorder(): void {
  if (grabbed) return;
  let tile = document.activeElement as HTMLElement;
  if (!tile.classList || !tile.classList.contains('tile') || !tile.dataset.id) tile = qsa('#track .tile')[0];
  if (!tile || !tile.dataset.id) { toast('Nenhum app para organizar'); return; }
  committed = false;
  tile.focus();
  pushLayer({
    selector: '#track .tile',
    onKey: (code) => {
      if (code === KEY.left || code === KEY.right) { move(code === KEY.left ? -1 : 1); return true; }
      if (code === KEY.down) { restoreDefault(); return true; }
      if (code === KEY.enter) { committed = true; popLayer(); return true; }
      return code === KEY.up; // ↑ não faz nada enquanto organiza
    },
    onClose: finish,
  });
  grabbed = tile;
  tile.classList.add('grab');
  $('#stage').classList.add('reorder');
}
