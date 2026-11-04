const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto de fora (TMDB, apps, cidade) antes de entrar em innerHTML. */
export const esc = (value: string): string => value.replace(/[&<>"']/g, (c) => ENTITIES[c]);

export const $ = <T extends HTMLElement = HTMLElement>(selector: string): T => document.querySelector(selector) as T;

export const qsa = (selector: string): HTMLElement[] => Array.prototype.slice.call(document.querySelectorAll(selector));
