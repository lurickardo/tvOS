// Ações de um app: desinstalar (app de loja, com confirmação) e ocultar/mostrar na prateleira.
// Segurar OK na prateleira pega o app para mover; ↑ leva à barra com lixeira e ocultar (reorder.ts).
// Segurar OK em "Todos os apps" abre estas opções direto.
import { esc, qsa } from '../../lib/html';
import { tvService } from '../../platform/luna';
import { actions, back, holds } from '../../ui/nav';
import { openOverlay, setOverlay } from '../../ui/overlay';
import { toast } from '../../ui/toast';
import { forgetApp, isHidden, setHidden } from './apps';
import { startReorder } from './reorder';

// Apps do sistema, o Homebrew e os tiles fixos não saem pela loja (o service também recusa).
const SYSTEM = /^(com\.webos\.|com\.palm\.|com\.lge\.|org\.webosbrew\.)/;
export const removable = (id: string): boolean => !SYSTEM.test(id);

let target = { id: '', title: '' };

const head = (title: string, sub: string) =>
  `<div class="ov-head"><div><h2>${esc(title)}</h2><div class="sub">${sub}</div></div><button class="chip f" data-a="close">Voltar</button></div>`;

export function toggleHidden(id: string, title: string): void {
  const hide = !isHidden(id);
  setHidden(id, hide);
  toast(hide ? `${title} oculto — continua em "Todos os apps"` : `${title} de volta à prateleira`);
}

/** Confirmação antes de desinstalar (irreversível): foco começa em Cancelar. */
export function confirmRemove(id: string, title: string): void {
  target = { id, title };
  openOverlay();
  setOverlay(head(`Desinstalar ${title}?`, 'O app sai da TV; dá para instalar de novo pela LG Content Store.')
    + '<div class="chips"><button class="chip f" data-a="close">Cancelar</button><button class="chip f" data-a="opt-remove-yes">Desinstalar</button></div>');
  qsa('#overlay .chips .chip')[0].focus();
}

function openAppOptions(id: string, title: string): void {
  target = { id, title };
  openOverlay();
  setOverlay(head(title, 'O que fazer com este app?')
    + `<div class="chips"><button class="chip f" data-a="opt-hide">${isHidden(id) ? 'Mostrar na prateleira' : 'Ocultar da prateleira'}</button>`
    + `${removable(id) ? '<button class="chip f" data-a="opt-remove">Desinstalar</button>' : ''}</div>`);
  qsa('#overlay .chips .chip')[0].focus();
}

actions['opt-hide'] = () => { back(); toggleHidden(target.id, target.title); };
actions['opt-remove'] = () => { back(); confirmRemove(target.id, target.title); };
actions['opt-remove-yes'] = () => {
  const { id, title } = target;
  back();
  toast(`Desinstalando ${title}…`);
  tvService('uninstall', { id }, 60000).then((r) => {
    toast(r ? `${title} desinstalado` : `Não foi possível desinstalar ${title}`);
    if (r) forgetApp(id);
  });
};

holds.app = (el) => {
  if (el.closest('#track')) { startReorder(); return; }
  back(); // "Todos os apps" fecha e dá lugar às opções
  openAppOptions(el.dataset.id as string, el.dataset.title as string);
};
