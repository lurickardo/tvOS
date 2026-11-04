const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto de fora (TMDB, apps, cidade) antes de entrar em innerHTML. */
export const esc = (value: string): string => value.replace(/[&<>"']/g, (c) => ENTITIES[c]);

/** Minúsculas, sem acento e só letras/números separados por espaço — para comparar nomes. */
export const plain = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export const $ = <T extends HTMLElement = HTMLElement>(selector: string): T => document.querySelector(selector) as T;

export const qsa = (selector: string): HTMLElement[] => Array.prototype.slice.call(document.querySelectorAll(selector));
