// Navegação só com o controle: foco espacial (vizinho mais próximo na direção da seta) dentro da
// camada do topo (home, gaveta, catálogo…). Voltar fecha a camada.
import { qsa } from '../lib/html';

export interface Layer {
  /** Seletor dos elementos focáveis desta camada. */
  selector: string;
  /** Seta que não achou vizinho: devolve true se tratou (ex.: ↓ da prateleira abre a gaveta). */
  edge?: (key: number, current: HTMLElement) => boolean;
  /** Tecla tratada pela camada antes da navegação por foco (devolve true se consumiu). */
  onKey?: (key: number) => boolean;
  onClose?: () => void;
  from?: HTMLElement | null;
}

const KEY = { enter: 13, left: 37, up: 38, right: 39, down: 40, back: 461, escape: 27, yellow: 405 };
const layers: Layer[] = [];

export const actions: Record<string, (el: HTMLElement) => void> = {};

export function setBase(layer: Layer): void { layers.length = 0; layers.push(layer); }

export function pushLayer(layer: Layer): void {
  layer.from = document.activeElement as HTMLElement | null;
  layers.push(layer);
}

export function popLayer(): void {
  if (layers.length < 2) return;
  const layer = layers.pop() as Layer;
  if (layer.onClose) layer.onClose();
  if (layer.from && document.body.contains(layer.from)) layer.from.focus();
}

// Voltar na raiz não faz nada: o tvOS é a home da TV (ADR 0007), não há para onde sair.
export function back(): void { popLayer(); }

/** Fecha todas as camadas e volta à tela inicial (botão Home com o tvOS já aberto). */
export function goHome(): void { while (layers.length > 1) popLayer(); }

export function focusFirst(selector?: string): void {
  const top = layers[layers.length - 1];
  const first = qsa(selector || top.selector)[0];
  if (first) first.focus();
}

/** Garante um foco na camada do topo (ex.: a prateleira acabou de carregar). */
export function ensureFocus(selector?: string): void {
  const active = document.activeElement;
  if (!active || active === document.body) focusFirst(selector);
}

/** Vizinho na direção da seta: menor distância de borda, com preferência a quem se sobrepõe no eixo perpendicular. */
function pick(current: HTMLElement, key: number, candidates: HTMLElement[]): HTMLElement | null {
  const horizontal = key === KEY.left || key === KEY.right;
  const sign = key === KEY.right || key === KEY.down ? 1 : -1;
  const span = (r: ClientRect) => (horizontal ? [r.left, r.right, r.top, r.bottom] : [r.top, r.bottom, r.left, r.right]);
  const [a0, a1, p0, p1] = span(current.getBoundingClientRect());
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  candidates.forEach((el) => {
    if (el === current) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return;
    const [b0, b1, q0, q1] = span(rect);
    if (((b0 + b1 - a0 - a1) / 2) * sign < 4) return; // não está na direção da seta
    const gap = sign > 0 ? b0 - a1 : a0 - b1;
    const perpGap = Math.max(0, q0 - p1, p0 - q1);
    if (horizontal && perpGap > 0) return; // esquerda/direita ficam na mesma linha
    const c = (p0 + p1) / 2; // centro de quem está focado: 0 se cai dentro do candidato
    const perpCenter = c < q0 ? q0 - c : c > q1 ? c - q1 : 0;
    const score = Math.max(0, gap) + perpGap * 3 + perpCenter * 0.5;
    if (score < bestScore) { bestScore = score; best = el; }
  });
  return best;
}

document.addEventListener('keydown', (event) => {
  const code = event.keyCode;
  if (code === KEY.back || code === KEY.escape) { event.preventDefault(); back(); return; }
  const top = layers[layers.length - 1];
  if (top.onKey && top.onKey(code)) { event.preventDefault(); return; }
  if (code < KEY.left || code > KEY.down) return;
  const target = event.target as HTMLElement;
  if (target.tagName === 'INPUT' && (code === KEY.left || code === KEY.right)) return; // cursor do texto
  const layer = layers[layers.length - 1];
  const candidates = qsa(layer.selector);
  event.preventDefault();
  const current = candidates.indexOf(target) >= 0 ? target : null;
  if (!current) { if (candidates[0]) candidates[0].focus(); return; }
  const next = pick(current, code, candidates);
  if (next) next.focus();
  else if (layer.edge) layer.edge(code, current);
});

document.addEventListener('click', (event) => {
  const el = (event.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
  const run = el && actions[el.dataset.a as string];
  if (el && run) run(el);
});

export { KEY };
