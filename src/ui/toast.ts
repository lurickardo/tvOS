import { $ } from '../lib/html';

let timer = 0;

/** Aviso curto sobre a prateleira; não rouba o foco. */
export function toast(message: string): void {
  const node = $('#toast');
  node.textContent = message;
  node.className = 'show';
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { node.className = ''; }, 4000);
}
