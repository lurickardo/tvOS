// Leituras do sistema (CPU, memória, FPS, rede). Só rodam com a home/gaveta visíveis:
// 10 s na home, 2 s na gaveta (+ FPS), nada com catálogo/lista em tela nem com o tvOS escondido (spec 01-home, R7).
import { luna } from '../../platform/luna';
import { watchFps } from './fps';
import { watchStats } from './metrics';

export interface SystemState {
  cpu: number | null;
  memPct: number | null;
  memUsedKb: number | null;
  memTotalKb: number | null;
  fps: number | null;
  /** Rótulo da conexão ("Wi‑Fi") e se há internet; null = indisponível. */
  link: string | null;
  online: boolean | null;
}
export type SystemMode = 'off' | 'home' | 'drawer';

const state: SystemState = { cpu: null, memPct: null, memUsedKb: null, memTotalKb: null, fps: null, link: null, online: null };
const listeners: Array<(s: SystemState) => void> = [];
let mode: SystemMode = 'off';
let stops: Array<() => void> = [];

const emit = () => listeners.forEach((cb) => cb(state));

export function onSystem(cb: (s: SystemState) => void): void { listeners.push(cb); }
export const getSystemMode = (): SystemMode => mode;

function readLink(): void {
  luna('luna://com.palm.connectionmanager/getStatus', {}, 3000).then((r) => {
    const wired = r && (r.wired as { state?: string } | undefined);
    const wifi = r && (r.wifi as { state?: string } | undefined);
    state.online = r ? r.isInternetConnectionAvailable === true : null;
    state.link = !r ? null : wired && wired.state === 'connected' ? 'Cabo' : wifi && wifi.state === 'connected' ? 'Wi‑Fi' : 'Sem conexão';
    emit();
  });
}

export function setSystemMode(next: SystemMode): void {
  if (next === mode) return;
  mode = next;
  stops.forEach((stop) => stop());
  stops = [];
  if (mode === 'off') return;
  // FPS só na gaveta: o laço de rAF acorda a CPU 60×/s e a home fica residente o tempo todo (ADR 0007).
  if (mode === 'drawer') stops.push(watchFps((fps) => { state.fps = fps; emit(); }));
  stops.push(watchStats((stats) => {
    state.cpu = stats ? stats.cpuPercent : null;
    state.memPct = stats ? (stats.memUsedKb / stats.memTotalKb) * 100 : null;
    state.memUsedKb = stats ? stats.memUsedKb : null;
    state.memTotalKb = stats ? stats.memTotalKb : null;
    emit();
    if (mode === 'drawer') readLink();
  }, mode === 'drawer' ? 2000 : 10000));
}
