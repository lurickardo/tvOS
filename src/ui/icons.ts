// Ícones SVG inline, 24×24, preenchidos com currentColor (paths do mockup da home).
const CLOUD = 'M7 18a4 4 0 0 1-.6-8A6 6 0 0 1 18 9.5 4.3 4.3 0 0 1 17.5 18z';
const CLOUD_HIGH = 'M7 15a4 4 0 0 1-.6-8A6 6 0 0 1 18 6.5 4.3 4.3 0 0 1 17.5 15z';
const PATHS = {
  live: '<circle cx="12" cy="12" r="2.4"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4l1.3-1.3a4.2 4.2 0 0 1 0-5.8zM16.2 7.8l-1.3 1.3a4.2 4.2 0 0 1 0 5.8l1.3 1.3a6 6 0 0 0 0-8.4zM5 5a10 10 0 0 0 0 14l1.3-1.3a8.2 8.2 0 0 1 0-11.4zM19 5l-1.3 1.3a8.2 8.2 0 0 1 0 11.4L19 19a10 10 0 0 0 0-14z"/>',
  hdmi: '<path d="M3 10h4v4H3zM7 9h9l2 2v2l-2 2H7zM18 11h3v2h-3z"/>',
  gear: '<path d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L14.9 3h-4l-.4 2.9a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.4 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.6 7.6 0 0 0 1.7 1l.4 2.9h4l.4-2.9a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.5zM12.9 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/>',
  tv: '<path d="M3 5h18v11H3zM5 7v7h14V7zM8 18h8v2H8z"/>',
  tvStar: '<path d="M3 5h18v11H3zM5 7v7h14V7zM8 18h8v2H8zM12 8.5l1 1.7 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 10.5l2-.3z"/>',
  apps: '<path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z"/>',
  moon: '<path d="M12 3a8 8 0 1 0 9 9 6.5 6.5 0 0 1-9-9z"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M11 2h2v3h-2zM11 19h2v3h-2zM2 11h3v2H2zM19 11h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zM16.3 17.7l1.4-1.4 2.1 2.1-1.4 1.4zM4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1zM16.3 6.3l2.1-2.1 1.4 1.4-2.1 2.1z"/>',
  partly: `<circle cx="8" cy="8.5" r="3.6"/><path d="M9 20a3.5 3.5 0 0 1-.5-7A5 5 0 0 1 18 12.4 3.8 3.8 0 0 1 17.5 20z"/>`,
  cloud: `<path d="${CLOUD}"/>`,
  fog: '<path d="M4 8h16v2H4zM6 12h14v2H6zM4 16h16v2H4z"/>',
  rain: `<path d="${CLOUD_HIGH}M7.6 16.6l1.8.6-1.2 3.4-1.8-.6zM11.6 16.6l1.8.6-1.2 3.4-1.8-.6zM15.6 16.6l1.8.6-1.2 3.4-1.8-.6z"/>`,
  snow: `<path d="${CLOUD_HIGH}"/><circle cx="8" cy="18.5" r="1.4"/><circle cx="12" cy="20" r="1.4"/><circle cx="16" cy="18.5" r="1.4"/>`,
  storm: `<path d="${CLOUD_HIGH}M11 14h3.4l-2 3.6h2.6L10.2 23l1-4.3H8.2z"/>`,
};

export type IconName = keyof typeof PATHS;

export const icon = (name: IconName): string => `<svg viewBox="0 0 24 24" aria-hidden="true">${PATHS[name]}</svg>`;
